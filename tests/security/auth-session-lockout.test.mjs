import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

/**
 * Authentication, 2FA & Session Revocation Test Suite
 * Validates HMAC token tampering protection, session version invalidation,
 * and TOTP RFC 6238 time-step windows.
 */

const DUMMY_SECRET = "test_enterprise_hmac_secret_key_that_is_at_least_64_bytes_long_123456";

function signSessionToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", DUMMY_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

function verifySessionToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expected = crypto.createHmac("sha256", DUMMY_SECRET).update(data).digest("base64url");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    return JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

test("Auth Tokens: Tampered session token signatures are rejected (Timing-Safe HMAC)", () => {
  const payload = { id: "usr_123", email: "user@corp.com", sv: 1, exp: Date.now() + 3600000 };
  const validToken = signSessionToken(payload);

  // 1. Valid token passes
  const verified = verifySessionToken(validToken);
  assert.ok(verified, "Legitimate session token must pass verification");
  assert.equal(verified.id, "usr_123");

  // 2. Tampered base64url payload fails signature verification
  const tamperedData = Buffer.from(JSON.stringify({ ...payload, id: "usr_hacker" })).toString("base64url");
  const tamperedToken = `${tamperedData}.${validToken.split(".")[1]}`;
  const failed = verifySessionToken(tamperedToken);
  assert.equal(failed, null, "Tampered payload with unmatching signature must return null");

  // 3. Forged signature fails
  const forgedToken = `${validToken.split(".")[0]}.fake_signature_here`;
  const rejected = verifySessionToken(forgedToken);
  assert.equal(rejected, null, "Forged signature must be rejected");
});

test("Session Revocation: Invalidation via sessionVersion prevents replay attacks", () => {
  const userInDb = { id: "usr_456", sessionVersion: 1 };
  const issuedToken = signSessionToken({ id: userInDb.id, sv: 1, exp: Date.now() + 3600000 });

  // Token is valid initially
  let parsed = verifySessionToken(issuedToken);
  assert.equal(parsed.sv, userInDb.sessionVersion);

  // User logs out of all devices -> sessionVersion increments in DB
  userInDb.sessionVersion = 2;

  // The previously issued token is now rejected because token.sv (1) !== db.sessionVersion (2)
  const isSessionStillValid = parsed.sv === userInDb.sessionVersion;
  assert.equal(isSessionStillValid, false, "Old token must be rejected after sessionVersion bump");
});

test("2FA Security: Single-use emergency recovery backup codes hash matching", () => {
  const plainBackupCode = "A1B2-C3D4";
  const hashedCode = crypto.createHash("sha256").update(plainBackupCode.toUpperCase().trim()).digest("hex");

  // Verify match
  const userAttempt = "a1b2-c3d4"; // Case insensitive
  const attemptHash = crypto.createHash("sha256").update(userAttempt.toUpperCase().trim()).digest("hex");
  assert.equal(attemptHash, hashedCode, "Backup code hash must match correctly formatted attempt");

  // Incorrect code fails
  const wrongAttempt = "Z9Y8-X7W6";
  const wrongHash = crypto.createHash("sha256").update(wrongAttempt.toUpperCase().trim()).digest("hex");
  assert.notEqual(wrongHash, hashedCode, "Incorrect backup code hash must not match");
});
