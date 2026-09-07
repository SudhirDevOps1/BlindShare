#!/usr/bin/env node
/**
 * ══════════════════════════════════════════════════════════════════════════
 * BLINDSHARE — backfill-field-vault.mjs (Zero-Knowledge at Rest DB Migration)
 * ══════════════════════════════════════════════════════════════════════════
 * Encrypts existing unencrypted database rows at rest using AES-256-GCM
 * with the platform master key:
 *   - documents: title, original_filename, storage_key
 *   - doc_versions: storage_key
 *   - links: name, watermark_text, nda_text
 *   - datarooms: name, description
 *
 * Idempotent: Already encrypted rows (prefixed with enc:v1: or enc:det:)
 * are strictly preserved and skipped.
 *
 * Usage:
 *   node scripts/backfill-field-vault.mjs
 *   node scripts/backfill-field-vault.mjs --dry-run
 */
import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
const { Pool } = pg;

// 1. Load Environment Variables (.env.local / .env)
for (const envFile of [".env.local", ".env"]) {
  const p = resolve(process.cwd(), envFile);
  if (existsSync(p)) {
    const lines = readFileSync(p, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const isDryRun = process.argv.includes("--dry-run");

function getMasterKey() {
  let secret =
    process.env.DB_ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: DB_ENCRYPTION_KEY, AUTH_SECRET, or SESSION_SECRET must be configured in production."
      );
    }
    secret = "blindshare-neon-db-master-vault-default-secret-salt-2026";
  }
  return crypto.createHash("sha256").update(`blindshare:db-vault:v1:${secret}`).digest();
}

function encryptField(plaintext) {
  if (!plaintext || typeof plaintext !== "string") return plaintext;
  if (plaintext.startsWith("enc:v1:") || plaintext.startsWith("enc:det:")) return plaintext;

  const key = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `enc:v1:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

async function runBackfill() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes("dummy_build")) {
    console.log("⚠️  DATABASE_URL not configured or dummy build target. Skipping live database backfill.");
    return;
  }

  console.log(`\n🔒 BlindShare Field Vault Backfill ${isDryRun ? "[DRY RUN]" : "[LIVE]"}`);
  console.log("───────────────────────────────────────────────────────────────────");

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("neon.tech") || databaseUrl.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  let client;
  try {
    client = await pool.connect();
    // 1. Backfill documents (title, original_filename, storage_key)
    console.log("→ Scanning documents...");
    const docsRes = await client.query("SELECT id, title, original_filename, storage_key FROM documents");
    let docsUpdated = 0;

    for (const row of docsRes.rows) {
      const newTitle = encryptField(row.title);
      const newFilename = encryptField(row.original_filename);
      const newStorageKey = encryptField(row.storage_key);

      const needsUpdate =
        newTitle !== row.title ||
        newFilename !== row.original_filename ||
        newStorageKey !== row.storage_key;

      if (needsUpdate) {
        if (!isDryRun) {
          await client.query(
            "UPDATE documents SET title = $1, original_filename = $2, storage_key = $3 WHERE id = $4",
            [newTitle, newFilename, newStorageKey, row.id]
          );
        }
        docsUpdated++;
      }
    }
    console.log(`  ✓ documents: ${docsUpdated} rows encrypted (total scanned: ${docsRes.rows.length})`);

    // 2. Backfill doc_versions (storage_key)
    console.log("→ Scanning doc_versions...");
    const verRes = await client.query("SELECT id, storage_key FROM doc_versions");
    let verUpdated = 0;

    for (const row of verRes.rows) {
      const newStorageKey = encryptField(row.storage_key);
      if (newStorageKey !== row.storage_key) {
        if (!isDryRun) {
          await client.query("UPDATE doc_versions SET storage_key = $1 WHERE id = $2", [newStorageKey, row.id]);
        }
        verUpdated++;
      }
    }
    console.log(`  ✓ doc_versions: ${verUpdated} rows encrypted (total scanned: ${verRes.rows.length})`);

    // 3. Backfill links (name, watermark_text, nda_text)
    console.log("→ Scanning links...");
    const linksRes = await client.query("SELECT id, name, watermark_text, nda_text FROM links");
    let linksUpdated = 0;

    for (const row of linksRes.rows) {
      const newName = encryptField(row.name);
      const newWatermark = row.watermark_text ? encryptField(row.watermark_text) : row.watermark_text;
      const newNda = row.nda_text ? encryptField(row.nda_text) : row.nda_text;

      const needsUpdate =
        newName !== row.name ||
        newWatermark !== row.watermark_text ||
        newNda !== row.nda_text;

      if (needsUpdate) {
        if (!isDryRun) {
          await client.query(
            "UPDATE links SET name = $1, watermark_text = $2, nda_text = $3 WHERE id = $4",
            [newName, newWatermark, newNda, row.id]
          );
        }
        linksUpdated++;
      }
    }
    console.log(`  ✓ links: ${linksUpdated} rows encrypted (total scanned: ${linksRes.rows.length})`);

    // 4. Backfill datarooms (name, description)
    console.log("→ Scanning datarooms...");
    const drRes = await client.query("SELECT id, name, description FROM datarooms");
    let drUpdated = 0;

    for (const row of drRes.rows) {
      const newName = encryptField(row.name);
      const newDesc = row.description ? encryptField(row.description) : row.description;

      const needsUpdate = newName !== row.name || newDesc !== row.description;

      if (needsUpdate) {
        if (!isDryRun) {
          await client.query(
            "UPDATE datarooms SET name = $1, description = $2 WHERE id = $3",
            [newName, newDesc, row.id]
          );
        }
        drUpdated++;
      }
    }
    console.log(`  ✓ datarooms: ${drUpdated} rows encrypted (total scanned: ${drRes.rows.length})`);

    console.log("───────────────────────────────────────────────────────────────────");
    console.log(`✨ Backfill complete! Total updated: ${docsUpdated + verUpdated + linksUpdated + drUpdated} fields`);
  } catch (err) {
    console.error("❌ Backfill execution failed:", err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runBackfill().catch(() => {
  process.exit(1);
});
