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
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(15000), // Generous 15s timeout for Google Apps Script cold-start & execution
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || (json && json.success === false)) {
      const errorMsg = json?.error || `GAS returned HTTP ${res.status}`;
      return {
        success: false,
        provider: "gas",
        error: errorMsg,
      };
    }

    return {
      success: true,
      provider: "gas",
      quotaRemaining: json?.quotaRemaining,
    };
  } catch (err: any) {
    const isTimeout = err?.name === "AbortError" || err?.name === "TimeoutError" || err?.message?.includes("aborted");
    return {
      success: false,
      provider: "gas",
      error: isTimeout
        ? "Google Apps Script timed out after 15s. The email may still be processing in your Google account."
        : (err?.message || "GAS fetch failed"),
    };
  }
}
