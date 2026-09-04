# Runbook

## Env filling guide
Copy `.env.example` → `.env`. Generate secrets:
```bash
openssl rand -hex 32              # SESSION_SECRET
openssl rand -hex 32              # DB_ENCRYPTION_KEY (AES-256 DB Vault)
openssl rand -hex 16              # HEALTH_TOKEN
npx web-push generate-vapid-keys  # VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
uuidgen                           # ADMIN_BOOTSTRAP_INVITE
```
B2: create a **new PRIVATE bucket**, then a **bucket-scoped Application Key**
(the Master Key is not S3-compatible — never use it).

## Deploy (≤5 commands per target)
**ALT-A Vercel + Neon + B2**
```bash
npm i -g vercel
vercel link
vercel env pull .env.local
npx drizzle-kit push
vercel deploy --prod
```
**PRIMARY Cloudflare (Pages + Workers + D1 + R2)**
```bash
npx wrangler d1 create blindshare-db
npx wrangler kv namespace create blindshare-kv
npx wrangler r2 bucket create blindshare-cipher
npx wrangler pages deploy .next --project-name blindshare
npx wrangler deploy
**ALT-C Docker + SQLite + Litestream + B2 (Zero-Cost Self-Hosted)**
```bash
# 1. Fill B2 and SESSION_SECRET in .env
# 2. Build and start with auto-restoring Litestream streaming WAL to B2
docker compose -f deploy/docker-compose.yml up -d --build
```

## Smoke tests after every deploy
1. `curl -s $APP/api/health | jq` → `status: healthy`, db latency < 500 ms.
2. Presign round-trip: upload a 1 KB test doc, open its link, delete it.
3. Analytics flush: open a link, wait 15 s, confirm dwell rows in the analytics page.

## Fragment-key proof test (request-dump)
```bash
# Server sees no fragment:
curl -sv "https://app/v/<slug>#k=THISNEVERTRAVELS" 2>&1 | grep -i "^> GET"
# → "> GET /v/<slug> HTTP/2"  — the #k= part is absent by design.
```
Repeat in DevTools → Network and check `Referer` headers on `/api/v/<slug>/bytes`: no fragment.

## Backup & restore drill
- **Backup:** nightly `pg_dump` (or `wrangler d1 export`) + object-store sync of the ciphertext prefix to a second B2 bucket.
- **Restore:** provision empty DB → `npx drizzle-kit push` → restore dump → re-sync objects → run `/api/health` and open one known link.
- Drill quarterly; record the result in CHANGELOG.md.

## Monitoring
Point Gatus/Upptime at `/api/health` (60 s interval). Alert on non-200 or db latency > 2 s.
Watch the admin storage gauge against `BUDGET_WARN_PERCENT`.

## Rollback
Redeploy the previous release tag; migrations are additive — verify with `npx drizzle-kit push --dry-run` style review before applying destructive changes.

## Local run & live-link CLI (dev loop)
```bash
./scripts/dev.sh                 # :3000 dev
./scripts/dev.sh prod            # build + start
```

## Database Factory Reset (Neon PostgreSQL)
To completely wipe all records and restore to fresh Genesis state:
1. Open Neon Dashboard ➔ **SQL Editor**.
2. Run `scripts/reset-db.sql`.
3. Re-open app URL and register fresh Super Admin account.

```bash
./scripts/dev.sh check           # typegen + tsc + build + selfcheck
node scripts/make-demo-pdf.mjs /tmp/demo.pdf
APP_URL=http://localhost:3000 node scripts/quicklink.mjs /tmp/demo.pdf --name Smoke
```
Then run the smoke list against the printed link: `/api/health` → 200, open the link
(ciphertext downloads, browser decrypts), check the link's analytics page shows dwell rows.
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
