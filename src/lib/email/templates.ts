/**
 * Clean, modern, responsive HTML email templates for BlindShare.
 * Zero external templating dependencies. Fully compatible with all major email clients.
 */

import { MagicLinkData, OtpData, PasswordResetData, InviteEmailData, ViewerAlertData, DiagnosticEmailData } from "./types";

const BLINDSHARE_LOGO_URL = "https://raw.githubusercontent.com/SudhirDevOps1/BlindShare/main/public/brand/02-favicon.svg";

/**
 * Base layout wrapper providing universal table-based container, high-contrast dark theme,
 * official BlindShare logo header, zero-knowledge cryptographic guarantee badge, and standard footer.
 * Every tag contains inlined styles to prevent email client CSS-stripping.
 */
export function baseEmailLayout(contentHtml: string, previewText: string, headerTitle: string = "Security Notification"): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>${headerTitle} - BlindShare</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-card { width: 100% !important; border-radius: 8px !important; }
      .email-content { padding: 20px 14px !important; }
      .email-header { padding: 16px 14px !important; }
      .email-outer-table { padding: 12px 6px !important; }
      .otp-code-text { font-size: 26px !important; letter-spacing: 2px !important; }
      .mobile-stack-card { padding: 12px 12px !important; }
    }
  </style>
