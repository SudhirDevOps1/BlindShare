import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, auditLog } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionCookie, ensureGenesisAdmin, sign2faPreAuthToken } from "@/lib/auth/session";
import { checkLockout, recordFailure, recordSuccess } from "@/lib/auth/lockout";
import { parseBody } from "@/lib/validation";
import { loginSchema } from "@/lib/validation/schemas";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

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
    const { email, password } = parsed.data;

    const ip = clientIp(request);

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

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      recordFailure(email, ip);
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
        email: user.email,
        name: user.name,
        role: user.role as "super_admin" | "admin" | "owner",
        isBlocked: user.isBlocked,
      },
      user.sessionVersion
    );

    await db
      .update(users)
      .set({ lastLoginAt: new Date(), failedLoginCount: 0 })
      .where(eq(users.id, user.id));

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: user.id,
      actorType: user.role === "super_admin" ? "admin" : "user",
      action: "auth.login",
      resourceType: "user",
      resourceId: user.id,
      detailsJson: JSON.stringify({ email: user.email }),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    logger.error("auth.login_error", { message: err?.message });
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
