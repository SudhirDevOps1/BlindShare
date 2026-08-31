import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { documents, docVersions, auditLog } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getStorageAdapter } from "@/lib/storage";
import { parseBody } from "@/lib/validation";
import { createVersionSchema } from "@/lib/validation/schemas";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;

  try {
    const versions = await db
      .select()
      .from(docVersions)
      .where(eq(docVersions.docId, id))
      .orderBy(desc(docVersions.versionNum));

    return NextResponse.json({ versions });
  } catch (err: any) {
    logger.error("docs.versions_list_failed", { docId: id, message: err?.message });
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const parsed = await parseBody(request, createVersionSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const { sizeBytes, pageCount, ivHex, tagHex, changelog, directCiphertextBase64 } = parsed.data;

  try {
    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.ownerId, auth.user.id)))
      .limit(1);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const newVersionNum = doc.currentVersion + 1;
    const versionStorageKey = `docs/${auth.user.id}/${id}_v${newVersionNum}.cipher`;
    const storage = getStorageAdapter();

    if (directCiphertextBase64) {
      const buffer = Buffer.from(directCiphertextBase64, "base64");
      await storage.putObject(versionStorageKey, buffer, "application/octet-stream");
    }

    const presign = await storage.getPresignedPutUrl(versionStorageKey, "application/octet-stream", 600);
    const versionId = genId("ver");

    await db.insert(docVersions).values({
      id: versionId,
      docId: id,
      versionNum: newVersionNum,
      storageKey: versionStorageKey,
      sizeBytes: sizeBytes || doc.sizeBytes,
      pageCount: pageCount || doc.pageCount,
      ivHex: ivHex || null,
      tagHex: tagHex || null,
      changelog: changelog || `Version ${newVersionNum}`,
    });

    await db
      .update(documents)
      .set({
        currentVersion: newVersionNum,
        storageKey: versionStorageKey,
        sizeBytes: sizeBytes || doc.sizeBytes,
        pageCount: pageCount || doc.pageCount,
        ivHex: ivHex || doc.ivHex,
        tagHex: tagHex || doc.tagHex,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id));

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: auth.user.id,
      actorType: "user",
      action: "doc.new_version",
      resourceType: "document",
      resourceId: id,
      detailsJson: JSON.stringify({ versionNum: newVersionNum }),
    });

    return NextResponse.json({
      success: true,
      versionNum: newVersionNum,
      presignedPutUrl: presign.url,
      storageKey: versionStorageKey,
    });
  } catch (err: any) {
    logger.error("docs.new_version_failed", { docId: id, message: err?.message });
    return NextResponse.json({ error: "Failed to create version" }, { status: 500 });
  }
}
