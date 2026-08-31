#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════
# BLINDSHARE — local compile + run (one command, nothing gets deleted)
#   ./scripts/dev.sh              → dev server  (hot reload)  on :3000
#   ./scripts/dev.sh prod         → compile + run production build on :3000
#   ./scripts/dev.sh check        → typegen + tsc + build + zero-knowledge self-check
#   PORT=4000 ./scripts/dev.sh    → run on another port
# ══════════════════════════════════════════════════════════════════════════
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"
MODE="${1:-dev}"

say() { printf "\n\033[1;33m▸ %s\033[0m\n" "$*"; }

# 1. .env (never committed) — seed from the mandated template if missing
if [ ! -f .env ]; then
  say "No .env found — seeding from .env.example"
  cp .env.example .env
  # portable in-place tweaks (BSD + GNU sed safe) — dev defaults, real creds come later
  node -e '
    const fs=require("fs");const p=".env";let s=fs.readFileSync(p,"utf8");
    s=s.replace(/NODE_ENV="production"/,"NODE_ENV=\"development\"");
    if(/DATABASE_URL="postgres:\/\/<user>/.test(s))
      s=s.replace(/DATABASE_URL=.*/,"DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db");
    fs.writeFileSync(p,s);'
  say "Seeded dev .env — edit for real cloud creds (B2/R2, Neon/D1) when you deploy"
fi

if [ ! -f .env ] || ! grep -q "DATABASE_URL=postgresql://postgres" .env 2>/dev/null; then
  say "⚠  DATABASE_URL should point at a reachable Postgres (e.g. postgresql://postgres:postgres@127.0.0.1:5432/app_db)"
fi

# 2. deps
if [ ! -d node_modules ]; then
  say "Installing dependencies"
  npm install
fi

# 3. schema
say "Applying Drizzle schema (push)"
npx drizzle-kit push --force || say "drizzle-kit push skipped/failed — check DATABASE_URL"

if [ "$MODE" = "check" ]; then
  say "Typegen"
  npx next typegen
  say "TypeScript"
  npm exec tsc -- --noEmit --pretty false
  say "Production build"
  npm run build
  say "Zero-knowledge self-check"
  node scripts/selfcheck-e2ee.mjs
  say "ALL CHECKS GREEN ✅"
  exit 0
fi

if [ "$MODE" = "prod" ]; then
  say "Production build"
  npm run build
  say "Zero-knowledge self-check"
  node scripts/selfcheck-e2ee.mjs
  say "Starting production server → http://localhost:${PORT}"
  PORT="$PORT" npm run start
else
  say "Starting dev server → http://localhost:${PORT}"
  npx next dev -p "$PORT"
fi
