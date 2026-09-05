import { isSafeWebhookUrl } from "@/lib/security/ssrf-validator";

/**
 * Webhook notification dispatcher.
 * Supports Discord webhooks, Slack incoming webhooks, and generic REST endpoints.
 */

export interface WebhookEventPayload {
  event: "link_opened" | "nda_signed" | "signature_submitted" | "reading_milestone" | "question_asked";
  linkName: string;
  linkSlug: string;
  docTitle?: string;
  pageNumber?: number;
  questionText?: string;
  viewerEmail?: string;
  viewerCountry?: string;
  viewerDevice?: string;
  dwellSeconds?: number;
  signedName?: string;
  timestamp: string;
}

export interface WebhookDispatchResult {
  success: boolean;
  status?: number;
  error?: string;
  latencyMs: number;
}

export async function sendWebhookNotificationDetailed(
  webhookUrl: string,
  payload: WebhookEventPayload
): Promise<WebhookDispatchResult> {
  const t0 = Date.now();
  if (!webhookUrl) {
    return { success: false, error: "Empty webhook target URL", latencyMs: 0 };
  }

  // SSRF Protection: verify destination is public and safe before making request
  const check = isSafeWebhookUrl(webhookUrl);
  if (!check.safe) {
    return {
      success: false,
      error: `Blocked by SSRF security policy (${check.reason || "Forbidden destination"})`,
      latencyMs: Date.now() - t0,
    };
  }

  try {
    const parsed = new URL(webhookUrl.trim());
    const host = parsed.hostname.toLowerCase();
    let path = parsed.pathname;

    // Auto-normalize Stoat / Revolt URLs if /api/ prefix was omitted
    if ((host === "stoat.chat" || host === "app.stoat.chat" || host.endsWith(".stoat.chat") || host === "revolt.chat") && path.startsWith("/webhooks/")) {
      parsed.pathname = "/api" + path;
      path = parsed.pathname;
    }

    const isDiscord =
      (host === "discord.com" || host.endsWith(".discord.com") || host === "discordapp.com" || host.endsWith(".discordapp.com")) &&
      path.startsWith("/api/webhooks");
    const isSlack =
      (host === "hooks.slack.com" || host.endsWith(".slack.com")) &&
      path.startsWith("/services");
    const isStoat =
      host === "stoat.chat" || host === "app.stoat.chat" || host.endsWith(".stoat.chat") || host === "revolt.chat" || host.endsWith(".revolt.chat");

    let body: any;

    if (isDiscord) {
      body = {
        username: "BlindShare Alerts",
        avatar_url: "https://blindshare.app/brand/02-favicon.svg",
        embeds: [
          {
            title: `🔔 ${getEventTitle(payload.event)}: ${payload.linkName}`,
            description: `A viewer interacted with your secure link **${payload.linkName}** (${payload.docTitle || "Document"}).`,
            color: payload.event === "signature_submitted" ? 0x10b981 : 0x6366f1,
            fields: [
              { name: "Viewer", value: payload.viewerEmail || payload.signedName || "Anonymous", inline: true },
              { name: "Location", value: payload.viewerCountry || "Unknown", inline: true },
              { name: "Device", value: payload.viewerDevice || "Desktop", inline: true },
              ...(payload.dwellSeconds ? [{ name: "Time Spent", value: `${payload.dwellSeconds}s`, inline: true }] : []),
            ],
            footer: { text: "BlindShare Zero-Knowledge Document Vault" },
            timestamp: payload.timestamp,
          },
        ],
      };
    } else if (isSlack) {
      body = {
        text: `*${getEventTitle(payload.event)}*: ${payload.linkName}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${getEventTitle(payload.event)}: ${payload.linkName}*\nViewer: *${payload.viewerEmail || payload.signedName || "Anonymous"}* (${payload.viewerCountry || "Unknown"}, ${payload.viewerDevice || "Desktop"})`,
            },
          },
        ],
      };
    } else if (isStoat) {
      // Stoat (Revolt) message payload (content string)
      const eventTitle = getEventTitle(payload.event);
      const summaryText = `🔔 **[BlindShare] ${eventTitle}: ${payload.linkName}**\n📄 Document: *${payload.docTitle || "Document"}*\n👤 Viewer: **${payload.viewerEmail || payload.signedName || "Anonymous"}** (${payload.viewerCountry || "Unknown"}, ${payload.viewerDevice || "Desktop"})${payload.dwellSeconds ? `\n⏱ Time Spent: ${payload.dwellSeconds}s` : ""}${payload.questionText ? `\n💬 Question: "${payload.questionText}"` : ""}`;
      body = {
        content: summaryText,
      };
    } else {
      // Generic JSON Webhook & Chat endpoints
      const eventTitle = getEventTitle(payload.event);
      const summaryText = `🔔 [BlindShare] ${eventTitle}: "${payload.linkName}" (${payload.docTitle || "Document"})\n👤 Viewer: ${payload.viewerEmail || payload.signedName || "Anonymous"} (${payload.viewerCountry || "Unknown"}, ${payload.viewerDevice || "Desktop"})${payload.dwellSeconds ? `\n⏱ Time Spent: ${payload.dwellSeconds}s` : ""}${payload.questionText ? `\n💬 Question: "${payload.questionText}"` : ""}`;

      body = {
        ...payload,
        text: summaryText,
        content: summaryText,
        message: summaryText,
      };
    }

    const response = await fetch(parsed.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });

    const latencyMs = Math.max(1, Date.now() - t0);

    if (response.ok) {
      return { success: true, status: response.status, latencyMs };
    }

    let errorDetail = `Remote server returned HTTP ${response.status}`;
    if (response.status === 404) {
      errorDetail = "Remote server returned 404 Not Found. This means the Webhook ID or Token does not exist on the server (the webhook URL is a test/dummy/fake URL). Please create a live webhook inside your Stoat, Slack, or Discord channel and paste its real URL.";
    } else if (response.status === 401 || response.status === 403) {
      errorDetail = "Remote server returned 401/403 Unauthorized. The token in your webhook URL is invalid or has expired.";
    } else if (response.status === 429) {
      errorDetail = "Remote server returned 429 Too Many Requests (Rate limit reached).";
    }

    return {
      success: false,
      status: response.status,
      error: errorDetail,
      latencyMs,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Network request failed",
      latencyMs: Math.max(1, Date.now() - t0),
    };
  }
}

export async function sendWebhookNotification(webhookUrl: string, payload: WebhookEventPayload): Promise<boolean> {
  const res = await sendWebhookNotificationDetailed(webhookUrl, payload);
  return res.success;
}

function getEventTitle(event: WebhookEventPayload["event"]): string {
  switch (event) {
    case "link_opened":
      return "Document Opened";
    case "nda_signed":
      return "NDA Accepted";
    case "signature_submitted":
      return "Document Digitally Signed";
    case "reading_milestone":
      return "High Interest: Reading > 1 min";
    case "question_asked":
      return "💬 Question Asked on Slide";
    default:
      return "Document Activity";
  }
}
