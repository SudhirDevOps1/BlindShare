import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { getSession } from "@/lib/auth/session";
import { db } from "@/db";
import { documents, docAudioNotes, links } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await getSession();
    // Check if `id` is a docId or a linkSlug
    let targetDocId = id;
    if (id.startsWith("lnk_") || !id.startsWith("doc_")) {
      const [link] = await db
        .select({ docId: links.docId, isActive: links.isActive, isRevoked: links.isRevoked })
        .from(links)
        .where(eq(links.slug, id))
        .limit(1);
      if (!link || link.isRevoked || !link.isActive || !link.docId) {
        return NextResponse.json({ error: "Audio notes not available" }, { status: 404 });
      }
      targetDocId = link.docId;
    } else {
      // If direct docId query, verify caller is the document owner
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const [doc] = await db
        .select({ id: documents.id, ownerId: documents.ownerId })
        .from(documents)
        .where(and(eq(documents.id, id), eq(documents.ownerId, session.id)))
        .limit(1);
      if (!doc) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }
    }

    const notes = await db
      .select({
        id: docAudioNotes.id,
        pageNumber: docAudioNotes.pageNumber,
        durationSec: docAudioNotes.durationSec,
        title: docAudioNotes.title,
        audioDataUrl: docAudioNotes.audioDataUrl,
        createdAt: docAudioNotes.createdAt,
      })
      .from(docAudioNotes)
      .where(eq(docAudioNotes.docId, targetDocId));

    return NextResponse.json({ notes });
  } catch (err: any) {
    logger.error("audio_notes.list_failed", { docId: id, message: err?.message });
    return NextResponse.json({ error: "Failed to fetch audio notes" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;

  try {
    const [doc] = await db
      .select({ id: documents.id, ownerId: documents.ownerId })
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.ownerId, auth.user.id)))
      .limit(1);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { pageNumber, durationSec, title, audioDataUrl } = body;

    if (!pageNumber || !audioDataUrl) {
      return NextResponse.json(
        { error: "pageNumber and audioDataUrl are required" },
        { status: 400 }
      );
    }

    const noteId = genId("audnote");

    // Remove any existing note on this page before adding new one
    await db
      .delete(docAudioNotes)
      .where(
        and(
          eq(docAudioNotes.docId, id),
          eq(docAudioNotes.pageNumber, parseInt(String(pageNumber), 10))
        )
      );

    await db.insert(docAudioNotes).values({
      id: noteId,
      docId: id,
      pageNumber: parseInt(String(pageNumber), 10),
      storageKey: `audio_${id}_p${pageNumber}.webm`,
      durationSec: parseInt(String(durationSec || 0), 10),
      title: title ? String(title).trim() : `Founder Note - Slide ${pageNumber}`,
      audioDataUrl,
    });

    return NextResponse.json({
      success: true,
      note: {
        id: noteId,
        pageNumber,
        durationSec,
        title: title || `Founder Note - Slide ${pageNumber}`,
      },
    });
  } catch (err: any) {
    logger.error("audio_notes.create_failed", { docId: id, message: err?.message });
    return NextResponse.json({ error: "Failed to attach voice note" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const pageNumber = searchParams.get("pageNumber");

  try {
    const [doc] = await db
      .select({ id: documents.id, ownerId: documents.ownerId })
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.ownerId, auth.user.id)))
      .limit(1);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (pageNumber) {
      await db
        .delete(docAudioNotes)
        .where(
          and(
            eq(docAudioNotes.docId, id),
            eq(docAudioNotes.pageNumber, parseInt(pageNumber, 10))
          )
        );
    } else {
      await db.delete(docAudioNotes).where(eq(docAudioNotes.docId, id));
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error("audio_notes.delete_failed", { docId: id, message: err?.message });
    return NextResponse.json({ error: "Failed to delete audio note" }, { status: 500 });
  }
}
