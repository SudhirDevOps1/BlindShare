# Changelog
All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).

## [1.2.0] - 2026-09-01 (17:35 IST)
### Added
- **AI Lead Conviction Intent Scoring Engine (Hot Deal Detector):**
  - Real-time mathematical scoring ($0-100$) analyzing 4 intent vectors: Dwell Time ($35\%$), Slide Completion ($25\%$), Revisit Frequency ($20\%$), and Focus Concentration + NDA Agreement ($20\%$).
  - High-intent badges (`🔥 HOT DEAL (85-100)`, `⚡ WARM INTEREST (60-84)`, `❄️ CASUAL (0-59)`) and actionable behavioral pills in analytics.
- **Client-Side Transparent GZIP Compression (50-80% Storage Footprint Reduction):**
  - Integrated browser-native `CompressionStream('gzip')` and `DecompressionStream('gzip')` before AES-GCM-256 encryption.
  - Transparent support for PDFs, Images, Markdown, Code, Plain Text, Word/Presentations with zero server CPU load and ₹0 cost.
  - Expands 10 GB free-tier storage capacity to effectively store 30–50 GB of documents.
- **Live DNS MX Record & Disposable/Fake Email Defense:**
  - Real-time Node.js DNS `resolveMx(domain)` lookup on gated email submissions.
  - Curated blocklist of 40+ high-volume disposable/temp email domains (`mailinator`, `tempmail`, `10minutemail`, `yopmail`, `guerrillamail`, etc.).
  - SSRF protection blocking private IP subnets (`127.*`, `10.*`, `192.168.*`, `169.254.*`), `localhost`, and internal domain probes.
- **Enterprise Automated Security & Cryptographic E2E Test Suite (`npm test`):**
  - 16+ automated security tests verifying Zero-Knowledge cryptographic integrity, AES-GCM-256 + GZIP compression, SSRF private IP blocks, timing-safe HMAC token verification, sessionVersion invalidation, and XSS sanitization.
- **Enterprise SIEM & SOC Log Forwarding Engine (`src/lib/siem/siem-forwarder.ts`):**
  - Formats audit and auth events into Common Event Format (CEF) and JSON for live streaming to Splunk HEC, Datadog Logs API, and Elastic / Logstash.
- **GitHub Advanced Static Security Pipeline (CodeQL & Aqua Trivy):**
  - Added `.github/workflows/codeql.yml` for deep semantic AST vulnerability scanning (OWASP Top 10 / CWE).
  - Added Aqua Security Trivy filesystem & dependency vulnerability scanning on every PR and commit.
- **Database & Storage Bucket Maintenance & Purge Suite (`/admin`):**
  - **Live Cleanliness Dashboard:** Displays real-time counts of orphaned B2/R2 files, tombstoned soft-deleted documents, expired/revoked links, and stale telemetry.
  - **Orphan Bucket Sweep:** Scans and purges unreferenced encrypted ciphertext blobs from S3/B2 storage.
  - **Tombstone Purge:** Permanently deletes soft-deleted documents, their physical storage files, versions, and audio pitch notes.
  - **Stale Link & Telemetry Pruning:** Cleans expired/revoked links and raw page dwell events older than 30 days to keep PostgreSQL within Neon free-tier limits.
  - **Full Platform Vacuum:** 1-click audited safe optimization cycle with double-confirmation dialogs.
- **Granular Link Expiration & View Limit Presets:**
  - 1-Click Expiry Presets in Link Studio: `1 Hour`, `24 Hours`, `7 Days`, `30 Days`, and custom date/time picker.
  - View Limit Presets: `1 View (Burn-After-Reading)`, `5 Views`, `25 Views`, `100 Views`, and custom numeric limit.
- **In-Doc Interactive Question Pins & Reader Feedback:**
  - Click-to-pin question overlay on slides with coordinates `(x%, y%)`.
  - Reader question popover with founder reply support and status badges (`Pending`, `Resolved`).
  - Webhook & Push notifications automatically dispatched to document owner upon new pin creation.
- **Voice Pitch Walkthrough Notes per Slide:**
  - Slide-specific founder audio explanations attached to pages.
  - Sleek floating dark-glass audio wave player with scrubbing, time duration, mute, and playback controls.
- **Live Presenter Room & Co-Browsing:**
  - Real-time slide synchronization between presenter and connected viewers.
  - Owner-only authorization guard preventing presentation hijacking.
  - Live broadcast alert banner for viewers with 1-click `"Sync Slides"` toggle.
