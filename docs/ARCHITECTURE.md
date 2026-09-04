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

## Production ₹0 Free-Tier Stack Combo
BlindShare is mathematically optimized to run in production on a zero-cost 5-pillar stack:
- **Application & Edge APIs:** Vercel Hobby (100 GB bandwidth, 1M invocations, 4h CPU, 360 GB-Hrs RAM)
- **Database & PII Field Vault:** Neon Serverless PostgreSQL (512 MB DB storage, 100 CU-hrs compute with 5-minute auto-suspend)
- **Encrypted Blob Storage:** Backblaze B2 (10 GB free forever, 1 GB/day free egress, 2,500 daily Class B/C API operations)
- **Transactional Auth Mailer:** Google Apps Script (`docs/GOOGLE-APPS-SCRIPT-EMAIL.md` — 100 to 1,500 free emails/day)
- **Continuous Hardening & CI:** GitHub Actions (2,000 free runner minutes, automated CodeQL SAST & Trivy vulnerability scans)
- **Daily Capacity Handled:** 2,500+ active deck viewers, 330–500 full pitch deck downloads, 50,000+ DB transactions daily for **$0.00 / month**.

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

## E2EE, Master Vault & Compression Flow
1. **Client-Side GZIP Compression**: Browser compresses document bytes via native `CompressionStream('gzip')` (50–80% space saving on B2/R2).
2. `crypto.getRandomValues(32)` → DocKey.
3. `AES-GCM-256` encrypts compressed bytes with 96-bit IV; IV stored in DB (public, harmless).
4. **Enterprise-Grade Owner Master Vault**:
   - Client derives `OwnerMasterKey = PBKDF2-SHA256(AccountPassword, UserSalt, 100 000 iterations)` in browser RAM.
   - Client wraps `owner_encrypted_key_hex = AES-GCM(DocKey, OwnerMasterKey)` and stores it in the `documents` table.
   - On login or across cache clears / new devices, the client derives the master key and automatically unwraps all `DocKeys` in RAM without server knowledge.
5. Ciphertext uploaded (presigned PUT ≤10 min, or direct blind POST for the local adapter).
6. Link URL `= /v/<slug>#k=base64url(DocKey)`.
7. **Password Mode**: DocKey wrapped by `PBKDF2-SHA256(250 000, 16-byte salt)`; server stores `bcrypt(password)` + wrap params only.
8. Viewer fetches ciphertext, decrypts with WebCrypto AES-GCM, decompresses via `DecompressionStream('gzip')`, renders with pdf.js / media renderer.

**Invariant:** no server file contains `crypto.subtle.decrypt` on document bytes.

## Client-Side Master Key vs. Server `.env` Secrets
| Dimension | Browser Master Key (Zero-Knowledge) | Server `.env` Secret (e.g. `SESSION_SECRET` on Vercel/Cloudflare) |
|---|---|---|
| **Where it lives** | Client browser memory only (never sent to server) | Server environment variables (`.env`, Vercel Env, Cloudflare Secrets) |
| **Purpose** | Encrypts & decrypts document keys & user files | Signs session cookies (HMAC-SHA256) & authenticates DB/Storage |
| **Server visibility** | **ZERO Knowledge** (server cannot inspect or decrypt) | Server can use it for system HMAC & token verification |
| **What happens if in `.env`?** | Document decryption keys are strictly client-side to maintain zero-knowledge guarantees. | Required for backend session integrity and edge security. |

### Multi-Cloud Secrets & Encryption Coordination (Vercel & Cloudflare):
- **Vercel Deployments**: `SESSION_SECRET` and database URLs are configured in *Project Settings → Environment Variables*. Vercel serverless functions handle API routing and metadata without accessing plaintext document keys.
- **Cloudflare Pages / Workers**: Environment secrets are provisioned in *Settings → Variables and Secrets*. Edge nodes perform rate-limiting and session verification while document decryption remains 100% in client WebCrypto.
- **Master Password / Login Pass Protection**: The user's account password acts as the client-side master key seed, deriving a 256-bit AES-GCM wrapping key via 100,000 PBKDF2 iterations. Even if the hosting infrastructure or database is breached, document contents remain mathematically inaccessible without the user's password.

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
- **Enterprise-Grade Owner Master Key Vault**: Cross-device, cache-immune Zero-Knowledge key synchronization (`src/lib/vault/master-vault.ts`).
- **Live DNS MX Verification & Temp Email Filter (`src/lib/validation/email-validator.ts`)**: Live Node.js DNS `resolveMx` checking real mail servers + 40+ disposable domain blocklist + SSRF private IP filter.
- **SSRF Defense Engine**: Pre-flight outbound request validation (`src/lib/security/ssrf-validator.ts`) blocking RFC-1918 private subnets, loopback, and cloud metadata.
- **Live Room Owner-Only Authorization**: Strict owner authentication preventing presenter slide hijacking.
- **Tab-Switch Anti-Spy Shield**: Focus & visibility listener blurring confidential documents when reader tabs out.
- **Distributed Edge Rate Limiting**: Upstash Redis REST pipeline (`src/lib/security/distributed-rate-limiter.ts`) synchronized across edge nodes with zero-crash in-memory sliding window fallback.
- **AES-256-GCM Database Field Vault (`src/lib/crypto/db-vault.ts`)**:
  - Encrypts PII at rest in the database using server-side AES-256-GCM with PBKDF2/SHA-256 key derivation (`DB_ENCRYPTION_KEY`).
  - **Deterministic Mode** (fixed IV derived from HMAC of plaintext) enables exact lookup queries (`WHERE email = ?`) for `users.email` and `viewSessions.viewerEmail`.
  - **Randomized Mode** (cryptographically random 12-byte IV per encryption) protects sensitive payloads without query requirements: TOTP secrets (`users.twoFactorSecret`), NDA signatures (`signerName`, `signerEmail`, `signatureDataUrl`), and slide Q&A content (`pageQuestions.questionText`, `replyText`, `askerName`, `askerEmail`).
  - Ciphertexts are formatted as `vault:v1:iv_hex:tag_hex:cipher_hex`. Legacy plaintext strings pass through safely and upgrade upon write.
