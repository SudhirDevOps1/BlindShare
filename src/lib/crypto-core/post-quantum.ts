/**
 * BlindShare Post-Quantum Hybrid Cryptographic Suite (v1.4.0)
 * Implements FIPS 203 ML-KEM-768 (Module Lattice KEM) + Classical ECDH (P-256) Hybrid.
 * 
 * Protects against "Harvest Now, Decrypt Later" quantum adversary campaigns.
 * Even if an adversary records encrypted ciphertext today, they cannot decrypt it
 * with future quantum computers running Shor's algorithm.
 *
 * Upgraded to genuine FIPS 203 ML-KEM-768 (NIST Final Standard, August 2024)
 * powered by audited lattice mathematics via @noble/post-quantum.
 */

import { ml_kem768 } from "@noble/post-quantum/ml-kem.js";

export interface PQHybridKeyPair {
  classicalPublicKey: string; // Hex-encoded classical public key
  classicalPrivateKey: CryptoKeyPair;
  quantumPublicKey: string;   // Hex-encoded FIPS 203 ML-KEM-768 public key (1,184 bytes = 2,368 hex chars)
  quantumPrivateKey: string;  // Hex-encoded FIPS 203 ML-KEM-768 secret key (2,400 bytes = 4,800 hex chars)
}

export interface PQHybridEncapsulation {
  ciphertextHex: string;     // Ephemeral classical public key + ML-KEM-768 ciphertext (1,088 bytes)
  sharedKey: CryptoKey;       // Non-extractable AES-GCM-256 CryptoKey
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generates a Hybrid KeyPair combining Classical ECDH (P-256) + Real Post-Quantum Lattice (ML-KEM-768)
 */
export async function generatePQHybridKeyPair(): Promise<PQHybridKeyPair> {
  const cryptoSubtle = crypto.subtle;
  if (!cryptoSubtle) throw new Error("SubtleCrypto not supported in current environment");

  // 1. Classical ECDH Keypair (ECDH P-256)
  const classicalPair = await cryptoSubtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );

  const rawClassicalPub = await cryptoSubtle.exportKey("raw", classicalPair.publicKey);
  const classicalPubHex = toHex(new Uint8Array(rawClassicalPub));

  // 2. FIPS 203 ML-KEM-768 Keypair (768-dim Module Lattice)
  const quantumPair = ml_kem768.keygen();
  const quantumPubHex = toHex(quantumPair.publicKey);
  const quantumPrivHex = toHex(quantumPair.secretKey);

  return {
    classicalPublicKey: classicalPubHex,
    classicalPrivateKey: classicalPair,
    quantumPublicKey: quantumPubHex,
    quantumPrivateKey: quantumPrivHex,
  };
}

/**
 * Encapsulate a 256-bit symmetric shared key using Recipient's Post-Quantum Hybrid Public Key
 */
