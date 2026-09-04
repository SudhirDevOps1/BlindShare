/**
 * Clean, modern, responsive HTML email templates for BlindShare.
 * Zero external templating dependencies. Fully compatible with all major email clients.
 */

import { MagicLinkData, OtpData, PasswordResetData, InviteEmailData, ViewerAlertData } from "./types";

function baseEmailLayout(contentHtml: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BlindShare Notification</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
    .container { max-width: 560px; margin: 0 auto; padding: 32px 20px; }
    .card { background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px 24px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4); }
    .brand { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .brand-logo { width: 32px; height: 32px; border-radius: 8px; background-color: #f59e0b; display: inline-block; vertical-align: middle; }
    .brand-name { font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; display: inline-block; vertical-align: middle; margin-left: 8px; }
    .btn { display: inline-block; background-color: #f59e0b; color: #020617; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; margin: 20px 0; text-align: center; }
    .btn:hover { background-color: #fbbf24; }
    .code-box { background-color: #020617; border: 1px solid #334155; border-radius: 12px; padding: 16px; text-align: center; font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #f59e0b; margin: 20px 0; }
    .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #64748b; line-height: 1.5; }
    .security-note { font-size: 12px; color: #94a3b8; background-color: #1e293b; border-radius: 8px; padding: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#0b0f19;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>
  <div class="container">
    <div class="card">
      <div class="brand">
        <span class="brand-logo"></span>
        <span class="brand-name">BlindShare</span>
      </div>
      ${contentHtml}
      <div class="security-note">
        🔒 <strong>Zero-Knowledge Security:</strong> BlindShare never transmits, processes, or logs unencrypted documents or keys. Your privacy is mathematically protected.
      </div>
    </div>
    <div class="footer">
      <p>Sent by BlindShare Platform • Self-Hosted & Zero-Knowledge E2EE</p>
      <p>If you did not request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`;
}

export function renderMagicLinkEmail(data: MagicLinkData): { subject: string; html: string; text: string } {
  const subject = `🔗 Your 1-Click Login Link for BlindShare`;
  const preview = `Click the secure link to sign in to BlindShare. Valid for ${data.expiresInMinutes} minutes.`;
  const html = baseEmailLayout(
    `
    <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0;">Sign in to your account</h2>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      Click the button below to sign in instantly to your BlindShare dashboard without entering a password.
    </p>
    <div style="text-align: center;">
      <a href="${data.magicLinkUrl}" class="btn">Sign In to BlindShare</a>
    </div>
    <p style="font-size: 12px; color: #94a3b8; word-break: break-all;">
      Or copy and paste this link into your browser:<br/>
      <a href="${data.magicLinkUrl}" style="color: #f59e0b;">${data.magicLinkUrl}</a>
    </p>
    <p style="font-size: 12px; color: #64748b;">
      This link will expire in <strong>${data.expiresInMinutes} minutes</strong> and can only be used once.
    </p>
    `,
    preview
  );
  const text = `Sign in to BlindShare: ${data.magicLinkUrl} (Expires in ${data.expiresInMinutes} minutes)`;
  return { subject, html, text };
}

export function renderOtpEmail(data: OtpData): { subject: string; html: string; text: string } {
  const subject = `🔢 ${data.otpCode} is your BlindShare Verification Code`;
  const preview = `Your single-use verification code is ${data.otpCode}. Valid for ${data.expiresInMinutes} minutes.`;
  const html = baseEmailLayout(
    `
    <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0;">Verification Code</h2>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      Enter the following 6-digit code to verify your identity and access BlindShare:
    </p>
    <div class="code-box">
      ${data.otpCode}
    </div>
    <p style="font-size: 12px; color: #64748b; text-align: center;">
      This single-use code will expire in <strong>${data.expiresInMinutes} minutes</strong>. Never share this code with anyone.
    </p>
    `,
    preview
  );
  const text = `Your BlindShare verification code is: ${data.otpCode}. Valid for ${data.expiresInMinutes} minutes.`;
  return { subject, html, text };
}

export function renderPasswordResetEmail(data: PasswordResetData): { subject: string; html: string; text: string } {
  const subject = `🔑 Reset your BlindShare Password`;
  const preview = `Reset your password for BlindShare. Valid for ${data.expiresInMinutes} minutes.`;
  const html = baseEmailLayout(
    `
    <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0;">Password Reset Request</h2>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      We received a request to reset the password for your BlindShare account. Click the button below to choose a new password:
    </p>
    <div style="text-align: center;">
      <a href="${data.resetUrl}" class="btn">Reset Password</a>
    </div>
    <p style="font-size: 12px; color: #94a3b8; word-break: break-all;">
      Or copy and paste this link into your browser:<br/>
      <a href="${data.resetUrl}" style="color: #f59e0b;">${data.resetUrl}</a>
    </p>
    <p style="font-size: 12px; color: #64748b;">
      This link will expire in <strong>${data.expiresInMinutes} minutes</strong>. If you did not request a password reset, no action is needed.
    </p>
    `,
    preview
  );
  const text = `Reset your BlindShare password: ${data.resetUrl} (Expires in ${data.expiresInMinutes} minutes)`;
  return { subject, html, text };
}

export function renderInviteEmail(data: InviteEmailData): { subject: string; html: string; text: string } {
  const subject = `✉️ You've been invited to join BlindShare as ${data.role === "admin" ? "an Admin" : "a Member"}`;
  const preview = `${data.invitedByName} has invited you to join BlindShare.`;
  const html = baseEmailLayout(
    `
    <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0;">Welcome to BlindShare</h2>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      <strong>${data.invitedByName}</strong> has invited you to join BlindShare with the role of <strong style="color: #f59e0b; text-transform: capitalize;">${data.role}</strong>.
    </p>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      Your private registration code is:
    </p>
    <div class="code-box" style="font-size: 20px; letter-spacing: 3px;">
      ${data.inviteCode}
    </div>
    <div style="text-align: center;">
      <a href="${data.signupUrl}" class="btn">Accept Invite & Create Account</a>
    </div>
    <p style="font-size: 12px; color: #64748b; text-align: center;">
      This invitation expires in <strong>${data.expiresInDays} days</strong>.
    </p>
    `,
    preview
  );
  const text = `You've been invited to BlindShare by ${data.invitedByName}. Register here: ${data.signupUrl} (Invite code: ${data.inviteCode})`;
  return { subject, html, text };
}

export function renderViewerAlertEmail(data: ViewerAlertData): { subject: string; html: string; text: string } {
  const subject = `🔔 [${data.event.toUpperCase()}] ${data.docTitle || data.linkName}`;
  const preview = `A recipient has interacted with your shared document ${data.docTitle || data.linkName}.`;
  const html = baseEmailLayout(
    `
    <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0;">Document Interaction Alert</h2>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      A recipient interacted with your secure link <strong>${data.linkName}</strong>:
    </p>
    <div style="background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px;">
      <p style="margin: 4px 0; color: #94a3b8;">Document: <strong style="color: #f8fafc;">${data.docTitle || "Untitled"}</strong></p>
      <p style="margin: 4px 0; color: #94a3b8;">Event: <strong style="color: #f59e0b;">${data.event}</strong></p>
      <p style="margin: 4px 0; color: #94a3b8;">Viewer: <strong style="color: #f8fafc;">${data.viewerEmail || "Anonymous"}</strong></p>
      <p style="margin: 4px 0; color: #94a3b8;">Location: <strong style="color: #f8fafc;">${data.viewerCountry || "Unknown"}</strong></p>
      <p style="margin: 4px 0; color: #94a3b8;">Device: <strong style="color: #f8fafc;">${data.viewerDevice || "Desktop"}</strong></p>
      ${data.dwellSeconds ? `<p style="margin: 4px 0; color: #94a3b8;">Dwell Time: <strong style="color: #10b981;">${data.dwellSeconds}s</strong></p>` : ""}
    </div>
    <p style="font-size: 12px; color: #64748b;">
      Timestamp: ${data.timestamp}
    </p>
    `,
    preview
  );
  const text = `Document Interaction on ${data.docTitle || data.linkName}: ${data.event} by ${data.viewerEmail || "Anonymous"}`;
  return { subject, html, text };
}
