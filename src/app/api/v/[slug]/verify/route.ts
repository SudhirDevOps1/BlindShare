import { NextResponse } from "next/server";
import { db } from "@/db";
import { links, documents, viewSessions } from "@/db/schema";
import { eq, and, or, isNull, sql } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { hashIp, parseUserAgent } from "@/lib/analytics";
import { sendPushToUser } from "@/lib/push";
import { sendWebhookNotification } from "@/lib/notifications/webhook-notifier";
import { parseBody } from "@/lib/validation";
import { verifyLinkSchema } from "@/lib/validation/schemas";
import { validateEmailWithMx } from "@/lib/validation/email-validator";
import { checkLockout, recordFailure, recordSuccess, getFailureCount } from "@/lib/auth/lockout";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

import { verifyAltchaPayload } from "@/lib/security/altcha";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const parsed = await parseBody(request, verifyLinkSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const { password, email, ndaAgreed, altcha } = parsed.data;

  const ip = clientIp(request);
  const failures = getFailureCount(`link:${slug}`, ip);
  const mustRequireAltcha = failures >= 2 || process.env.ALTCHA_REQUIRED === "true";

  if (mustRequireAltcha && !altcha) {
    recordFailure(`link:${slug}`, ip);
    return NextResponse.json(
      { error: "Bot security challenge required. Please complete verification before continuing.", reason: "captcha_required" },
      { status: 400 }
    );
  }

  if (altcha) {
    const isAltchaValid = verifyAltchaPayload(altcha);
    if (!isAltchaValid) {
      recordFailure(`link:${slug}`, ip);
      return NextResponse.json(
        { error: "Bot security verification failed. Please refresh and try again." },
        { status: 400 }
      );
    }
  }

  try {
    // Password-gate brute-force lockout, scoped per link+IP (independent of the
    // owner-login lockout so a share-link guess spree cannot lock out the owner).
    const lockedFor = checkLockout(`link:${slug}`, ip);
    if (lockedFor > 0) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${Math.ceil(lockedFor / 60)} minute(s).` },
        { status: 423, headers: { "Retry-After": String(lockedFor) } }
      );
    }

    const [link] = await db.select().from(links).where(eq(links.slug, slug)).limit(1);

    // Enumeration-proof: identical 404 whether the slug never existed, or exists
    // but is revoked/inactive — no distinguishable signal to a prober.
    if (!link || link.isRevoked || !link.isActive) {
      return NextResponse.json({ error: "This link is not available" }, { status: 404 });
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json({ error: "This link has expired" }, { status: 404 });
    }

    if (link.maxViews !== null && link.viewCount >= link.maxViews) {
      return NextResponse.json({ error: "This link has reached its maximum view limit" }, { status: 404 });
    }

    if (link.passwordHash) {
      if (!password) {
        return NextResponse.json({ error: "Password is required for this document" }, { status: 401 });
      }
      const isMatch = await verifyPassword(password, link.passwordHash);
      if (!isMatch) {
        const { locked } = recordFailure(`link:${slug}`, ip);
        logger.warn("link.password_gate_failed", { linkId: link.id, locked });
        return NextResponse.json(
          { error: locked ? "Too many attempts. This link is temporarily locked." : "Invalid document password" },
          { status: locked ? 423 : 401 }
        );
      }
      recordSuccess(`link:${slug}`, ip);
    }

    let cleanEmail = null;
    if (link.requiresEmail) {
      if (!email) {
        return NextResponse.json({ error: "A valid email address is required to view this document" }, { status: 400 });
      }
      cleanEmail = email.trim().toLowerCase();

      // Anti-fake email protection: Verify DNS MX records & block disposable domains
      const emailCheck = await validateEmailWithMx(cleanEmail);
      if (!emailCheck.valid) {
        return NextResponse.json(
          { error: emailCheck.reason || "Please provide a valid working email address" },
          { status: 400 }
        );
      }

      if (link.allowedDomains) {
        const allowedList = link.allowedDomains.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
        const emailDomain = cleanEmail.split("@")[1] || "";
        const isAllowed = allowedList.some((domain) => emailDomain === domain || emailDomain.endsWith("." + domain));
        if (!isAllowed) {
          return NextResponse.json(
            { error: `Access restricted. Email must belong to: ${link.allowedDomains}` },
            { status: 403 }
          );
        }
      }
    }

    if (link.requiresNda && !ndaAgreed) {
      return NextResponse.json(
        { error: "You must accept the NDA / confidentiality agreement to continue" },
        { status: 400 }
      );
    }

    const rawIp = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";
    const country = request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country") || "Unknown";

    const ipHash = hashIp(rawIp);
    const parsedUa = parseUserAgent(userAgent);
    const sessionId = genId("ses");

    await db.insert(viewSessions).values({
      id: sessionId,
      linkId: link.id,
      docId: link.docId || null,
      viewerEmail: cleanEmail,
      viewerIpHash: ipHash,
      country,
      uaBrowser: parsedUa.browser,
      uaOs: parsedUa.os,
      uaDevice: parsedUa.device,
      ndaAgreedAt: ndaAgreed ? new Date() : null,
      startedAt: new Date(),
      lastHeartbeatAt: new Date(),
      totalDwellSeconds: 0,
      completedPages: 0,
      maxPageReached: 1,
    });

    const shouldRevokeOnBurn = Boolean(link.burnAfterReading);

    await db
      .update(links)
      .set({
        viewCount: sql`${links.viewCount} + 1`,
        isRevoked: shouldRevokeOnBurn ? true : links.isRevoked,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(links.id, link.id),
          eq(links.isRevoked, false),
          or(isNull(links.maxViews), sql`${links.viewCount} < ${links.maxViews}`)
        )
      );

    const [ownerDoc] = link.docId
      ? await db.select({ title: documents.title }).from(documents).where(eq(documents.id, link.docId)).limit(1)
      : [{ title: link.name }];

    const docTitle = ownerDoc?.title || link.name;
    const viewerDisplay = cleanEmail ? cleanEmail : `Anonymous (${parsedUa.device} in ${country})`;

    if (link.webhookUrl) {
      sendWebhookNotification(link.webhookUrl, {
        event: ndaAgreed ? "nda_signed" : "link_opened",
        linkName: link.name,
        linkSlug: link.slug,
        docTitle,
        viewerEmail: cleanEmail || undefined,
        viewerCountry: country,
        viewerDevice: `${parsedUa.os} / ${parsedUa.browser} (${parsedUa.device})`,
        timestamp: new Date().toISOString(),
      }).catch((e) => logger.warn("webhook.dispatch_failed", { message: e?.message }));
    }

    sendPushToUser(link.ownerId, {
      title: `New view on "${docTitle}"`,
      body: `${viewerDisplay} just opened your link "${link.name}"`,
      url: `/dashboard/analytics/${link.id}`,
    }).catch((e) => logger.warn("push.first_open_failed", { message: e?.message }));

    return NextResponse.json({ success: true, sessionId, viewerIdentity: cleanEmail || "anonymous" });
  } catch (err: any) {
    logger.error("link.verify_failed", { message: err?.message });
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
