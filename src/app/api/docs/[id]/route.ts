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
import { encryptField, decryptField } from "@/lib/crypto/db-vault";

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

    const decryptedDoc = {
      ...doc,
      title: decryptField(doc.title),
      originalFilename: decryptField(doc.originalFilename),
      storageKey: decryptField(doc.storageKey),
    };

    const decryptedVersions = versions.map((v) => ({
      ...v,
      storageKey: decryptField(v.storageKey),
    }));

    const decryptedDocLinks = docLinks.map((l) => ({
      ...l,
      name: decryptField(l.name),
      watermarkText: l.watermarkText ? decryptField(l.watermarkText) : null,
      ndaText: l.ndaText ? decryptField(l.ndaText) : null,
    }));

    return NextResponse.json({
      document: decryptedDoc,
      versions: decryptedVersions,
      links: decryptedDocLinks,
    });
  } catch (err: any) {
    logger.error("docs.get_failed", { docId: id, message: err?.message, stack: err?.stack });
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
      updatedAt: new Date(),
    };
    if (title !== undefined) {
      updates.title = encryptField(title);
    }
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
    logger.error("docs.update_failed", { docId: id, message: err?.message, stack: err?.stack });
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
    const resolvedDocStorageKey = decryptField(doc.storageKey);

    if (resolvedDocStorageKey) {
      await storage.deleteObject(resolvedDocStorageKey);
    }

    const versions = await db.select().from(docVersions).where(eq(docVersions.docId, id));
    for (const v of versions) {
      const resolvedVersionKey = decryptField(v.storageKey);
      if (resolvedVersionKey && resolvedVersionKey !== resolvedDocStorageKey) {
        await storage.deleteObject(resolvedVersionKey);
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
    logger.error("docs.delete_failed", { docId: id, message: err?.message, stack: err?.stack });
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
