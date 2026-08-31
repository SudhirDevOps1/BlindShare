import { NextResponse } from "next/server";
import { db } from "@/db";
import { links, signatures, viewSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashIp } from "@/lib/analytics";
import { parseBody } from "@/lib/validation";
import { submitSignatureSchema } from "@/lib/validation/schemas";
import { sendWebhookNotification } from "@/lib/notifications/webhook-notifier";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const parsed = await parseBody(request, submitSignatureSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const { sessionId, signerName, signerEmail, signatureDataUrl } = parsed.data;

  try {
    const [link] = await db.select().from(links).where(eq(links.slug, slug)).limit(1);

    if (!link || link.isRevoked || !link.isActive) {
      return NextResponse.json({ error: "Link not available" }, { status: 404 });
    }

    const ip = clientIp(request);
    const ipHash = hashIp(ip);
    const signatureId = genId("sig");

    await db.insert(signatures).values({
      id: signatureId,
      linkId: link.id,
      sessionId: sessionId || null,
      signerName,
      signerEmail: signerEmail || null,
      signatureDataUrl,
      signedAt: new Date(),
      ipHash,
    });

    if (link.webhookUrl) {
      sendWebhookNotification(link.webhookUrl, {
        event: "signature_submitted",
        linkName: link.name,
        linkSlug: link.slug,
        signedName: signerName,
        viewerEmail: signerEmail,
        timestamp: new Date().toISOString(),
      }).catch((e) => logger.warn("webhook.dispatch_failed", { message: e?.message }));
    }

    logger.info("signature.submitted", { linkId: link.id, signatureId });
    return NextResponse.json({ success: true, signatureId });
  } catch (err: any) {
    logger.error("signature.submit_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to record signature" }, { status: 500 });
  }
}
