import crypto from "crypto";

/**
 * Validates cryptographically signed local storage tokens.
 * Decouples HMAC verification from route-level authorization logic to prevent
 * user-controlled parameter bypasses (CWE-290 / CWE-807).
 */
export function verifyStorageSignature(
  action: "put" | "get",
  key: string,
  expiresStr: string | null,
  sig: string | null
): boolean {
  if (!sig || !expiresStr) {
    return false;
  }

  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || expires <= Date.now()) {
    return false;
  }

  const secret = process.env.SESSION_SECRET || "blindshare_local_secret";
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${action}:${key}:${expires}`)
    .digest("hex");

  if (sig.length !== expectedSig.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(sig, "utf-8"), Buffer.from(expectedSig, "utf-8"));
}
