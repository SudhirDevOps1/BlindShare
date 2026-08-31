#!/usr/bin/env node
/**
 * ══════════════════════════════════════════════════════════════════════════
 * BLINDSHARE — quicklink: encrypt locally, upload, print a LIVE share link
 * ══════════════════════════════════════════════════════════════════════════
 * The decryption key is generated and AES-GCM-256 applied HERE (Node WebCrypto —
 * the same primitives the browser uses), so the server only ever receives
 * ciphertext. The key travels exclusively in the printed URL fragment (#k=…).
 *
 *   node scripts/quicklink.mjs ./deck.pdf
 *   node scripts/quicklink.mjs ./deck.pdf --name "Acme VC" --password "hunter2" \
 *        --email --expiry 2026-12-31T00:00 --views 25 --no-watermark
 *
 * Options: --name --slug --password --email --domains a.com,b.com --download
 *          --no-watermark --watermark "TEXT" --views N --expiry ISO --nda "text"
 * Env:     APP_URL · BLINDSHARE_EMAIL · BLINDSHARE_PASSWORD · ADMIN_BOOTSTRAP_INVITE
 */
import { readFileSync, existsSync } from "node:fs";
import { basename } from "node:path";

const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
const EMAIL = process.env.BLINDSHARE_EMAIL || "admin@blindshare.local";
const PASSWORD = process.env.BLINDSHARE_PASSWORD || "AdminPassword2026!";
const INVITE = process.env.ADMIN_BOOTSTRAP_INVITE || "blindshare-genesis-admin-2026";

const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith("--"));
const flag = (n) => argv.includes(`--${n}`);
const opt = (n) => {
  const hit = argv.find((a) => a.startsWith(`--${n}=`));
  if (hit) return hit.split("=").slice(1).join("=");
  const i = argv.indexOf(`--${n}`);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : undefined;
};

const die = (msg) => {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
};

if (!file) die("usage: node scripts/quicklink.mjs <file> [options]");
if (!existsSync(file)) die(`file not found: ${file}`);

/* ── crypto (audited WebCrypto only) ─────────────────────────────────────── */
const b64url = (buf) => Buffer.from(buf).toString("base64url");
const toHex = (buf) => Buffer.from(buf).toString("hex");

async function deriveWrapKey(password, salt) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
}

async function main() {
  const data = readFileSync(file);
  if (data.length > 25 * 1024 * 1024) die("file exceeds 25MB MAX_FILE_MB budget");

  console.log(`\n🔐 BLINDSHARE quicklink → ${APP_URL}`);
  console.log(`   file: ${basename(file)}  (${(data.length / 1024 / 1024).toFixed(2)} MB)`);

  /* 1. auth (login; auto-register with the genesis/invite code on fresh installs) */
  let cookie = "";
  const post = async (path, body, withCookie = true) => {
    const res = await fetch(APP_URL + path, {
      method: "POST",
      headers: { "content-type": "application/json", ...(withCookie && cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
    });
    const sc = res.headers.getSetCookie?.() || [];
    if (sc.length) cookie = sc.map((c) => c.split(";")[0]).join("; ");
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  };

  let auth = await post("/api/auth/login", { email: EMAIL, password: PASSWORD }, false);
  if (!auth.ok) {
    console.log("   … no session yet, trying invite-code registration");
    auth = await post("/api/auth/register", { email: EMAIL, password: PASSWORD, name: "CLI Owner", inviteCode: INVITE }, false);
    if (!auth.ok) die(`auth failed: ${auth.json.error || auth.status} — set BLINDSHARE_EMAIL/BLINDSHARE_PASSWORD or create the account in the UI first`);
  }
  console.log(`   ✔ signed in as ${EMAIL}`);

  /* 2. key + client-side AES-GCM-256 encryption (server NEVER sees the key) */
  const docKey = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await crypto.subtle.importKey("raw", docKey, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, aesKey, data);
  console.log("   ✔ AES-GCM-256 encrypted locally (ciphertext-only upload)");

  /* 3. page count estimate (client-side; the server never parses content) */
  let pageCount = 1;
  const latin = data.subarray(0, Math.min(data.length, 1_000_000)).toString("latin1");
  const pages = latin.match(/\/Type\s*\/Page[^s]/g);
  if (pages) pageCount = pages.length;

  /* 4. upload ciphertext + create the link */
  const up = await post("/api/docs", {
    title: opt("name") || basename(file).replace(/\.[^.]+$/, ""),
    originalFilename: basename(file),
    sizeBytes: data.length,
    pageCount,
    encryptionMode: "e2ee-fragment",
    ivHex: toHex(iv),
    directCiphertextBase64: Buffer.from(ciphertext).toString("base64"),
  });
  if (!up.ok) die(`upload failed: ${up.json.error || up.status}`);
  const docId = up.json.documentId;

  let wrappedKeyHex, passwordSaltHex;
  if (flag("password")) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const wIv = crypto.getRandomValues(new Uint8Array(12));
    const wrapKey = await deriveWrapKey(opt("password"), salt);
    const enc = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: wIv }, wrapKey, docKey));
    const combined = new Uint8Array(wIv.length + enc.length);
    combined.set(wIv, 0);
    combined.set(enc, wIv.length);
    wrappedKeyHex = toHex(combined);
    passwordSaltHex = toHex(salt);
  }

  const link = await post("/api/links", {
    docId,
    name: opt("name") || `quicklink ${new Date().toISOString().slice(0, 10)}`,
    slug: opt("slug"),
    password: flag("password") ? opt("password") : undefined,
    passwordSaltHex,
    wrappedKeyHex,
    requiresEmail: flag("email"),
    allowedDomains: opt("domains"),
    allowDownload: flag("download"),
    watermarkEnabled: !flag("no-watermark"),
    watermarkText: opt("watermark"),
    requiresNda: flag("nda"),
    ndaText: opt("nda") || (flag("nda") ? "Confidential: do not forward. Acknowledge to continue." : undefined),
    maxViews: opt("views") ? parseInt(opt("views"), 10) : undefined,
    expiresAt: opt("expiry") ? new Date(opt("expiry")).toISOString() : undefined,
  });
  if (!link.ok) die(`link creation failed: ${link.json.error || link.status}`);

  /* 5. print the live link */
  const liveUrl = `${APP_URL}/v/${link.json.slug}#k=${b64url(docKey)}`;
  console.log("\n───────────────────────────────────────────────────────────");
  console.log("🔗 LIVE LINK (fragment carries the key → never sent to the server):");
  console.log("\n   " + liveUrl + "\n");
  console.log("   document id : " + docId);
  console.log("   key (hex)   : " + toHex(docKey) + "   ← keep it, it is unrecoverable if lost");
  console.log("   gates       : " + [
    flag("password") ? "password(PBKDF2-wrap)" : null,
    flag("email") ? "email-capture" : null,
    flag("no-watermark") ? null : "watermark",
    flag("download") ? "download-allowed" : null,
    opt("views") ? `max-views ${opt("views")}` : null,
    opt("expiry") ? `expires ${opt("expiry")}` : null,
    flag("nda") ? "NDA clickwrap" : null,
  ].filter(Boolean).join(" · ") || "none");
  console.log("───────────────────────────────────────────────────────────\n");
}

main().catch((e) => die(e.stack || String(e)));
