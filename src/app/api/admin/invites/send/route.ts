import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/db";
import { invites, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseBody } from "@/lib/validation";
import { genId, genInviteCode } from "@/lib/ids";
import { sendEmail, renderInviteEmail } from "@/lib/email";
import { getRequestOrigin } from "@/lib/auth/request-origin";
import { z } from "zod";
import { logger } from "@/lib/logger";

const sendInviteSchema = z.object({
  recipientEmail: z.string().trim().email("Valid recipient email is required").toLowerCase(),
  role: z.enum(["owner", "admin", "super_admin"]).optional().default("owner"),
  expiryDays: z.union([z.number().int().positive().max(365), z.string()]).optional().default(7),
  customCode: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("errorResponse" in auth) return auth.errorResponse;

  const parsed = await parseBody(request, sendInviteSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const { recipientEmail, role = "owner", expiryDays = 7, customCode } = parsed.data;

  try {
    // Only a Super Admin may mint a super_admin invite
    const effectiveRole = role === "super_admin" && auth.user.role !== "super_admin" ? "owner" : role;
    const finalDays = Number(expiryDays) || 7;

    let code = customCode && customCode.trim() ? customCode.trim() : genInviteCode("sherinv");

    const [collision] = await db.select({ id: invites.id }).from(invites).where(eq(invites.code, code)).limit(1);
    if (collision) {
      code = genInviteCode("sherinv");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + finalDays);

    const inviteId = genId("inv");

    await db.insert(invites).values({
      id: inviteId,
      code,
      role: effectiveRole,
      createdBy: auth.user.id,
      expiresAt,
      isUsed: false,
    });

    const origin = getRequestOrigin(request);
    const signupUrl = `${origin}/signup?invite=${encodeURIComponent(code)}`;

    const { subject, html, text } = renderInviteEmail({
      recipientEmail,
      inviteCode: code,
      signupUrl,
      role: effectiveRole,
      invitedByName: auth.user.name || "Administrator",
      expiresInDays: finalDays,
    });

    const emailResult = await sendEmail({
      to: recipientEmail,
      subject,
      html,
      text,
      fromName: "BlindShare Team",
    });

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: auth.user.id,
      actorType: "admin",
      action: "admin.invite_email_dispatched",
      resourceType: "invite",
      resourceId: inviteId,
      detailsJson: JSON.stringify({
        recipientEmail,
        role: effectiveRole,
        expiryDays: finalDays,
        emailProvider: emailResult.provider,
        emailSuccess: emailResult.success,
      }),
    });

    return NextResponse.json({
      success: true,
      code,
      expiresAt,
      emailSent: emailResult.success,
      provider: emailResult.provider,
      message: `Invitation generated and emailed to ${recipientEmail}`,
    });
  } catch (err: any) {
    logger.error("admin.invite_send_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
  }
}
