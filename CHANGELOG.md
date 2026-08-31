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
- **Auto-Database Migrator:** Automatic first-run PostgreSQL schema table initialization (`src/db/auto-migrate.ts`) ensuring all 12 tables exist without manual SQL execution.
- **Account & Security Settings (`/dashboard/settings`):**
  - Live Profile / Display Name and Login Email (Username) modification.
  - Password Change with complexity strength meter and automatic cross-device session termination.
  - Granular Access Delegation: Custom Invite Code Generator with `Owner (Member)`, `Admin`, and `Super Admin` roles.
  - Single-click "Sign Out All Devices" global session invalidation.
- **FormForge Feedback Integration (`/contact`):** Built-in contact form with honeypot bot trap, FormData/JSON failover, and localStorage persistence.
- **PrismAnalytics Engine:** Zero-cookie client tracking via pure `navigator.sendBeacon` and relaxed CSP header whitelist.
- **Database Factory Reset Suite (`scripts/reset-db.sql`):** Safe 1-click Neon database purge and rebuild script.
- **Strict Zod Body Validation:** Centralized request schemas across every REST API route.

### Changed
- Rebranded to **BlindShare** with zero plain-text file storage.
- Removed seeded demo credentials banner from `/login` for airtight production security.
- Hardened Content Security Policy (`connect-src`) to allow authorized Cloudflare Workers and S3 endpoints.

