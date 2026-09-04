/**
 * Google Apps Script (GAS) Web App Email Dispatcher
 * Allows 100% free ($0) email delivery via personal Gmail (500/day) or Workspace (2,000/day)
 * without requiring custom domain ownership or DNS DKIM/SPF verification.
 */

import { EmailPayload, EmailResult } from "../types";

export async function sendViaGas(payload: EmailPayload): Promise<EmailResult> {
  const webappUrl = process.env.GAS_WEBAPP_URL;
  const secretToken = process.env.GAS_SECRET_TOKEN || "";

  if (!webappUrl) {
    return {
      success: false,
      provider: "gas",
      error: "GAS_WEBAPP_URL is not configured in environment variables",
    };
  }

  try {
    const res = await fetch(webappUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: secretToken,
        secretToken: secretToken,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text || "",
        fromName: payload.fromName || "BlindShare Security",
      }),
      signal: AbortSignal.timeout(10000), // 10-second timeout
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || (json && json.success === false)) {
      return {
        success: false,
        provider: "gas",
        error: json?.error || `GAS returned HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      provider: "gas",
      quotaRemaining: json?.quotaRemaining,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "gas",
      error: err?.message || "Failed to communicate with Google Apps Script Web App",
    };
  }
}
