# Privacy policy (source of truth for /privacy)

## 1. NEVER COLLECTED
Document plaintext · DocKeys · password plaintext · third-party trackers. Retention: N/A.

## 2. CIPHERTEXT
Encrypted document bytes, encrypted thumbnails, IVs and wrap parameters.
Retention: until owner deletes (crypto-shred) or `DOC_TTL_SWEEP_DAYS` purge.

## 3. METADATA-LITE
Session id, page number + dwell seconds, UA class, coarse country (provider header),
salted daily IP hash (raw-IP storage OFF by default), viewer e-mail only when the owner
enabled the e-mail gate. Retention: `PAGE_EVENTS_RETENTION_DAYS` (180d), audit 30d rolling.

## 4. PLATFORM LOGS
Hosting/CDN and object-store provider logs under their own policies (Cloudflare, Vercel,
Netlify, Deno, Render, Backblaze). We do not copy these into our database.

## Rights
Owners: `/api/user/export` and Settings → Delete Account (purges objects + rows).
Viewers: contact the owner who shared the link. No ads, no data sale, no 3rd-party analytics.

## Honest limitations
Watermark/anti-download are deterrents, not DRM. Fragment holders can decrypt. Geo gates are coarse.
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
