import { NextResponse } from "next/server";

/**
 * RFC 9116 security.txt — a professional, machine-readable disclosure contact.
 * Points to SECURITY.md for the full policy (not-yet-audited disclosure, no bounty).
 */
export async function GET() {
  const appUrl = process.env.PUBLIC_APP_URL || "http://localhost:3000";
  const contact = process.env.VAPID_SUBJECT?.startsWith("mailto:")
    ? process.env.VAPID_SUBJECT
    : "mailto:security@example.com";

  const body = [
    `Contact: ${contact}`,
    `Policy: ${appUrl}/security`,
    `Preferred-Languages: en, hi`,
    `Canonical: ${appUrl}/.well-known/security.txt`,
    `Expires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}`,
  ].join("\n");

  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
