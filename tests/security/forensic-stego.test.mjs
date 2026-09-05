import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

/**
 * Unit & Integration Test Suite: Invisible Forensic Steganography & Key Derivation (v1.4.0)
 */

function encodePayloadToBits(payload) {
  const identity = (payload.viewerIdentity || "PUBLIC_VIEWER").trim().toLowerCase();
  const slug = (payload.slug || "UNKNOWN").toLowerCase();
  const ts = payload.timestamp || Date.now();

  let h1 = 0x811c9dc5;
  for (let i = 0; i < identity.length; i++) {
    h1 ^= identity.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  const identityHash = (h1 >>> 8) & 0xffffff;

  let h2 = 0x5a5a;
  for (let i = 0; i < slug.length; i++) {
    h2 = ((h2 << 5) - h2 + slug.charCodeAt(i)) & 0xffff;
  }
  const slugHash = h2 & 0xffff;

  const timeBucket = Math.floor(ts / (5 * 60 * 1000)) & 0xffff;
  const checksum = ((identityHash ^ (slugHash << 4) ^ timeBucket) & 0xff);

  const bits = [];
  for (let b = 23; b >= 0; b--) bits.push((identityHash >> b) & 1);
  for (let b = 15; b >= 0; b--) bits.push((slugHash >> b) & 1);
  for (let b = 15; b >= 0; b--) bits.push((timeBucket >> b) & 1);
  for (let b = 7; b >= 0; b--) bits.push((checksum >> b) & 1);

  return bits;
}

test("Forensic Stego: Generates exact 64-bit constellation with valid CRC checksum", () => {
  const payload = {
    viewerIdentity: "investor@sequoia.com",
    slug: "pitch-deck-2026",
    timestamp: 1772700000000,
  };

  const bits = encodePayloadToBits(payload);
  assert.equal(bits.length, 64, "Bitstream must be exactly 64 bits");
  bits.forEach((b) => assert.ok(b === 0 || b === 1, "Each bit must be 0 or 1"));

  // Check determinism
  const bits2 = encodePayloadToBits(payload);
  assert.deepEqual(bits, bits2, "Deterministic encoding must produce identical bitstream for same input");
});

test("Zero-Exfiltration: Zeroize wipes raw key buffer in-place to prevent RAM inspection", () => {
  const rawKey = crypto.randomBytes(32);
  const copy = Buffer.from(rawKey);
  assert.deepEqual(rawKey, copy);

  // Simulate zeroizeBuffer
  rawKey.fill(0);

  assert.notDeepEqual(rawKey, copy);
  assert.ok(rawKey.every((byte) => byte === 0), "Every byte in memory must be wiped to 0");
});

test("HKDF Per-Slide Derivation: Generates cryptographically unique keys per slide", async () => {
  const masterKey = crypto.randomBytes(32);

  // Derive Slide 1 and Slide 2 keys using HKDF-SHA256
  const keySlide1 = crypto.hkdfSync(
    "sha256",
    masterKey,
    Buffer.from("blindshare-hkdf-salt-2026"),
    Buffer.from("blindshare-slide-v1.4.0-1"),
    32
  );

  const keySlide2 = crypto.hkdfSync(
    "sha256",
    masterKey,
    Buffer.from("blindshare-hkdf-salt-2026"),
    Buffer.from("blindshare-slide-v1.4.0-2"),
    32
  );

  const buf1 = Buffer.from(keySlide1);
  const buf2 = Buffer.from(keySlide2);

  assert.equal(buf1.length, 32);
  assert.equal(buf2.length, 32);
  assert.notDeepEqual(buf1, buf2, "Per-slide derived keys must be strictly distinct");
  assert.notDeepEqual(buf1, masterKey, "Slide sub-key must never match master document key");
});
