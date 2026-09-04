import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/db";
import { invites, auditLog } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { parseBody } from "@/lib/validation";
import { adminInviteSchema } from "@/lib/validation/schemas";
import { genId, genInviteCode } from "@/lib/ids";
import { logger } from "@/lib/logger";

export async function GET() {
  const auth = await requireAdmin();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const allInvites = await db.select().from(invites).orderBy(desc(invites.createdAt));
    return NextResponse.json({ invites: allInvites });
  } catch (err: any) {
    logger.error("admin.invites_list_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("errorResponse" in auth) return auth.errorResponse;

  const parsed = await parseBody(request, adminInviteSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const { role = "owner", expiryDays = 7, expiresInDays, customCode, code: altCode } = parsed.data;

  try {
    // Only a Super Admin may mint an invite that grants super_admin.
    const effectiveRole = role === "super_admin" && auth.user.role !== "super_admin" ? "owner" : role;
    const finalDays = expiresInDays !== undefined ? expiresInDays : expiryDays;
    const chosenCode = (customCode && customCode.trim()) || (altCode && altCode.trim()) || "";

    let code = chosenCode ? chosenCode : genInviteCode("sherinv");

    const [collision] = await db.select({ id: invites.id }).from(invites).where(eq(invites.code, code)).limit(1);
    if (collision) {
      code = genInviteCode("sherinv");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(finalDays));

    const inviteId = genId("inv");

    await db.insert(invites).values({
      id: inviteId,
      code,
      role: effectiveRole,
      createdBy: auth.user.id,
      expiresAt,
      isUsed: false,
    });

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: auth.user.id,
      actorType: "admin",
      action: "admin.invite_create",
      resourceType: "invite",
      resourceId: inviteId,
      detailsJson: JSON.stringify({ role: effectiveRole, expiryDays: finalDays }),
    });

    return NextResponse.json({
      success: true,
      code,
      expiresAt,
      invite: {
        id: inviteId,
        code,
        role: effectiveRole,
        expiresAt,
      },
    });
  } catch (err: any) {
    logger.error("admin.invite_create_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Invite ID is required" }, { status: 400 });
    }

    const [target] = await db.select().from(invites).where(eq(invites.id, id)).limit(1);
    if (!target) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    await db.delete(invites).where(eq(invites.id, id));

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: auth.user.id,
      actorType: "admin",
      action: "admin.invite_revoke",
      resourceType: "invite",
      resourceId: id,
      detailsJson: JSON.stringify({ revokedCode: target.code, role: target.role }),
    });

    return NextResponse.json({ success: true, message: "Invite revoked successfully" });
  } catch (err: any) {
    logger.error("admin.invite_revoke_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to revoke invite" }, { status: 500 });
  }
}
