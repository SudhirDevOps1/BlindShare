/**
 * Master Email Dispatcher for BlindShare
 * Automatically routes outgoing email through the best available provider:
 * 1. Google Apps Script (GAS) Web App (Zero domain setup required, $0 cost)
 * 2. Resend API
 * 3. Brevo API
 * 4. SMTP / Gmail
 * 5. Mock / Console logger (Local development fallback)
 */

import { EmailPayload, EmailResult, EmailProviderType } from "./types";
import { sendViaGas } from "./providers/gas-provider";
import { sendViaResend } from "./providers/resend-provider";
import { sendViaBrevo } from "./providers/brevo-provider";
import { sendViaSmtp } from "./providers/smtp-provider";
import { logger } from "@/lib/logger";

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const chosenProvider = (process.env.EMAIL_PROVIDER || "auto").toLowerCase() as EmailProviderType;

  // Specific Provider Override
  if (chosenProvider === "gas") {
    return sendViaGas(payload);
  }
  if (chosenProvider === "resend") {
    return sendViaResend(payload);
  }
  if (chosenProvider === "brevo") {
    return sendViaBrevo(payload);
  }
  if (chosenProvider === "smtp") {
    return sendViaSmtp(payload);
  }

  // Automatic Cascading Fallback (auto)
  if (process.env.GAS_WEBAPP_URL) {
    const res = await sendViaGas(payload);
    if (res.success) return res;
    logger.warn("email.gas_failed_falling_back", { error: res.error });
  }

  if (process.env.RESEND_API_KEY) {
    const res = await sendViaResend(payload);
    if (res.success) return res;
    logger.warn("email.resend_failed_falling_back", { error: res.error });
  }

  if (process.env.BREVO_API_KEY) {
    const res = await sendViaBrevo(payload);
    if (res.success) return res;
    logger.warn("email.brevo_failed_falling_back", { error: res.error });
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const res = await sendViaSmtp(payload);
    if (res.success) return res;
    logger.warn("email.smtp_failed_falling_back", { error: res.error });
  }

  // Local Dev / Mock Fallback
  logger.info("email.mock_delivery", {
    to: payload.to,
    subject: payload.subject,
    preview: payload.text?.substring(0, 80) || "HTML email",
  });

  return {
    success: true,
    provider: "mock",
    messageId: `mock_${Date.now()}`,
  };
}

export function getActiveEmailProvider(): { provider: EmailProviderType; configured: boolean; details: string } {
  if (process.env.GAS_WEBAPP_URL) {
    return { provider: "gas", configured: true, details: "Google Apps Script Relay ($0 Free)" };
  }
  if (process.env.RESEND_API_KEY) {
    return { provider: "resend", configured: true, details: "Resend API (Custom Domain)" };
  }
  if (process.env.BREVO_API_KEY) {
    return { provider: "brevo", configured: true, details: "Brevo API" };
  }
  if (process.env.SMTP_HOST) {
    return { provider: "smtp", configured: true, details: `SMTP (${process.env.SMTP_HOST})` };
  }
  return { provider: "mock", configured: false, details: "Console Mock (Set GAS_WEBAPP_URL or RESEND_API_KEY)" };
}
