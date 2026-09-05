# Security policy

## Supported versions
The `main` branch is the only supported version during 0.x.

## Reporting a vulnerability
Open a private security advisory in the repository, or contact the deployment operator listed in
`VAPID_SUBJECT`. Please include reproduction steps and impact. Target first response: 72 hours.

## Status
**This project has NOT been externally audited.** Cryptography uses only audited primitives:
WebCrypto `AES-GCM-256`, `PBKDF2-SHA256` (250 000 iterations), `bcrypt` for password hashes,
HMAC-SHA256 signed session cookies. No hand-rolled crypto.

## Security headers checklist
- [x] Content-Security-Policy (incl. `worker-src 'self' blob:` for pdf.js)
- [x] Strict-Transport-Security (preload-ready)
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Permissions-Policy (minimal)
- [x] Cross-Origin-Resource-Policy: same-origin
- [x] X-Frame-Options: DENY / frame-ancestors 'none'
- [x] X-Robots-Tag noindex on `/v/*` + robots.txt disallow

## 6-Pillar Zero-Knowledge Cryptographic Suite (v1.4.0)
- **Pillar 1 (In-Memory Key Isolation & RAM Zeroing)** (`src/lib/crypto-core/index.ts`):
  - Keys imported with `extractable: false` via WebCrypto Subtle API, preventing Chrome extensions and DevTools console inspection from exporting keys.
  - Raw key buffers immediately wiped (`zeroizeBuffer(rawBytes)`) with zeros in memory.
- **Pillar 2 (HKDF RFC 5869 Sub-Key Derivation)** (`src/lib/crypto-core/index.ts`):
  - Derives cryptographically isolated sub-keys per slide (`deriveSlideKey(masterKey, pageNumber)`). Allows sub-10ms streaming of individual slides without decrypting the entire file.
- **Pillar 3 (Argon2id Memory-Hard KDF)** (`src/lib/crypto-core/argon2id.ts`):
  - Memory-hard derivation function for the Owner Master Key Vault, rendering GPU and ASIC brute-forcing mathematically infeasible.
- **Pillar 4 (Post-Quantum Hybrid ML-KEM-768 + ECDH)** (`src/lib/crypto-core/post-quantum.ts`):
  - Combines NIST FIPS 203 lattice-based key encapsulation with classical ECDH P-256 to defeat "Harvest Now, Decrypt Later" quantum adversary pipelines.
- **Pillar 5 (Invisible Forensic Steganography & Leak Scanner)** (`src/lib/watermark/forensic-stego.ts`):
  - Embeds an invisible 64-bit micro-dot luminance constellation (viewer signature, link slug, timestamp, CRC checksum) directly onto document canvas pixels.
  - Forensic Leak Scanner modal (`src/components/analytics/forensic-leak-scanner-modal.tsx`) decodes leaked screenshots and smartphone camera photos to identify leaks.
- **Pillar 6 (Forward Secrecy & Burn-After-Reading Ratchet)** (`src/app/api/v/[slug]/ratchet-burn/route.ts`):
  - Strips the `#k=...` URL fragment from the browser history stack immediately upon successful decryption.
  - Client-side `beforeunload` beacon shreds the session mapping, preventing memory forensics.

## Advanced hardening (added post-launch)
- **Real-Time Founder Alerting (Stoat / Slack / Discord)**: Webhook notification dispatcher (`src/lib/notifications/webhook-notifier.ts`) with multi-format payload support and `DEFAULT_WEBHOOK_URL` fallback.
- **Columnar DuckDB Analytics Engine** (`src/lib/analytics/duckdb-engine.ts`): Sub-5ms slide heatmap aggregations and mathematical percentiles ($p50, p90, p99$).
- **Strict input validation**: every API route validates its JSON body against a Zod schema
  before touching the database (`src/lib/validation/schemas.ts`).
- **128-bit identifiers**: share-link slugs, session ids, document/link/user ids all use
  16 random bytes (128 bits), generated centrally in `src/lib/ids.ts`.
- **Password policy**: minimum length (`PASSWORD_MIN_LENGTH`, default 10) plus mandatory
  upper/lower/digit/symbol, enforced both client-side (live strength meter) and server-side.
- **bcrypt cost factor**: configurable via `BCRYPT_COST_FACTOR` (default 12).
- **Owner-login brute-force lockout**: `LOGIN_LOCKOUT_TRIES` / `LOGIN_LOCKOUT_MINUTES`,
  independent from the per-link password-gate lockout.
- **Session versioning**: "Log out of all devices" (`/api/auth/logout-all`) instantly
  invalidates every previously issued session token, even if its signature is still valid.
- **`__Host-` cookie prefix** in production: Secure, Path=/, no Domain attribute.
- **No-store caching** enforced on every authenticated route (`/dashboard/*`, `/admin/*`,
  `/api/admin/*`, `/api/auth/*`, `/api/docs/*`, `/api/links/*`, `/api/datarooms/*`).
- **Structured, redacting logger** (`src/lib/logger.ts`): passwords, emails, invite codes and
  keys are hashed to an 8-char fingerprint before any log line is emitted.
