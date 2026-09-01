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
links 1─* page_questions
documents 1─* doc_audio_notes
links 1─* live_rooms
users 1─* invites · users 1─* push_subscriptions · audit_log · system_settings
```

## E2EE & Compression Flow
1. **Client-Side GZIP Compression**: Browser compresses document bytes via native `CompressionStream('gzip')` (50–80% space saving on B2/R2).
2. `crypto.getRandomValues(32)` → DocKey.
3. `AES-GCM-256` encrypts compressed bytes with 96-bit IV; IV stored in DB (public, harmless).
4. Ciphertext uploaded (presigned PUT ≤10 min, or direct blind POST for the local adapter).
5. Link URL `= /v/<slug>#k=base64url(DocKey)`.
6. Password mode: DocKey wrapped by `PBKDF2-SHA256(250 000, 16-byte salt)`; server stores
   `bcrypt(password)` + wrap params only.
7. Viewer fetches ciphertext, decrypts with WebCrypto AES-GCM, decompresses via `DecompressionStream('gzip')`, renders with pdf.js / media renderer.

**Invariant:** no server file contains `crypto.subtle.decrypt` on document bytes.

## Event pipeline & AI Intent Scoring
- **Telemetry Batching**: Viewer buffers per-page dwell in memory → flush every `VIEW_HEARTBEAT_SEC` (10s) as a batched array → `POST /api/v/<slug>/session` writes one aggregate row update + N page_event rows.
- **AI Lead Conviction Intent Scorer (`src/lib/analytics/intent-scorer.ts`)**: Evaluates aggregate engagement across 4 conviction weights:
  - Total Dwell Time ($35\%$)
  - Document Completion Rate ($25\%$)
  - Return Visit Frequency ($20\%$)
  - High-Interest Slide Concentration & NDA Signature ($20\%$)
  - Output: Conviction score ($0–100$), Level (`hot` | `warm` | `cold`), and behavioral insight pills.

## Security & Defense Layer
- **Two-Factor Authentication (2FA / TOTP RFC 6238)**: User-level TOTP engine (`src/lib/auth/totp.ts`) with HMAC-SHA1 30-second windows and 8 single-use hashed recovery backup codes.
- **Live DNS MX Verification & Temp Email Filter (`src/lib/validation/email-validator.ts`)**: Live Node.js DNS `resolveMx` checking real mail servers + 40+ disposable domain blocklist + SSRF private IP filter.
- **SSRF Defense Engine**: Pre-flight outbound request validation (`src/lib/security/ssrf-validator.ts`) blocking RFC-1918 private subnets, loopback, and cloud metadata.
- **Live Room Owner-Only Authorization**: Strict owner authentication preventing presenter slide hijacking.
- **Tab-Switch Anti-Spy Shield**: Focus & visibility listener blurring confidential documents when reader tabs out.
- **Distributed Edge Rate Limiting**: Upstash Redis REST pipeline (`src/lib/security/distributed-rate-limiter.ts`) synchronized across edge nodes with zero-crash in-memory sliding window fallback.
