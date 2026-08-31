import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { datarooms, dataroomDocs, documents, links } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;

  try {
    const [dr] = await db
      .select()
      .from(datarooms)
      .where(and(eq(datarooms.id, id), eq(datarooms.ownerId, auth.user.id)))
      .limit(1);

    if (!dr) {
      return NextResponse.json({ error: "Dataroom not found" }, { status: 404 });
    }

    const docs = await db
      .select({
        id: documents.id,
        title: documents.title,
        originalFilename: documents.originalFilename,
        sizeBytes: documents.sizeBytes,
        pageCount: documents.pageCount,
        encryptionMode: documents.encryptionMode,
        sortOrder: dataroomDocs.sortOrder,
      })
      .from(dataroomDocs)
      .innerJoin(documents, eq(dataroomDocs.docId, documents.id))
      .where(eq(dataroomDocs.dataroomId, id))
      .orderBy(dataroomDocs.sortOrder);

    const drLinks = await db
      .select()
      .from(links)
      .where(eq(links.dataroomId, id));

    return NextResponse.json({
      dataroom: dr,
      documents: docs,
      links: drLinks,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch dataroom" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;

  try {
    const [dr] = await db
      .select()
      .from(datarooms)
      .where(and(eq(datarooms.id, id), eq(datarooms.ownerId, auth.user.id)))
      .limit(1);

    if (!dr) {
      return NextResponse.json({ error: "Dataroom not found" }, { status: 404 });
    }

    await db.delete(datarooms).where(eq(datarooms.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete dataroom" }, { status: 500 });
  }
}
