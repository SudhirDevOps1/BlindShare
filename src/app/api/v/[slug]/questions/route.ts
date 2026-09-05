import { NextResponse } from "next/server";
import { db } from "@/db";
import { links, documents, pageQuestions, viewSessions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { genId } from "@/lib/ids";
import { sendWebhookNotification } from "@/lib/notifications/webhook-notifier";
import { sendPushToUser } from "@/lib/push";
import { logger } from "@/lib/logger";
import { rateLimitDistributed } from "@/lib/security/distributed-rate-limiter";
import { encryptField, decryptField } from "@/lib/crypto/db-vault";
import { getSession } from "@/lib/auth/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const [link] = await db
      .select({ id: links.id, ownerId: links.ownerId, isRevoked: links.isRevoked, isActive: links.isActive })
      .from(links)
      .where(eq(links.slug, slug))
      .limit(1);

    if (!link || link.isRevoked || !link.isActive) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const rawSessionId = searchParams.get("sessionId")?.trim() || null;
    const rawViewerEmail = searchParams.get("viewerEmail")?.trim().toLowerCase() || null;

    // Check if the current viewer is the authenticated link owner / founder
    const currentUser = await getSession();
    const isOwner = Boolean(currentUser?.id && currentUser.id === link.ownerId);

    const questions = await db
      .select({
        id: pageQuestions.id,
        sessionId: pageQuestions.sessionId,
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
      .where(eq(pageQuestions.linkId, link.id))
      .orderBy(desc(pageQuestions.createdAt));

    const decryptedQuestions = questions
      .map((q) => {
        const decryptedEmail = q.askerEmail ? decryptField(q.askerEmail)?.toLowerCase() : null;
        const isOwn =
          isOwner ||
          Boolean(rawViewerEmail && decryptedEmail && decryptedEmail === rawViewerEmail) ||
          Boolean(rawSessionId && q.sessionId && q.sessionId === rawSessionId);

        return {
          id: q.id,
          pageNumber: q.pageNumber,
          posXPercent: q.posXPercent,
          posYPercent: q.posYPercent,
          questionText: decryptField(q.questionText),
          askerName: decryptField(q.askerName),
          replyText: q.replyText ? decryptField(q.replyText) : null,
          repliedAt: q.repliedAt,
          isResolved: q.isResolved,
          createdAt: q.createdAt,
          isOwn,
        };
      })
      // Enforce investor/reader privacy: readers only see their own questions and replies
      .filter((q) => isOwner || q.isOwn);

    return NextResponse.json({ questions: decryptedQuestions });
  } catch (err: any) {
    logger.error("questions.list_failed", { slug, message: err?.message });
    return NextResponse.json({ error: "Failed to fetch question pins" }, { status: 500 });
  }
}

import { verifyAltchaPayload } from "@/lib/security/altcha";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const check = await rateLimitDistributed(`question:${ip}:${slug}`, 15, 60_000);
    if (!check.allowed) {
      return NextResponse.json(
        { error: "Too many question submissions. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { pageNumber, posXPercent, posYPercent, questionText, askerEmail, askerName, sessionId, altcha } = body;

    // Verify ALTCHA Proof-of-Work if submitted
    if (altcha) {
      const isValid = verifyAltchaPayload(altcha);
      if (!isValid) {
        return NextResponse.json(
          { error: "Security verification failed. Please try again." },
          { status: 400 }
        );
      }
    }

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
      questionText: encryptField(sanitizedText),                        // AES-256-GCM encrypted
      askerEmail: sanitizedEmail ? encryptField(sanitizedEmail) : null, // AES-256-GCM encrypted
      askerName: encryptField(sanitizedName),                            // AES-256-GCM encrypted
    });

    // Notify document owner via Webhook & WebPush
    const targetWebhook = link.webhookUrl || process.env.DEFAULT_WEBHOOK_URL || process.env.WEBHOOK_URL;
    if (targetWebhook) {
      sendWebhookNotification(targetWebhook, {
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
