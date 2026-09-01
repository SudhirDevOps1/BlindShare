---
name: blindshare-architecture
description: >-
  Master architectural knowledge, zero-knowledge cryptographic invariants,
  zero-cost hosting presets, and hardened security defense protocols for BlindShare.
  Use when designing, extending, debugging, auditing, or maintaining the BlindShare
  platform or any zero-knowledge document sharing system.
---

# BlindShare Architecture & Engineering Mastery Skill

## Overview
**BlindShare** (v1.2.0) is a self-hosted, zero-knowledge encrypted document sharing and analytics platform (DocSend & Papermark alternative). The core technical guarantee of BlindShare is: **the server never sees plaintext files, passwords, or decryption keys — not once, not ever.**

This skill provides future AI agents with deep architectural context, strict security invariants, dual database driver support, zero-cost cloud deployment presets, and autonomous verification checklists.

---

## 🔒 1. Core Architectural & Cryptographic Invariants

Any AI working on this codebase **MUST STRICTLY PRESERVE** the following invariants:

1. **Zero-Knowledge URL Fragment Key Transport (RFC 3986):**
   - The master decryption key (`#k=...`) MUST ONLY live in the URL fragment.
   - Per RFC 3986 §3.5, URL fragments are processed client-side by browsers and are **NEVER sent in HTTP request lines** to servers, CDNs, or reverse proxies.
   - Decryption occurs strictly inside the viewer's browser via `crypto.subtle.decrypt('AES-GCM', ...)`.

2. **Transparent Client-Side GZIP Compression:**
   - Before AES-GCM-256 encryption, documents are compressed using browser-native `CompressionStream('gzip')`.
   - On viewer decrypt, documents pass through `DecompressionStream('gzip')`.
   - This reduces file storage and bandwidth by 50-80% without incurring server CPU overhead.

3. **Key Derivation & Password Gate (PBKDF2):**
   - Password-gated links wrap the document key (`DocKey`) using PBKDF2 with SHA-256 and **250,000 iterations**.
   - Server-side stores only the PBKDF2 salt and wrapped ciphertext key (`wrappedKeyHex`). The server cannot decrypt the document even with database access.

4. **Timing-Safe HMAC Session Token Signatures:**
   - Sessions are signed with HMAC-SHA256 (`crypto.createHmac`) using `SESSION_SECRET`.
   - Verification MUST use `crypto.timingSafeEqual` to prevent side-channel timing attacks.
   - Multi-device instant session invalidation is enforced via `users.sessionVersion`.

5. **Atomic Concurrency & Anti-Race-Condition Updates (TOCTOU):**
   - Single-use Burn-After-Reading and max-views links MUST be updated atomically in SQL:
     ```typescript
     where(and(eq(links.id, linkId), eq(links.isRevoked, false), or(isNull(links.maxViews), sql`${links.viewCount} < ${links.maxViews}`)))
     ```
   - Never separate the view count check from the increment update.

6. **Strict Privilege Escalation Defense:**
   - Admin bootstrap invite comparisons MUST use strict equality (`submittedNorm === adminBootstrapInvite`).
   - Never use partial string matching (`.endsWith()` or `.includes()`) for authorization keys.

7. **Storage Boundary Confinement (Path Traversal Defense):**
   - File keys in local storage adapters MUST be sanitized via `path.basename` and confined within `path.resolve(storageDir)`.

---

## 💰 2. Three Master Zero-Cost Deployment Presets (No-Card Stacks)

BlindShare supports three production presets engineered to run 100% on free tiers without requiring a credit card:

### 🟢 Preset A: Cloud Serverless (Vercel / Render + Neon Postgres + Backblaze B2)
- **Use Case:** Default 1-click cloud deployment.
- **Database:** Neon PostgreSQL (`DATABASE_DRIVER=postgres`, 512 MB free storage, auto-sleeps on idle).
- **Storage:** Backblaze B2 (`STORE_TARGET=b2`, 10 GB free forever, presigned direct browser uploads).
- **Cost:** $0/month forever.

