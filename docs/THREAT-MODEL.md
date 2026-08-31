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
| Honeypot / decoy docs (Phase-3, opt-in) | Owner-configured, audit-logged, disclosed in privacy docs | Ethics: must be disclosed, never used to entrap |
| Rate-limit evasion on multi-instance edge | In-memory limiter is first line; durable limiter = KV/DO on CF target | Per-instance counters only |
