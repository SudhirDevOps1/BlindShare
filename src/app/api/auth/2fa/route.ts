import { NextResponse } from "next/server";
import { db, pool } from "@/db";
import { users, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verify2faPreAuthToken, createSessionCookie } from "@/lib/auth/session";
import { verifyTotpToken, verifyAndConsumeBackupCode } from "@/lib/auth/totp";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";
import { decryptField, decryptEmail } from "@/lib/crypto/db-vault";

async function ensure2faColumns() {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret text;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_backup_codes text;
    `);
  } catch {}
}

export async function POST(request: Request) {
  await ensure2faColumns();
  try {
    const body = await request.json().catch(() => ({}));
    const { tempToken, code } = body;

    if (!tempToken || !code) {
      return NextResponse.json(
        { error: "Authentication token and 2FA code are required" },
        { status: 400 }
      );
    }

    const payload = verify2faPreAuthToken(tempToken);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: "2FA session expired. Please log in again.", expired: true },
        { status: 401 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || user.isBlocked || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: "Invalid 2FA challenge state" }, { status: 401 });
    }

    const cleanCode = String(code).trim();
    let isTotpValid = false;
    let isBackupValid = false;

    // Check standard 6-digit TOTP
    if (/^\d{6}$/.test(cleanCode.replace(/\s/g, ""))) {
      const plainSecret = decryptField(user.twoFactorSecret);
      isTotpValid = verifyTotpToken(cleanCode, plainSecret);
    }

    // If TOTP failed, check emergency recovery backup code
    if (!isTotpValid && user.twoFactorBackupCodes) {
      const backupResult = verifyAndConsumeBackupCode(cleanCode, user.twoFactorBackupCodes);
      if (backupResult.valid) {
        isBackupValid = true;
        // Update user record with remaining consumed backup codes
        await db
          .update(users)
          .set({ twoFactorBackupCodes: backupResult.remainingHashedCodesCsv, updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }
    }

    if (!isTotpValid && !isBackupValid) {
      return NextResponse.json(
        { error: "Invalid 6-digit authenticator code or backup code." },
        { status: 400 }
      );
    }

    const cleanEmail = decryptEmail(user.email);
    // Success: issue real authenticated session cookie
    await createSessionCookie(
      {
        id: user.id,
        email: cleanEmail,
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
      action: isBackupValid ? "auth.login_2fa_backup" : "auth.login_2fa",
      resourceType: "user",
      resourceId: user.id,
      detailsJson: JSON.stringify({ email: cleanEmail, method: isBackupValid ? "backup_code" : "totp" }),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: cleanEmail,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    logger.error("auth.2fa_challenge_error", { message: err?.message });
    return NextResponse.json({ error: "2FA authentication failed" }, { status: 500 });
  }
}
