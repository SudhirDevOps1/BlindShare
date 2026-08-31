import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, pool } from "@/db";
import { users, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  generateTotpSecret,
  generateTotpUri,
  verifyTotpToken,
  generateBackupCodes,
} from "@/lib/auth/totp";
import { verifyPassword } from "@/lib/auth/password";
import { genId } from "@/lib/ids";
import QRCode from "qrcode";

async function ensure2faColumns() {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret text;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_backup_codes text;
    `);
  } catch {}
}

export async function GET() {
  await ensure2faColumns();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({
      twoFactorEnabled: users.twoFactorEnabled,
    })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);

  return NextResponse.json({
    enabled: Boolean(user?.twoFactorEnabled),
  });
}

export async function POST(request: Request) {
  await ensure2faColumns();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    // 1. SETUP: Generate a new TOTP secret & QR Code
    if (action === "setup") {
      const secret = generateTotpSecret();
      const uri = generateTotpUri(session.email, secret, "BlindShare");
      const qrCodeDataUrl = await QRCode.toDataURL(uri, {
        margin: 2,
        width: 256,
        color: {
          dark: "#020617",
          light: "#ffffff",
        },
      });

      return NextResponse.json({
        secret,
        uri,
        qrCodeDataUrl,
      });
    }

    // 2. ENABLE: Verify user's initial 6-digit code and save to DB
    if (action === "enable") {
      const { secret, code } = body;
      if (!secret || !code) {
        return NextResponse.json({ error: "Secret and 6-digit code are required" }, { status: 400 });
      }

      const isValid = verifyTotpToken(code, secret);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid verification code. Please check your authenticator app and try again." },
          { status: 400 }
        );
      }

      const { rawCodes, hashedCodes } = generateBackupCodes(8);

      await db
        .update(users)
        .set({
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          twoFactorBackupCodes: hashedCodes.join(","),
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.id));

      await db.insert(auditLog).values({
        id: genId("aud"),
        userId: session.id,
        actorType: session.role === "super_admin" ? "admin" : "user",
        action: "auth.2fa_enabled",
        resourceType: "user",
        resourceId: session.id,
        detailsJson: JSON.stringify({ email: session.email }),
      });

      return NextResponse.json({
        success: true,
        backupCodes: rawCodes,
      });
    }

    // 3. DISABLE: Turn off 2FA after password confirmation
    if (action === "disable") {
      const { password } = body;
      if (!password) {
        return NextResponse.json({ error: "Current password is required to disable 2FA" }, { status: 400 });
      }

      const [user] = await db
        .select({
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(users.id, session.id))
        .limit(1);

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isMatch = await verifyPassword(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
      }

      await db
        .update(users)
        .set({
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.id));

      await db.insert(auditLog).values({
        id: genId("aud"),
        userId: session.id,
        actorType: session.role === "super_admin" ? "admin" : "user",
        action: "auth.2fa_disabled",
        resourceType: "user",
        resourceId: session.id,
        detailsJson: JSON.stringify({ email: session.email }),
      });

      return NextResponse.json({
        success: true,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "2FA operation failed" }, { status: 500 });
  }
}