### 🟢 Preset B: Zero-Cost Self-Hosted (Docker / VPS + SQLite + Litestream B2)
- **Use Case:** Persistent servers, Raspberry Pi, Fly.io, or self-hosted VPS with zero database fees.
- **Database:** Local SQLite at `/data/blindshare.db` (`DATABASE_DRIVER=sqlite`, Drizzle ORM).
- **Disaster Recovery:** Litestream background daemon continuously streams SQLite WAL frames to Backblaze B2 every 1 second ($0 RPO).
- **Auto-Restore:** `deploy/entrypoint.sh` automatically restores the database from B2 on cold container boot.
- **Cost:** $0/month forever.

### 🟢 Preset C: Edge & Infinite Bandwidth (Cloudflare Pages + Turso libSQL + B2 Bandwidth Alliance)
- **Use Case:** High-traffic viral pitch decks requiring unlimited download bandwidth without surprise bills.
- **Compute:** Cloudflare Pages / Workers (`npm run pages:build`, 0ms cold start).
- **Database:** Turso SQLite Edge (`libsql://...`, 9 GB free storage, 1 Billion reads/month, 300+ edge locations).
- **Storage:** Backblaze B2 via Cloudflare Proxied CNAME (`B2_ENDPOINT=download.yourdomain.com`).
- **Bandwidth Alliance:** Under the Cloudflare + Backblaze Bandwidth Alliance, data transfer from B2 through Cloudflare CDN is **100% FREE ($0 Unlimited Egress)**.
- **Card Requirement:** 0% — No credit card required on Cloudflare, Turso, or B2.

---

## 🦆 3. Embedded In-Memory Analytics & SIEM Pipeline

1. **DuckDB Columnar Analytics Engine (`src/lib/analytics/duckdb-engine.ts`):**
   - High-performance in-process OLAP engine.
   - Computes mathematical dwell percentiles (`p50, p90, p99`), slide drop-off rates, and completion heatmaps in sub-5ms without taxing the primary database.
   - Supports streaming NDJSON and CSV exports.

2. **AI Lead Conviction Scoring Engine (`src/lib/analytics/lead-scoring.ts`):**
   - Mathematical 0-100 score analyzing 4 intent signals: Dwell Time (35%), Slide Completion (25%), Revisit Frequency (20%), and Focus/NDA (20%).
   - Classifies readers into `🔥 HOT DEAL (85-100)`, `⚡ WARM (60-84)`, and `❄️ CASUAL (0-59)`.

3. **Enterprise SIEM Forwarder (`src/lib/siem/siem-forwarder.ts`):**
   - Streams security audit logs in Common Event Format (CEF) and JSON to Splunk HEC, Datadog Logs API, and Elastic Stack.

---

## 🛠️ 4. AI Self-Improvement & Development Protocol

When developing or modifying BlindShare, follow these strict development rules:

1. **Zero Content Deletions (Strict User Rule):**
   - Never remove existing features, comments, routes, or documentation. Always refine, harden, or extend.
2. **Dual-Language i18n Parity:**
   - When adding new UI elements, register dictionary keys in both `en` and `hi` in `src/lib/i18n/dictionary.ts`.
3. **Version Synchronization (v1.2.0):**
   - Ensure `package.json`, `src/app/api/version/route.ts`, `README.md`, and `docs/CHANGELOG.md` all report identical version tags.
4. **Mandatory Automated Verification:**
   - Before committing any changes, run:
     ```bash
     npm run typecheck && npm test && npm run lint
     ```
   - All 18+ security & cryptographic E2E tests MUST pass with 0 errors.

---

## 📁 References & Additional Documents
- [Security Invariants & Defenses](references/security-invariants.md)
- [Zero-Cost Hosting Presets Guide](references/zero-cost-presets.md)
- [Client-Side Cryptography Pipeline](references/crypto-pipeline.md)
- [AI Audit Checklist](examples/audit-checklist.md)
