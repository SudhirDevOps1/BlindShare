import crypto from "crypto";

/**
 * Standard RFC 6238 TOTP (Time-based One-Time Password) Implementation.
 * Compatible with Google Authenticator, Microsoft Authenticator, Authy, and 1Password.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encodes a buffer into a Base32 string (RFC 4648).
 */
export function base32Encode(buffer: Buffer | Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a Buffer.
 */
export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[\s-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue; // Skip invalid chars

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically strong 20-byte Base32 secret for TOTP.
 */
export function generateTotpSecret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

/**
 * Generates the standard otpauth:// URI for authenticator QR codes.
 */
export function generateTotpUri(email: string, secret: string, issuer = "BlindShare"): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const encIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Computes a 6-digit TOTP token for a given time step counter.
 */
function computeTotp(secretBytes: Buffer, timeStep: number): string {
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac("sha1", secretBytes).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const str = String(code % 1_000_000);
  return str.padStart(6, "0");
}

/**
 * Verifies a user-supplied 6-digit TOTP code against a Base32 secret.
 * Allows +/- 1 time step (30 seconds) clock drift tolerance.
 */
export function verifyTotpToken(token: string, secret: string, window = 1): boolean {
  if (!token || typeof token !== "string") return false;
  const cleanToken = token.trim().replace(/\s/g, "");
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false;

  try {
    const secretBytes = base32Decode(secret);
    if (secretBytes.length === 0) return false;

    const currentStep = Math.floor(Date.now() / 1000 / 30);

    for (let offset = -window; offset <= window; offset++) {
      const expectedToken = computeTotp(secretBytes, currentStep + offset);
      if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expectedToken))) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Generates 8 single-use cryptographically random backup recovery codes.
 */
export function generateBackupCodes(count = 8): { rawCodes: string[]; hashedCodes: string[] } {
  const rawCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    const raw = `${crypto.randomBytes(2).toString("hex")}-${crypto.randomBytes(2).toString("hex")}`;
    rawCodes.push(raw);
    const hash = crypto.createHash("sha256").update(raw.toLowerCase().replace(/[^a-z0-9]/g, "")).digest("hex");
    hashedCodes.push(hash);
  }

  return { rawCodes, hashedCodes };
}

/**
 * Verifies and consumes a backup recovery code against a stored list of SHA-256 hashed codes.
 */
export function verifyAndConsumeBackupCode(
  rawCode: string,
  storedHashedCodesCsv: string
): { valid: boolean; remainingHashedCodesCsv: string } {
  if (!rawCode || !storedHashedCodesCsv) {
    return { valid: false, remainingHashedCodesCsv: storedHashedCodesCsv || "" };
  }

  const clean = rawCode.toLowerCase().replace(/[^a-z0-9]/g, "");
  const targetHash = crypto.createHash("sha256").update(clean).digest("hex");

  const list = storedHashedCodesCsv.split(",").map((s) => s.trim()).filter(Boolean);
  const index = list.indexOf(targetHash);

  if (index === -1) {
    return { valid: false, remainingHashedCodesCsv: storedHashedCodesCsv };
  }

  // Consume (remove) the used code
  list.splice(index, 1);
  return { valid: true, remainingHashedCodesCsv: list.join(",") };
}