export async function encapsulatePQHybrid(
  recipientClassicalPubHex: string,
  recipientQuantumPubHex: string
): Promise<PQHybridEncapsulation> {
  const cryptoSubtle = crypto.subtle;
  if (!cryptoSubtle) throw new Error("SubtleCrypto not supported in current environment");

  // 1. Ephemeral Classical ECDH Keypair
  const ephemeralClassical = await cryptoSubtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );

  // Import recipient classical public key
  const recipientPubBytes = fromHex(recipientClassicalPubHex);
  const recipientClassicalKey = await cryptoSubtle.importKey(
    "raw",
    recipientPubBytes as ArrayBufferView<ArrayBuffer>,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Classical shared secret
  const classicalSecretBits = await cryptoSubtle.deriveBits(
    { name: "ECDH", public: recipientClassicalKey },
    ephemeralClassical.privateKey,
    256
  );

  // 2. Real FIPS 203 ML-KEM-768 Encapsulation
  const recipientQuantumPubBytes = fromHex(recipientQuantumPubHex);
  const { cipherText: quantumCipherText, sharedSecret: quantumSharedSecret } =
    ml_kem768.encapsulate(recipientQuantumPubBytes);

  // 3. Hybrid Combination via HKDF-SHA256 (RFC 5869 / Apple PQ3 / NIST SP 800-56C Style)
  // Combines Classical Shared Secret (32 bytes) + Post-Quantum Lattice Shared Secret (32 bytes)
  const combinedSecret = new Uint8Array(32 + 32);
  combinedSecret.set(new Uint8Array(classicalSecretBits), 0);
  combinedSecret.set(quantumSharedSecret, 32);

  const hkdfKey = await cryptoSubtle.importKey(
    "raw",
    combinedSecret as ArrayBufferView<ArrayBuffer>,
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  // Derive non-extractable 256-bit AES-GCM Key
  const sharedKey = await cryptoSubtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode("blindshare-pq-hybrid-v1.4.0"),
      info: new TextEncoder().encode("ml-kem-768-x25519-hybrid-key"),
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false, // Strictly non-extractable
    ["encrypt", "decrypt"]
  );

  // Export ephemeral classical public key to include in ciphertext payload
  const rawEphemeralPub = await cryptoSubtle.exportKey("raw", ephemeralClassical.publicKey);
  const ephemPubHex = toHex(new Uint8Array(rawEphemeralPub));
  const qCiphertextHex = toHex(quantumCipherText);

  return {
    ciphertextHex: `${ephemPubHex}:${qCiphertextHex}`,
    sharedKey,
  };
}

/**
 * Decapsulate Post-Quantum Hybrid Ciphertext using Recipient Private Key
 */
export async function decapsulatePQHybrid(
  ciphertextHex: string,
  recipientClassicalPrivateKey: CryptoKey,
  recipientQuantumPrivHex: string
): Promise<CryptoKey> {
  const cryptoSubtle = crypto.subtle;
  if (!cryptoSubtle) throw new Error("SubtleCrypto not supported in current environment");

  const [ephemPubHex, qCiphertextHex] = ciphertextHex.split(":");
  if (!ephemPubHex || !qCiphertextHex) {
    throw new Error("Invalid Post-Quantum Hybrid ciphertext format");
  }

  // 1. Classical ECDH Decapsulation
  const ephemPubBytes = fromHex(ephemPubHex);
  const ephemPubKey = await cryptoSubtle.importKey(
    "raw",
    ephemPubBytes as ArrayBufferView<ArrayBuffer>,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const classicalSecretBits = await cryptoSubtle.deriveBits(
    { name: "ECDH", public: ephemPubKey },
    recipientClassicalPrivateKey,
    256
  );

  // 2. Real FIPS 203 ML-KEM-768 Decapsulation
  const qCipherBytes = fromHex(qCiphertextHex);
  const recipientQuantumPrivBytes = fromHex(recipientQuantumPrivHex);
  const quantumSharedSecret = ml_kem768.decapsulate(qCipherBytes, recipientQuantumPrivBytes);

  // 3. Derive identical 256-bit Hybrid Key via HKDF
  const combinedSecret = new Uint8Array(32 + 32);
  combinedSecret.set(new Uint8Array(classicalSecretBits), 0);
  combinedSecret.set(quantumSharedSecret, 32);

  const hkdfKey = await cryptoSubtle.importKey(
    "raw",
    combinedSecret as ArrayBufferView<ArrayBuffer>,
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  return await cryptoSubtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode("blindshare-pq-hybrid-v1.4.0"),
      info: new TextEncoder().encode("ml-kem-768-x25519-hybrid-key"),
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false, // Strictly non-extractable
    ["encrypt", "decrypt"]
  );
}

// Expose on window for browser DevTools console verification and security testing
if (typeof window !== "undefined") {
  (window as any).__BLINDSHARE_PQ__ = {
    generatePQHybridKeyPair,
    encapsulatePQHybrid,
    decapsulatePQHybrid,
  };
}
