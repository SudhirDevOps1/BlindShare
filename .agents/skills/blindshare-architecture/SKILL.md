---
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
- **URL Fragment Rule:** The master decryption key (`#k=...`) MUST ONLY live in the URL fragment.
  - *Hindi:* डिक्रिप्शन की (`#k=`) सिर्फ URL Fragment में रहेगी और कभी भी HTTP रिक्वेस्ट लाइन, सर्वर लॉग्स या CDN पर नहीं जाएगी (RFC 3986 §3.5)।
- **Browser-Side Decrypt:** Decryption occurs strictly inside the viewer's browser via `crypto.subtle.decrypt('AES-GCM', ...)`.
- **PBKDF2 Key Wrapping:** Password-protected links wrap the DocKey with PBKDF2 (SHA-256) at **250,000 iterations**. The server stores only salt and wrapped ciphertext key (`wrappedKeyHex`).
- **GZIP Stream Compression:** Native browser `CompressionStream('gzip')` compresses payloads before AES-GCM-256 encryption, reducing storage and bandwidth by 50-80% at ₹0 / $0 server cost.

### 💰 B. Three Zero-Cost Master Presets (100% Free & No-Card Stacks)
1. **Preset A: Cloud Serverless (Recommended Default)**
   - *Stack:* Vercel / Render + Neon Serverless PostgreSQL (`DATABASE_DRIVER=postgres`) + Backblaze B2 (`STORE_TARGET=b2`).
   - *Cost:* $0/month (Neon 512 MB free DB + B2 10 GB free encrypted vault).
2. **Preset B: Zero-Cost Self-Hosted**
   - *Stack:* Docker / VPS / Fly.io + SQLite (`DATABASE_DRIVER=sqlite`) + Litestream B2 Continuous WAL streaming.
   - *Cost:* $0/month ($0 database hosting with sub-second RPO B2 backups).
3. **Preset C: Edge & Infinite Bandwidth**
   - *Stack:* Cloudflare Pages + Turso libSQL Edge (`libsql://...`) + Backblaze B2 via Proxied CNAME (`B2_ENDPOINT=download.yourdomain.com`).
   - *Bandwidth Alliance Guarantee:* Data egress from B2 through Cloudflare CDN is **100% FREE ($0 Unlimited Egress)**.
   - *Card Requirement:* 0% (No credit card required anywhere).

---

## 🛡️ 2. Hardened Security & Anti-Hacking Defenses (सुरक्षा व बग प्रिवेंशन)

Every AI must strictly implement and verify these security defenses on any new or existing route:

1. **Admin Bootstrap Privilege Escalation Defense:**
   - Strict exact equality (`submittedNorm === adminBootstrapInvite`) is mandatory. Never use `.endsWith()` or partial matches.
2. **Local Storage Path Traversal Confinement:**
   - File paths must be sanitized with `path.basename` and confined within `path.resolve(storageDir)`.
3. **Atomic Concurrency (TOCTOU) Link Protection:**
   - Single-use Burn-After-Reading and max-views checks must be performed in a single atomic SQL update query.
4. **Timing-Safe HMAC Sessions & Multi-Device Invalidation:**
   - Session signatures must use `crypto.timingSafeEqual` and invalidate instantly across all devices on password change via `users.sessionVersion`.
5. **SSRF & DNS Rebinding Mitigation:**
   - Webhook dispatches and email domain lookups must strictly block RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`), and cloud metadata (`169.254.169.254`).
6. **Orphan Sweep Version Blob Preservation:**
   - S3/B2 bucket cleaner must preserve `docVersions.storageKey` alongside `documents.storageKey` to prevent historical version deletion.
7. **Sole Super Admin Self-Deletion Guard:**
   - Prevent the last remaining Super Admin from deleting their own account.

---

## 🚀 3. AI Self-Improvement & Strict Development Protocol (AI सुधार नियम)

Follow this protocol during any engineering task on BlindShare:

| Step | Rule | Description |
|:---:|---|---|
| **1** | **Zero Content Deletion** | *"Bina kuchh hataye"* — Never delete existing features, documentation, or code paths. Only harden, extend, and improve. |
| **2** | **Bilingual i18n Parity** | Every UI string must have entries in both `en` and `hi` in `src/lib/i18n/dictionary.ts`. |
| **3** | **Version Synchronization** | All files (`package.json`, `version/route.ts`, `README.md`, `CHANGELOG.md`) must report `v1.2.0`. |
| **4** | **Automated Test Invariant** | Always run `npm run typecheck && npm test && npm run lint`. All 18+ security tests must pass with 0 errors. |
| **5** | **Zero PII Logging** | Never output passwords, keys, viewer emails, or filenames to stdout. Use `logger.info/warn/error`. |

---

## 📁 References & Deep Architecture Docs
- [Security Invariants & Defenses](references/security-invariants.md)
- [Zero-Cost Hosting Presets Guide](references/zero-cost-presets.md)
- [Client-Side Cryptography Pipeline](references/crypto-pipeline.md)
- [AI Audit Checklist](examples/audit-checklist.md)
