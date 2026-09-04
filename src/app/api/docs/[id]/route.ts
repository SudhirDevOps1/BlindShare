import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { documents, docVersions, auditLog } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getStorageAdapter } from "@/lib/storage";
import { parseBody } from "@/lib/validation";
import { updateDocumentSchema } from "@/lib/validation/schemas";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;

  try {
    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.ownerId, auth.user.id)))
      .limit(1);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const versions = await db.select().from(docVersions).where(eq(docVersions.docId, id));
    const { links } = await import("@/db/schema");
    const docLinks = await db.select().from(links).where(eq(links.docId, id));

    return NextResponse.json({ document: doc, versions, links: docLinks });
  } catch (err: any) {
    logger.error("docs.get_failed", { docId: id, message: err?.message });
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const parsed = await parseBody(request, updateDocumentSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const { title, ownerEncryptedKeyHex, ownerEncryptedKeyIvHex } = parsed.data;

  try {
    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.ownerId, auth.user.id)))
      .limit(1);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const updates: Record<string, any> = {
      title: title || doc.title,
      updatedAt: new Date(),
    };
    if (ownerEncryptedKeyHex !== undefined) {
      updates.ownerEncryptedKeyHex = ownerEncryptedKeyHex;
    }
    if (ownerEncryptedKeyIvHex !== undefined) {
      updates.ownerEncryptedKeyIvHex = ownerEncryptedKeyIvHex;
    }

    await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error("docs.update_failed", { docId: id, message: err?.message });
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;

  try {
    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.ownerId, auth.user.id)))
      .limit(1);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const storage = getStorageAdapter();

    if (doc.storageKey) {
      await storage.deleteObject(doc.storageKey);
    }

    const versions = await db.select().from(docVersions).where(eq(docVersions.docId, id));
    for (const v of versions) {
      if (v.storageKey && v.storageKey !== doc.storageKey) {
        await storage.deleteObject(v.storageKey);
      }
    }

    await db.delete(documents).where(eq(documents.id, id));

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: auth.user.id,
      actorType: "user",
      action: "doc.crypto_shred",
      resourceType: "document",
      resourceId: id,
      detailsJson: JSON.stringify({ shreddedObjects: versions.length + 1 }),
    });

    return NextResponse.json({ success: true, message: "Document and ciphertext crypto-shredded" });
  } catch (err: any) {
    logger.error("docs.delete_failed", { docId: id, message: err?.message });
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
