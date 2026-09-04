/**
 * Multi-Provider Email Engine Types
 * Supports Google Apps Script (GAS), Resend, Brevo, SMTP, and Local Console Mock.
 */

export type EmailProviderType = "auto" | "gas" | "resend" | "brevo" | "smtp" | "mock";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
}

export interface EmailResult {
  success: boolean;
  provider: EmailProviderType;
  messageId?: string;
  error?: string;
  quotaRemaining?: number;
}

export interface MagicLinkData {
  recipientEmail: string;
  magicLinkUrl: string;
  expiresInMinutes: number;
}

export interface OtpData {
  recipientEmail: string;
  otpCode: string;
  expiresInMinutes: number;
}

export interface PasswordResetData {
  recipientEmail: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface InviteEmailData {
  recipientEmail: string;
  inviteCode: string;
  signupUrl: string;
  role: string;
  invitedByName: string;
  expiresInDays: number;
}

export interface ViewerAlertData {
  recipientEmail: string;
  docTitle: string;
  linkName: string;
  event: string;
  viewerEmail?: string;
  viewerCountry?: string;
  viewerDevice?: string;
  dwellSeconds?: number;
  timestamp: string;
}
