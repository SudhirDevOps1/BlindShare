import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, authTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { genId } from "@/lib/ids";
import { createSessionCookie } from "@/lib/auth/session";
import { sendEmail, renderMagicLinkEmail } from "@/lib/email";
import { getRequestOrigin } from "@/lib/auth/request-origin";
import { parseBody } from "@/lib/validation";
import { z } from "zod";
import crypto from "crypto";

const requestMagicLinkSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
});

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function POST(request: Request) {
  const parsed = await parseBody(request, requestMagicLinkSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const { email } = parsed.data;

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      // Don't reveal user existence, but return clean message
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, a magic link has been sent.",
      });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: "Account is suspended. Contact an administrator." }, { status: 403 });
    }

    // Invalidate prior active magic links for this email
    await db
      .update(authTokens)
      .set({ isUsed: true })
      .where(and(eq(authTokens.email, email), eq(authTokens.type, "magic_link"), eq(authTokens.isUsed, false)));

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresInMinutes = 15;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await db.insert(authTokens).values({
      id: genId("tok"),
      email,
      tokenHash,
      type: "magic_link",
      expiresAt,
      isUsed: false,
    });

    const origin = getRequestOrigin(request);
    const magicLinkUrl = `${origin}/api/auth/magic-link?token=${rawToken}`;

    const { subject, html, text } = renderMagicLinkEmail({
      recipientEmail: email,
      magicLinkUrl,
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
      message: "If an account exists with that email, a magic link has been sent.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to generate magic link" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }

  try {
    const tokenHash = hashToken(token);
    const now = new Date();

    const [record] = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.tokenHash, tokenHash),
          eq(authTokens.type, "magic_link"),
          eq(authTokens.isUsed, false),
          gt(authTokens.expiresAt, now)
        )
      )
      .limit(1);

    if (!record) {
      return NextResponse.redirect(new URL("/login?error=expired_token", request.url));
    }

    const [user] = await db.select().from(users).where(eq(users.email, record.email)).limit(1);

    if (!user || user.isBlocked) {
      return NextResponse.redirect(new URL("/login?error=account_blocked", request.url));
    }

    // Mark token as consumed
    await db.update(authTokens).set({ isUsed: true }).where(eq(authTokens.id, record.id));

    // Create authenticated session
    await createSessionCookie(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any,
        isBlocked: user.isBlocked,
      },
      user.sessionVersion
    );

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    return NextResponse.redirect(new URL("/login?error=server_error", request.url));
  }
}
