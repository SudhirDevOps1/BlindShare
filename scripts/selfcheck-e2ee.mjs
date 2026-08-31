#!/usr/bin/env node
/**
 * ZERO-KNOWLEDGE SELF-CHECK
 * Fails the build if any server-side file attempts to decrypt document bytes.
 * Allowed: client components ("use client") and the shared crypto-core (browser-only).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src/app/api", "src/lib/storage", "src/lib/auth", "src/lib/analytics", "src/lib/push", "src/db"];
const FORBIDDEN = [/crypto\.subtle\.decrypt/, /subtle\.decrypt\s*\(/, /unwrapKeyWithPassword\s*\(/, /decryptBytes\s*\(/];

const hits = [];

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry)) {
      const src = readFileSync(full, "utf8");
      if (src.includes('"use client"') || src.includes("'use client'")) continue;
      for (const rx of FORBIDDEN) {
        if (rx.test(src)) hits.push(`${relative(ROOT, full)} :: ${rx}`);
      }
    }
  }
}

for (const d of SCAN_DIRS) walk(join(ROOT, d));

if (hits.length > 0) {
  console.error("\n❌ ZERO-KNOWLEDGE VIOLATION — server-side decryption detected:\n");
  for (const h of hits) console.error("   " + h);
  console.error("\nThe server must remain a blind courier.\n");
  process.exit(1);
}

console.log("✅ Zero-knowledge self-check passed: 0 server-side document-decrypt call sites.");
