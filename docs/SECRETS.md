# Secrets inventory (names + rotation only — never values)

| Name | Where | Rotation |
|---|---|---|
| `SESSION_SECRET` | platform secret store | 90 days (rotating logs everyone out) |
| `B2_KEY_ID` / `B2_APPLICATION_KEY` | platform secret store | 90 days or immediately on incident |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Cloudflare | 90 days |
| `CF_API_TOKEN` | GitHub Actions secret | 180 days |
| `DATABASE_URL` / `TURSO_AUTH_TOKEN` / `SUPABASE_SERVICE_ROLE_KEY` | platform secret store | 180 days |
| `VAPID_PRIVATE_KEY` | platform secret store | on compromise (invalidates subscriptions) |
| `ADMIN_BOOTSTRAP_INVITE` | platform secret store | after first admin is created |
| `HEALTH_TOKEN` | platform secret store | 180 days |
| `RESEND_API_KEY`, `ABLY_API_KEY`, `BOT_WEBHOOK_URL` | optional | on compromise |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | optional | on compromise (edge rate limiting) |
| `ALTCHA_HMAC_KEY` | optional secret store | 180 days (falls back to `SESSION_SECRET`) |
| Android keystore (Phase-4) | GitHub Secrets, base64 | never in repo |

Rules: `.env` is never committed · secrets never appear in logs, chat or the database ·
presigned-URL signatures are masked in logs.

---

## 🔐 Zero-Knowledge Invariant & Key Separation

### Why Document Decryption Keys are NEVER in `.env`:
1. **Client-Side Zero-Knowledge (`Browser Memory`)**:
   - The `OwnerMasterKey` is derived client-side from the user's password using `PBKDF2-SHA256` (100,000 rounds) and a unique salt.
   - Individual document keys (`DocKey`) are generated using CSPRNG in the browser, encrypted with `OwnerMasterKey` (AES-GCM-256), and stored as ciphertext in the database.
   - Decryption occurs exclusively in the recipient/owner browser.
2. **Server Environment Secrets (`.env`)**:
   - Server secrets (`SESSION_SECRET`, `DATABASE_URL`, `B2_APPLICATION_KEY`, etc.) protect backend operations, database connections, and session integrity.
   - The server is a **100% Blind Courier** that stores ciphertext blobs and transmits them upon authorized requests, but mathematically cannot decrypt document bytes.
3. **Defense-in-Depth Synergy**:
   - Compromise of the server or `.env` does NOT compromise plaintext documents because the server lacks document decryption keys.
   - Compromise of client local cache does NOT compromise document keys because they can be re-derived on the fly by entering the account password.
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
