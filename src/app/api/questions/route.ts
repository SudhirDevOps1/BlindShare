import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { pageQuestions, documents, links } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { encryptField, decryptField } from "@/lib/crypto/db-vault";
import { sendEmail, renderQuestionReplyEmail } from "@/lib/email";

export async function GET() {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const userQuestions = await db
      .select({
        id: pageQuestions.id,
        docId: pageQuestions.docId,
        docTitle: documents.title,
        linkId: pageQuestions.linkId,
        linkName: links.name,
        linkSlug: links.slug,
        pageNumber: pageQuestions.pageNumber,
        posXPercent: pageQuestions.posXPercent,
        posYPercent: pageQuestions.posYPercent,
        questionText: pageQuestions.questionText,
        askerName: pageQuestions.askerName,
        askerEmail: pageQuestions.askerEmail,
        replyText: pageQuestions.replyText,
        repliedAt: pageQuestions.repliedAt,
        isResolved: pageQuestions.isResolved,
        createdAt: pageQuestions.createdAt,
      })
      .from(pageQuestions)
      .innerJoin(links, eq(pageQuestions.linkId, links.id))
      .leftJoin(documents, eq(links.docId, documents.id))
      .where(eq(links.ownerId, auth.user.id))
      .orderBy(desc(pageQuestions.createdAt));

    const decrypted = userQuestions.map((q) => ({
      ...q,
      questionText: decryptField(q.questionText),
      askerName: decryptField(q.askerName),
      askerEmail: q.askerEmail ? decryptField(q.askerEmail) : null,
      replyText: q.replyText ? decryptField(q.replyText) : null,
    }));

    return NextResponse.json({ questions: decrypted });
  } catch (err: any) {
    logger.error("questions.list_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await request.json();
    const { questionId, replyText, isResolved } = body;

    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 });
    }

    const [q] = await db
      .select({
        id: pageQuestions.id,
        docId: pageQuestions.docId,
        docTitle: documents.title,
        linkId: pageQuestions.linkId,
        linkName: links.name,
        linkSlug: links.slug,
        pageNumber: pageQuestions.pageNumber,
        questionText: pageQuestions.questionText,
        askerName: pageQuestions.askerName,
        askerEmail: pageQuestions.askerEmail,
      })
      .from(pageQuestions)
      .innerJoin(links, eq(pageQuestions.linkId, links.id))
      .leftJoin(documents, eq(links.docId, documents.id))
      .where(and(eq(pageQuestions.id, questionId), eq(links.ownerId, auth.user.id)))
      .limit(1);

    if (!q) {
      return NextResponse.json({ error: "Question not found or access denied" }, { status: 404 });
    }

    const escapeText = (str: string, maxLen: number) =>
      String(str || "")
        .replace(/[<>"'&]/g, (c) => (c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : c === "'" ? "&#39;" : "&amp;"))
        .trim()
        .substring(0, maxLen);

    const updatePayload: any = {};
    let isNewReply = false;
    if (typeof replyText === "string" && replyText.trim()) {
      updatePayload.replyText = encryptField(escapeText(replyText, 2000));
      updatePayload.repliedAt = new Date();
      isNewReply = true;
    }
    if (typeof isResolved === "boolean") {
      updatePayload.isResolved = isResolved;
    }

    await db
      .update(pageQuestions)
      .set(updatePayload)
      .where(eq(pageQuestions.id, questionId));

    // Send email notification to the reader if an email was provided
    if (isNewReply && q.askerEmail) {
      const recipientEmail = decryptField(q.askerEmail);
      if (recipientEmail && recipientEmail.includes("@")) {
        const decryptedAskerName = decryptField(q.askerName) || "Reader";
        const decryptedQuestion = decryptField(q.questionText) || "";
        const docName = q.docTitle || q.linkName || "Pitch Deck";
        const slideNum = q.pageNumber || 1;
        const founderName = auth.user.name || "The Founder";
        const cleanReply = escapeText(replyText, 2000);

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://blindshare.vercel.app";
        const viewLink = q.linkSlug ? `${appUrl}/v/${q.linkSlug}` : appUrl;

        const questionEmail = renderQuestionReplyEmail({
          recipientEmail,
          askerName: escapeText(decryptedAskerName, 80),
          founderName: escapeText(founderName, 80),
          docName: escapeText(docName, 120),
          slideNum,
          questionText: escapeText(decryptedQuestion, 500),
          replyText: cleanReply,
          viewLink,
        });

        sendEmail({
          to: recipientEmail,
          subject: questionEmail.subject,
          html: questionEmail.html,
          text: questionEmail.text,
          fromName: "BlindShare Inquiries",
        })
          .then((res) => logger.info("questions.reply_email_sent", { to: recipientEmail, success: res.success }))
          .catch((emailErr) => logger.warn("questions.reply_email_failed", { message: emailErr?.message }));
      }
    }

    return NextResponse.json({ success: true, updated: updatePayload });
  } catch (err: any) {
    logger.error("questions.update_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Question id is required" }, { status: 400 });
    }

    const [q] = await db
      .select({ id: pageQuestions.id })
      .from(pageQuestions)
      .innerJoin(links, eq(pageQuestions.linkId, links.id))
      .where(and(eq(pageQuestions.id, id), eq(links.ownerId, auth.user.id)))
      .limit(1);

    if (!q) {
      return NextResponse.json({ error: "Question not found or access denied" }, { status: 404 });
    }

    await db.delete(pageQuestions).where(eq(pageQuestions.id, id));

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    logger.error("questions.delete_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}

