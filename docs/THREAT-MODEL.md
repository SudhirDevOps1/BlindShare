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
| Database dump theft / SQL injection read leak | AES-256-GCM Database Field Vault (`src/lib/crypto/db-vault.ts`) encrypts all PII (user/viewer emails, TOTP secrets, NDA signatures, slide Q&A) | Attacker observes row counts, timestamps, and relational links, but cannot read plaintext PII |
| Health check probe exhaustion / Monitoring DoS | Distributed sliding-window rate limiter on `/api/health` (60 req/min per IP) | Volumetric L7 DDoS saturates edge ingress bandwidth before handler executes |
| Unconsented tracking / Regulatory non-compliance | 2026 GDPR Article 7 Bilingual Cookie Banner strictly gates `PrismAnalytics` execution until explicit affirmative opt-in | Viewer resetting browser storage triggers fresh consent banner on return |
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
