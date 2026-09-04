/**
 * Brevo (Sendinblue) Email API Provider
 * REST API for high-volume delivery with verified custom domains.
 */

import { EmailPayload, EmailResult } from "../types";

export async function sendViaBrevo(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL || "security@blindshare.app";
  const fromName = payload.fromName || process.env.BREVO_FROM_NAME || "BlindShare Security";

  if (!apiKey) {
    return {
      success: false,
      provider: "brevo",
      error: "BREVO_API_KEY is not configured in environment variables",
    };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: payload.to }],
        subject: payload.subject,
        htmlContent: payload.html,
        textContent: payload.text,
      }),
      signal: AbortSignal.timeout(8000),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        provider: "brevo",
        error: json?.message || `Brevo returned HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      provider: "brevo",
      messageId: json?.messageId,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "brevo",
      error: err?.message || "Failed to reach Brevo API",
    };
  }
}
