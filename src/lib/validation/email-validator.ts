import dns from "dns";

// Curated blocklist of high-volume disposable / temporary email domains
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.biz",
  "guerrillamail.de",
  "sharklasers.com",
  "grr.la",
  "yopmail.com",
  "yopmail.fr",
  "trashmail.com",
  "throwawaymail.com",
  "fakeinbox.com",
  "dispostable.com",
  "burnermail.io",
  "getnada.com",
  "inboxkitten.com",
  "crazymailing.com",
  "mytemp.email",
  "maildrop.cc",
  "harakirimail.com",
  "zillamail.com",
  "nada.ltd",
  "dropmail.me",
  "tempail.com",
  "mohmal.com",
  "emailondeck.com",
  "generator.email",
  "mailsac.com",
  "fakemailgenerator.com",
  "getairmail.com",
  "armyspy.com",
  "cuvox.de",
  "dayrep.com",
  "fleckens.hu",
  "gustr.com",
  "jourrapide.com",
  "rhyta.com",
  "superrito.com",
  "teleworm.us",
  "einrot.com",
]);

export interface EmailValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates format, blocks disposable temp emails, and verifies live DNS MX records.
 * Uses native Node.js DNS promises with a fast 2.5s timeout.
 */
export async function validateEmailWithMx(email: string): Promise<EmailValidationResult> {
  const clean = email.trim().toLowerCase();

  // Basic format check
  const emailRegex = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;
  const match = clean.match(emailRegex);
  if (!match) {
    return { valid: false, reason: "Please enter a valid email format" };
  }

  const domain = match[1];

  // Check disposable email blacklist
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      reason: "Temporary or disposable email addresses are not allowed for confidential documents.",
    };
  }

  // Check DNS MX record for the domain (100% free, native Node.js DNS)
  try {
    const resolvePromise = dns.promises.resolveMx(domain);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DNS timeout")), 2500)
    );

    const mxRecords = (await Promise.race([resolvePromise, timeoutPromise])) as dns.MxRecord[];

    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        reason: "The email domain does not have valid mail receiving servers (MX records).",
      };
    }

    return { valid: true };
  } catch (err: any) {
    // If domain does not exist or has no MX / A records
    if (err.code === "ENOTFOUND" || err.code === "ENODATA" || err.code === "SERVFAIL") {
      return {
        valid: false,
        reason: "The email domain does not exist or cannot receive mail. Please use a real email.",
      };
    }

    // On network/timeout errors, fail open to avoid blocking legitimate users on flaky DNS
    return { valid: true };
  }
}
