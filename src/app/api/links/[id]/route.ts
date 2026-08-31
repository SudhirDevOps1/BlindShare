import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { links, auditLog } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { parseBody } from "@/lib/validation";
import { updateLinkSchema } from "@/lib/validation/schemas";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;

  try {
    const [link] = await db
      .select()
      .from(links)
      .where(and(eq(links.id, id), eq(links.ownerId, auth.user.id)))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    return NextResponse.json({ link });
  } catch (err: any) {
    logger.error("links.get_failed", { linkId: id, message: err?.message });
    return NextResponse.json({ error: "Failed to fetch link" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const parsed = await parseBody(request, updateLinkSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const body = parsed.data;

  try {
    const [link] = await db
      .select()
      .from(links)
      .where(and(eq(links.id, id), eq(links.ownerId, auth.user.id)))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const updates: Partial<typeof links.$inferInsert> = { updatedAt: new Date() };

    if (body.name !== undefined) updates.name = body.name;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.isRevoked !== undefined) updates.isRevoked = body.isRevoked;
    if (body.requiresEmail !== undefined) updates.requiresEmail = body.requiresEmail;
    if (body.allowedDomains !== undefined)
      updates.allowedDomains = body.allowedDomains ? body.allowedDomains.trim().toLowerCase() : null;
    if (body.allowDownload !== undefined) updates.allowDownload = body.allowDownload;
    if (body.watermarkEnabled !== undefined) updates.watermarkEnabled = body.watermarkEnabled;
    if (body.watermarkText !== undefined) updates.watermarkText = body.watermarkText || null;
    if (body.requiresNda !== undefined) updates.requiresNda = body.requiresNda;
    if (body.ndaText !== undefined) updates.ndaText = body.ndaText || null;
    if (body.maxViews !== undefined) updates.maxViews = body.maxViews ? parseInt(String(body.maxViews), 10) : null;
    if (body.expiresAt !== undefined) updates.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    if (body.password !== undefined) {
      if (body.password && body.password.trim().length > 0) {
        updates.passwordHash = await hashPassword(body.password.trim());
        if (body.passwordSaltHex) updates.passwordSaltHex = body.passwordSaltHex;
        if (body.wrappedKeyHex) updates.wrappedKeyHex = body.wrappedKeyHex;
      } else {
        updates.passwordHash = null;
        updates.passwordSaltHex = null;
        updates.wrappedKeyHex = null;
      }
    }

    await db.update(links).set(updates).where(eq(links.id, id));

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: auth.user.id,
      actorType: "user",
      action: "link.update",
      resourceType: "link",
      resourceId: id,
      detailsJson: JSON.stringify(Object.keys(updates)),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error("links.update_failed", { linkId: id, message: err?.message });
    return NextResponse.json({ error: "Failed to update link" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;

  try {
    const [link] = await db
      .select()
      .from(links)
      .where(and(eq(links.id, id), eq(links.ownerId, auth.user.id)))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    await db.delete(links).where(eq(links.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error("links.delete_failed", { linkId: id, message: err?.message });
    return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
  }
}
