/**
 * BlindShare Cryptographic Core (Audited WebCrypto APIs)
 * 
 * Invariants:
 * - DocKey = CSPRNG-256 (WebCrypto crypto.getRandomValues)
 * - Cipher = AES-GCM-256 with 96-bit (12-byte) IV
 * - Password wrap = PBKDF2 with SHA-256 (250,000 iterations)
 * - Keys live strictly on the client (URL fragment #k=... or client memory)
 */

import { EncryptedPayload, WrappedKeyPayload } from "./types";

// Base64URL encoding / decoding (RFC 4648) without padding
export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBuffer(hex: string): Uint8Array {
  if (!hex || hex.length % 2 !== 0) return new Uint8Array(0);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generate a 256-bit random Document Key
 */
export function generateDocKey(): Uint8Array {
  const key = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(key);
  return key;
}

/**
 * Encode DocKey into URL fragment parameter value
 */
export function docKeyToFragment(key: Uint8Array): string {
  return bufferToBase64Url(key);
}

/**
 * Extract DocKey from URL fragment string or #k=... parameter
 */
export function fragmentToDocKey(fragment: string): Uint8Array | null {
  try {
    let clean = fragment.startsWith("#") ? fragment.substring(1) : fragment;
    if (clean.startsWith("k=")) {
      clean = clean.substring(2);
    }
    const ampIndex = clean.indexOf("&");
    if (ampIndex !== -1) {
      clean = clean.substring(0, ampIndex);
    }
    if (!clean) return null;
    const key = base64UrlToBuffer(clean);
    if (key.length !== 32) {
      console.warn("Invalid DocKey length in fragment, expected 32 bytes:", key.length);
      return null;
    }
    return key;
  } catch (err) {
    console.error("Failed to parse fragment DocKey:", err);
    return null;
  }
}

/**
 * Client-Side Encrypt document bytes using AES-GCM-256
 */
/**
 * Browser-native GZIP client-side compression to reduce B2/R2 bucket storage size by 50-80%
 */
export async function compressBytes(data: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") return data;
  try {
    const stream = new Response(new Blob([data as any])).body!.pipeThrough(new CompressionStream("gzip"));
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return data;
  }
}

/**
 * Browser-native GZIP client-side decompression with auto-detect magic bytes
 */
export async function decompressBytes(data: Uint8Array): Promise<Uint8Array> {
  if (data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b && typeof DecompressionStream !== "undefined") {
    try {
      const stream = new Response(new Blob([data as any])).body!.pipeThrough(new DecompressionStream("gzip"));
      const buffer = await new Response(stream).arrayBuffer();
      return new Uint8Array(buffer);
    } catch {
      return data;
    }
  }
  return data;
}

/**
 * Client-Side Encrypt document bytes using AES-GCM-256 (with transparent client-side compression)
 */
export async function encryptBytes(
  plaintext: ArrayBuffer | Uint8Array,
  rawKey: Uint8Array
): Promise<EncryptedPayload> {
  const cryptoSubtle = crypto.subtle;
  if (!cryptoSubtle) {
    throw new Error("WebCrypto SubtleCrypto is not supported in this environment");
  }

  // Transparently compress client-side to minimize bucket storage footprint
  const rawBytes = plaintext instanceof Uint8Array ? plaintext : new Uint8Array(plaintext);
  const compressed = await compressBytes(rawBytes);

  // Import raw key
  const cryptoKey = await cryptoSubtle.importKey(
    "raw",
    rawKey as ArrayBufferView<ArrayBuffer>,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Generate a random 12-byte (96-bit) IV for GCM
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  const ciphertext = await cryptoSubtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128,
    },
    cryptoKey,
    compressed as ArrayBufferView<ArrayBuffer>
  );

  return {
    ciphertext,
    iv,
  };
}

/**
 * Client-Side Decrypt document bytes using AES-GCM-256 (with transparent decompression)
 */
