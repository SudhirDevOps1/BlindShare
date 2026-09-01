import { NextResponse } from "next/server";
import { db } from "@/db";
import { links, documents, pageQuestions, viewSessions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { genId } from "@/lib/ids";
import { sendWebhookNotification } from "@/lib/notifications/webhook-notifier";
import { sendPushToUser } from "@/lib/push";
import { logger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const [link] = await db
      .select({ id: links.id, isRevoked: links.isRevoked, isActive: links.isActive })
      .from(links)
      .where(eq(links.slug, slug))
      .limit(1);

    if (!link || link.isRevoked || !link.isActive) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const questions = await db
      .select({
        id: pageQuestions.id,
        pageNumber: pageQuestions.pageNumber,
        posXPercent: pageQuestions.posXPercent,
        posYPercent: pageQuestions.posYPercent,
        questionText: pageQuestions.questionText,
        askerName: pageQuestions.askerName,
        replyText: pageQuestions.replyText,
        repliedAt: pageQuestions.repliedAt,
        isResolved: pageQuestions.isResolved,
        createdAt: pageQuestions.createdAt,
      })
      .from(pageQuestions)
      .where(eq(pageQuestions.linkId, link.id))
      .orderBy(desc(pageQuestions.createdAt));

    return NextResponse.json({ questions });
  } catch (err: any) {
    logger.error("questions.list_failed", { slug, message: err?.message });
    return NextResponse.json({ error: "Failed to fetch question pins" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const { pageNumber, posXPercent, posYPercent, questionText, askerEmail, askerName, sessionId } = body;

    if (!pageNumber || !questionText || typeof questionText !== "string" || !questionText.trim()) {
      return NextResponse.json(
        { error: "Page number and question text are required" },
        { status: 400 }
      );
    }

    const [link] = await db
      .select({
        id: links.id,
        name: links.name,
        docId: links.docId,
        ownerId: links.ownerId,
        webhookUrl: links.webhookUrl,
        isRevoked: links.isRevoked,
        isActive: links.isActive,
      })
      .from(links)
      .where(eq(links.slug, slug))
      .limit(1);

    if (!link || link.isRevoked || !link.isActive) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const escapeText = (str: string, maxLen: number) =>
      String(str || "")
        .replace(/[<>"'&]/g, (c) => (c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : c === "'" ? "&#39;" : "&amp;"))
        .trim()
        .substring(0, maxLen);

    const sanitizedText = escapeText(questionText, 1000);
    const sanitizedName = askerName ? escapeText(String(askerName), 80) : "Anonymous Reader";
    const sanitizedEmail = askerEmail ? String(askerEmail).trim().toLowerCase().substring(0, 254) : null;

    if (!sanitizedText) {
      return NextResponse.json({ error: "Question text cannot be empty" }, { status: 400 });
    }

    const questionId = genId("qst");

    await db.insert(pageQuestions).values({
      id: questionId,
      linkId: link.id,
      docId: link.docId || "",
      sessionId: sessionId || null,
      pageNumber: Math.max(1, parseInt(String(pageNumber), 10)),
      posXPercent: Math.min(100, Math.max(0, parseInt(String(posXPercent || 50), 10))),
      posYPercent: Math.min(100, Math.max(0, parseInt(String(posYPercent || 50), 10))),
      questionText: sanitizedText,
      askerEmail: sanitizedEmail,
      askerName: sanitizedName,
    });

    // Notify document owner via Webhook & WebPush
    if (link.webhookUrl) {
      sendWebhookNotification(link.webhookUrl, {
        event: "question_asked",
        linkName: link.name,
        linkSlug: slug,
        pageNumber,
        questionText: questionText.trim(),
        viewerEmail: askerEmail || undefined,
        timestamp: new Date().toISOString(),
      }).catch((e) => logger.warn("webhook.question_failed", { message: e?.message }));
    }

    sendPushToUser(link.ownerId, {
      title: `New Question on Page ${pageNumber}`,
      body: `"${questionText.trim().substring(0, 80)}" on link "${link.name}"`,
      url: `/dashboard/analytics/${link.id}`,
    }).catch((e) => logger.warn("push.question_failed", { message: e?.message }));

    return NextResponse.json({
      success: true,
      question: {
        id: questionId,
        pageNumber,
        posXPercent,
        posYPercent,
        questionText: questionText.trim(),
        askerName: askerName || "Anonymous Reader",
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    logger.error("questions.create_failed", { slug, message: err?.message });
    return NextResponse.json({ error: "Failed to submit question" }, { status: 500 });
  }
}
