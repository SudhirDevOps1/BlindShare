/**
 * Resend Email API Provider
 * Standard transactional API for developers with verified custom domains.
 */

import { EmailPayload, EmailResult } from "../types";

export async function sendViaResend(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_EMAIL || "security@blindshare.app";

  if (!apiKey) {
    return {
      success: false,
      provider: "resend",
      error: "RESEND_API_KEY is not configured in environment variables",
    };
  }

  try {
    const from = payload.fromName ? `${payload.fromName} <${fromAddress}>` : fromAddress;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
      signal: AbortSignal.timeout(8000),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        provider: "resend",
        error: json?.message || `Resend returned HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      provider: "resend",
      messageId: json?.id,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "resend",
      error: err?.message || "Failed to reach Resend API",
    };
  }
}
