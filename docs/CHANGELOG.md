# Changelog
All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).

## [Unreleased]
### Planned
- Phase-2: live-deck sync (DO/WS rooms), request-access flow, geo/time gates, kill-switch, Q&A ping
- Phase-3: voice notes per page, lead scoring, cover-page builder, webhooks
- Phase-4: Capacitor Android app (share-sheet upload, biometric lock, FLAG_SECURE)

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

