import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

/**
 * Test Suite for Client-Side Zero-Knowledge Metadata Vault
 * Verifies P-256 ECDH + AES-GCM-256 Asymmetric Envelope Encryption
 */

test("Client Metadata Vault: P-256 Keypair generation and asymmetric envelope encryption", async () => {
  // 1. Generate Founder P-256 ECDH Keypair via webcrypto
  const founderPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );

  const rawFounderPub = await crypto.subtle.exportKey("raw", founderPair.publicKey);
  const founderPubBase64 = Buffer.from(rawFounderPub).toString("base64");

  // 2. Viewer encrypts private question
  const privateQuestion = "What is the ARR growth target for Q3 2026?";

  // Import Founder Pub
  const importedFounderKey = await crypto.subtle.importKey(
    "raw",
    Buffer.from(founderPubBase64, "base64"),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Viewer generates ephemeral pair
  const ephemeralPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );

  const sharedAesKey = await crypto.subtle.deriveKey(
    { name: "ECDH", public: importedFounderKey },
    ephemeralPair.privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedAesKey,
    new TextEncoder().encode(privateQuestion)
  );

  const exportedEphemeral = await crypto.subtle.exportKey("raw", ephemeralPair.publicKey);

  const envelope = {
    ciphertext: Buffer.from(cipherBuffer).toString("base64"),
    iv: Buffer.from(iv).toString("base64"),
    ephemeralPublicKey: Buffer.from(exportedEphemeral).toString("base64"),
  };

  assert.ok(envelope.ciphertext.length > 0, "Ciphertext should not be empty");
  assert.notEqual(envelope.ciphertext, privateQuestion, "Ciphertext must not be plaintext");

  // 3. Founder decrypts using Private Key
  const importedEphemeral = await crypto.subtle.importKey(
    "raw",
    Buffer.from(envelope.ephemeralPublicKey, "base64"),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const founderSharedKey = await crypto.subtle.deriveKey(
    { name: "ECDH", public: importedEphemeral },
    founderPair.privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: Buffer.from(envelope.iv, "base64") },
    founderSharedKey,
    Buffer.from(envelope.ciphertext, "base64")
  );

  const decryptedText = new TextDecoder().decode(decryptedBuffer);
  assert.equal(decryptedText, privateQuestion, "Decrypted text must exactly match original viewer question");
});

test("Client Metadata Vault: Salted domain hash routes notification without revealing viewer email", async () => {
  const viewerEmail = "partner@sequoiacap.com";
  const domain = viewerEmail.split("@")[1].toLowerCase();
  
  const hash = crypto.createHash("sha256").update(`blindshare:domain:${domain}`).digest("hex");
  
  assert.ok(hash.length === 64, "Domain hash must be 64-char SHA-256 hex");
  assert.ok(!hash.includes("sequoiacap"), "Salted hash must not reveal raw domain string");
});
