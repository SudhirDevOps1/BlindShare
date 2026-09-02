"use client";

import {
  deriveOwnerMasterKey,
  wrapDocKeyForOwner,
  unwrapDocKeyForOwner,
  bufferToHex,
} from "@/lib/crypto-core";

let inMemoryMasterKey: CryptoKey | null = null;

/**
 * Unlock the Owner Master Key Vault in browser memory using the master password and salt.
 */
export async function unlockOwnerVault(password: string, saltHex: string): Promise<CryptoKey> {
  const masterKey = await deriveOwnerMasterKey(password, saltHex);
  inMemoryMasterKey = masterKey;
  return masterKey;
}

/**
 * Retrieve the active in-memory Owner Master Key if unlocked.
 */
export function getOwnerMasterKey(): CryptoKey | null {
  return inMemoryMasterKey;
}

/**
 * Set the in-memory master key directly.
 */
export function setOwnerMasterKey(key: CryptoKey | null): void {
  inMemoryMasterKey = key;
}

/**
 * Check if the master vault is currently unlocked in this browser session.
 */
export function isVaultUnlocked(): boolean {
  return inMemoryMasterKey !== null;
}

/**
 * Automatically wrap a 32-byte DocKey with the active Owner Master Key if unlocked.
 */
export async function autoWrapDocKeyForOwner(
  docKey: Uint8Array
): Promise<{ ownerEncryptedKeyHex: string; ownerEncryptedKeyIvHex: string } | null> {
  if (!inMemoryMasterKey) return null;
  try {
    const wrapped = await wrapDocKeyForOwner(docKey, inMemoryMasterKey);
    return {
      ownerEncryptedKeyHex: wrapped.wrappedHex,
      ownerEncryptedKeyIvHex: wrapped.ivHex,
    };
  } catch (err) {
    console.warn("Failed to wrap DocKey for owner vault:", err);
    return null;
  }
}

/**
 * Synchronize and unwrap all documents' keys using the active Owner Master Key.
 * Populates localStorage & sessionStorage so "Copy Link" and viewer work 100% seamlessly.
 */
export async function syncVaultDocumentKeys(documents: any[]): Promise<number> {
  if (!inMemoryMasterKey || !Array.isArray(documents) || typeof window === "undefined") {
    return 0;
  }

  let restoredCount = 0;

  for (const doc of documents) {
    if (!doc?.id || !doc?.ownerEncryptedKeyHex || !doc?.ownerEncryptedKeyIvHex) {
      continue;
    }

    // If key is already in storage, skip unwrapping to save CPU cycles
    const existing =
      localStorage.getItem(`blindshare_key_${doc.id}`) ||
      sessionStorage.getItem(`blindshare_key_${doc.id}`);

    if (existing) {
      continue;
    }

    try {
      const docKey = await unwrapDocKeyForOwner(
        doc.ownerEncryptedKeyHex,
        doc.ownerEncryptedKeyIvHex,
        inMemoryMasterKey
      );

      if (docKey && docKey.length === 32) {
        const hex = bufferToHex(docKey);
        localStorage.setItem(`blindshare_key_${doc.id}`, hex);
        sessionStorage.setItem(`blindshare_key_${doc.id}`, hex);
        restoredCount++;
      }
    } catch (err) {
      console.warn(`Failed to unwrap key for document ${doc.id}:`, err);
    }
  }

  return restoredCount;
}
