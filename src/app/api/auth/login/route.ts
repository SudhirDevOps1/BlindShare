import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, auditLog } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionCookie, ensureGenesisAdmin, sign2faPreAuthToken } from "@/lib/auth/session";
import { checkLockout, recordFailure, recordSuccess, getFailureCount } from "@/lib/auth/lockout";
import { parseBody } from "@/lib/validation";
import { loginSchema } from "@/lib/validation/schemas";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";
import crypto from "crypto";
import { verifyAltchaPayload } from "@/lib/security/altcha";
import { encryptEmail, decryptEmail } from "@/lib/crypto/db-vault";

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function POST(request: Request) {
  try {
    await ensureGenesisAdmin();

    const parsed = await parseBody(request, loginSchema);
    if ("errorResponse" in parsed) return parsed.errorResponse;
    const { email, password, altcha } = parsed.data;

    const ip = clientIp(request);
    const failures = getFailureCount(email, ip);
    const mustRequireAltcha = failures >= 2 || process.env.ALTCHA_REQUIRED === "true";

    if (mustRequireAltcha && !altcha) {
      recordFailure(email, ip);
      return NextResponse.json(
        { error: "Security challenge verification required due to suspicious activity. Please complete the verification.", reason: "captcha_required" },
        { status: 400 }
      );
    }

    // Verify ALTCHA if provided or if required
    if (altcha) {
      const isValidAltcha = verifyAltchaPayload(altcha);
      if (!isValidAltcha) {
        recordFailure(email, ip);
        return NextResponse.json(
          { error: "Security challenge verification failed. Please try again.", reason: "invalid_captcha" },
          { status: 400 }
        );
      }
    }

    const lockedFor = checkLockout(email, ip);
    if (lockedFor > 0) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Try again in ${Math.ceil(lockedFor / 60)} minute(s).`,
          reason: "locked",
        },
        { status: 423, headers: { "Retry-After": String(lockedFor) } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    // Look up by encrypted email — encryptEmail() is deterministic (same input → same ciphertext)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, encryptEmail(cleanEmail)))
      .limit(1);

    if (!user) {
      const [anyUser] = await db.select({ id: users.id }).from(users).limit(1);
      if (!anyUser) {
        return NextResponse.json(
          {
            error: "Database is fresh and has no accounts yet. Please click 'Create Account' to register your Super Admin account (no invite required).",
            reason: "no_users",
          },
          { status: 404 }
        );
      }
      recordFailure(cleanEmail, ip);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { error: "Account is suspended. Please contact an administrator." },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      const { locked, remainingTries } = recordFailure(email, ip);
      await db
        .update(users)
        .set({ failedLoginCount: sql`${users.failedLoginCount} + 1` })
        .where(eq(users.id, user.id));

      logger.warn("auth.login_failed", { userId: user.id, locked });

      return NextResponse.json(
        {
          error: locked
            ? "Too many failed attempts. Account temporarily locked."
            : `Invalid email or password. ${remainingTries} attempt(s) remaining before temporary lockout.`,
          reason: locked ? "locked" : "invalid_credentials",
        },
        { status: locked ? 423 : 401 }
      );
    }

    recordSuccess(email, ip);

    // 2FA Challenge Branch
    if (user.twoFactorEnabled) {
      const tempToken = sign2faPreAuthToken(user.id);
      return NextResponse.json({
        require2fa: true,
        tempToken,
      });
    }

    await createSessionCookie(
      {
        id: user.id,
        email: decryptEmail(user.email), // decrypt before writing to signed session cookie
        name: user.name,
        role: user.role as "super_admin" | "admin" | "owner",
        isBlocked: user.isBlocked,
      },
      user.sessionVersion
    );

    let masterKeySaltHex = user.masterKeySaltHex;
    if (!masterKeySaltHex) {
      masterKeySaltHex = crypto.randomBytes(16).toString("hex");
      await db
        .update(users)
        .set({ lastLoginAt: new Date(), failedLoginCount: 0, masterKeySaltHex })
        .where(eq(users.id, user.id));
    } else {
      await db
        .update(users)
        .set({ lastLoginAt: new Date(), failedLoginCount: 0 })
        .where(eq(users.id, user.id));
    }

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: user.id,
      actorType: user.role === "super_admin" ? "admin" : "user",
      action: "auth.login",
      resourceType: "user",
      resourceId: user.id,
      detailsJson: JSON.stringify({ email: cleanEmail }), // use cleanEmail (already decrypted/normalized)
    });

    const decryptedEmail = decryptEmail(user.email);
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: decryptedEmail,
        name: user.name,
        role: user.role,
        masterKeySaltHex,
      },
    });
  } catch (err: any) {
    logger.error("auth.login_error", { message: err?.message });
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
