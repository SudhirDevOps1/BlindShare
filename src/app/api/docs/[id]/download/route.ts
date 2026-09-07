import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getStorageAdapter } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { decryptField } from "@/lib/crypto/db-vault";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const resolvedStorageKey = decryptField(doc.storageKey);
    const obj = await storage.getObject(resolvedStorageKey);

    if (!obj) {
      return NextResponse.json({ error: "Storage object not found" }, { status: 404 });
    }

    const clearFilename = decryptField(doc.originalFilename) || "document";

    return new NextResponse(obj.data as any, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(clearFilename)}.shercipher"`,
        "X-BlindShare-Mode": doc.encryptionMode,
        "X-BlindShare-IV": doc.ivHex || "",
      },
    });
  } catch (err: any) {
    logger.error("docs.download.failed", { id, message: err?.message, stack: err?.stack });
    return NextResponse.json({ error: "Request failed. Please retry." }, { status: 500 });
  }
}
