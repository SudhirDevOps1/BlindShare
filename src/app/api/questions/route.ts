import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { pageQuestions, documents, links } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { encryptField, decryptField } from "@/lib/crypto/db-vault";
import { sendEmail } from "@/lib/email/email-dispatcher";

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

        const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #020617; color: #f8fafc; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    <div style="display: flex; align-items: center; margin-bottom: 20px;">
      <h2 style="color: #f59e0b; margin: 0; font-size: 18px; font-weight: 700;">BlindShare • Founder Reply to Your Question</h2>
    </div>
    
    <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 14px;">
      Hello <strong>${escapeText(decryptedAskerName, 80)}</strong>,
    </p>
    <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 20px; line-height: 1.5;">
      <strong>${escapeText(founderName, 80)}</strong> has answered your inquiry on <strong>${escapeText(docName, 120)}</strong> (Slide ${slideNum}):
    </p>

    <div style="background: #1e293b; border-left: 3px solid #f59e0b; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px;">
      <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; margin-bottom: 4px;">Your Question (Slide ${slideNum}):</div>
      <div style="font-size: 13px; color: #e2e8f0; font-style: italic;">"${escapeText(decryptedQuestion, 500)}"</div>
    </div>

    <div style="background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
      <div style="font-size: 11px; text-transform: uppercase; color: #34d399; font-weight: 600; margin-bottom: 4px;">Official Founder Response:</div>
      <div style="font-size: 14px; color: #f8fafc; font-weight: 500; line-height: 1.5;">${cleanReply}</div>
    </div>

    <div style="text-align: center; margin-top: 24px; margin-bottom: 20px;">
      <a href="${viewLink}" style="display: inline-block; background: #f59e0b; color: #020617; font-weight: 700; font-size: 13px; text-decoration: none; padding: 10px 24px; border-radius: 10px;">
        View Document & Slide
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #1e293b; margin: 20px 0;" />
    <p style="font-size: 11px; color: #64748b; margin: 0; text-align: center;">
      Protected with BlindShare Zero-Knowledge E2EE Architecture.
    </p>
  </div>
</body>
</html>
`;

        sendEmail({
          to: recipientEmail,
          subject: `Founder reply on "${docName}" (Slide ${slideNum})`,
          html: emailHtml,
          text: `Founder response on "${docName}" (Slide ${slideNum}): ${replyText}`,
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