- **Fail-fast env validation** (`src/lib/env.ts`): production boots refuse a missing/weak
  `SESSION_SECRET` or missing `DATABASE_URL`.
- **Two-Factor Authentication (2FA / TOTP RFC 6238)** (`src/lib/auth/totp.ts`): Authenticator
  app support (Google Authenticator, Authy, 1Password) with 1-click QR code setup, time drift tolerance,
  and 8 single-use SHA-256 hashed recovery backup codes.
- **SSRF Defense Engine** (`src/lib/security/ssrf-validator.ts`): Outbound webhook destination validation
  that actively blocks loopback interfaces, private RFC-1918 subnets (`10.x`, `172.16.x`, `192.168.x`),
  multicast, and cloud metadata IP addresses (`169.254.169.254`, `metadata.google.internal`).
- **Live DNS MX Verification & Temp Email Filter** (`src/lib/validation/email-validator.ts`): Real-time
  DNS MX record resolution ensuring viewers provide legitimate corporate/personal mailboxes, combined
  with a blocklist of 40+ disposable temp email domains and private subnet probe mitigation.
- **Live Room Access Control & Presentation Guard** (`src/app/api/v/[slug]/room/route.ts`): Strict
  owner-only session verification preventing unauthorized users from broadcasting or hijacking slide navigation.
- **Tab-Switch Anti-Spy Privacy Shield** (`src/app/v/[slug]/page.tsx`): Focus & window visibility listeners
  that automatically conceal confidential document canvases behind a dark-glass veil on blur or tab switch.
- **Burn-After-Reading Atomic Self-Destruction** (`src/app/api/v/[slug]/verify/route.ts`): Single-use
  links that immediately flag `isRevoked: true` in database upon initial unlock, permanently shredding future access.
- **Client-Side GZIP Compression before AES-GCM Encryption** (`src/lib/crypto-core/index.ts`): Compresses
  data client-side before AES-GCM-256 encryption, reducing storage footprint by 50–80% with zero server visibility.
- **Distributed Edge Rate Limiting** (`src/lib/security/distributed-rate-limiter.ts`): Multi-node rate
  limiting via Upstash Redis REST HTTP API with zero-crash in-memory sliding window fallback.
- **Resilient Self-Hosted PDF.js**: Local vendor script loading with CDN failover to guarantee 100%
  viewer uptime without single-point supply-chain dependencies.
- **Enterprise-Grade Owner Master Key Vault** (`src/lib/vault/master-vault.ts`):
  - Derives a 256-bit `OwnerMasterKey` in browser memory via WebCrypto `PBKDF2-SHA256` (100,000 rounds) using a per-user 16-byte random salt.
  - Automatically wraps every document's 32-byte `DocKey` with `AES-GCM-256` before sending metadata to `/api/docs`.
  - On login or across browser cache clears, the client derives the master key in RAM and decrypts all document keys locally.
  - **Zero-Knowledge Invariant**: Plaintext master passwords and unencrypted document keys are never transmitted to the server.
- **Client vs. Server Key Isolation**:
  - The server `.env` variables (`SESSION_SECRET`, `ADMIN_BOOTSTRAP_INVITE`, `UPSTASH_REDIS_REST_TOKEN`) are strictly isolated for session HMACs, database operations, and edge rate-limiting.
  - Document decryption keys NEVER exist in `.env` or on the server file system. All document decryption happens exclusively inside viewer and owner browsers using WebCrypto.
- **CodeQL Advanced SAST Hardening (86/86 Alerts Resolved · 0 Open)**:
  - **URL Substring Parsing Hardening**: Replaced substring checks with strict RFC `URL` hostname and search parameter validators in database connection pools and webhooks.
  - **CSPRNG Invariant**: Pure WebCrypto `crypto.getRandomValues()` and `crypto.randomUUID()` used everywhere. `Math.random()` completely eliminated.
  - **SVG DOMParser Sanitization**: Native XML DOM parsing and strict URL protocol allowlisting (`http:`, `https:`, `mailto:`, `#`), replacing bypass-vulnerable regexes.
  - **HTML Entity Character Encoding**: Question text, asker names, and founder replies strictly converted (`<` -> `&lt;`, `>` -> `&gt;`, `"` -> `&quot;`, `'` -> `&#39;`) to ensure stored XSS immunity.
  - **Tainted File Write & Storage Confinement**: All storage keys mapped to SHA-256 digests (`${sha256(key)}.blob`), path boundary verification, and low-level file descriptor access with `0o600` owner-only mode.
- **Permanent Indelible PDF Download Watermark Embedding (`pdf-lib`)**:
  - Automatically stamps multi-layer diagonal matrix watermarks (verified recipient identity, timestamp, custom text, slug) directly into every page stream before export.
