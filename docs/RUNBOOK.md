# Runbook

## Env filling guide
Copy `.env.example` → `.env`. Generate secrets:
```bash
openssl rand -hex 32              # SESSION_SECRET
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
./scripts/dev.sh check           # typegen + tsc + build + selfcheck
node scripts/make-demo-pdf.mjs /tmp/demo.pdf
APP_URL=http://localhost:3000 node scripts/quicklink.mjs /tmp/demo.pdf --name Smoke
```
Then run the smoke list against the printed link: `/api/health` → 200, open the link
(ciphertext downloads, browser decrypts), check the link's analytics page shows dwell rows.
