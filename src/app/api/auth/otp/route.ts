import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, authTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { genId } from "@/lib/ids";
import { createSessionCookie } from "@/lib/auth/session";
import { sendEmail, renderOtpEmail } from "@/lib/email";
import { parseBody } from "@/lib/validation";
import { z } from "zod";
import crypto from "crypto";

const sendOtpSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
});

const verifyOtpSchema = z
  .object({
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    code: z.string().trim().min(6).max(6).optional(),
    otp: z.string().trim().min(6).max(6).optional(),
  })
  .refine((data) => Boolean(data.code || data.otp), {
    message: "6-digit OTP code is required",
    path: ["code"],
  });

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function POST(request: Request) {
  const parsed = await parseBody(request, sendOtpSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const { email } = parsed.data;

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, a verification code has been sent.",
      });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: "Account is suspended. Contact an administrator." }, { status: 403 });
    }

    // Invalidate prior active OTPs for this email
    await db
      .update(authTokens)
      .set({ isUsed: true })
      .where(and(eq(authTokens.email, email), eq(authTokens.type, "otp"), eq(authTokens.isUsed, false)));

    // Generate random 6-digit number
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const tokenHash = hashToken(rawOtp);
    const expiresInMinutes = 15;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await db.insert(authTokens).values({
      id: genId("tok"),
      email,
      tokenHash,
      type: "otp",
      expiresAt,
      isUsed: false,
    });

    const { subject, html, text } = renderOtpEmail({
      recipientEmail: email,
      otpCode: rawOtp,
      expiresInMinutes,
    });

    await sendEmail({
      to: email,
      subject,
      html,
      text,
      fromName: "BlindShare Security",
    });

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a verification code has been sent.",
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const parsed = await parseBody(request, verifyOtpSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const email = parsed.data.email;
  const rawCode = (parsed.data.code || parsed.data.otp)!.trim();

  try {
    const tokenHash = hashToken(rawCode);
    const now = new Date();

    const [record] = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.email, email),
          eq(authTokens.tokenHash, tokenHash),
          eq(authTokens.type, "otp"),
          eq(authTokens.isUsed, false),
          gt(authTokens.expiresAt, now)
        )
      )
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user || user.isBlocked) {
      return NextResponse.json({ error: "Account not found or suspended" }, { status: 403 });
    }

    // Mark OTP as used
    await db.update(authTokens).set({ isUsed: true }).where(eq(authTokens.id, record.id));

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      isBlocked: user.isBlocked,
    };

    await createSessionCookie(sessionUser, user.sessionVersion);

    return NextResponse.json({
      success: true,
      user: {
        ...sessionUser,
        masterKeySaltHex: user.masterKeySaltHex,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
