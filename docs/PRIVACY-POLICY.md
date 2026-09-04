# Privacy Policy (Source of Truth for /privacy)

BlindShare is architected as a zero-knowledge document courier. This document serves as the comprehensive source of truth for the platform's data protection posture, cryptographic privacy boundaries, and GDPR/CCPA compliance.

---

## 1. The Four-Quadrant Data Inventory

### Quadrant 1: NEVER COLLECTED
- **Document plaintext / readable file bytes**: The backend never receives, processes, or logs unencrypted document bytes.
- **DocKeys**: Client-side AES-GCM-256 encryption keys live strictly in the URL `#k=...` fragment (RFC 3986) or ephemeral client browser RAM. They never touch server HTTP headers, request lines, or application logs.
- **Password plaintext**: Passwords are never stored or logged. Accounts use `bcrypt` (cost 12); document-level passwords use client-side `PBKDF2-SHA256` (250,000 iterations).
- **Third-party advertising & cross-site trackers**: Absolutely zero third-party tracking scripts, advertising pixels, or data broker integrations.
- **Retention**: **N/A** — Never exists on the server.

### Quadrant 2: CIPHERTEXT (Client-Side Encrypted)
- **Encrypted document bytes**: AES-GCM-256 encrypted ciphertext with 96-bit random IVs and 128-bit authentication tags, pre-compressed via native `CompressionStream('gzip')`.
- **Encrypted thumbnails**: Rendered and encrypted client-side on the owner's device prior to upload.
- **Initialization vectors (IVs) and wrap parameters**: Stored alongside blobs (mathematically useless without the fragment key or master password).
- **Retention**: Preserved until the owner deletes the document (triggering immediate cryptographic shredding) or automatic `DOC_TTL_SWEEP_DAYS` purge.

### Quadrant 3: METADATA-LITE (Database Field Vault Protected)
All Personally Identifiable Information (PII) within metadata tables is encrypted at rest using the **AES-256-GCM Database Field Vault** (`src/lib/crypto/db-vault.ts`):
- **User accounts**: `email` (deterministic AES-256-GCM for exact lookups), `twoFactorSecret` (randomized AES-256-GCM with 12-byte IV).
- **Viewer & NDA sessions**: `viewerEmail` (deterministic AES-256-GCM), `signerName`, `signerEmail`, `signatureDataUrl` (randomized AES-256-GCM).
- **In-Doc Q&A pins**: `questionText`, `replyText`, `askerName`, `askerEmail` (randomized AES-256-GCM).
- **Engagement Telemetry**: Session ID, slide index, dwell seconds (batched every 10s), coarse device/OS class, and coarse country derived from edge CDN headers.
- **IP Protection**: Salted daily IP hash (`crypto.createHash('sha256')`). Raw IP storage is disabled by default.
- **Retention**: `page_events` (180 days default), `view_sessions` (180 days default), `audit_log` (30 days rolling).

### Quadrant 4: PLATFORM LOGS
- **CDN & Edge logs**: Edge request logs (IP, timestamp, TLS cipher) governed independently by infrastructure providers (Cloudflare, Vercel, Render). BlindShare does not ingest or duplicate edge access logs into application databases.
- **Object store access logs**: Managed under Backblaze B2 / Cloudflare R2 privacy terms.
- **Application structured logs**: Enforced via `src/lib/logger.ts`. Automatically sanitizes and redacts emails, IDs, and secrets into 8-character SHA-256 digests.
- **Retention**: Governed by hosting provider policy; zero persistence in BlindShare primary storage.

---

## 2. Sub-processor Registry (GDPR Article 28)

BlindShare utilizes vetted, privacy-compliant infrastructure providers to deliver high availability, low latency, and zero-egress cryptographic storage. No sub-processor ever receives decryption keys or plaintext document content.

| Sub-processor | Location | Processing Scope | Security Boundary |
|---|---|---|---|
| **Neon Inc.** | United States (AWS) | PostgreSQL metadata, link settings & session store | **AES-256-GCM Field Vault Encrypted PII** |
| **Backblaze Inc. (B2)** | United States / EU | Encrypted document blob store (S3-compatible) | **Client-Side Ciphertext Only (Zero-Knowledge)** |
| **Cloudflare Inc. (R2 / Edge)** | Global Edge (300+ PoPs) | DNS routing, DDoS shield, asset proxy, edge storage | **TLS 1.3 / Strict Zero-Log Edge Pipeline** |
| **Vercel Inc.** | Global Edge | Stateless Next.js application runtime & serverless APIs | **Ephemeral Memory Only (No Keys Persisted)** |
| **Upstash Inc.** | United States | Edge rate limiting & brute-force prevention state | **Zero PII Stored (Key Hashes Only)** |
| **Resend / Brevo / GAS** | United States / France | Transactional auth emails & magic sign-in links | **Transient Delivery Only (No Email Body Archival)** |

*Enterprise teams can request a signed Data Processing Addendum (DPA) with EU Standard Contractual Clauses (SCCs) by emailing `security@blindshare.app`.*

---

## 3. GDPR Article 7 Cookie & Privacy Consent

- **Zero Dark Patterns**: The platform deploys an explicit, non-coercive bilingual consent banner (`src/components/compliance/cookie-consent-banner.tsx`).
- **Telemetry Gating**: First-party privacy analytics (`PrismAnalytics`) are completely paused until the visitor grants explicit affirmative consent.
- **Granular Controls**: Visitors can accept all cookies, restrict strictly to essential functionality (session cookies and CSRF protection), or toggle granular preferences.
- **Bilingual Parity**: 100% synchronized support across English (`en`) and Hindi (`hi`).
- **Audit Token**: Consent decisions are recorded in browser storage under `blindshare_cookie_consent_v1` and can be revised at any time from the site footer.

---

## 4. User Rights & Cryptographic Erasure (GDPR Arts. 15–22 & CCPA)

- **Right to Access & Portability (Art. 15 & 20)**: Document owners can download a complete machine-readable archive of all their metadata, audit logs, and account details via `/api/user/export`.
- **Right to Erasure / Crypto-Shredding (Art. 17)**:
  - Account deletion (`Settings → Delete Account`) immediately purges all user rows, session records, and storage blobs.
  - Document deletion instantly obliterates the stored ciphertext and owner wrapped keys, rendering any distributed fragments permanently undecryptable.
- **Viewer Rights**: Viewers submit minimal metadata (dwell time, coarse country). Where an email gate was required by the document owner, viewers can request erasure directly from the owner who shared the link.
- **Zero Commercial Exploitation**: We do not sell, rent, monetize, or profile user data or document analytics under any circumstances.

---

## 5. Honest Limitations (No Security Theater)

- **Watermarks are a deterrent, not DRM**: Diagonal matrix watermarks deter unauthorized leaks and identify sources. A determined recipient can photograph their monitor screen with an analog camera.
- **Download-off is client-side containment**: Once bytes are decrypted for visual canvas rendering in the browser, they exist ephemerally in RAM.
- **Link forwarding is outside courier control**: Anyone possessing the full URL including the `#k=...` fragment can decrypt the document. Always use password gates, email verification, domain restrictions, view limits, and expiration dates for defense-in-depth.
- **Geolocation gates are coarse**: Country detection is derived from CDN IP headers and can be bypassed by viewers using VPN or proxy services.
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
