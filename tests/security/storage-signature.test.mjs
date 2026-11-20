import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { verifyStorageSignature } from "../../src/lib/storage/signature.ts";

test("Storage Signature: Valid HMAC-SHA256 signature authorizes access", () => {
  const secret = process.env.SESSION_SECRET || "blindshare_local_secret";
  const key = "docs/test-doc-123.bin";
  const expires = Date.now() + 60_000;
  const sig = crypto.createHmac("sha256", secret).update(`get:${key}:${expires}`).digest("hex");

  const isValid = verifyStorageSignature("get", key, String(expires), sig);
  assert.strictEqual(isValid, true);
});

test("Storage Signature: Expired timestamp is strictly rejected", () => {
  const secret = process.env.SESSION_SECRET || "blindshare_local_secret";
  const key = "docs/test-doc-123.bin";
  const expires = Date.now() - 5_000; // 5 seconds in the past
  const sig = crypto.createHmac("sha256", secret).update(`get:${key}:${expires}`).digest("hex");

  const isValid = verifyStorageSignature("get", key, String(expires), sig);
  assert.strictEqual(isValid, false);
});

test("Storage Signature: Action mismatch (PUT vs GET) is rejected", () => {
  const secret = process.env.SESSION_SECRET || "blindshare_local_secret";
  const key = "docs/test-doc-123.bin";
  const expires = Date.now() + 60_000;
  // Generated for 'put' but checked against 'get'
  const sig = crypto.createHmac("sha256", secret).update(`put:${key}:${expires}`).digest("hex");

  const isValid = verifyStorageSignature("get", key, String(expires), sig);
  assert.strictEqual(isValid, false);
});

test("Storage Signature: Tampered signature byte or invalid key is rejected", () => {
  const secret = process.env.SESSION_SECRET || "blindshare_local_secret";
  const key = "docs/test-doc-123.bin";
  const expires = Date.now() + 60_000;
  const sig = crypto.createHmac("sha256", secret).update(`get:${key}:${expires}`).digest("hex");
  const tamperedSig = sig.slice(0, -2) + (sig.endsWith("0") ? "1" : "0");

  const isValid = verifyStorageSignature("get", key, String(expires), tamperedSig);
  assert.strictEqual(isValid, false);
});

test("Storage Signature: Null or malformed parameters fail safely without throwing", () => {
  assert.strictEqual(verifyStorageSignature("get", "key", null, null), false);
  assert.strictEqual(verifyStorageSignature("get", "key", "not-a-number", "random-sig"), false);
});
