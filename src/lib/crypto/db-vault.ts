import crypto from "crypto";

/**
 * BlindShare Database Field Vault (Zero-Knowledge at Rest)
 *
 * Threat Model:
 * If the Neon PostgreSQL database or backup storage is compromised or dumped,
 * all PII (user emails, viewer emails, signer names, signatures, 2FA secrets)
 * must be completely unreadable ciphertext.
 *
 * Invariants:
 * 1. AES-256-GCM with 96-bit IV and 128-bit authentication tag.
 * 2. Searchable fields (like user login email) use deterministic authenticated
 *    encryption (enc:det:...) so exact-match SQL queries work seamlessly without
 *    revealing plaintext to Neon DB.
 * 3. General sensitive fields (viewer emails, signatures, 2FA secrets) use
 *    randomized authenticated encryption (enc:v1:...) with fresh CSPRNG IVs.
 * 4. Transparent fallback/graceful passthrough for unencrypted legacy data.
 */

function getMasterKey(): Buffer {
  const secret =
    process.env.DB_ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    "blindshare-neon-db-master-vault-default-secret-salt-2026";
  return crypto.createHash("sha256").update(`blindshare:db-vault:v1:${secret}`).digest();
}

/**
 * Deterministic authenticated encryption for searchable email lookups.
 * Output format: enc:det:<ivHex>:<tagHex>:<cipherHex>
 */
export function encryptEmail(email: string | null | undefined): string {
  if (!email || typeof email !== "string") return "";
  const clean = email.trim().toLowerCase();
  if (clean.startsWith("enc:det:") || clean.startsWith("enc:v1:")) return clean;

  const key = getMasterKey();
  // Deterministic 12-byte IV derived from HMAC-SHA256 of the normalized email
  const iv = crypto.createHmac("sha256", key).update(`email-iv:${clean}`).digest().subarray(0, 12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(clean, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `enc:det:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts an email value. If value is not encrypted (e.g. legacy row), returns as-is.
 */
export function decryptEmail(val: string | null | undefined): string {
  if (!val || typeof val !== "string") return "";
  if (!val.startsWith("enc:det:") && !val.startsWith("enc:v1:")) {
    return val;
  }
  return decryptField(val);
}

/**
 * Randomized authenticated encryption for sensitive PII fields.
 * Output format: enc:v1:<ivHex>:<tagHex>:<cipherHex>
 */
export function encryptField(plaintext: string | null | undefined): string {
  if (!plaintext || typeof plaintext !== "string") return "";
  if (plaintext.startsWith("enc:v1:") || plaintext.startsWith("enc:det:")) return plaintext;

  const key = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `enc:v1:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts any encrypted field (enc:v1:... or enc:det:...).
 * Returns original plaintext string if encrypted, or original value if legacy plaintext.
 */
export function decryptField(val: string | null | undefined): string {
  if (!val || typeof val !== "string") return "";
  if (!val.startsWith("enc:v1:") && !val.startsWith("enc:det:")) {
    return val;
  }

  try {
    const parts = val.split(":");
    if (parts.length !== 5) return val;

    const iv = Buffer.from(parts[2], "hex");
    const tag = Buffer.from(parts[3], "hex");
    const ciphertext = Buffer.from(parts[4], "hex");
    const key = getMasterKey();

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    // If decryption fails due to key change or tampering, return safe redacted or original
    return val;
  }
}

/**
 * Checks whether a database string is encrypted.
 */
export function isEncrypted(val: string | null | undefined): boolean {
  return typeof val === "string" && (val.startsWith("enc:v1:") || val.startsWith("enc:det:"));
}
