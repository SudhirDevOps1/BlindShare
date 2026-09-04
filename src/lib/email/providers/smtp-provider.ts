/**
 * SMTP Email Dispatcher (Gmail App Password / Custom SMTP)
 */

import { EmailPayload, EmailResult } from "../types";

export async function sendViaSmtp(payload: EmailPayload): Promise<EmailResult> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return {
      success: false,
      provider: "smtp",
      error: "SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are not fully configured",
    };
  }

  // If running in an environment where nodemailer or raw socket is available
  try {
    // Runtime dynamic load to avoid Turbopack bundle warnings if nodemailer is not installed
    const modName = "nodemailer";
    const nodemailer = await (Function("m", "return import(m)")(modName)).catch(() => null);
    if (!nodemailer || !nodemailer.createTransport) {
      return {
        success: false,
        provider: "smtp",
        error: "Nodemailer package is not installed. Use GAS_WEBAPP_URL or RESEND_API_KEY instead.",
      };
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (process.env.SMTP_SECURE || "true") === "true",
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `"${payload.fromName || "BlindShare Security"}" <${user}>`,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    return {
      success: true,
      provider: "smtp",
      messageId: info?.messageId,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "smtp",
      error: err?.message || "SMTP dispatch failed",
    };
  }
}
