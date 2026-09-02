import crypto from "crypto";
import { logger } from "@/lib/logger";

const ALTCHA_HMAC_KEY = process.env.ALTCHA_HMAC_KEY || process.env.SESSION_SECRET || "blindshare-altcha-pow-secret-key-32b";

export interface AltchaChallenge {
  algorithm: "SHA-256";
  challenge: string;
  maxnumber: number;
  salt: string;
  signature: string;
}

export interface AltchaPayload {
  algorithm: string;
  challenge: string;
  number: number;
  salt: string;
  signature: string;
  took?: number;
}

// In-memory replay attack prevention cache with 10-minute automatic eviction
const usedSignatures = new Map<string, number>();

function cleanReplayCache() {
  const now = Date.now();
  for (const [sig, exp] of usedSignatures.entries()) {
    if (exp <= now) {
      usedSignatures.delete(sig);
    }
  }
}

/**
 * Generate a cryptographically signed Proof-of-Work challenge
 * @param maxNumber Maximum number to search (e.g. 50,000 ~ 500ms solve time)
 * @param expiresInMs Expiration time in milliseconds (default: 5 minutes)
 */
export function createAltchaChallenge(
  maxNumber = 50000,
  expiresInMs = 5 * 60 * 1000
): AltchaChallenge {
  const expires = Date.now() + expiresInMs;
  const randomSalt = crypto.randomBytes(12).toString("hex");
  const salt = `${randomSalt}?expires=${expires}`;

  // Choose a random secret number from 0 to maxNumber
  const secretNumber = Math.floor(Math.random() * maxNumber);

  // Compute challenge hash: SHA256(salt + secretNumber)
  const challenge = crypto
    .createHash("sha256")
    .update(`${salt}${secretNumber}`, "utf8")
    .digest("hex");

  // Sign challenge + expires using HMAC-SHA256
  const signature = crypto
    .createHmac("sha256", ALTCHA_HMAC_KEY)
    .update(challenge, "utf8")
    .digest("hex");

  return {
    algorithm: "SHA-256",
    challenge,
    maxnumber: maxNumber,
    salt,
    signature,
  };
}

/**
 * Verify an ALTCHA Proof-of-Work payload submitted by client
 * @param payload Base64-encoded or raw AltchaPayload object
 */
export function verifyAltchaPayload(payload: string | AltchaPayload | null | undefined): boolean {
  if (!payload) return false;

  try {
    let data: AltchaPayload;
    if (typeof payload === "string") {
      // Decode base64 or JSON string
      let rawStr = payload.trim();
      if (!rawStr.startsWith("{")) {
        rawStr = Buffer.from(rawStr, "base64").toString("utf8");
      }
      data = JSON.parse(rawStr);
    } else {
      data = payload;
    }

    if (!data.challenge || data.number === undefined || !data.salt || !data.signature) {
      return false;
    }

    if (data.algorithm !== "SHA-256") {
      return false;
    }

    // 1. Extract and check expiration from salt (?expires=...)
    const expMatch = data.salt.match(/[?&]expires=(\d+)/);
    if (expMatch && expMatch[1]) {
      const expiresAt = parseInt(expMatch[1], 10);
      if (Date.now() > expiresAt) {
        logger.warn("altcha.verification_failed", { reason: "expired" });
        return false;
      }
    }

    // 2. Check Replay Attack Cache
    cleanReplayCache();
    if (usedSignatures.has(data.signature)) {
      logger.warn("altcha.verification_failed", { reason: "replay_detected" });
      return false;
    }

    // 3. Verify HMAC Signature in constant time
    const expectedSignature = crypto
      .createHmac("sha256", ALTCHA_HMAC_KEY)
      .update(data.challenge, "utf8")
      .digest("hex");

    const sigBuf = Buffer.from(data.signature, "hex");
    const expBuf = Buffer.from(expectedSignature, "hex");

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      logger.warn("altcha.verification_failed", { reason: "invalid_hmac" });
      return false;
    }

    // 4. Verify Proof-of-Work solution: SHA256(salt + number) === challenge
    const computedChallenge = crypto
      .createHash("sha256")
      .update(`${data.salt}${data.number}`, "utf8")
      .digest("hex");

    if (computedChallenge !== data.challenge) {
      logger.warn("altcha.verification_failed", { reason: "invalid_pow" });
      return false;
    }

    // 5. Mark signature as used until expiry + 60s
    const expTime = expMatch && expMatch[1] ? parseInt(expMatch[1], 10) : Date.now() + 5 * 60 * 1000;
    usedSignatures.set(data.signature, expTime + 60 * 1000);

    return true;
  } catch (err: any) {
    logger.error("altcha.verification_error", { message: err?.message });
    return false;
  }
}
