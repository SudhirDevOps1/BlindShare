"use client";

/**
 * BlindShare Hardware-Backed WebAuthn PRF (Pseudo-Random Function) Vault Engine
 *
 * Implements W3C WebAuthn Level 3 PRF Extension:
 * Allows founders to unlock their Owner Master Key Vault directly via biometric
 * Touch ID, Face ID, Windows Hello, or hardware security keys (YubiKey) in sub-50ms.
 *
 * Security Invariants:
 * 1. Origin-bound cryptographic key derivation inside hardware Secure Enclave.
 * 2. The raw PRF output is never stored on server and never sent over the wire.
 * 3. PRF output is passed through HKDF-SHA256 to derive AES-GCM-256 Master Key.
 * 4. Graceful fallback to PBKDF2/Argon2id master passphrase when hardware is absent.
 */

function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if WebAuthn is available in the current browser environment.
 */
export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.navigator !== "undefined" &&
    Boolean(window.PublicKeyCredential)
  );
}

export interface PasskeyRegistrationResult {
  credentialId: string;
  prfSupported: boolean;
}

/**
 * Registers a new hardware-backed Passkey requesting the PRF extension for vault encryption.
 */
export async function registerPasskeyWithPrf(
  username: string,
  userDisplayName: string
): Promise<PasskeyRegistrationResult> {
  if (!isWebAuthnAvailable()) {
    throw new Error("WebAuthn is not supported in this browser.");
  }

  const userId = new TextEncoder().encode(`blindshare-user-${username}`);
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const creationOptions: CredentialCreationOptions = {
    publicKey: {
      challenge,
      rp: {
        name: "BlindShare Zero-Knowledge Vault",
        id: window.location.hostname === "localhost" ? undefined : window.location.hostname,
      },
      user: {
        id: userId,
        name: username,
        displayName: userDisplayName || username,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },  // ES256 (P-256)
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
      timeout: 60000,
      extensions: {
        prf: {},
      } as any,
    },
  };

  const credential = (await navigator.credentials.create(
    creationOptions
  )) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error("Passkey registration was cancelled by user.");
  }

  const clientExtensions = credential.getClientExtensionResults() as any;
  const prfSupported = Boolean(clientExtensions?.prf?.enabled);
  const credentialId = bufferToBase64Url(credential.rawId);

  // Store registered credential ID in localStorage for instant biometric prompt
  try {
    localStorage.setItem("blindshare_passkey_cred_id", credentialId);
    localStorage.setItem("blindshare_passkey_prf_enabled", String(prfSupported));
  } catch {}

  return { credentialId, prfSupported };
}

/**
 * Unlocks the Master Vault directly using the Passkey PRF hardware derivation.
 */
export async function unlockVaultWithPasskeyPrf(
  vaultSaltHex: string,
  credentialIdBase64?: string
): Promise<CryptoKey> {
  if (!isWebAuthnAvailable()) {
    throw new Error("WebAuthn is not supported in this browser.");
  }

  const credIdStr =
    credentialIdBase64 ||
    (typeof window !== "undefined" ? localStorage.getItem("blindshare_passkey_cred_id") : null);

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  // Salt input for deterministic PRF key derivation
  const prfSalt = new TextEncoder().encode(`blindshare-vault-prf:${vaultSaltHex || "default-salt"}`);

  const allowCredentials: PublicKeyCredentialDescriptor[] = credIdStr
    ? [{ id: base64UrlToUint8Array(credIdStr) as unknown as BufferSource, type: "public-key" }]
    : [];

  const requestOptions: CredentialRequestOptions = {
    publicKey: {
      challenge,
      timeout: 60000,
      userVerification: "preferred",
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
      extensions: {
        prf: {
          eval: {
            first: prfSalt,
          },
        },
      } as any,
    },
  };

  const assertion = (await navigator.credentials.get(requestOptions)) as PublicKeyCredential | null;

  if (!assertion) {
    throw new Error("Biometric authentication was cancelled.");
  }

  const extensionResults = assertion.getClientExtensionResults() as any;
  const prfOutput = extensionResults?.prf?.results?.first as ArrayBuffer | undefined;

  if (!prfOutput) {
    throw new Error(
      "The authenticator does not support the WebAuthn PRF extension. Please unlock with master password."
    );
  }

  // Derive AES-GCM-256 Master Key via HKDF-SHA256 from the 32-byte PRF secret
  const prfKeyMaterial = await crypto.subtle.importKey(
    "raw",
    prfOutput,
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  const masterKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode("blindshare-webauthn-prf-v1.4.0"),
      info: new TextEncoder().encode("owner-master-vault-encryption-key"),
    },
    prfKeyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );

  return masterKey;
}
