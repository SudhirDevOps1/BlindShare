# Changelog
All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).

## [1.4.0] - 2026-09-03

### 🚀 Added & Enhanced
- **Glassmorphic Cyber UI & Micro-Animations (`src/app/dashboard/page.tsx`, `src/components/upload/doc-uploader.tsx`):**
  - Upgraded dashboard stat cards with glassmorphic depth (`backdrop-blur-xl`, `bg-slate-900/50`, `border-slate-800/80`).
  - Interactive hover elevation (`hover:-translate-y-1`), animated corner glows (amber, blue, emerald, purple), and micro-scaling icon containers (`group-hover:scale-110`).
  - Pulsing live status dot, 90-degree rotating Plus upload trigger, cyber drag-drop hover ring (`ring-4 ring-amber-500/20`), and bouncing cloud upload animation.
- **Full Responsive Experience (Mobile, Tablet & PC First):**
  - Adaptive responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) for all screen form factors.
  - Mobile thumb-tapping optimization with full-width action buttons (`w-full sm:w-auto`) and native slide-in navigation drawer.
  - Minimum 44x44px touch targets compliant with WCAG accessibility standards.
- **Enterprise SEO & Crawler Privacy Shield (`src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/v/[slug]/layout.tsx`):**
  - Dynamic XML sitemap generator with priority routing for public landing and auth pages (`/`, `/login`, `/signup`).
  - Smart robots engine blocking bots and AI crawlers from internal APIs, admin panels, and private viewer routes (`/v/`).
  - Dedicated `noindex, nofollow, noimageindex` viewer layout guaranteeing confidential investor pitch decks are never indexed.
  - High-intent search keywords and rich Schema.org `SoftwareApplication` JSON-LD structured data.
- **Repository Documentation Inter-Linking (`README.md`, `docs/*.md`, `visual.md`):**
  - Cross-linked complete knowledge base across all 18 tracked documentation guides with unified navigation matrices.
- **Competitive Flaws & High-Smoothness Research Roadmap (`next-patch.md`):**
  - Strict competitive analysis benchmarking DocSend, Papermark, and Digify user complaints and failure points.
  - v1.4.0 execution plan for GPU-accelerated touch swiping, 0ms slide pre-caching, and reading comfort modes.
- **Umami-Style Real-Time Live Investor Radar (`src/app/api/investors/live/route.ts`):**
  - Real-time active reader monitor tracking visitors engaged on pitch decks within the last 5 minutes.
  - Aggregates live viewer counts, active links, slide progression, and coarse geolocation without storing raw IP addresses or third-party cookies.
- **2026 GDPR Article 7 Bilingual Cookie Consent Banner (`src/components/compliance/cookie-consent-banner.tsx`):**
  - Zero-dark-pattern, non-coercive banner with 100% synchronized English (`en`) and Hindi (`hi`) parity.
  - Telemetry and non-essential analytics (`PrismAnalytics`) strictly gated until affirmative opt-in.
  - Granular controls with preferences saved in `localStorage` under `blindshare_cookie_consent_v1`.
- **Sub-processor Registry & Enterprise DPA Transparency (`docs/PRIVACY-POLICY.md`, `/privacy#subprocessors`):**
  - GDPR Article 28 vendor disclosures covering Neon, Backblaze B2, Cloudflare, Vercel, Upstash, and Resend.
  - Enforces zero-knowledge boundary: no sub-processor ever receives decryption keys or plaintext documents.

- **Tux Robot Cyber-Pet & Tight Circular Flashlight Spotlight (`src/components/cursor/crypto-cursor.tsx`):**
  - GPU-accelerated companion mascot with flapping wings, eye blinking, dynamic amber/emerald pupils, and trailing companion distance physics.
  - Adaptive follow physics: pet respects 80px personal space and activates high-speed chase sprint only when cursor pulls away.
  - 125px circular flashlight mask confining ciphertext illumination strictly inside a tight radius around the cursor; workspace remains 100% dark and undisturbed elsewhere.
  - Automatic graceful degradation on mobile touchscreens and viewports `< 768px` for zero-obstruction mobile responsiveness.
- **Dedicated Settings Management for Cyber Pet:**
  - Placed cyber pet toggle exclusively inside the Settings page (`/dashboard/settings`), removing clutter from dashboard sidebar.
