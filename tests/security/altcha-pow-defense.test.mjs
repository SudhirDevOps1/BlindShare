import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const ALTCHA_HMAC_KEY = process.env.ALTCHA_HMAC_KEY || "test-altcha-pow-secret-key-32b";

function createTestChallenge(maxNumber = 1000, expiresInMs = 60000) {
  const expires = Date.now() + expiresInMs;
  const randomSalt = crypto.randomBytes(12).toString("hex");
  const salt = `${randomSalt}?expires=${expires}`;
  const secretNumber = Math.floor(Math.random() * maxNumber);

  const challenge = crypto
    .createHash("sha256")
    .update(`${salt}${secretNumber}`, "utf8")
    .digest("hex");

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
    secretNumber,
  };
}

function solvePoW(challenge, salt, maxNumber) {
  const target = challenge.toLowerCase();
  for (let i = 0; i <= maxNumber; i++) {
    const hash = crypto.createHash("sha256").update(`${salt}${i}`, "utf8").digest("hex");
    if (hash === target) {
      return i;
    }
  }
  return null;
}

function verifyPoW(payload, usedSignatures = new Set()) {
  if (!payload || !payload.challenge || payload.number === undefined || !payload.salt || !payload.signature) {
    return false;
  }

  const expMatch = payload.salt.match(/[?&]expires=(\d+)/);
  if (expMatch && expMatch[1]) {
    const expiresAt = parseInt(expMatch[1], 10);
    if (Date.now() > expiresAt) return false;
  }

  if (usedSignatures.has(payload.signature)) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", ALTCHA_HMAC_KEY)
    .update(payload.challenge, "utf8")
    .digest("hex");

  const sigBuf = Buffer.from(payload.signature, "hex");
  const expBuf = Buffer.from(expectedSignature, "hex");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }

  const computedChallenge = crypto
    .createHash("sha256")
    .update(`${payload.salt}${payload.number}`, "utf8")
    .digest("hex");

  if (computedChallenge !== payload.challenge) {
    return false;
  }

  usedSignatures.add(payload.signature);
  return true;
}

test("ALTCHA Defense: Generates valid SHA-256 HMAC-signed challenge", () => {
  const c = createTestChallenge(5000);
  assert.equal(c.algorithm, "SHA-256");
  assert.equal(typeof c.challenge, "string");
  assert.equal(c.challenge.length, 64);
  assert.equal(c.signature.length, 64);
});

test("ALTCHA Defense: Correct Proof-of-Work solver verifies successfully", () => {
  const c = createTestChallenge(500);
  const solvedNumber = solvePoW(c.challenge, c.salt, c.maxnumber);
  assert.notEqual(solvedNumber, null);

  const payload = {
    algorithm: "SHA-256",
    challenge: c.challenge,
    number: solvedNumber,
    salt: c.salt,
    signature: c.signature,
  };

  const ok = verifyPoW(payload);
  assert.equal(ok, true);
});

test("ALTCHA Defense: Wrong number / forgery is strictly rejected", () => {
  const c = createTestChallenge(500);
  const payload = {
    algorithm: "SHA-256",
    challenge: c.challenge,
    number: 999999, // Wrong number
    salt: c.salt,
    signature: c.signature,
  };

  const ok = verifyPoW(payload);
  assert.equal(ok, false);
});

test("ALTCHA Defense: Replay attack with duplicate signature is rejected", () => {
  const used = new Set();
  const c = createTestChallenge(500);
  const solvedNumber = solvePoW(c.challenge, c.salt, c.maxnumber);

  const payload = {
    algorithm: "SHA-256",
    challenge: c.challenge,
    number: solvedNumber,
    salt: c.salt,
    signature: c.signature,
  };

  const firstTry = verifyPoW(payload, used);
  assert.equal(firstTry, true);

  const secondTry = verifyPoW(payload, used);
  assert.equal(secondTry, false);
});