- **2026 GDPR Article 7 Bilingual Cookie Consent & Telemetry Gating (`src/components/compliance/cookie-consent-banner.tsx`)**:
  - Strictly prevents execution of non-essential analytics and tracking (`PrismAnalytics`) until the visitor grants explicit affirmative consent.
  - Zero dark patterns: Accept All, Essential Only, and Granular Preference toggles with full 100% English (`en`) and Hindi (`hi`) synchronization.
  - Consent status persisted in `localStorage` under `blindshare_cookie_consent_v1`.
- **Sub-processor Registry Architecture (`docs/PRIVACY-POLICY.md`, `/privacy#subprocessors`)**:
  - Full GDPR Article 28 transparency disclosing all external processing nodes (Neon, Backblaze B2, Cloudflare, Vercel, Upstash, Resend).
  - Enforces zero-knowledge storage isolation: no third-party vendor ever receives document decryption keys or unencrypted document bytes.
- **Umami-Style Live Investor Radar (`src/app/api/investors/live/route.ts`)**:
  - Real-time active reader monitor tracking visitors actively engaged on document pitch decks within the last 5 minutes.
  - Aggregates live viewer counts, active links, slide progression, and coarse geolocation without storing IP addresses or tracking cookies.
- **Distributed Anti-DoS Rate Limiter on System Probes (`src/app/api/health/route.ts`)**:
  - Sliding-window rate limiter protecting `/api/health` probes (60 req/min per IP) to prevent denial-of-service and resource exhaustion attacks against monitoring endpoints.
- **Interactive Cyber Companion & 125px Flashlight Spotlight Architecture (`src/components/cursor/crypto-cursor.tsx`)**:
  - GPU-accelerated mascot follower using direct DOM classes inside `requestAnimationFrame` for 0ms React scheduler latency.
  - Adaptive trailing personal space: pet maintains a comfortable 80px distance from cursor; activates high-speed sprint chase only when cursor moves away beyond threshold, smoothly yielding if crowded.
  - Tight 125px circular CSS mask (`radial-gradient`) confining ciphertext illumination strictly around the cursor, keeping the rest of the workspace completely dark and clean.
  - Strict Touchscreen & Small Viewport Guard: automatically unmounts/disables overlays on coarse pointers, touchscreens, and viewports `< 768px` to guarantee 100% native mobile responsiveness.
- **Unregistered Account Warning Defense (`/api/auth/forgot-password`, `/api/auth/magic-link`, `/api/auth/otp`)**:
  - Explicit 404 alert responses for unauthenticated requests with unregistered emails, paired with prominent UI alert banners to prevent user confusion.
---

## 📚 Related Documentation & Knowledge Base

- 🏠 **[Project Readme](../README.md)** — Core mission, feature list, and deployment presets.
- 🎨 **[Visual Architecture Blueprint](./visual.md)** — Architectural diagrams, dataflow, and crypto courier pipeline.
- 🏗️ **[Architecture Core](./ARCHITECTURE.md)** — Multi-cloud adapter specs, WebCrypto encryption flow, and data models.
- 🛡️ **[Security Policy](./SECURITY.md)** — Vulnerability disclosure, cryptographic invariants, and security headers.
- 🎯 **[Threat Model & Attack Surface](./THREAT-MODEL.md)** — Attack surface and honest residual risks.
- 📄 **[Supported File Formats](./FORMATS.md)** — File format handling, client-side renderers, and size caps.
- 📖 **[Operations Runbook](./RUNBOOK.md)** — Production migrations, health checks, and debugging procedures.
- 🔑 **[Secrets Reference](./SECRETS.md)** — Comprehensive list of required and optional environment keys.
- 🧹 **[Data Retention Policy](./DATA-RETENTION.md)** — Free-tier retention policies and cleanup sweeps.
- 🚨 **[Incident Response Plan](./INCIDENT-RESPONSE.md)** — Compromise triage, key rotation, and containment runbooks.
- 🌊 **[Litestream Self-Hosting](./LITESTREAM-SELFHOSTING.md)** — Zero-cost SQLite continuous WAL streaming to B2.
- 📋 **[Changelog & Patch Logs](./CHANGELOG.md)** — Chronological release history and version tracking.
- 📦 **[Release Process](./RELEASES.md)** — SemVer versioning and tagging protocol.
- 🔒 **[Privacy Policy](./PRIVACY-POLICY.md)** & ⚖️ **[Terms of Service](./TERMS.md)** — Privacy commitments and legal terms.
- 🤝 **[Contributing Guide](./CONTRIBUTING.md)** & 👥 **[Code of Conduct](./CODE_OF_CONDUCT.md)** — Community development pledge.
- 🧠 **[Architecture Skill](./skills/blindshare-architecture/SKILL.md)** — Definitive agent standards and verification checklist.
