#!/bin/sh
set -e

# BlindShare Self-Hosted Production Entrypoint with Litestream Auto-Recovery
DB_PATH="/data/blindshare.db"
CONFIG_FILE="/etc/litestream.yml"

mkdir -p /data

# 1. Restore database from Backblaze B2 / S3 if replica exists and local DB is missing
if [ -n "$B2_BUCKET_NAME" ] && [ -n "$B2_KEY_ID" ] && [ -n "$B2_APPLICATION_KEY" ]; then
  echo "==> [Litestream] Checking for existing database replica in Backblaze B2 ($B2_BUCKET_NAME)..."
  litestream restore -if-replica-exists -config "$CONFIG_FILE" "$DB_PATH" || true
  echo "==> [Litestream] Database verification complete."

  # 2. Launch Litestream replication daemon alongside Next.js standalone process
  echo "==> [BlindShare] Starting Next.js app with real-time WAL streaming to B2..."
  exec litestream replicate -config "$CONFIG_FILE" -exec "node server.js"
else
  echo "==> [BlindShare] B2 credentials not provided for Litestream. Running in local SQLite standalone mode."
  exec node server.js
fi
