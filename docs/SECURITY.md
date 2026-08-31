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

## Advanced hardening (added post-launch)
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
