/**
 * Webhook notification dispatcher.
 * Supports Discord webhooks, Slack incoming webhooks, and generic REST endpoints.
 */

export interface WebhookEventPayload {
  event: "link_opened" | "nda_signed" | "signature_submitted" | "reading_milestone";
  linkName: string;
  linkSlug: string;
  docTitle?: string;
  viewerEmail?: string;
  viewerCountry?: string;
  viewerDevice?: string;
  dwellSeconds?: number;
  signedName?: string;
  timestamp: string;
}

export async function sendWebhookNotification(webhookUrl: string, payload: WebhookEventPayload): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith("http")) return false;

  try {
    const isDiscord = webhookUrl.includes("discord.com/api/webhooks") || webhookUrl.includes("discordapp.com/api/webhooks");
    const isSlack = webhookUrl.includes("hooks.slack.com/services");

    let body: any;

    if (isDiscord) {
      body = {
        username: "BlindShare Alerts",
        avatar_url: "https://blindshare.app/icon.png",
        embeds: [
          {
            title: `🔔 ${getEventTitle(payload.event)}: ${payload.linkName}`,
            description: `A viewer interacted with your secure link **${payload.linkName}** (${payload.docTitle || "Document"}).`,
            color: payload.event === "signature_submitted" ? 0x10b981 : 0x6366f1, // emerald or indigo
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
    } else {
      // Generic JSON Webhook
      body = payload;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000), // 4s timeout to avoid blocking requests
    });

    return response.ok;
  } catch (err) {
    // Non-blocking fire-and-forget
    console.error("[WebhookNotifier] Failed to dispatch webhook:", err);
    return false;
  }
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
    default:
      return "Document Activity";
  }
}
