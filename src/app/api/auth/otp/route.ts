import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, authTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { genId } from "@/lib/ids";
import { createSessionCookie } from "@/lib/auth/session";
import { sendEmail, renderOtpEmail } from "@/lib/email";
import { getRequestOrigin } from "@/lib/auth/request-origin";
import { parseBody } from "@/lib/validation";
import { z } from "zod";
import crypto from "crypto";
import { encryptEmail, decryptEmail } from "@/lib/crypto/db-vault";

const sendOtpSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
});

const verifyOtpSchema = z
  .object({
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    code: z.string().trim().min(3).max(32).optional(),
    otp: z.string().trim().min(3).max(32).optional(),
  })
  .refine((data) => Boolean(data.code || data.otp), {
    message: "Verification code is required",
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

    // Invalidate prior active OTPs & magic links for this email (encrypted lookup)
    await db
      .update(authTokens)
      .set({ isUsed: true })
      .where(and(eq(authTokens.email, encEmail), eq(authTokens.isUsed, false)));

    // Generate random 6-digit number
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const tokenHash = hashToken(rawOtp);
    const expiresInMinutes = 15;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Also generate paired 1-click magic link token (Papermark multi-channel standard)
    const rawMagicToken = crypto.randomBytes(32).toString("hex");
    const magicHash = hashToken(rawMagicToken);

    await db.insert(authTokens).values([
      {
        id: genId("tok"),
        email: encEmail, // AES-256-GCM encrypted
        tokenHash,
        type: "otp",
        expiresAt,
        isUsed: false,
      },
      {
        id: genId("tok"),
        email: encEmail,
        tokenHash: magicHash,
        type: "magic_link",
        expiresAt,
        isUsed: false,
      },
    ]);

    const baseUrl = getRequestOrigin(request);
    const magicLinkUrl = `${baseUrl}/api/auth/magic-link?token=${rawMagicToken}`;
    const userAgent = request.headers.get("user-agent") || "Web Browser";
    const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Web Client";
    const cleanDevice = userAgent.includes("Macintosh")
      ? "Safari / Chrome on macOS"
      : userAgent.includes("Windows")
      ? "Chrome / Edge on Windows"
      : userAgent.includes("Android")
      ? "Chrome on Android"
      : userAgent.includes("iPhone")
      ? "Safari on iOS"
      : userAgent.includes("Linux")
      ? "Linux Workstation"
      : "Desktop / Mobile Browser";

    const { subject, html, text } = renderOtpEmail({
      recipientEmail: email,
      otpCode: rawOtp,
      expiresInMinutes,
      magicLinkUrl,
      formattedCode: `${rawOtp.slice(0, 3)} - ${rawOtp.slice(3)}`,
      deviceInfo: cleanDevice,
      locationInfo: clientIp === "::1" || clientIp === "127.0.0.1" ? "Local Session" : clientIp,
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
  // Sanitize input: strip spaces, hyphens, and uppercase formatting
  const rawCode = (parsed.data.code || parsed.data.otp)!.trim().replace(/[\s\-]/g, "");

  try {
    const encEmail = encryptEmail(email);
    const tokenHash = hashToken(rawCode);
    const now = new Date();

    const [record] = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.email, encEmail),
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

    const [user] = await db.select().from(users).where(eq(users.email, encEmail)).limit(1);

    if (!user || user.isBlocked) {
      return NextResponse.json({ error: "Account not found or suspended" }, { status: 403 });
    }

    // Mark OTP as used
    await db.update(authTokens).set({ isUsed: true }).where(eq(authTokens.id, record.id));

    const sessionUser = {
      id: user.id,
      email: decryptEmail(user.email),
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
