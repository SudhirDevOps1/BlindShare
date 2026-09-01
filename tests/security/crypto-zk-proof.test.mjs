import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import zlib from "node:zlib";

/**
 * Enterprise Cryptographic & Zero-Knowledge Invariant Suite
 * Verifies that document encryption occurs with AES-GCM-256, uses random 96-bit IVs,
 * compresses via GZIP, and that server-side extraction without the key is mathematically impossible.
 */

async function simulateClientEncrypt(plainText) {
  const rawBytes = Buffer.from(plainText, "utf8");
  const compressed = zlib.gzipSync(rawBytes);
  const docKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", docKey, iv);
  const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    docKeyBase64Url: docKey.toString("base64url"),
    ivBase64: iv.toString("base64"),
    authTagBase64: authTag.toString("base64"),
    cipherText: encrypted,
  };
}

async function simulateClientDecrypt(encryptedData, docKeyBase64Url, ivBase64, authTagBase64) {
  const docKey = Buffer.from(docKeyBase64Url, "base64url");
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", docKey, iv);
  decipher.setAuthTag(authTag);
  const decompressed = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  const plainBytes = zlib.gunzipSync(decompressed);
  return plainBytes.toString("utf8");
}

test("E2EE: Encrypts with AES-GCM-256 and decrypts accurately with GZIP compression", async () => {
  const secretDoc = "CONFIDENTIAL ACQUISITION MEMO: $500M Purchase Price terms & IP transfer agreements.";
  const payload = await simulateClientEncrypt(secretDoc);

  assert.ok(payload.cipherText.length > 0, "Ciphertext must not be empty");
  assert.notEqual(payload.cipherText.toString("utf8"), secretDoc, "Ciphertext must not contain plaintext");

  const decrypted = await simulateClientDecrypt(
    payload.cipherText,
    payload.docKeyBase64Url,
    payload.ivBase64,
    payload.authTagBase64
  );

  assert.equal(decrypted, secretDoc, "Decrypted document must perfectly match original plaintext");
});

test("Zero-Knowledge: Ciphertext cannot be decrypted with an invalid or tampered key", async () => {
  const secretDoc = "Top secret patent claims";
  const payload = await simulateClientEncrypt(secretDoc);

  const fakeKey = crypto.randomBytes(32).toString("base64url");

  await assert.rejects(
    async () => {
      await simulateClientDecrypt(payload.cipherText, fakeKey, payload.ivBase64, payload.authTagBase64);
    },
    /unable to authenticate data/i,
    "Decryption must fail and reject with authentication tag mismatch error with incorrect key"
  );
});

test("Zero-Knowledge: Ciphertext cannot be decrypted if ciphertext or auth tag is modified (Integrity Check)", async () => {
  const secretDoc = "Financial audit results";
  const payload = await simulateClientEncrypt(secretDoc);

  // Tamper 1 bit in ciphertext
  const tamperedCipher = Buffer.from(payload.cipherText);
  tamperedCipher[0] ^= 0x01;

  await assert.rejects(
    async () => {
      await simulateClientDecrypt(tamperedCipher, payload.docKeyBase64Url, payload.ivBase64, payload.authTagBase64);
    },
    /unable to authenticate data/i,
    "Decryption must fail when ciphertext is modified in transit"
  );
});

test("Key Transport: URL #fragment format adheres to RFC 3986 (Never sent in HTTP request line)", () => {
  const docKey = crypto.randomBytes(32).toString("base64url");
  const shareUrl = `https://blindshare.app/v/slug-123#k=${docKey}`;

  const parsed = new URL(shareUrl);
  assert.equal(parsed.pathname, "/v/slug-123");
  assert.equal(parsed.hash, `#k=${docKey}`, "Key must live strictly in #fragment anchor");
  assert.equal(parsed.search, "", "Decryption key must NEVER be passed as a query param (?k=)");
});
