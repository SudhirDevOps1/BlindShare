import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, authTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { genId } from "@/lib/ids";
import { hashPassword } from "@/lib/auth/password";
import { sendEmail, renderPasswordResetEmail } from "@/lib/email";
import { getRequestOrigin } from "@/lib/auth/request-origin";
import { parseBody } from "@/lib/validation";
import { z } from "zod";
import crypto from "crypto";
import { encryptEmail } from "@/lib/crypto/db-vault";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
});

const resetPasswordSubmitSchema = z.object({
  token: z.string().trim().min(20, "Invalid reset token"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
});

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function POST(request: Request) {
  const parsed = await parseBody(request, forgotPasswordSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const { email } = parsed.data;

  try {
    const encEmail = encryptEmail(email);
    const [user] = await db.select().from(users).where(eq(users.email, encEmail)).limit(1);
    if (!user) {
      const [anyUser] = await db.select({ id: users.id }).from(users).limit(1);
      if (!anyUser) {
        return NextResponse.json(
          {
            error: "Database has no registered accounts yet. Please click 'Create Account' to register your Super Admin account.",
            reason: "no_users",
          },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          error: "No account found with this email address. Please check your email or register first.",
          reason: "user_not_found",
        },
        { status: 404 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: "Account is suspended. Contact an administrator." }, { status: 403 });
    }

    // Invalidate prior active password reset tokens for this email (encrypted lookup)
    await db
      .update(authTokens)
      .set({ isUsed: true })
      .where(and(eq(authTokens.email, encEmail), eq(authTokens.type, "password_reset"), eq(authTokens.isUsed, false)));

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresInMinutes = 20;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await db.insert(authTokens).values({
      id: genId("tok"),
      email: encEmail, // AES-256-GCM encrypted at rest
      tokenHash,
      type: "password_reset",
      expiresAt,
      isUsed: false,
    });

    const origin = getRequestOrigin(request);
    const resetUrl = `${origin}/reset-password?token=${rawToken}`;

    const { subject, html, text } = renderPasswordResetEmail({
      recipientEmail: email, // plaintext for SMTP delivery only
      resetUrl,
      expiresInMinutes,
    });

    await sendEmail({
      to: email, // plaintext for SMTP — never stored
      subject,
      html,
      text,
      fromName: "BlindShare Security",
    });

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to process password reset request" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const parsed = await parseBody(request, resetPasswordSubmitSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const { token, newPassword } = parsed.data;

  try {
    const tokenHash = hashToken(token);
    const now = new Date();

    const [record] = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.tokenHash, tokenHash),
          eq(authTokens.type, "password_reset"),
          eq(authTokens.isUsed, false),
          gt(authTokens.expiresAt, now)
        )
      )
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired password reset token" }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, record.email)).limit(1);
    if (!user || user.isBlocked) {
      return NextResponse.json({ error: "Account not found or suspended" }, { status: 403 });
    }

    const newPasswordHash = await hashPassword(newPassword);

    // Update password, increment sessionVersion (revokes all active sessions), and mark token used
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        sessionVersion: (user.sessionVersion || 1) + 1,
        failedLoginCount: 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await db.update(authTokens).set({ isUsed: true }).where(eq(authTokens.id, record.id));

    return NextResponse.json({
      success: true,
      message: "Password reset successful. Please log in with your new password.",
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
