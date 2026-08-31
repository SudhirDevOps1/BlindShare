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

## [1.1.0] - 2026-08-29
### Changed
- **Rebranded** from SherPapermark to **BlindShare** (env-only rebrand tokens updated;
  zero functional changes — `PUBLIC_APP_NAME` still overrides everything).
- First-run experience: `/api/auth/bootstrap` detects an "unclaimed" deployment so the
  first real sign-up never needs an invite code; the seeded placeholder account no longer
  counts as an owner.
- Invite-code matching is now trim + case-insensitive with typo tolerance, and every
  registration failure returns a precise, actionable reason instead of one generic message.
### Added
- Strict Zod validation on every API route request body.
- Centralized 128-bit id/slug generation (`src/lib/ids.ts`).
- Password policy (length + complexity) enforced client- and server-side with a live
  strength meter.
- Owner-login brute-force lockout, independent of the existing link password-gate lockout.
- Session versioning + "Log out of all devices".
- `__Host-` prefixed session cookie in production.
- Structured, PII-redacting logger; fail-fast environment validation.
- No-store cache headers on all authenticated routes; extra security headers
  (Cross-Origin-Opener-Policy, X-Permitted-Cross-Domain-Policies, X-DNS-Prefetch-Control).
- `/.well-known/security.txt`, `/security` policy page, `/api/version`, `not-found.tsx`,
  `error.tsx`.
- Local dev runner (`scripts/dev.sh`) and terminal live-link generator
  (`scripts/quicklink.mjs`, `scripts/make-demo-pdf.mjs`).
