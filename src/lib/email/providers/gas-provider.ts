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

  const maxAttempts = 2;
  let lastError = "Failed to communicate with Google Apps Script Web App";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
        signal: AbortSignal.timeout(5500), // Safe 5.5s timeout within serverless ceilings
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || (json && json.success === false)) {
        lastError = json?.error || `GAS returned HTTP ${res.status}`;
        // If rate limited (quota) or unauthorized, do not retry
        if (res.status === 401 || res.status === 403 || res.status === 429) {
          return {
            success: false,
            provider: "gas",
            error: lastError,
          };
        }
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        return {
          success: false,
          provider: "gas",
          error: lastError,
        };
      }

      return {
        success: true,
        provider: "gas",
        quotaRemaining: json?.quotaRemaining,
      };
    } catch (err: any) {
      lastError = err?.message || "GAS fetch failed";
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 300));
        continue;
      }
    }
  }

  return {
    success: false,
    provider: "gas",
    error: lastError,
  };
}
