# Threat model

| Threat | Mitigation | Residual risk (honest) |
|---|---|---|
| Snoopy host / hosting provider reads docs | E2EE: server stores ciphertext only; keys never sent | Host can see ciphertext size + access timing |
| Bucket misconfiguration | Bucket always PRIVATE; presigned URLs only (PUT ≤10 min, GET ≤5 min); signatures masked in logs | Presigned URL leak within its short TTL |
| Link forwarded beyond intent | Password gate, e-mail gate, domain allowlist, expiry, max-views, revoke = crypto-shred | Anyone with the full URL incl. `#k=` can decrypt |
| Credential stuffing | bcrypt hashes, invite-only registration, per-IP rate limits, gate lockout | Weak owner passwords |
| Share-code enumeration | 128-bit unguessable slugs, identical 404/410 shapes | — |
| Fake analytics spam | Session must be created via `/verify`; per-link 120 views/hr limiter | Determined scripted viewer |
| Owner-account brute-force | Per-account+IP lockout (LOGIN_LOCKOUT_TRIES/MINUTES), audit-logged failures | Distributed credential stuffing across many IPs |
| Malformed/hostile request bodies | Every route validated against a strict Zod schema before DB access | Novel schema-bypass bugs |
| Stolen session cookie replay after logout | Session-version check invalidates all tokens on "log out all devices" | Cookie theft before revocation |
| XSS via uploaded content | SVG sanitised (scripts/handlers/`javascript:` stripped), Markdown escape-first, strict CSP | Novel renderer bugs |
| Screenshotting / re-photography | Watermark overlay deterrent; Phase-4 Android FLAG_SECURE | **Not preventable** — no DRM claims |
| Geo/time gates bypass | CF country header, view windows | Coarse; VPN bypass possible |
| Rate-limit evasion on multi-instance edge | Distributed Upstash Redis REST edge limiter with in-memory fallback | Redis unconfigured reverts to per-instance |
| Webhook Server-Side Request Forgery (SSRF) | Outbound URL/IP filter actively blocks RFC-1918 private subnets, loopback, and cloud metadata (`169.254.169.254`) | Attacker probes external public domains |
| Account credential stuffing / password theft | Two-Factor Authentication (2FA / TOTP RFC 6238) with Google Authenticator + 8 recovery codes | User losing both authenticator device and backup codes |
| CDN tampering / Supply-chain outage | Self-hosted local `pdf.js` vendor bundle with automatic CDN fallback | Browser caching stale scripts |
