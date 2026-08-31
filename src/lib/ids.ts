import crypto from "crypto";

/**
 * Centralized, strict ID generation.
 *
 * INVARIANT (THREAT-MODEL.md): share-link identifiers must be 128-bit
 * unguessable. All security-sensitive identifiers (links, sessions, invites,
 * documents, users, audit entries) now use 16 random bytes (128 bits) instead
 * of the previous 64-bit ids, encoded as base64url for links/sessions (compact,
 * URL-safe) or hex for internal ids (easy to grep in logs/DB).
 */

/** 128-bit hex id with a readable prefix, e.g. `doc_9f3a...` (32 hex chars). */
export function genId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}

/** 128-bit unguessable, URL-safe slug for public share links / sessions. */
export function genUnguessableSlug(): string {
  return crypto.randomBytes(16).toString("base64url");
}

/** Short, human-shareable invite code that still carries 96 bits of entropy. */
export function genInviteCode(prefix = "inv"): string {
  return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}

/** Constant-time string compare to prevent timing side-channels on secrets. */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Still run a comparison of equal length to keep timing constant-ish.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
