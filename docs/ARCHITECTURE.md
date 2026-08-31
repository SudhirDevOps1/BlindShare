# Architecture

## Adapters (env-only swap)
| Concern | Env | Options |
|---|---|---|
| Backend | `BACKEND_TARGET` | cf · vercel · netlify · deno · render-cron (ops only) |
| Database | `DB_TARGET` | d1 · neon · turso · supabase |
| Object store | `STORE_TARGET` | r2 · b2 (both S3-compatible, PRIVATE, presigned only) |
| Notify | VAPID web-push default; e-mail adapter OFF by default |

Code: `src/lib/storage/{b2,r2,local}-adapter.ts` implement one `StorageAdapter` contract
(`getPresignedPutUrl`, `getPresignedGetUrl`, `putObject`, `getObject`, `deleteObject`, `listObjects`).

## Data model (ER, simplified)
```
users 1─* documents 1─* doc_versions
users 1─* datarooms 1─* dataroom_docs *─1 documents
documents 1─* links *─1 datarooms
links 1─* view_sessions 1─* page_events
users 1─* invites · users 1─* push_subscriptions · audit_log · system_settings
```

## E2EE flow
1. `crypto.getRandomValues(32)` → DocKey.
2. `AES-GCM-256` encrypt with 96-bit IV; IV stored in DB (public, harmless).
3. Ciphertext uploaded (presigned PUT ≤10 min, or direct blind POST for the local adapter).
4. Link URL `= /v/<slug>#k=base64url(DocKey)`.
5. Password mode: DocKey wrapped by `PBKDF2-SHA256(250 000, 16-byte salt)`; server stores
   `bcrypt(password)` + wrap params only.
6. Viewer fetches ciphertext, decrypts with WebCrypto, renders with pdf.js / media renderer.

**Invariant:** no server file contains `crypto.subtle.decrypt` on document bytes.

## Event pipeline
Viewer buffers per-page dwell in memory → flush every `VIEW_HEARTBEAT_SEC` (10s) as a batched
array → `POST /api/v/<slug>/session` writes one aggregate row update + N page_event rows.
On `BACKEND_TARGET=cf` the buffer moves to KV/DO and flushes hourly (`ANALYTICS_FLUSH_MIN`)
to respect the D1 100K writes/day budget.

## Security & Defense Layer
- **Two-Factor Authentication (2FA / TOTP RFC 6238)**: User-level TOTP engine (`src/lib/auth/totp.ts`) with HMAC-SHA1 30-second windows and 8 single-use hashed recovery backup codes.
- **SSRF Defense Engine**: Pre-flight outbound request validation (`src/lib/security/ssrf-validator.ts`) blocking RFC-1918 private subnets, loopback, and cloud metadata.
- **Distributed Edge Rate Limiting**: Upstash Redis REST pipeline (`src/lib/security/distributed-rate-limiter.ts`) synchronized across edge nodes with zero-crash in-memory sliding window fallback.