- **Single-Page Unrestricted Scroll & Dual Fit Mode (`src/components/pdf-viewer/pdf-renderer.tsx`):**
  - Smooth continuous scrolling from Header to Footer and Footer to Header for portrait documents, Hindi books (e.g. "गुनाहों का देवता"), and multi-page decks.
  - Zero-negative-scroll flexbox architecture (`justify-start` + `my-auto`) eliminating top/bottom vertical cutoffs.
  - Dedicated **Fit Width (चौड़ाई अनुसार फिट)** and **Fit Page (पूरा पृष्ठ फिट)** modes with 100% bilingual synchronization in `dictionary.ts`.
  - Mousewheel vertical scroll isolation: scrolling inside a page never prematurely jumps to adjacent slides.
  - Automatic `scrollTop = 0` reset on slide change.
  - 1-click zoom reset to 100% with decimal-rounded stepping.
- **In-Doc Q&A Reader Isolation & Founder Email Notifications (`src/app/api/questions`, `src/app/api/v/[slug]/questions`):**
  - Interactive slide question pins with strict reader privacy isolation (readers only see their own questions).
  - Transactional email dispatch alerting document founders of new inquiries with in-app reply synchronization.
- **Forensic PDF Download Watermark Burn-in (`pdf-lib`):**
  - Stamped indelible diagonal security matrix watermarks directly into exported PDF bytes when downloads are permitted.
- **Signed NDA Execution Certificate Generation (`src/app/api/v/[slug]/nda-cert`):**
  - Standalone cryptographic PDF certificate verifying NDA execution timestamps, signer identity, and audit hash.
- **Database-Backed Developer Social Suite & Custom Branding (`src/components/landing/footer.tsx`, `src/app/admin/settings/page.tsx`, `src/app/api/public-settings/route.ts`):**
  - Configurable developer name and multi-channel social media suite (GitHub, LinkedIn, Twitter/X, Instagram, Facebook, Discord, YouTube, Telegram) in the landing footer.
  - Admin settings panel integration allowing founders to toggle active links and customize profile URLs stored in PostgreSQL (`app_settings`), with safe fallback to `.env` variables (`NEXT_PUBLIC_DEVELOPER_NAME`, `NEXT_PUBLIC_SOCIAL_*`).
  - Authentic official vector brand SVG icons with accessible tooltips, secure external links (`rel="noopener noreferrer"`), and tamper-proof protection for the core repository.
- **Extended Office & Document Format Support (`src/components/viewer/media-renderer.tsx`):**
  - Expanded zero-knowledge viewing and client-side rendering for legacy and modern formats: `.ppt`, `.pptx`, `.xls`, `.xlsx`, `.odt`, `.ods`, `.csv`, `.tsv`, `.txt`, `.md`, `.json`, `.svg`, and raster graphics.
- **Self-Healing Document Page Count & PDF Truncation Fix (`src/app/api/docs/[id]/route.ts`, `src/components/upload/doc-uploader.tsx`):**
  - Self-heals document `pageCount` in the database during upload and viewing, preventing slide truncation and zero-page indexing bugs.
- **Viewer Ergonomics & Scroll Polish (`src/components/pdf-viewer/pdf-renderer.tsx`):**
  - Fullscreen single-page scroll cutoff and wheel flip fixes with smooth continuous vertical scrolling.
- **UI Streamlining for Presentation Controls & Trust Bar (`src/components/landing/architecture-showcase.tsx`, `src/components/landing/trust-bar.tsx`):**
  - Streamlined bulky presentation controls and ticker pause button using `sr-only` to keep the UI clean, modern, and uncluttered while preserving 100% background auto-play, hover-pause, and accessibility.
