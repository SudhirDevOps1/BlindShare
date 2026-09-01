import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { documents, pageQuestions, links } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;

  try {
    const [doc] = await db
      .select({ id: documents.id, ownerId: documents.ownerId, title: documents.title })
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.ownerId, auth.user.id)))
      .limit(1);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const questions = await db
      .select({
        id: pageQuestions.id,
        linkId: pageQuestions.linkId,
        linkName: links.name,
        linkSlug: links.slug,
        pageNumber: pageQuestions.pageNumber,
        posXPercent: pageQuestions.posXPercent,
        posYPercent: pageQuestions.posYPercent,
        questionText: pageQuestions.questionText,
        askerEmail: pageQuestions.askerEmail,
        askerName: pageQuestions.askerName,
        replyText: pageQuestions.replyText,
        repliedAt: pageQuestions.repliedAt,
        isResolved: pageQuestions.isResolved,
        createdAt: pageQuestions.createdAt,
      })
      .from(pageQuestions)
      .leftJoin(links, eq(pageQuestions.linkId, links.id))
      .where(eq(pageQuestions.docId, id))
      .orderBy(desc(pageQuestions.createdAt));

    return NextResponse.json({ docTitle: doc.title, questions });
  } catch (err: any) {
    logger.error("doc_questions.list_failed", { docId: id, message: err?.message });
    return NextResponse.json({ error: "Failed to fetch document questions" }, { status: 500 });
  }
}

export async function PATCH(
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
    const { questionId, replyText, isResolved } = body;

    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 });
    }

    const updates: any = {};
    if (replyText !== undefined) {
      updates.replyText = String(replyText).trim();
      updates.repliedAt = new Date();
    }
    if (isResolved !== undefined) {
      updates.isResolved = Boolean(isResolved);
    }

    await db
      .update(pageQuestions)
      .set(updates)
      .where(and(eq(pageQuestions.id, questionId), eq(pageQuestions.docId, id)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error("doc_questions.update_failed", { docId: id, message: err?.message });
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}
