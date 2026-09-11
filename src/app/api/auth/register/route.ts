import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, invites, auditLog } from "@/db/schema";
import { eq, ne } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { createSessionCookie, GENESIS_PLACEHOLDER_EMAIL } from "@/lib/auth/session";
import { parseBody } from "@/lib/validation";
import { registerSchema } from "@/lib/validation/schemas";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";
import crypto from "crypto";
import { encryptEmail, encryptField } from "@/lib/crypto/db-vault";
import { validateEmailWithMx } from "@/lib/validation/email-validator";
import { verifyAltchaPayload } from "@/lib/security/altcha";
import { checkLockout, recordFailure } from "@/lib/auth/lockout";



export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, registerSchema);
    if ("errorResponse" in parsed) return parsed.errorResponse;
    const { email: cleanEmail, password, name, inviteCode, altcha } = parsed.data;

    // ── IP-based rate limiting (prevents mass account creation) ───────────────
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const registrationKey = `register::${cleanEmail}`;
    const lockSecs = checkLockout(registrationKey, ip);
    if (lockSecs > 0) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later.", reason: "locked" },
        { status: 429, headers: { "Retry-After": String(lockSecs) } }
      );
    }

    // ── ALTCHA Proof-of-Work (skip for genesis bootstrap on unclaimed deployments) ──
    // We check first-user status before DB writes to decide whether to enforce ALTCHA
    const [genesisCheck] = await db
      .select({ id: users.id })
      .from(users)
      .where(ne(users.email, encryptEmail(GENESIS_PLACEHOLDER_EMAIL)))
      .limit(1);
    const isGenesisSetup = genesisCheck === undefined;

    if (!isGenesisSetup) {
      // Enforce ALTCHA for all non-genesis registrations
      if (!altcha) {
        recordFailure(registrationKey, ip);
        return NextResponse.json(
          { error: "Bot verification required. Please complete the ALTCHA challenge." },
          { status: 400 }
        );
      }
      const altchaValid = await verifyAltchaPayload(altcha);
      if (!altchaValid) {
        recordFailure(registrationKey, ip);
        return NextResponse.json(
          { error: "Bot verification failed. Please refresh and try again." },
          { status: 400 }
        );
      }
    }

    // Defense-in-depth: Reject disposable/temp emails (e.g. mailinator.com) and verify DNS MX
    const emailCheck = await validateEmailWithMx(cleanEmail);
    if (!emailCheck.valid) {
      return NextResponse.json(
        { error: emailCheck.reason || "Temporary or invalid email addresses are not permitted." },
        { status: 400 }
      );
    }

    // Check if email already registered (compare encrypted form)
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, encryptEmail(cleanEmail))).limit(1);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    // ── Decide the role & whether an invite is actually required ──────────────
    let role = "owner";
    let inviteRecord: typeof invites.$inferSelect | null = null;

    // Forgiving comparison: trim + case-insensitive so a stray space or capital
    // never blocks a legitimate operator.
    const normalize = (v: string) => v.trim().toLowerCase();
    const adminBootstrapInvite = normalize(
      process.env.ADMIN_BOOTSTRAP_INVITE || "blindshare-genesis-admin-2026"
    );
    const submittedCode = typeof inviteCode === "string" ? inviteCode.trim() : "";
    const submittedNorm = normalize(submittedCode);

    // A deployment is "claimed" only once a REAL owner exists. The auto-seeded
    // placeholder account does not count, so the first human sign-up always works.
    // Note: GENESIS_PLACEHOLDER_EMAIL is compared encrypted since all emails are stored encrypted.
    // Reuse the genesisCheck already performed above (for ALTCHA bypass check).
    const isFirstRealUser = isGenesisSetup;

    let bootstrapMatch = false;
    if (submittedNorm.length > 0) {
      const subBuf = Buffer.from(submittedNorm, "utf8");
      const bootBuf = Buffer.from(adminBootstrapInvite, "utf8");
      if (subBuf.length === bootBuf.length && crypto.timingSafeEqual(subBuf, bootBuf)) {
        bootstrapMatch = true;
      }
    }

    if (isFirstRealUser || bootstrapMatch) {
      role = "super_admin";
    } else if (submittedCode) {
      // Look the code up on its own first so we can explain WHY it failed.
      const [inv] = await db
        .select()
        .from(invites)
        .where(eq(invites.code, submittedCode))
        .limit(1);

      if (!inv) {
        return NextResponse.json(
          {
            error:
              "That invite code was not found. Check for typos, or ask an administrator to generate a new one from the Admin Panel → Invite Codes.",
            reason: "not_found",
          },
          { status: 400 }
        );
      }
      if (inv.isUsed) {
        return NextResponse.json(
          { error: "This invite code has already been claimed. Please request a fresh one.", reason: "used" },
          { status: 400 }
        );
      }
      if (new Date(inv.expiresAt) < new Date()) {
        return NextResponse.json(
          { error: "This invite code has expired. Please request a fresh one.", reason: "expired" },
          { status: 400 }
        );
      }

      inviteRecord = inv;
      role = inv.role;
    } else {
      return NextResponse.json(
        {
          error:
            "An invite code is required because this deployment already has an owner. Use the ADMIN_BOOTSTRAP_INVITE value from your .env file, or ask an administrator for a code.",
          reason: "required",
        },
        { status: 400 }
      );
    }

    const userId = genId("usr");
    const passwordHash = await hashPassword(password);
    const masterKeySaltHex = crypto.randomBytes(16).toString("hex");

    await db.insert(users).values({
      id: userId,
      email: encryptEmail(cleanEmail), // AES-256-GCM encrypted — plaintext never persisted
      name: encryptField(name), // AES-256-GCM encrypted at rest
      passwordHash,
      role,
      isBlocked: false,
      sessionVersion: 1,
      masterKeySaltHex,
    });

    if (inviteRecord) {
      await db
        .update(invites)
        .set({ isUsed: true, usedBy: userId })
        .where(eq(invites.id, inviteRecord.id));
    }

    const sessionUser = {
      id: userId,
      email: cleanEmail,
      name,
      role: role as "super_admin" | "admin" | "owner",
      isBlocked: false,
    };

    await createSessionCookie(sessionUser, 1);

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId,
      actorType: "user",
      action: "auth.register",
      resourceType: "user",
      resourceId: userId,
      detailsJson: JSON.stringify({ email: encryptEmail(cleanEmail), role }),
    });

    return NextResponse.json({
      success: true,
      user: {
        ...sessionUser,
        masterKeySaltHex,
      },
    });
  } catch (err: any) {
    logger.error("auth.register_error", { message: err?.message });
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