export async function decryptBytes(
  ciphertext: ArrayBuffer | Uint8Array,
  rawKey: Uint8Array,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  const cryptoSubtle = crypto.subtle;
  if (!cryptoSubtle) {
    throw new Error("WebCrypto SubtleCrypto is not supported in this environment");
  }

  const cryptoKey = await cryptoSubtle.importKey(
    "raw",
    rawKey as ArrayBufferView<ArrayBuffer>,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decrypted = await cryptoSubtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as ArrayBufferView<ArrayBuffer>,
      tagLength: 128,
    },
    cryptoKey,
    ciphertext as ArrayBufferView<ArrayBuffer>
  );

  // Decompress if compressed, otherwise return raw buffer
  const decompressed = await decompressBytes(new Uint8Array(decrypted));
  return decompressed.buffer as ArrayBuffer;
}

/**
 * Wrap DocKey using password-derived key (PBKDF2 + AES-GCM)
 */
export async function wrapKeyWithPassword(
  docKey: Uint8Array,
  password: string
): Promise<WrappedKeyPayload> {
  const cryptoSubtle = crypto.subtle;
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  const enc = new TextEncoder();
  const passwordKey = await cryptoSubtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const derivedKey = await cryptoSubtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 250000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  const encryptedKey = await cryptoSubtle.encrypt(
    { name: "AES-GCM", iv },
    derivedKey,
    docKey as ArrayBufferView<ArrayBuffer>
  );

  // Combine IV + encrypted key for transport
  const combined = new Uint8Array(iv.length + encryptedKey.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedKey), iv.length);

  return {
    wrappedKeyHex: bufferToHex(combined),
    saltHex: bufferToHex(salt),
    iterations: 250000,
    algorithm: "PBKDF2-SHA256-AES-GCM-256",
  };
}

/**
 * Unwrap DocKey using password
 */
export async function unwrapKeyWithPassword(
  wrappedKeyHex: string,
  saltHex: string,
  password: string
): Promise<Uint8Array> {
  const cryptoSubtle = crypto.subtle;
  const combined = hexToBuffer(wrappedKeyHex);
  const salt = hexToBuffer(saltHex);

  if (combined.length < 13) {
    throw new Error("Invalid wrapped key format");
  }

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const enc = new TextEncoder();
  const passwordKey = await cryptoSubtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const derivedKey = await cryptoSubtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as ArrayBufferView<ArrayBuffer>,
      iterations: 250000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decryptedKey = await cryptoSubtle.decrypt(
    { name: "AES-GCM", iv: iv as ArrayBufferView<ArrayBuffer> },
    derivedKey,
    ciphertext as ArrayBufferView<ArrayBuffer>
  );

  return new Uint8Array(decryptedKey);
}

/**
 * Derive 256-bit Owner Master Key using PBKDF2 with SHA-256 (100,000 iterations)
 */
export async function deriveOwnerMasterKey(
  password: string,
  saltHex: string
): Promise<CryptoKey> {
  const cryptoSubtle = crypto.subtle;
  const salt = hexToBuffer(saltHex);
  const enc = new TextEncoder();
  const baseKey = await cryptoSubtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await cryptoSubtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as ArrayBufferView<ArrayBuffer>,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Wrap a 32-byte DocKey with the OwnerMasterKey (AES-GCM-256)
 */
export async function wrapDocKeyForOwner(
  docKey: Uint8Array,
  masterKey: CryptoKey
): Promise<{ wrappedHex: string; ivHex: string }> {
  const cryptoSubtle = crypto.subtle;
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  const encryptedKey = await cryptoSubtle.encrypt(
    { name: "AES-GCM", iv },
    masterKey,
    docKey as ArrayBufferView<ArrayBuffer>
  );

  return {
    wrappedHex: bufferToHex(encryptedKey),
    ivHex: bufferToHex(iv),
  };
}

/**
 * Unwrap a 32-byte DocKey using the OwnerMasterKey (AES-GCM-256)
 */
export async function unwrapDocKeyForOwner(
  wrappedHex: string,
  ivHex: string,
  masterKey: CryptoKey
): Promise<Uint8Array> {
  const cryptoSubtle = crypto.subtle;
  const iv = hexToBuffer(ivHex);
  const ciphertext = hexToBuffer(wrappedHex);

  const decryptedKey = await cryptoSubtle.decrypt(
    { name: "AES-GCM", iv: iv as ArrayBufferView<ArrayBuffer> },
    masterKey,
    ciphertext as ArrayBufferView<ArrayBuffer>
  );

  return new Uint8Array(decryptedKey);
}