- **Tab-Switch Anti-Spy Privacy Shield:**
  - Automatic `visibilitychange` and window `blur` detection obfuscating confidential documents with dark-glass privacy veil when reader changes tabs or applications.
- **Burn-After-Reading Self-Destruct Links:**
  - Atomic database self-destruction (`isRevoked: true`) immediately upon first session unlock.

### Security Fixes & Hardening
- **Live Room Access Control:** Added strict owner authentication checks to `/api/v/[slug]/room` ensuring only document creators can broadcast slides.
- **DNS Rebinding & SSRF Mitigation:** Enforced private IP / cloud metadata blocklists prior to DNS MX queries in `email-validator.ts`.
- **Stored XSS Prevention:** Applied HTML tag stripping and sanitization on all reader question submissions and names.
- **React Ref Render Body Fix:** Transitioned `audioRef.current` access in `VoiceNotePlayer` to metadata-driven state updates to ensure strict React concurrency compliance.


## [1.0.0] - 2026-08-29
### Added
- Zero-knowledge E2EE upload pipeline (AES-GCM-256, CSPRNG DocKey, `#k=` fragment links)
- Link studio: password (PBKDF2 250k wrap), e-mail gate, domain allowlist, NDA clickwrap,
  expiry, max-views, watermark and download toggles, QR codes
- Viewer: pdf.js page-wise renderer + image/SVG/Markdown/TXT/CSV/audio/video/bundle renderers,
  live watermark overlay, resume hint, revoke-mid-session watchdog
- Analytics: per-page dwell sparklines, completion %, UA class, coarse country, CSV export
- Admin panel: users/roles, invites, blind audit log, storage gauge, free-tier budget ledger,
  maintenance mode, broadcast banner, orphan-object sweeps
- Storage adapters (B2 / R2 / local), PWA shell, HI+EN i18n, GDPR-lite export & delete
- Security headers middleware, rate limiting, robots noindex for share links, docs pack

## [1.1.0] - 2026-08-31
### Added
- **Two-Factor Authentication (2FA / TOTP RFC 6238):**
  - Standard authenticator app support (Google Authenticator, Microsoft Authenticator, Authy, 1Password).
  - 1-click QR code scanning + manual secret key entry in `TwoFactorModal`.
  - 8 single-use cryptographically random SHA-256 hashed emergency recovery backup codes.
  - 2FA challenge login gate with temporary signed pre-auth tokens.
- **Webhook SSRF (Server-Side Request Forgery) Defense Engine:**
  - Automatic URL and IP validation blocking RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.1`, `::1`), and cloud metadata (`169.254.169.254`, `metadata.google.internal`).
- **Distributed Upstash Redis Rate Limiting:**
  - HTTP REST edge rate limiting pipeline across multi-region edge nodes with zero-downtime sliding-window in-memory fallback.
- **Resilient Self-Hosted `pdf.js` Engine:**
  - Local vendor script loading `/vendor/pdfjs/pdf.min.js` with automatic CDN failover.
- **300+ DPI Retina Crisp Vector Rendering:**
  - Minimum 2x canvas super-sampling with `imageSmoothingQuality = "high"` and smart container auto-fitting.
- **Pitch Presentation Slideshow Mode:**
  - Fullscreen presenter view for PDFs, images, markdown, code, and SVGs with interactive red laser pointer, keyboard navigation (`Space`, `Arrows`, `L`), and dynamic watermark synchronization.
- **Admin Environment & Diagnostics Center:**
  - Live Neon Postgres ping latency meter (ms), B2 storage status, AES-GCM-256 WebCrypto tests, and 13+ masked environment keys.
- **In-App Dark-Glass `<ConfirmModal />` Component:**
  - Modern dark-blur confirmation dialogs replacing all native browser `window.confirm()` popups.
- **Multi-Click / Double-Submission Lock:**
  - Button state locking preventing duplicate dataroom, document, and link creation.
- **Auto-Database Migrator:**
  - Self-healing database schema table and column initialization (`src/db/auto-migrate.ts`).
- **Account & Security Settings (`/dashboard/settings`):**
  - Profile name and email editing, password changes with strength meter, invite generator, and "Sign Out All Devices" global session invalidation.

### Changed
- Upgraded PDF.js rendering pipeline to eliminate duplicate canvas ref conflicts.
- Hardened Content Security Policy (`connect-src`, `worker-src`) to allow local blob workers and distributed rate limiters.
- Fixed favicon 404 and eliminated React SSR hydration mismatch (#418).

