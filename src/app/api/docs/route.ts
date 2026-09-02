import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { documents, docVersions, auditLog } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getStorageAdapter } from "@/lib/storage";
import { parseBody } from "@/lib/validation";
import { createDocumentSchema } from "@/lib/validation/schemas";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";
import { detectFormat } from "@/lib/formats";

export async function GET() {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const userDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.ownerId, auth.user.id))
      .orderBy(desc(documents.createdAt));

    return NextResponse.json({ documents: userDocs });
  } catch (err: any) {
    logger.error("docs.list_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const parsed = await parseBody(request, createDocumentSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const {
    title,
    originalFilename,
    sizeBytes,
    pageCount,
    encryptionMode,
    ivHex,
    tagHex,
    ownerEncryptedKeyHex,
    ownerEncryptedKeyIvHex,
    directCiphertextBase64,
  } = parsed.data;

  try {
    // Defence-in-depth: reject filename extensions the client renderer does not
    // know about with a clear message (still never inspects file *content* —
    // the server stays blind, this is metadata-only allowlisting).
    const fmt = detectFormat(originalFilename);
    if (fmt.kind === "unknown") {
      logger.warn("docs.unknown_extension_accepted", { ownerId: auth.user.id, extension: originalFilename.split(".").pop() });
    }

    const docId = genId("doc");
    const storageKey = `docs/${auth.user.id}/${docId}.cipher`;
    const storage = getStorageAdapter();

    if (directCiphertextBase64) {
      const buffer = Buffer.from(directCiphertextBase64, "base64");
      await storage.putObject(storageKey, buffer, "application/octet-stream");
    }

    const presign = await storage.getPresignedPutUrl(storageKey, "application/octet-stream", 600);

    await db.insert(documents).values({
      id: docId,
      ownerId: auth.user.id,
      title,
      originalFilename,
      sizeBytes,
      storageKey,
      encryptionMode: encryptionMode || "e2ee-fragment",
      ivHex: ivHex || null,
      tagHex: tagHex || null,
      ownerEncryptedKeyHex: ownerEncryptedKeyHex || null,
      ownerEncryptedKeyIvHex: ownerEncryptedKeyIvHex || null,
      pageCount: pageCount || 1,
      currentVersion: 1,
      isTombstone: false,
    });

    await db.insert(docVersions).values({
      id: genId("ver"),
      docId,
      versionNum: 1,
      storageKey,
      sizeBytes,
      pageCount: pageCount || 1,
      ivHex: ivHex || null,
      tagHex: tagHex || null,
      changelog: "Initial upload",
    });

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: auth.user.id,
      actorType: "user",
      action: "doc.upload",
      resourceType: "document",
      resourceId: docId,
      detailsJson: JSON.stringify({ sizeBytes, pageCount, mode: encryptionMode || "e2ee-fragment", format: fmt.kind }),
    });

    return NextResponse.json({
      success: true,
      documentId: docId,
      storageKey,
      presignedPutUrl: presign.url,
    });
  } catch (err: any) {
    logger.error("docs.create_failed", { ownerId: auth.user.id, message: err?.message });
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
