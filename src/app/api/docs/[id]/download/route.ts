import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getStorageAdapter } from "@/lib/storage";

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
    const obj = await storage.getObject(doc.storageKey);

    if (!obj) {
      return NextResponse.json({ error: "Storage object not found" }, { status: 404 });
    }

    return new NextResponse(obj.data as any, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.originalFilename)}.shercipher"`,
        "X-BlindShare-Mode": doc.encryptionMode,
        "X-BlindShare-IV": doc.ivHex || "",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Download failed" }, { status: 500 });
  }
}
