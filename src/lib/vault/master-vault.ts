"use client";

import {
  deriveOwnerMasterKey,
  importOwnerMasterKeyFromRaw,
  wrapDocKeyForOwner,
  unwrapDocKeyForOwner,
  bufferToHex,
  hexToBuffer,
} from "@/lib/crypto-core";

let inMemoryMasterKey: CryptoKey | null = null;

/**
 * Unlock the Owner Master Key Vault in browser memory using the master password and salt.
 * Also persists raw key material safely in sessionStorage so page refreshes/redirects stay unlocked.
 */
export async function unlockOwnerVault(password: string, saltHex: string): Promise<CryptoKey> {
  const masterKey = await deriveOwnerMasterKey(password, saltHex);
  inMemoryMasterKey = masterKey;

  if (typeof window !== "undefined") {
    try {
      const exportedRaw = await crypto.subtle.exportKey("raw", masterKey);
      const hex = bufferToHex(new Uint8Array(exportedRaw));
      sessionStorage.setItem("blindshare_master_vault_token", hex);
    } catch {}
  }

  return masterKey;
}

/**
 * Auto-restore the master vault from the active browser session tab if available.
 */
export async function restoreOwnerVaultFromSession(): Promise<CryptoKey | null> {
  if (inMemoryMasterKey) return inMemoryMasterKey;
  if (typeof window === "undefined") return null;

  try {
    const sessionToken = sessionStorage.getItem("blindshare_master_vault_token");
    if (sessionToken && sessionToken.length === 64) {
      const rawBytes = hexToBuffer(sessionToken);
      const masterKey = await importOwnerMasterKeyFromRaw(rawBytes);
      inMemoryMasterKey = masterKey;
      return masterKey;
    }
  } catch (err) {
    console.warn("Could not restore master vault from session:", err);
  }

  return null;
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
  if (inMemoryMasterKey !== null) return true;
  if (typeof window !== "undefined") {
    return Boolean(sessionStorage.getItem("blindshare_master_vault_token"));
  }
  return false;
}

/**
 * Automatically wrap a 32-byte DocKey with the active Owner Master Key if unlocked.
 */
export async function autoWrapDocKeyForOwner(
  docKey: Uint8Array
): Promise<{ ownerEncryptedKeyHex: string; ownerEncryptedKeyIvHex: string } | null> {
  let masterKey = inMemoryMasterKey;
  if (!masterKey) {
    masterKey = await restoreOwnerVaultFromSession();
  }
  if (!masterKey) return null;

  try {
    const wrapped = await wrapDocKeyForOwner(docKey, masterKey);
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
 * Synchronize and unwrap all documents' and links' keys using the active Owner Master Key.
 * Populates localStorage & sessionStorage so "Copy Link" and viewer work 100% seamlessly.
 */
export async function syncVaultDocumentKeys(documents: any[], links?: any[]): Promise<number> {
  let masterKey = inMemoryMasterKey;
  if (!masterKey) {
    masterKey = await restoreOwnerVaultFromSession();
  }
  if (!masterKey || typeof window === "undefined") {
    return 0;
  }

  let restoredCount = 0;

  if (Array.isArray(documents)) {
    for (const doc of documents) {
      if (!doc?.id) continue;

      let hexKey =
        localStorage.getItem(`blindshare_key_${doc.id}`) ||
        sessionStorage.getItem(`blindshare_key_${doc.id}`);

      if (!hexKey && doc.ownerEncryptedKeyHex && doc.ownerEncryptedKeyIvHex) {
        try {
          const docKey = await unwrapDocKeyForOwner(
            doc.ownerEncryptedKeyHex,
            doc.ownerEncryptedKeyIvHex,
            masterKey
          );

          if (docKey && docKey.length === 32) {
            hexKey = bufferToHex(docKey);
            localStorage.setItem(`blindshare_key_${doc.id}`, hexKey);
            sessionStorage.setItem(`blindshare_key_${doc.id}`, hexKey);
            restoredCount++;
          }
        } catch (err) {
          console.warn(`Failed to unwrap key for document ${doc.id}:`, err);
        }
      } else if (hexKey && (!doc.ownerEncryptedKeyHex || !doc.ownerEncryptedKeyIvHex)) {
        // Auto-heal: If local key exists on this device, wrap and back up to Master Vault!
        try {
          const rawKey = hexToBuffer(hexKey);
          wrapDocKeyForOwner(rawKey, masterKey)
            .then((wrapped) => {
              fetch(`/api/docs/${doc.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ownerEncryptedKeyHex: wrapped.wrappedHex,
                  ownerEncryptedKeyIvHex: wrapped.ivHex,
                }),
              }).catch(() => {});
            })
            .catch(() => {});
        } catch {}
      }
    }
  }

  // Also sync link slugs
  if (Array.isArray(links)) {
    for (const link of links) {
      if (!link?.slug) continue;
      const targetDocId = link.docId;
      let hexKey =
        (targetDocId && localStorage.getItem(`blindshare_key_${targetDocId}`)) ||
        (targetDocId && sessionStorage.getItem(`blindshare_key_${targetDocId}`)) ||
        localStorage.getItem(`blindshare_link_key_${link.slug}`);

      if (!hexKey && link.ownerEncryptedKeyHex && link.ownerEncryptedKeyIvHex) {
        try {
          const docKey = await unwrapDocKeyForOwner(
            link.ownerEncryptedKeyHex,
            link.ownerEncryptedKeyIvHex,
            masterKey
          );
          if (docKey && docKey.length === 32) {
            hexKey = bufferToHex(docKey);
            if (targetDocId) {
              localStorage.setItem(`blindshare_key_${targetDocId}`, hexKey);
              sessionStorage.setItem(`blindshare_key_${targetDocId}`, hexKey);
            }
            restoredCount++;
          }
        } catch {}
      }

      if (hexKey) {
        localStorage.setItem(`blindshare_link_key_${link.slug}`, hexKey);
        localStorage.setItem(`blindshare_key_${link.slug}`, hexKey);
        sessionStorage.setItem(`blindshare_link_key_${link.slug}`, hexKey);
      }
    }
  }

  return restoredCount;
}
