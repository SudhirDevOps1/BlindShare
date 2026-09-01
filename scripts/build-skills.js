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

# BlindShare Master AI Brain & Architectural Engineering Skill

> 🌐 **Bilingual Master Directive (English + हिंदी):**  
> This document acts as the definitive brain context, architectural standard, cryptographic rulebook, and self-improvement protocol for any AI agent interacting with the BlindShare codebase.

---

## 🧠 1. AI Brain Context & Zero-Knowledge Invariants (क्रिप्टोग्राफिक व आर्किटेक्चरल सिद्धांत)

Any AI modifying or extending this codebase **MUST UNCONDITIONALLY UPHOLD** these non-negotiable invariants:

### 🔐 A. Zero-Knowledge Cryptography (RFC 3986)
- **URL Fragment Rule:** The master decryption key (\`#k=...\`) MUST ONLY live in the URL fragment.
  - *Hindi:* डिक्रिप्शन की (\`#k=\`) सिर्फ URL Fragment में रहेगी और कभी भी HTTP रिक्वेस्ट लाइन, सर्वर लॉग्स या CDN पर नहीं जाएगी (RFC 3986 §3.5)।
- **Browser-Side Decrypt:** Decryption occurs strictly inside the viewer's browser via \`crypto.subtle.decrypt('AES-GCM', ...)\`.
- **PBKDF2 Key Wrapping:** Password-protected links wrap the DocKey with PBKDF2 (SHA-256) at **250,000 iterations**. The server stores only salt and wrapped ciphertext key (\`wrappedKeyHex\`).
- **GZIP Stream Compression:** Native browser \`CompressionStream('gzip')\` compresses payloads before AES-GCM-256 encryption, reducing storage and bandwidth by 50-80% at ₹0 / $0 server cost.

### 💰 B. Three Zero-Cost Master Presets (100% Free & No-Card Stacks)
1. **Preset A: Cloud Serverless (Recommended Default)**
   - *Stack:* Vercel / Render + Neon Serverless PostgreSQL (\`DATABASE_DRIVER=postgres\`) + Backblaze B2 (\`STORE_TARGET=b2\`).
   - *Cost:* $0/month (Neon 512 MB free DB + B2 10 GB free encrypted vault).
2. **Preset B: Zero-Cost Self-Hosted**
   - *Stack:* Docker / VPS / Fly.io + SQLite (\`DATABASE_DRIVER=sqlite\`) + Litestream B2 Continuous WAL streaming.
   - *Cost:* $0/month ($0 database hosting with sub-second RPO B2 backups).
3. **Preset C: Edge & Infinite Bandwidth**
   - *Stack:* Cloudflare Pages + Turso libSQL Edge (\`libsql://...\`) + Backblaze B2 via Proxied CNAME (\`B2_ENDPOINT=download.yourdomain.com\`).
   - *Bandwidth Alliance Guarantee:* Data egress from B2 through Cloudflare CDN is **100% FREE ($0 Unlimited Egress)**.
   - *Card Requirement:* 0% (No credit card required anywhere).

---

## 🛡️ 2. Hardened Security & Anti-Hacking Defenses (सुरक्षा व बग प्रिवेंशन)

Every AI must strictly implement and verify these security defenses on any new or existing route:

1. **Admin Bootstrap Privilege Escalation Defense:**
   - Strict exact equality (\`submittedNorm === adminBootstrapInvite\`) is mandatory. Never use \`.endsWith()\` or partial matches.
2. **Local Storage Path Traversal Confinement:**
   - File paths must be sanitized with \`path.basename\` and confined within \`path.resolve(storageDir)\`.
3. **Atomic Concurrency (TOCTOU) Link Protection:**
   - Single-use Burn-After-Reading and max-views checks must be performed in a single atomic SQL update query.
4. **Timing-Safe HMAC Sessions & Multi-Device Invalidation:**
   - Session signatures must use \`crypto.timingSafeEqual\` and invalidate instantly across all devices on password change via \`users.sessionVersion\`.
5. **SSRF & DNS Rebinding Mitigation:**
   - Webhook dispatches and email domain lookups must strictly block RFC 1918 private subnets (\`10.0.0.0/8\`, \`172.16.0.0/12\`, \`192.168.0.0/16\`), loopback (\`127.0.0.0/8\`), and cloud metadata (\`169.254.169.254\`).
6. **Orphan Sweep Version Blob Preservation:**
   - S3/B2 bucket cleaner must preserve \`docVersions.storageKey\` alongside \`documents.storageKey\` to prevent historical version deletion.
7. **Sole Super Admin Self-Deletion Guard:**
   - Prevent the last remaining Super Admin from deleting their own account.

---

## 🚀 3. AI Self-Improvement & Strict Development Protocol (AI सुधार नियम)

Follow this protocol during any engineering task on BlindShare:

| Step | Rule | Description |
|:---:|---|---|
| **1** | **Zero Content Deletion** | *"Bina kuchh hataye"* — Never delete existing features, documentation, or code paths. Only harden, extend, and improve. |
| **2** | **Bilingual i18n Parity** | Every UI string must have entries in both \`en\` and \`hi\` in \`src/lib/i18n/dictionary.ts\`. |
| **3** | **Version Synchronization** | All files (\`package.json\`, \`version/route.ts\`, \`README.md\`, \`CHANGELOG.md\`) must report \`v1.2.0\`. |
| **4** | **Automated Test Invariant** | Always run \`npm run typecheck && npm test && npm run lint\`. All 18+ security tests must pass with 0 errors. |
| **5** | **Zero PII Logging** | Never output passwords, keys, viewer emails, or filenames to stdout. Use \`logger.info/warn/error\`. |

---

## 📁 References & Deep Architecture Docs
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
