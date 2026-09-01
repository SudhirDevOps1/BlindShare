const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'docs', 'skills', 'blindshare-architecture');

const files = {
  'SKILL.md': `---
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
   - The master decryption key (\`#k=...\`) MUST ONLY live in the URL fragment.
   - Per RFC 3986 §3.5, URL fragments are processed client-side by browsers and are **NEVER sent in HTTP request lines** to servers, CDNs, or reverse proxies.
   - Decryption occurs strictly inside the viewer's browser via \`crypto.subtle.decrypt('AES-GCM', ...)\`.

2. **Transparent Client-Side GZIP Compression:**
   - Before AES-GCM-256 encryption, documents are compressed using browser-native \`CompressionStream('gzip')\`.
   - On viewer decrypt, documents pass through \`DecompressionStream('gzip')\`.
   - This reduces file storage and bandwidth by 50-80% without incurring server CPU overhead.

3. **Key Derivation & Password Gate (PBKDF2):**
   - Password-gated links wrap the document key (\`DocKey\`) using PBKDF2 with SHA-256 and **250,000 iterations**.
   - Server-side stores only the PBKDF2 salt and wrapped ciphertext key (\`wrappedKeyHex\`). The server cannot decrypt the document even with database access.

4. **Timing-Safe HMAC Session Token Signatures:**
   - Sessions are signed with HMAC-SHA256 (\`crypto.createHmac\`) using \`SESSION_SECRET\`.
   - Verification MUST use \`crypto.timingSafeEqual\` to prevent side-channel timing attacks.
   - Multi-device instant session invalidation is enforced via \`users.sessionVersion\`.

5. **Atomic Concurrency & Anti-Race-Condition Updates (TOCTOU):**
   - Single-use Burn-After-Reading and max-views links MUST be updated atomically in SQL:
     \`\`\`typescript
     where(and(eq(links.id, linkId), eq(links.isRevoked, false), or(isNull(links.maxViews), sql\`\${links.viewCount} < \${links.maxViews}\`)))
     \`\`\`
   - Never separate the view count check from the increment update.

6. **Strict Privilege Escalation Defense:**
   - Admin bootstrap invite comparisons MUST use strict equality (\`submittedNorm === adminBootstrapInvite\`).
   - Never use partial string matching (\`.endsWith()\` or \`.includes()\`) for authorization keys.

7. **Storage Boundary Confinement (Path Traversal Defense):**
   - File keys in local storage adapters MUST be sanitized via \`path.basename\` and confined within \`path.resolve(storageDir)\`.

---

## 💰 2. Three Master Zero-Cost Deployment Presets (No-Card Stacks)

BlindShare supports three production presets engineered to run 100% on free tiers without requiring a credit card:

### 🟢 Preset A: Cloud Serverless (Vercel / Render + Neon Postgres + Backblaze B2)
- **Use Case:** Default 1-click cloud deployment.
- **Database:** Neon PostgreSQL (\`DATABASE_DRIVER=postgres\`, 512 MB free storage, auto-sleeps on idle).
- **Storage:** Backblaze B2 (\`STORE_TARGET=b2\`, 10 GB free forever, presigned direct browser uploads).
- **Cost:** \$0/month forever.

### 🟢 Preset B: Zero-Cost Self-Hosted (Docker / VPS + SQLite + Litestream B2)
- **Use Case:** Persistent servers, Raspberry Pi, Fly.io, or self-hosted VPS with zero database fees.
- **Database:** Local SQLite at \`/data/blindshare.db\` (\`DATABASE_DRIVER=sqlite\`, Drizzle ORM).
- **Disaster Recovery:** Litestream background daemon continuously streams SQLite WAL frames to Backblaze B2 every 1 second (\$0 RPO).
- **Auto-Restore:** \`deploy/entrypoint.sh\` automatically restores the database from B2 on cold container boot.
- **Cost:** \$0/month forever.

### 🟢 Preset C: Edge & Infinite Bandwidth (Cloudflare Pages + Turso libSQL + B2 Bandwidth Alliance)
- **Use Case:** High-traffic viral pitch decks requiring unlimited download bandwidth without surprise bills.
- **Compute:** Cloudflare Pages / Workers (\`npm run pages:build\`, 0ms cold start).
- **Database:** Turso SQLite Edge (\`libsql://...\`, 9 GB free storage, 1 Billion reads/month, 300+ edge locations).
- **Storage:** Backblaze B2 via Cloudflare Proxied CNAME (\`B2_ENDPOINT=download.yourdomain.com\`).
- **Bandwidth Alliance:** Under the Cloudflare + Backblaze Bandwidth Alliance, data transfer from B2 through Cloudflare CDN is **100% FREE (\$0 Unlimited Egress)**.
- **Card Requirement:** 0% — No credit card required on Cloudflare, Turso, or B2.

---

## 🦆 3. Embedded In-Memory Analytics & SIEM Pipeline

1. **DuckDB Columnar Analytics Engine (\`src/lib/analytics/duckdb-engine.ts\`):**
   - High-performance in-process OLAP engine.
   - Computes mathematical dwell percentiles (\`p50, p90, p99\`), slide drop-off rates, and completion heatmaps in sub-5ms without taxing the primary database.
   - Supports streaming NDJSON and CSV exports.

2. **AI Lead Conviction Scoring Engine (\`src/lib/analytics/lead-scoring.ts\`):**
   - Mathematical 0-100 score analyzing 4 intent signals: Dwell Time (35%), Slide Completion (25%), Revisit Frequency (20%), and Focus/NDA (20%).
   - Classifies readers into \`🔥 HOT DEAL (85-100)\`, \`⚡ WARM (60-84)\`, and \`❄️ CASUAL (0-59)\`.

3. **Enterprise SIEM Forwarder (\`src/lib/siem/siem-forwarder.ts\`):**
   - Streams security audit logs in Common Event Format (CEF) and JSON to Splunk HEC, Datadog Logs API, and Elastic Stack.

---

## 🛠️ 4. AI Self-Improvement & Development Protocol

When developing or modifying BlindShare, follow these strict development rules:

1. **Zero Content Deletions (Strict User Rule):**
   - Never remove existing features, comments, routes, or documentation. Always refine, harden, or extend.
2. **Dual-Language i18n Parity:**
   - When adding new UI elements, register dictionary keys in both \`en\` and \`hi\` in \`src/lib/i18n/dictionary.ts\`.
3. **Version Synchronization (v1.2.0):**
   - Ensure \`package.json\`, \`src/app/api/version/route.ts\`, \`README.md\`, and \`docs/CHANGELOG.md\` all report identical version tags.
4. **Mandatory Automated Verification:**
   - Before committing any changes, run:
     \`\`\`bash
     npm run typecheck && npm test && npm run lint
     \`\`\`
   - All 18+ security & cryptographic E2E tests MUST pass with 0 errors.

---

## 📁 References & Additional Documents
- [Security Invariants & Defenses](references/security-invariants.md)
- [Zero-Cost Hosting Presets Guide](references/zero-cost-presets.md)
- [Client-Side Cryptography Pipeline](references/crypto-pipeline.md)
- [AI Audit Checklist](examples/audit-checklist.md)
`,

  'references/security-invariants.md': `# Security Invariants & Attack Mitigations Reference

## 1. Zero-Knowledge Proof Invariant
- **Rule:** Plaintext documents and master encryption keys must NEVER reach the server.
- **Implementation:** AES-GCM-256 with CSPRNG 256-bit keys generated via \`crypto.getRandomValues()\`.
- **Key Transport:** \`https://app.domain/v/{slug}#k={keyBase64}\`.
- **RFC 3986 Guarantee:** The fragment identifier after \`#\` is stripped by user agents before making HTTP requests.

## 2. Server-Side Request Forgery (SSRF) Defense
- **Rule:** Webhook dispatchers must never hit loopback, private subnets, or cloud metadata endpoints.
- **Engine:** \`src/lib/security/ssrf-validator.ts\` checks URLs before dispatch.
- **Blocked Ranges:**
  - \`127.0.0.0/8\` (Loopback)
  - \`10.0.0.0/8\`, \`172.16.0.0/12\`, \`192.168.0.0/16\` (Private RFC 1918)
  - \`169.254.0.0/16\` (Link-Local & Cloud Metadata e.g. AWS/GCP 169.254.169.254)
  - \`::1\`, \`fe80::/10\` (IPv6 link-local)
  - \`metadata.google.internal\`, \`instance-data\`

## 3. Stored XSS Prevention
- **Rule:** Reader question text, viewer names, and feedback pins must be sanitized before persistence and rendering.
- **Sanitization:** Strip HTML tags with regex \`/<[^>]*>?/gm\` and truncate to max safe boundaries (1,000 chars for questions, 80 chars for names).

## 4. Race Condition Immunity (TOCTOU)
- **Rule:** Single-use Burn-After-Reading links and Max-Views limits must be checked and updated in a single atomic SQL step.
- **Query:**
  \`\`\`typescript
  await db.update(links)
    .set({ viewCount: sql\`\${links.viewCount} + 1\`, isRevoked: shouldRevoke ? true : links.isRevoked })
    .where(and(eq(links.id, linkId), eq(links.isRevoked, false), or(isNull(links.maxViews), sql\`\${links.viewCount} < \${links.maxViews}\`)));
  \`\`\`

## 5. Brute Force Protection
- **Rule:** Password-gated links and user login attempts must enforce progressive lockouts.
- **Thresholds:** 5 failed attempts within 15 minutes trigger a 15-minute IP/account lockout.
`,

  'references/zero-cost-presets.md': `# Zero-Cost Deployment Presets Blueprint

## Overview
BlindShare is engineered to run permanently on $0 / month free tiers without requiring credit cards or risking unexpected bills.

| Preset | Hosting / Compute | Database | Encrypted Storage | Monthly Cost | Credit Card? | Best For |
|---|---|---|---|:---:|:---:|---|
| **Preset A** | Vercel / Render Hobby | Neon Serverless PostgreSQL | Backblaze B2 (Direct) | **$0** | ❌ No | 1-Click Fast Deployment |
| **Preset B** | Docker / VPS / Fly.io | SQLite + Litestream Daemon | Backblaze B2 (WAL Stream) | **$0** | ❌ No | Self-Hosted / Zero DB Fees |
| **Preset C** | Cloudflare Pages | Turso libSQL Edge | Backblaze B2 + Cloudflare CDN | **$0** | ❌ No | High Viral Traffic & $0 Egress |

### Cloudflare + B2 Bandwidth Alliance Architecture
When Backblaze B2 is paired with Cloudflare CDN via a Proxied CNAME (\`download.yourdomain.com -> f005.backblazeb2.com\`), all egress bandwidth is wavered under the Bandwidth Alliance agreement, enabling **100% Unlimited $0 Egress**.
`,

  'references/crypto-pipeline.md': `# Cryptographic Pipeline & Compression

## Pipeline Flow

\`\`\`
[ Raw Document File ]
        │
        ▼ (Browser Web Workers)
[ CompressionStream('gzip') ] ──► 50-80% Size Reduction
        │
        ▼ (WebCrypto API)
[ AES-GCM-256 Encrypt ] ──► (256-bit Key, 96-bit IV, 128-bit Auth Tag)
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
[ Ciphertext Blob ]          [ DocKey (#k=...) ]          [ IV + Tag Metadata ]
        │                             │                             │
(Presigned S3 PUT to B2)       (URL Fragment only)            (Saved to DB)
\`\`\`

## Key Wrapping (Password Protection)
When a link has a password:
1. Client generates \`Salt\` (16 bytes random CSPRNG).
2. Computes \`WrapKey = PBKDF2(Password, Salt, 250000, SHA-256)\`.
3. Encrypts \`WrappedKey = AES-GCM(DocKey, WrapKey)\`.
4. Stores \`SaltHex\` and \`WrappedKeyHex\` in the database.
`,

  'examples/audit-checklist.md': `# AI Verification Checklist for BlindShare

Before completing any task or pushing commits, verify each item:

- [ ] **1. Cryptographic Invariant:** Is the decryption key exclusively in the \`#k=\` URL fragment?
- [ ] **2. Zero Content Deletion:** Were all existing features and comments preserved?
- [ ] **3. Auth & RBAC:** Are all new privileged routes protected by \`requireAuth()\`, \`requireAdmin()\`, or \`requireSuperAdmin()\`?
- [ ] **4. Ownership Guard (IDOR):** Does every document/link query check \`eq(table.ownerId, auth.user.id)\`?
- [ ] **5. Input Validation:** Are all request bodies strictly parsed through a Zod schema in \`src/lib/validation/schemas.ts\`?
- [ ] **6. Concurrency Safety:** Are single-use or counter updates executed with atomic SQL \`WHERE\` conditions?
- [ ] **7. Dual-Language i18n:** Are new UI labels added to both \`en\` and \`hi\` in \`src/lib/i18n/dictionary.ts\`?
- [ ] **8. PII-Safe Logging:** Are logs using \`logger.info/warn/error\` instead of raw \`console.log\`?
- [ ] **9. Version Consistency:** Do \`package.json\`, \`src/app/api/version/route.ts\`, \`README.md\`, and \`CHANGELOG.md\` all match (\`v1.2.0\`)?
- [ ] **10. Automated Tests:** Do all 18 security tests pass (\`npm test\`) with 0 TypeScript/ESLint errors?
`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(baseDir, relPath);
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('✅ Generated:', fullPath);
}
