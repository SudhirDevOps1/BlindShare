# Cryptographic Pipeline & Compression

## Pipeline Flow

```
[ Raw Document File ]
        │
        ▼ (Browser Web Workers)
[ CompressionStream('gzip') ] ──► 50-80% Size Reduction
        │
        ▼ (WebCrypto API)
[ AES-GCM-256 Encrypt ] ──► (256-bit Key, 96-bit IV, 128-bit Auth Tag)
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
[ Ciphertext Blob ]          [ DocKey (#k=...) ]          [ IV + Tag Metadata ]
        │                             │                             │
(Presigned S3 PUT to B2)       (URL Fragment only)            (Saved to DB)
```

## Owner Master Vault Wrapping (Bitwarden-Style Persistence)
When an authenticated owner uploads a document:
1. Client derives `OwnerMasterKey = PBKDF2(AccountPassword, UserSalt, 100000, SHA-256)` in browser RAM.
2. Client encrypts `OwnerWrappedKey = AES-GCM(DocKey, OwnerMasterKey)` with random 96-bit IV.
3. Database stores `owner_encrypted_key_hex` and `owner_encrypted_key_iv_hex`.
4. Upon login or cache clear, the client decrypts all `DocKeys` in RAM without server knowledge.

## Link Key Wrapping (Per-Link Password Protection)
When a share link has a password gate enabled:
1. Client generates `Salt` (16 bytes random CSPRNG).
2. Computes `WrapKey = PBKDF2(LinkPassword, Salt, 250000, SHA-256)`.
3. Encrypts `WrappedKey = AES-GCM(DocKey, WrapKey)`.
4. Stores `password_salt_hex` and `wrapped_key_hex` on the link record in the database.
5. Viewer enters the link password, unwraps `DocKey` locally in browser memory, and decrypts ciphertext seamlessly.
