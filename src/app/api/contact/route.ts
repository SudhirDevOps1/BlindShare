import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { parseBody } from "@/lib/validation";
import { contactSchema } from "@/lib/validation/schemas";
import { checkLockout, recordFailure } from "@/lib/auth/lockout";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";
import { encryptEmail, encryptField } from "@/lib/crypto/db-vault";

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);

    // Rate-limit check per IP
    const lockedFor = checkLockout(`contact:${ip}`, ip);
    if (lockedFor > 0) {
      return NextResponse.json(
        { error: "Too many messages sent. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(lockedFor) } }
      );
    }

    const parsed = await parseBody(request, contactSchema);
    if ("errorResponse" in parsed) return parsed.errorResponse;

    const { name, email, subject, message, website } = parsed.data;

    // Silent drop for honeypot bots
    if (website && website.trim().length > 0) {
      return NextResponse.json({ success: true, message: "Message received." });
    }

    // Record submission into auditLog as contact_message
    try {
      await db.insert(auditLog).values({
        id: genId("contact"),
        userId: null,
        actorType: "viewer",
        action: "contact_submission",
        resourceType: "contact_message",
        resourceId: encryptEmail(email),
        detailsJson: JSON.stringify({
          name: name ? encryptField(name) : "Anonymous",
          email: encryptEmail(email),
          subject: subject || "General Inquiry",
          messageSnippet: encryptField(message.slice(0, 300)),
          submittedAt: new Date().toISOString(),
          ip,
        }),
      });
    } catch (dbErr) {
      recordFailure(`contact:${ip}`, ip);
      logger.error("Failed to write contact message to auditLog", { error: String(dbErr) });
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been received. Our team will review it shortly.",
    });
  } catch (err: any) {
    logger.error("Contact API error", { error: err.message });
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