- **React Hydration Error #418 & Ad-Blocker Resilience (`src/app/layout.tsx`):**
  - Eliminated root `<html>` hydration mismatch (React error #418) by removing redundant manual `<head>` in App Router and using Next.js `Metadata` API.
  - Migrated telemetry to Next.js `Script` (`strategy="afterInteractive"`) with robust error handling for silent degradation against browser ad-blockers (`ERR_BLOCKED_BY_CLIENT`).
  - Added `suppressHydrationWarning` to `<body>` to prevent third-party extension injection warnings.

### 🛡️ Security Hardening
- **Tiered Edge Abuse Limiting & Tab Visibility Guard (`src/proxy.ts`, `src/app/v/[slug]/page.tsx`):**
  - Split edge rate limits into separate buckets: `300 req/hr` for initial link views vs `2,400 req/hr per IP+slug` for active reading telemetry.
  - Page Visibility API (`document.hidden`) pausing background polling loops during tab switching.
  - Revocation watchdog resilience: HTTP 429 throttles safely ignored to prevent false "Link Has Expired" states.
- **AES-256-GCM Database Field Vault (`src/lib/crypto/db-vault.ts`):**
  - Server-side AES-256-GCM encryption of sensitive database fields at rest using PBKDF2-SHA256 derived keys (`DB_ENCRYPTION_KEY`).
  - Deterministic encryption for auth lookups (`users.email`, `viewSessions.viewerEmail`, `auditLog.detailsJson`); randomized encryption for TOTP secrets, NDA signatures, and in-doc Q&A.
  - Retroactive auto-migration scanning existing Neon DB audit rows and securely upgrading legacy emails to `enc:det:...`.
  - Full authenticated AES-256-GCM encryption wired into OTP verification routes.
- **Unregistered User Warning Defense (Auth Routes):**
  - Instant 404 alert warnings for unregistered email submissions on Forgot Password, Magic Link, and OTP routes, eliminating silent failures.
- **Distributed Anti-DoS Rate Limiter on System Probes (`src/app/api/health/route.ts`):**
  - Sliding-window rate limiter protecting `/api/health` probes (60 req/min per IP) to prevent monitoring pipeline starvation.
- **34 Automated Enterprise Security Tests (`npm test`):**
  - Expanded test suite to 34 comprehensive tests covering DB Vault encryption roundtrip, auth route wiring, GDPR Cookie Banner, Sub-processor Registry, ALTCHA PoW, SSRF defense, timing-safe HMACs, and DuckDB analytics.
- **Automated SIEM CEF 1.4.0 Synchronization:** Upgraded Common Event Format string generation and verified SIEM test suites.
- **Crawler Document Isolation:** Strict prevention of search engine spidering across private link slugs.

## [1.3.0] - 2026-09-02

### 🚀 Added & Enhanced
- **Permanent Indelible PDF Download Watermarking (`src/components/pdf-viewer/pdf-renderer.tsx`):**
  - Integrated client-side `pdf-lib` to burn and stamp diagonal matrix watermarks directly into every single page stream when downloading watermarked PDFs.
  - Watermark includes recipient identity/email, timestamp, document slug, and custom watermark text with opacity control.
- **Dedicated Dashboard Q&A Inbox (`src/app/dashboard/questions/page.tsx`, `src/app/api/questions/route.ts`):**
  - Centralized founder control center to search, filter (All, Pending, Resolved), and manage reader questions from slides.
  - Inline composer to publish official **Founder Replies** with instant real-time sync back to reader viewers.
- **Real-Time 3-Second Live Q&A Synchronizer:**
  - Real-time bidirectional watchdog updating reader question pin popovers and status badges (`✓ Founder Reply`) without requiring page reloads.
- **Automatic Master Vault Unlock on Login (Bitwarden / Proton Model):**
  - Automatic client-side PBKDF2 master key derivation and background document/link key unwrapping on `/login` and 2FA verification.
- **Tab-Level Decrypted Session Cache:**
  - Fast 0.01s (10ms) reloads on browser page refresh (`F5`) utilizing ephemeral tab-level `sessionStorage` buffers that automatically wipe on tab closure.
- **Interactive Selectable Text Layer & Clickable Hyperlinks:**
  - Full text selection, clipboard extraction (**Copy Text** button), `Ctrl+F` search, and interactive clickable `<a>` hyperlinks over canvas slides.
- **ALTCHA Proof-of-Work Bot & DDoS Defense (`src/lib/security/altcha.ts`, `src/components/security/altcha-box.tsx`):**
  - 100% self-hosted Proof-of-Work (PoW) CAPTCHA alternative with zero cookies, zero third-party tracking, and zero external network dependencies.
  - Generates HMAC-SHA256 signed challenges with constant-time verification (`crypto.timingSafeEqual`) and 10-minute in-memory replay defense.
  - Inbuilt protection across Public Share Links, Investor Email Gates, Founder Q&A forms, and Admin Sign-In (`/login`).
- **Dynamic OpenGraph & Social Preview Engine (`src/app/opengraph-image.tsx`, `src/app/twitter-image.tsx`, `public/brand/og-image.png`):**
  - High-resolution 1200x630 cards with gold lock branding, glowing badges, and feature pills for rich previews on WhatsApp, Telegram, Twitter/X, and LinkedIn.
- **Horizontal Scrollable Navigation Bar (`src/components/brand-header.tsx`, `src/app/globals.css`):**
  - Added smooth horizontal scrolling (`no-scrollbar`) for center navigation tabs to prevent UI squishing on smaller laptop screens.
- **24 Automated Enterprise Security Tests (`npm test`):**
  - 24 comprehensive test suites covering Zero-Knowledge E2EE, ALTCHA PoW, SSRF defense, HMAC tokens, DuckDB analytics, and AI lead scoring.

### 🛡️ Security Hardening
- **CodeQL Alert #86 Fixed:** Replaced substring URL matching with strict RFC `URL` hostname and search param verification in `src/db/index.ts` and `src/lib/notifications/webhook-notifier.ts`.
- **DDoS / Spam Protection on Public In-Doc Questions:** Added distributed rate limiting (`15 req/min per IP`) on `/api/v/[slug]/questions`.
- **Stored XSS Sanitization:** Comprehensive HTML entity sanitization on reader inquiries and founder replies.

## [1.2.0] - 2026-09-01
  - Client-side WebCrypto `PBKDF2-SHA256` (100,000 iterations) with 16-byte user-specific salt deriving an `OwnerMasterKey` in browser RAM.
  - Transparent AES-GCM-256 wrapping of individual 32-byte `DocKey`s before saving metadata to `/api/docs`.
  - Seamless cross-device and cache-immune document key synchronization without server knowledge.
  - Interactive Zero-Knowledge Key Recovery dialog in `/dashboard/links` supporting single-click account password or key string unlock.
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
- **Dual SQLite Schema & Litestream Zero-Cost Self-Hosting (`src/db/sqlite-schema.ts`, `deploy/`):**
  - Full 1:1 SQLite schema mirroring PostgreSQL for zero-cost self-hosted Docker / VPS instances.
  - Added `deploy/litestream.yml`, `deploy/entrypoint.sh`, and `deploy/Dockerfile` for sub-second WAL replication to Backblaze B2 ($0 DB hosting).
- **DuckDB In-Process Columnar Analytics Engine (`src/lib/analytics/duckdb-engine.ts`):**
  - Sub-5ms aggregations for high-frequency reader dwell percentiles ($p50, p90, p99$), slide completion heatmaps, and NDJSON/CSV streaming exports.
- **Enterprise Automated Security & Cryptographic E2E Test Suite (`npm test`):**
  - 18+ automated security tests verifying Zero-Knowledge cryptographic integrity, AES-GCM-256 + GZIP compression, SSRF private IP blocks, timing-safe HMAC token verification, sessionVersion invalidation, and XSS sanitization.
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
- **Admin Bootstrap Privilege Escalation Mitigation:** Enforced strict exact matching for master bootstrap invite codes in `auth/register/route.ts` preventing single-character/suffix privilege escalation.
- **Path Traversal Defense:** Hardened local storage key resolution with `path.basename` and `path.resolve` boundary checks in `local-adapter.ts`.
- **Atomic Concurrency (TOCTOU) Protection:** Implemented atomic SQL conditions for Burn-After-Reading and Max-Views access in `v/[slug]/verify/route.ts` to prevent race condition multi-reads.
- **Session Desync on Password Update:** Seamlessly re-issued updated HMAC session tokens on password changes in `user/profile/route.ts` while terminating all other active devices.
- **Orphan Sweep Version Blob Preservation:** Included `docVersions.storageKey` in orphan sweep valid key sets (`admin/sweeps/route.ts`) to prevent accidental purging of historical document versions.
- **Sole Super Admin Guard:** Prevented sole remaining Super Admin accounts from accidental self-deletion in `user/delete/route.ts`.
- **Live Room Access Control:** Added strict owner authentication checks to `/api/v/[slug]/room` ensuring only document creators can broadcast slides.
- **DNS Rebinding & SSRF Mitigation:** Enforced private IP / cloud metadata blocklists prior to DNS MX queries in `email-validator.ts`.
- **Stored XSS Prevention:** Applied HTML entity character escaping (`<` -> `&lt;`, `>` -> `&gt;`) on all reader question submissions and names.
- **React Ref Render Body Fix:** Transitioned `audioRef.current` access in `VoiceNotePlayer` to metadata-driven state updates to ensure strict React concurrency compliance.
- **CodeQL Advanced SAST Cleanliness (85/85 Resolved · 0 Open Alerts):**
  - **Insecure Randomness (CSPRNG):** Replaced all `Math.random()` occurrences in telemetry and layout with `crypto.getRandomValues()` and `crypto.randomUUID()`.
  - **Bad HTML Filtering Regexp & SVG Sanitization:** Replaced regex-based SVG tag stripping with native `DOMParser()` and URL protocol allowlist (`https?://`, `mailto:`, `#`) in `media-renderer.tsx`.
  - **Insecure Temporary File & Tainted File Write:** Replaced hardcoded `/tmp` storage with private mode `0o700` directories, mapped storage keys to SHA-256 digests (`${sha256(key)}.blob`), and switched to low-level file descriptor access with `0o600` mode.
  - **Local Upload Endpoint Gating:** Added `requireAuth()` and strict alphanumeric key validation on `/api/storage/local-upload`.
- **GitHub Open-Source Branding & License:**
  - Added GitHub Repository links and interactive Star ⭐ buttons across BrandHeader (desktop and mobile), BrandFooter, and HomePage hero section.
  - Added MIT License open-source badges and links in navigation footer and landing page.


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