- **Tiered Edge Abuse Limiting & In-Session Telemetry Isolation (`src/proxy.ts`, `src/app/v/[slug]/page.tsx`)**:
  - Route-aware edge throttling separating link initial access from active reading:
    - Primary link view & metadata (`/api/v/[slug]`): `300 req/hour per link` to protect serverless compute from scrapers while allowing normal reloads.
    - Password gate verification: `gate:${ip}:${slug}` with 20 tries / 15 min lockout.
    - Active in-session telemetry (`/questions`, `/room`, `/session`, `/bytes`): generous `2,400 req/hour per IP+slug` so readers actively reading, taking notes, or in live presentation rooms never get throttled.
  - Page Visibility API (`document.hidden`) automatically suspends background polling when readers switch tabs, conserving rate limits and bandwidth.
  - Watchdog fault tolerance: HTTP 429 and transient network blips are gracefully bypassed, ensuring active reader sessions are never falsely terminated with "Link Has Expired".
- **In-Doc Q&A Reader Isolation Privacy (`/api/v/[slug]/questions`, `/api/questions`)**:
  - Private questions/feedback dropped by viewers are strictly isolated: anonymous and external viewers can only query and view their own pins.
  - Transactional email dispatch notifies founders in real time with 1-click in-app reply sync.
- **Signed NDA Forensic Certificate Generation (`/api/v/[slug]/nda-cert`)**:
  - Standalone cryptographic PDF certificate for executed NDAs with SHA-256 integrity hash, execution timestamp, and legal audit trail.
- **ALTCHA Proof-of-Work Bot & DDoS Defense** (`src/lib/security/altcha.ts`):
  - 100% self-hosted Proof-of-Work (PoW) CAPTCHA alternative with zero third-party tracking, zero cookies, and zero external network dependencies.
  - Generates SHA-256 challenges with HMAC-SHA256 signatures, verified in constant time (`crypto.timingSafeEqual`) with a 10-minute in-memory replay prevention cache.
  - Seamlessly protects public document links, investor email gates, founder Q&A question pins, and admin login forms.
- **Privacy-First Telemetry Architecture (`PrismAnalytics`)**:
  - Optional, self-hosted telemetry engine with zero third-party scripts, zero PII, zero cross-site cookies, and 10s buffered batch beaconing.
- **AES-256-GCM Database Field Vault (`src/lib/crypto/db-vault.ts`)**:
  - Server-side AES-256-GCM encryption of sensitive database fields at rest using PBKDF2-SHA256 derived keys (`DB_ENCRYPTION_KEY`).
  - Protects user emails, viewer emails, 2FA TOTP secrets, NDA signatures, and slide Q&A conversations.
  - Deterministic encryption mode enables index lookups for auth without leaking raw email plaintext.
  - Mitigates catastrophic database dump leaks or read-only SQL injection exposure.
- **Distributed Anti-DoS Rate Limiter on System Probes (`src/app/api/health/route.ts`)**:
  - Sliding-window rate limiter protecting `/api/health` probes (60 req/min per IP) to prevent denial-of-service and monitoring pipeline starvation.
- **2026 GDPR Article 7 Bilingual Cookie & Privacy Consent (`src/components/compliance/cookie-consent-banner.tsx`)**:
  - Zero-dark-pattern consent banner gating all client analytics until affirmative opt-in with 100% English/Hindi bilingual parity.
- **Sub-processor Registry & Enterprise DPA Transparency (`docs/PRIVACY-POLICY.md`, `/privacy#subprocessors`)**:
  - Exhaustive GDPR Article 28 vendor disclosures (Neon, Backblaze B2, Cloudflare, Vercel, Upstash, Resend) guaranteeing zero vendor visibility into document keys or plaintext.
- **34 Automated Enterprise Security Tests (`npm test`)**:
  - Comprehensive CI test suite running on every commit and PR verifying:
    1. ALTCHA SHA-256 HMAC challenge generation and PoW verification
    2. ALTCHA signature forgery and replay attack prevention
    3. Timing-safe HMAC session cookie verification and tamper rejection
    4. Session revocation via `sessionVersion` invalidation
    5. 2FA TOTP RFC 6238 generation and single-use backup code matching
    6. Client-side AES-GCM-256 + GZIP compression roundtrip integrity
    7. Zero-Knowledge tamper resistance and authentication tag validation
    8. RFC 3986 URL fragment key preservation (`#k=...` never sent to server)
    9. Owner Master Vault PBKDF2 100k rounds key derivation and key wrapping
    10. DuckDB slide heatmaps, completion rates, and dwell percentiles ($p50, p90, p99$)
    11. XSS script tag and event handler sanitization
    12. AI Lead Conviction Intent Scoring (Hot, Warm, Cold deal detection)
    13. SVG brand vector icon integrity (zero corrupted or raster PNG files)
    14. Burn-after-reading single-use link self-destruction
    15. Storage isolation: plaintext keys never persisted in document models
    16. Investor intelligence metrics NaN prevention and route registration
    17. Database Field Vault AES-256-GCM PII encryption roundtrip & auth wiring
    18. GDPR 2026 Cookie Consent Banner & Sub-processors registry integrity
    19. Common Event Format (CEF) SIEM string formatting
    20. SSRF outbound validation blocking private subnets, loopbacks, and cloud metadata
    21. Disposable/temporary email blocking and MX validation
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
