import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { datarooms, dataroomDocs, documents, links } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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

    const decryptedDr = {
      ...dr,
      name: decryptField(dr.name),
      description: dr.description ? decryptField(dr.description) : null,
    };

    const decryptedDocs = docs.map((d) => ({
      ...d,
      title: decryptField(d.title),
      originalFilename: decryptField(d.originalFilename),
    }));

    const decryptedLinks = drLinks.map((l) => ({
      ...l,
      name: decryptField(l.name),
      watermarkText: l.watermarkText ? decryptField(l.watermarkText) : null,
      ndaText: l.ndaText ? decryptField(l.ndaText) : null,
    }));

    return NextResponse.json({
      dataroom: decryptedDr,
      documents: decryptedDocs,
      links: decryptedLinks,
    });
  } catch (err: any) {
    logger.error("datarooms.get.failed", { id, message: err?.message, stack: err?.stack });
    return NextResponse.json({ error: "Request failed. Please retry." }, { status: 500 });
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
    logger.error("datarooms.delete.failed", { id, message: err?.message, stack: err?.stack });
    return NextResponse.json({ error: "Request failed. Please retry." }, { status: 500 });
  }
}
