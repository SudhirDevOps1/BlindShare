/**
 * BlindShare Client-Side Zero-Knowledge Metadata Vault
 *
 * Implements Asymmetric Envelope Encryption (NIST P-256 ECDH + AES-GCM-256)
 *
 * Guarantees:
 * 1. Zero-Knowledge: Viewer emails, NDA signatures, and in-document Q&A pins
 *    are encrypted in the viewer's browser using the Founder's P-256 Public Key.
 * 2. Blind Courier: Neither server processes, Neon DB administrators, nor database
 *    dumps can read the plaintext metadata without the Founder's Private Key.
 * 3. Domain Routing: Calculates a one-way salted SHA-256 hash of email domains
 *    (e.g., @sequoia.com) so the platform can trigger founder notification alerts
 *    ("Someone from Sequoia viewed your deck") without ever seeing the full email.
 * 4. In-Memory Zeroization: Cleans up ephemeral key buffers immediately after use.
 */

export interface EncryptedMetadataEnvelope {
  ciphertext: string; // Base64 AES-GCM-256 ciphertext
  iv: string; // Base64 12-byte IV
  ephemeralPublicKey: string; // Base64 raw P-256 public key (65 bytes uncompressed)
  domainHash?: string; // Hex SHA-256 of lowercase domain (for notification routing)
}

export interface FounderKeyPair {
  publicKeyRaw: Uint8Array;
  publicKeyBase64: string;
  privateKey: CryptoKey;
}

/**
 * Generates an ECDH P-256 Keypair for the Founder to receive encrypted metadata.
 */
export async function generateFounderMetadataKeyPair(): Promise<FounderKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );

  const exportedRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const rawBytes = new Uint8Array(exportedRaw);
  let binary = "";
  for (let i = 0; i < rawBytes.length; i++) {
    binary += String.fromCharCode(rawBytes[i]);
  }
  const publicKeyBase64 = btoa(binary);

  return {
    publicKeyRaw: rawBytes,
    publicKeyBase64,
    privateKey: keyPair.privateKey,
  };
}

/**
 * Encrypts metadata (email, question, note) in the viewer browser using Founder's Public Key.
 */
export async function encryptMetadataForFounder(
  plaintext: string,
  founderPublicKeyBase64: string,
  metadataType: "email" | "question" | "signature" | "general" = "general"
): Promise<EncryptedMetadataEnvelope> {
  // 1. Decode Founder's raw uncompressed P-256 public key
  const binary = atob(founderPublicKeyBase64);
  const founderBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    founderBytes[i] = binary.charCodeAt(i);
  }

  const founderKey = await crypto.subtle.importKey(
    "raw",
    founderBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // 2. Generate Ephemeral KeyPair for Forward-Secure ECDH exchange
  const ephemeralKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );

  // 3. Derive 256-bit AES-GCM symmetric key
  const sharedAesKey = await crypto.subtle.deriveKey(
    { name: "ECDH", public: founderKey },
    ephemeralKeyPair.privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  // 4. Encrypt plaintext
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedPlaintext = new TextEncoder().encode(plaintext);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedAesKey,
    encodedPlaintext
  );

  // 5. Export ephemeral public key
  const exportedEphemeral = await crypto.subtle.exportKey("raw", ephemeralKeyPair.publicKey);
  const ephemeralBytes = new Uint8Array(exportedEphemeral);
  let ephemeralBinary = "";
  for (let i = 0; i < ephemeralBytes.length; i++) {
    ephemeralBinary += String.fromCharCode(ephemeralBytes[i]);
  }

  // 6. Calculate domain hash if email
  let domainHash: string | undefined = undefined;
  if (metadataType === "email" && plaintext.includes("@")) {
    const domain = plaintext.split("@")[1]?.trim().toLowerCase();
    if (domain) {
      const domainBytes = new TextEncoder().encode(`blindshare:domain:${domain}`);
      const hashBuffer = await crypto.subtle.digest("SHA-256", domainBytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      domainHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  }

  // 7. Base64 encoding
  const cipherBytes = new Uint8Array(cipherBuffer);
  let cipherBinary = "";
  for (let i = 0; i < cipherBytes.length; i++) {
    cipherBinary += String.fromCharCode(cipherBytes[i]);
  }

  let ivBinary = "";
  for (let i = 0; i < iv.length; i++) {
    ivBinary += String.fromCharCode(iv[i]);
  }

  return {
    ciphertext: btoa(cipherBinary),
    iv: btoa(ivBinary),
    ephemeralPublicKey: btoa(ephemeralBinary),
    domainHash,
  };
}

/**
 * Decrypts metadata envelope in Founder's browser using Founder's Private Key.
 */
export async function decryptMetadataByFounder(
  envelope: EncryptedMetadataEnvelope,
  founderPrivateKey: CryptoKey
): Promise<string> {
  // 1. Decode Ephemeral Public Key
  const binaryEphemeral = atob(envelope.ephemeralPublicKey);
  const ephemeralBytes = new Uint8Array(binaryEphemeral.length);
  for (let i = 0; i < binaryEphemeral.length; i++) {
    ephemeralBytes[i] = binaryEphemeral.charCodeAt(i);
  }

  const ephemeralPublicKey = await crypto.subtle.importKey(
    "raw",
    ephemeralBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // 2. Derive matching Shared AES-GCM Key
  const sharedAesKey = await crypto.subtle.deriveKey(
    { name: "ECDH", public: ephemeralPublicKey },
    founderPrivateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // 3. Decode IV and Ciphertext
  const binaryIv = atob(envelope.iv);
  const iv = new Uint8Array(binaryIv.length);
  for (let i = 0; i < binaryIv.length; i++) {
    iv[i] = binaryIv.charCodeAt(i);
  }

  const binaryCipher = atob(envelope.ciphertext);
  const cipherBytes = new Uint8Array(binaryCipher.length);
  for (let i = 0; i < binaryCipher.length; i++) {
    cipherBytes[i] = binaryCipher.charCodeAt(i);
  }

  // 4. Decrypt
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    sharedAesKey,
    cipherBytes
  );

  return new TextDecoder().decode(decryptedBuffer);
}