</head>
<body bgcolor="#090d16" style="margin: 0; padding: 0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #f8fafc;">
  <!-- Preheader text (hidden in inbox preview) -->
  <div style="display: none; font-size: 1px; color: #090d16; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${previewText}
  </div>

  <!-- Outer wrapper table -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#090d16" class="email-outer-table" style="background-color: #090d16; margin: 0; padding: 32px 12px;">
    <tr>
      <td align="center" valign="top">

        <!-- Main Card Container (Max 580px) -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-card" style="max-width: 580px; width: 100%; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);">

          <!-- Brand Header Banner -->
          <tr>
            <td bgcolor="#0b1222" class="email-header" style="background-color: #0b1222; background: linear-gradient(180deg, #152238 0%, #0b1222 100%); border-bottom: 1px solid #1e293b; padding: 22px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="padding-right: 12px;">
                          <img src="${BLINDSHARE_LOGO_URL}" alt="BlindShare Logo" width="42" height="42" style="width: 42px; height: 42px; border-radius: 10px; display: block; border: 1px solid rgba(245, 158, 11, 0.5); background-color: #030712;" />
                        </td>
                        <td valign="middle">
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; line-height: 1.1;">
                            BLIND<span style="color: #f59e0b;">SHARE</span>
                          </div>
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 3px;">
                            Zero-Knowledge Vault
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 20px; padding: 4px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #10b981; letter-spacing: 0.04em;">
                      ● E2EE SECURED
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td bgcolor="#0f172a" class="email-content" style="background-color: #0f172a; padding: 34px 28px 26px 28px;">
              ${contentHtml}

              <!-- Zero-Knowledge Cryptographic Trust Callout -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 28px; background-color: #070e1e; border: 1px solid #1e3a5f; border-radius: 10px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="28" valign="top" style="padding-right: 10px; font-size: 18px; line-height: 1.2;">
                          🔒
                        </td>
                        <td valign="middle" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.55; color: #94a3b8;">
                          <strong style="color: #f8fafc;">Zero-Knowledge Security Guarantee:</strong> BlindShare never transmits, processes, or logs unencrypted documents or decryption keys (<code style="font-family: 'SFMono-Regular', Consolas, Monaco, monospace; color: #f59e0b; background-color: rgba(245, 158, 11, 0.12); padding: 1px 4px; border-radius: 4px;">#k=...</code>). Your privacy is mathematically protected by client-side WebCrypto AES-GCM-256.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Bottom Platform Meta & Safety Notice -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #1e293b; text-align: center;">
                <tr>
                  <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #475569;">
                    <div style="color: #64748b; font-weight: 700; margin-bottom: 4px;">
                      BlindShare Platform v1.4.0 • Enterprise Zero-Knowledge Vault
                    </div>
                    <div>
                      Self-Hosted & Zero-Knowledge E2EE • RFC 3986 URL Fragment Invariant
                    </div>
                    <div style="margin-top: 6px; color: #334155;">
                      If you did not request this email, no action is needed. Your account remains completely secure.
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1-Click Magic Link Email Template
 */
export function renderMagicLinkEmail(data: MagicLinkData): { subject: string; html: string; text: string } {
  const subject = `🔗 Your 1-Click Login Link for BlindShare`;
  const preview = `Click the secure link to sign in to BlindShare. Valid for ${data.expiresInMinutes} minutes.`;
  const html = baseEmailLayout(
    `
    <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 14px 0; line-height: 1.3; letter-spacing: -0.02em;">
      Instant 1-Click Sign In
    </h1>
    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.65; color: #cbd5e1; margin: 0 0 22px 0;">
      We received a sign-in request for your BlindShare account (<strong style="color: #ffffff;">${data.recipientEmail}</strong>). Click the button below to sign in instantly without typing a password:
    </p>

    <!-- Bulletproof Centered CTA Button -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 28px auto;">
      <tr>
        <td align="center" bgcolor="#f59e0b" style="border-radius: 12px; background-color: #f59e0b; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 6px 18px rgba(245, 158, 11, 0.4);">
          <a href="${data.magicLinkUrl}" target="_blank" style="display: inline-block; padding: 15px 38px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 800; color: #020617 !important; text-decoration: none !important; letter-spacing: -0.01em; border-radius: 12px; border: 1px solid #f59e0b;">
            Sign In to BlindShare &rarr;
          </a>
        </td>
      </tr>
    </table>

    <!-- Direct Fallback Link Box -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #030712; border: 1px solid #1e293b; border-radius: 10px;">
      <tr>
        <td style="padding: 12px 14px;">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            Or copy and paste this link into your browser:
          </div>
          <div style="font-family: 'SFMono-Regular', Consolas, Monaco, monospace; font-size: 12px; color: #f59e0b; word-break: break-all; line-height: 1.5;">
            <a href="${data.magicLinkUrl}" target="_blank" style="color: #f59e0b; text-decoration: underline;">${data.magicLinkUrl}</a>
          </div>
        </td>
      </tr>
    </table>

    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #64748b; line-height: 1.5; margin: 16px 0 0 0;">
      ⏱️ This link will expire in <strong style="color: #cbd5e1;">${data.expiresInMinutes} minutes</strong> and can only be used once.
    </p>
    `,
    preview,
    "1-Click Sign In"
  );
  const text = `Sign in to BlindShare: ${data.magicLinkUrl}\n\nThis link will expire in ${data.expiresInMinutes} minutes and can only be used once.`;
  return { subject, html, text };
}

/**
 * Multi-Format Email Authentication Template (Papermark Standard)
 * Supports 1-click direct sign-in button, formatted spaced/hyphenated passcode, and device security context.
 */
export function renderOtpEmail(data: OtpData): { subject: string; html: string; text: string } {
  const displayCode = data.formattedCode || (data.otpCode.length === 6 ? `${data.otpCode.slice(0, 3)} - ${data.otpCode.slice(3)}` : data.otpCode);
  const subject = `🔐 Sign in to BlindShare (Code: ${data.otpCode})`;
  const preview = `Sign in to BlindShare with code ${displayCode} or use the 1-click instant login button. Valid for ${data.expiresInMinutes} minutes.`;

  const magicButtonSection = data.magicLinkUrl
    ? `
    <!-- 1-Click Direct Sign-In Button (Papermark Standard) -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 24px auto 16px auto;">
      <tr>
        <td align="center" bgcolor="#f59e0b" style="border-radius: 12px; background-color: #f59e0b; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35);">
          <a href="${data.magicLinkUrl}" target="_blank" style="display: inline-block; padding: 15px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 800; color: #020617 !important; text-decoration: none !important; letter-spacing: -0.01em; border-radius: 12px;">
            Sign In to BlindShare &rarr;
          </a>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin: 20px 0 16px 0;">
      <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; background-color: #0f172a; padding: 0 10px;">
        &mdash; OR ENTER VERIFICATION CODE &mdash;
      </span>
    </div>
    `
    : "";

  const securityContextSection = (data.deviceInfo || data.locationInfo)
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 22px 0 10px 0; background-color: #030712; border: 1px solid #1e293b; border-radius: 10px;">
      <tr>
        <td style="padding: 12px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #94a3b8; line-height: 1.6; word-break: break-word;">
          🛡️ <strong>Request Security Details:</strong><br />
          ${data.deviceInfo ? `• Client: <span style="color: #cbd5e1; word-break: break-word;">${data.deviceInfo}</span><br />` : ""}
          ${data.locationInfo ? `• Location/IP: <span style="color: #cbd5e1; word-break: break-all;">${data.locationInfo}</span><br />` : ""}
          • Time: <span style="color: #cbd5e1;">${new Date().toUTCString()}</span>
        </td>
      </tr>
    </table>
    `
    : "";

  const html = baseEmailLayout(
    `
    <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 12px 0; line-height: 1.3; letter-spacing: -0.02em;">
      Sign in to BlindShare
    </h1>
    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.65; color: #cbd5e1; margin: 0 0 16px 0;">
      We received a request to authenticate your account (<strong style="color: #ffffff;">${data.recipientEmail}</strong>). You can sign in directly with 1 click, or enter the temporary security code below:
    </p>

    ${magicButtonSection}

    <!-- Large Glowing OTP Box with Hyphenated/Grouped Display -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 18px auto; width: 100%; max-width: 380px;">
      <tr>
        <td align="center" style="background-color: #020617; border: 2px dashed #f59e0b; border-radius: 14px; padding: 20px 16px; box-shadow: 0 0 20px rgba(245, 158, 11, 0.15);">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">
            Single-Use Security Code
          </div>
          <div class="otp-code-text" style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Courier, monospace; font-size: 32px; font-weight: 900; letter-spacing: 4px; color: #fbbf24; word-break: break-all; max-width: 100%;">
            ${displayCode}
          </div>
        </td>
      </tr>
    </table>

    ${securityContextSection}

    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #64748b; line-height: 1.5; margin: 16px 0 0 0; text-align: center;">
      ⏱️ This link and single-use code expire in <strong style="color: #cbd5e1;">${data.expiresInMinutes} minutes</strong>. If you did not request this, no action is needed.
    </p>
    `,
    preview,
    "Sign In to BlindShare"
  );

  const text = data.magicLinkUrl
    ? `Sign in to BlindShare:\n\n1-Click Instant Sign-In: ${data.magicLinkUrl}\n\nOr enter code: ${displayCode}\n\nValid for ${data.expiresInMinutes} minutes. If you did not request this, please ignore.`
    : `Your BlindShare verification code is: ${displayCode}\n\nValid for ${data.expiresInMinutes} minutes. If you did not request this, please ignore.`;

  return { subject, html, text };
}

/**
 * Password Reset Email Template
 */
export function renderPasswordResetEmail(data: PasswordResetData): { subject: string; html: string; text: string } {
  const subject = `🔑 Reset your BlindShare Password`;
  const preview = `Reset your password for BlindShare. Valid for ${data.expiresInMinutes} minutes.`;
  const html = baseEmailLayout(
    `
    <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 14px 0; line-height: 1.3; letter-spacing: -0.02em;">
      Password Reset Request
    </h1>
    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.65; color: #cbd5e1; margin: 0 0 22px 0;">
      We received a request to reset the password for your BlindShare account (<strong style="color: #ffffff;">${data.recipientEmail}</strong>). Click the secure button below to choose a new password:
    </p>

    <!-- Bulletproof Centered CTA Button -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 28px auto;">
      <tr>
        <td align="center" bgcolor="#f59e0b" style="border-radius: 12px; background-color: #f59e0b; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 6px 18px rgba(245, 158, 11, 0.4);">
          <a href="${data.resetUrl}" target="_blank" style="display: inline-block; padding: 15px 38px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 800; color: #020617 !important; text-decoration: none !important; letter-spacing: -0.01em; border-radius: 12px; border: 1px solid #f59e0b;">
            Reset Password &rarr;
          </a>
        </td>
      </tr>
    </table>

    <!-- Direct Fallback Link Box -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #030712; border: 1px solid #1e293b; border-radius: 10px;">
      <tr>
        <td style="padding: 12px 14px;">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            Or copy and paste this link into your browser:
          </div>
          <div style="font-family: 'SFMono-Regular', Consolas, Monaco, monospace; font-size: 12px; color: #f59e0b; word-break: break-all; line-height: 1.5;">
            <a href="${data.resetUrl}" target="_blank" style="color: #f59e0b; text-decoration: underline;">${data.resetUrl}</a>
          </div>
        </td>
      </tr>
    </table>

    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #64748b; line-height: 1.5; margin: 16px 0 0 0;">
      ⏱️ This link will expire in <strong style="color: #cbd5e1;">${data.expiresInMinutes} minutes</strong>. If you did not request a password reset, no action is needed and your account remains safe.
    </p>
    `,
    preview,
    "Password Reset"
  );
  const text = `Reset your BlindShare password: ${data.resetUrl}\n\nThis link will expire in ${data.expiresInMinutes} minutes. If you did not request a password reset, please ignore this email.`;
  return { subject, html, text };
}

/**
 * Team Invite Email Template
 */
export function renderInviteEmail(data: InviteEmailData): { subject: string; html: string; text: string } {
  const roleDisplay = data.role === "admin" ? "an Admin" : "a Member";
  const subject = `✉️ You've been invited to join BlindShare as ${roleDisplay}`;
  const preview = `${data.invitedByName} has invited you to join BlindShare as ${roleDisplay}.`;
  const html = baseEmailLayout(
    `
    <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 14px 0; line-height: 1.3; letter-spacing: -0.02em;">
      You've Been Invited to BlindShare
    </h1>
    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.65; color: #cbd5e1; margin: 0 0 18px 0;">
      <strong style="color: #ffffff;">${data.invitedByName}</strong> has invited you to collaborate on the BlindShare zero-knowledge platform with the role:
    </p>

    <!-- Role Chip -->
    <div style="margin-bottom: 22px;">
      <span style="display: inline-block; background-color: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; border-radius: 8px; padding: 6px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.05em;">
        ${data.role}
      </span>
    </div>

    <!-- Invite Code Box -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 18px 0; background-color: #030712; border: 1px dashed #334155; border-radius: 10px;">
      <tr>
        <td align="center" style="padding: 16px;">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
            Your Private Registration Code
          </div>
          <div style="font-family: 'SFMono-Regular', Consolas, Monaco, monospace; font-size: 22px; font-weight: 800; color: #f8fafc; letter-spacing: 4px;">
            ${data.inviteCode}
          </div>
        </td>
      </tr>
    </table>

    <!-- Bulletproof Centered CTA Button -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 26px auto;">
      <tr>
        <td align="center" bgcolor="#f59e0b" style="border-radius: 12px; background-color: #f59e0b; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 6px 18px rgba(245, 158, 11, 0.4);">
          <a href="${data.signupUrl}" target="_blank" style="display: inline-block; padding: 15px 38px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 800; color: #020617 !important; text-decoration: none !important; letter-spacing: -0.01em; border-radius: 12px; border: 1px solid #f59e0b;">
            Accept Invite & Create Account &rarr;
          </a>
        </td>
      </tr>
    </table>

    <!-- Direct Fallback Link Box -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #030712; border: 1px solid #1e293b; border-radius: 10px;">
      <tr>
        <td style="padding: 12px 14px;">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            Direct Registration Link:
          </div>
          <div style="font-family: 'SFMono-Regular', Consolas, Monaco, monospace; font-size: 12px; color: #f59e0b; word-break: break-all; line-height: 1.5;">
            <a href="${data.signupUrl}" target="_blank" style="color: #f59e0b; text-decoration: underline;">${data.signupUrl}</a>
          </div>
        </td>
      </tr>
    </table>

    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #64748b; line-height: 1.5; margin: 16px 0 0 0; text-align: center;">
      ⏱️ This invitation expires in <strong style="color: #cbd5e1;">${data.expiresInDays} days</strong>.
    </p>
    `,
    preview,
    "Workspace Invitation"
  );
  const text = `You've been invited to BlindShare by ${data.invitedByName} as ${data.role}.\n\nRegistration URL: ${data.signupUrl}\nInvite Code: ${data.inviteCode}\n\nValid for ${data.expiresInDays} days.`;
  return { subject, html, text };
}

/**
 * Real-Time Document Interaction / Analytics Alert Email Template
 */
export function renderViewerAlertEmail(data: ViewerAlertData): { subject: string; html: string; text: string } {
  const subject = `🔔 [${data.event.toUpperCase()}] ${data.docTitle || data.linkName}`;
  const preview = `A recipient has interacted with your shared document ${data.docTitle || data.linkName}.`;
  const html = baseEmailLayout(
    `
    <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 14px 0; line-height: 1.3; letter-spacing: -0.02em;">
      Document Activity Alert
    </h1>
    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.65; color: #cbd5e1; margin: 0 0 20px 0;">
      A recipient interacted with your secure link <strong style="color: #f59e0b;">${data.linkName}</strong>:
    </p>

    <!-- Telemetry Information Card (Mobile-First Stacked Rows: Zero Overlap) -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #030712; border: 1px solid #1e293b; border-radius: 12px; margin: 20px 0; overflow: hidden;">
      <tr>
        <td class="mobile-stack-card" style="padding: 16px 18px;">
          <div style="padding: 8px 0; border-bottom: 1px solid #1e293b;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">Document</div>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #f8fafc; word-break: break-word;">${data.docTitle || "Untitled"}</div>
          </div>
          <div style="padding: 8px 0; border-bottom: 1px solid #1e293b;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">Event</div>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 700; color: #f59e0b; word-break: break-word;">${data.event}</div>
          </div>
          <div style="padding: 8px 0; border-bottom: 1px solid #1e293b;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">Viewer</div>
            <div style="font-family: 'SFMono-Regular', Consolas, Monaco, monospace; font-size: 13px; font-weight: 600; color: #cbd5e1; word-break: break-all;">${data.viewerEmail || "Anonymous"}</div>
          </div>
          <div style="padding: 8px 0; border-bottom: 1px solid #1e293b;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">Location</div>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #cbd5e1; word-break: break-word;">${data.viewerCountry || "Unknown"}</div>
          </div>
          <div style="padding: 8px 0; border-bottom: 1px solid #1e293b;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">Device</div>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #cbd5e1; word-break: break-word;">${data.viewerDevice || "Desktop"}</div>
          </div>
          ${data.dwellSeconds ? `
          <div style="padding: 8px 0; border-bottom: 1px solid #1e293b;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">Dwell Time</div>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 700; color: #10b981;">${data.dwellSeconds}s</div>
          </div>
          ` : ""}
          <div style="padding: 8px 0;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">Timestamp (UTC)</div>
            <div style="font-family: 'SFMono-Regular', Consolas, Monaco, monospace; font-size: 12px; color: #94a3b8; word-break: break-word;">${data.timestamp}</div>
          </div>
        </td>
      </tr>
    </table>
    `,
    preview,
    "Document Interaction"
  );
  const text = `Document Activity Alert on ${data.docTitle || data.linkName}: ${data.event} by ${data.viewerEmail || "Anonymous"} at ${data.timestamp}`;
  return { subject, html, text };
}

/**
 * Live Diagnostic Verification Email Template
 * Renders a mobile-first, bulletproof responsive card with zero overlap or text squeezing on narrow viewports.
 */
export function renderDiagnosticEmail(data: DiagnosticEmailData): { subject: string; html: string; text: string } {
  const subject = `🧪 BlindShare Email Relay Active: Live Diagnostic Verified`;
  const preview = `Your BlindShare transactional email relay (${data.provider.toUpperCase()}) is active and successfully delivering messages.`;
  const html = baseEmailLayout(
    `
    <div style="display: inline-block; padding: 4px 12px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 9999px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #34d399; letter-spacing: 0.05em; margin-bottom: 16px;">
      ● LIVE RELAY PROBE
    </div>

    <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 12px 0; line-height: 1.3; letter-spacing: -0.02em;">
      Email Engine Verification
    </h1>
    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 20px 0;">
      Congratulations! Your BlindShare transactional email relay is configured and delivering messages successfully in production.
    </p>

    <!-- Mobile-First Stacked Diagnostic Cards (Zero Horizontal Squeeze / Zero Overlap) -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #030712; border: 1px solid #1e293b; border-radius: 12px; margin: 20px 0; overflow: hidden;">
      <tr>
        <td class="mobile-stack-card" style="padding: 16px 18px;">
          
          <div style="padding: 10px 0; border-bottom: 1px solid #1e293b;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">
              Active Email Provider
            </div>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 700; color: #38bdf8; word-break: break-word;">
              ${data.provider.toUpperCase()}
            </div>
          </div>

          <div style="padding: 10px 0; border-bottom: 1px solid #1e293b;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">
              Relay Architecture & Free Tier Status
            </div>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #cbd5e1; line-height: 1.5; word-break: break-word;">
              ${data.providerDetails}
            </div>
          </div>

          <div style="padding: 10px 0; border-bottom: 1px solid #1e293b;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">
              Destination Recipient
            </div>
            <div style="font-family: 'SFMono-Regular', Consolas, Monaco, monospace; font-size: 13px; font-weight: 600; color: #facc15; word-break: break-all;">
              ${data.recipientEmail}
            </div>
          </div>

          <div style="padding: 10px 0;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">
              Dispatched Timestamp (UTC)
            </div>
            <div style="font-family: 'SFMono-Regular', Consolas, Monaco, monospace; font-size: 12px; color: #94a3b8; word-break: break-word;">
              ${data.timestamp || new Date().toUTCString()}
            </div>
          </div>

        </td>
      </tr>
    </table>
    `,
    preview,
    "Relay Diagnostic Test"
  );
  const text = `BlindShare Email Relay Active: Delivered via ${data.provider.toUpperCase()} (${data.providerDetails}) to ${data.recipientEmail} at ${data.timestamp || new Date().toUTCString()}.`;
  return { subject, html, text };
}

