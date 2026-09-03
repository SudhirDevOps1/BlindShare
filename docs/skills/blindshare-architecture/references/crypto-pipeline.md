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

## Key Wrapping (Password Protection)
When a link has a password:
1. Client generates `Salt` (16 bytes random CSPRNG).
2. Computes `WrapKey = PBKDF2(Password, Salt, 250000, SHA-256)`.
3. Encrypts `WrappedKey = AES-GCM(DocKey, WrapKey)`.
4. Stores `SaltHex` and `WrappedKeyHex` in the database.
