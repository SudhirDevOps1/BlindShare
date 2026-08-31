<div align="center">

<br />

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/brand/logo.svg">
  <img alt="BlindShare" src="public/brand/logo.svg" height="80">
</picture>

<h1>BlindShare</h1>

<p>
  <strong>Zero-Knowledge Encrypted Document Sharing & Analytics</strong><br/>
  <sub>The server never sees your files — ever.</sub>
</p>

<p>
  <a href="https://github.com/SudhirDevOps1/BlindShare/releases/tag/v1.1.0">
    <img src="https://img.shields.io/github/v/release/SudhirDevOps1/BlindShare?style=flat-square&label=release&color=22c55e" alt="Release" />
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
  </a>
  <a href="https://github.com/SudhirDevOps1/BlindShare/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/SudhirDevOps1/BlindShare/ci.yml?branch=main&style=flat-square&label=CI" alt="CI" />
  </a>
  <a href="https://nextjs.org">
    <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs" alt="Next.js" />
  </a>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/encryption-AES--GCM--256-red?style=flat-square&logo=gnuprivacyguard&logoColor=white" alt="AES-GCM-256" />
  <img src="https://img.shields.io/badge/cost-\$0%2Fmonth-orange?style=flat-square" alt="Free" />
</p>

<p>
  <a href="#-why-blindshare">Why BlindShare?</a> •
  <a href="#-features">Features</a> •
  <a href="#-quick-deploy">Deploy</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-local-development">Local Dev</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

<br/>

> **BlindShare** is a self-hosted, privacy-first alternative to **DocSend** and **Papermark** — built for founders, lawyers, and creators who need to share sensitive documents without trusting a third-party server with their content.

<br/>

</div>

---

## 🤔 Why BlindShare?

| | DocSend | Papermark | **BlindShare** |
|---|:---:|:---:|:---:|
| Self-hosted | ❌ | ✅ | ✅ |
| **Server never sees files** | ❌ | ❌ | ✅ |
| Client-side AES-GCM-256 | ❌ | ❌ | ✅ |
| Per-page analytics | ✅ | ✅ | ✅ |
| Password-protected links | ✅ | ✅ | ✅ |
| NDA clickwrap | ✅ | ❌ | ✅ |
| Dynamic watermarks | ✅ | ✅ | ✅ |
| **Free to host** | ❌ | ❌ | ✅ |
| GDPR-lite data controls | ❌ | ❌ | ✅ |

---

## 🔐 How It Works

BlindShare runs in `e2ee-fragment` mode. Your documents are encrypted **in your browser** before they ever leave your device. The server stores only ciphertext — random bytes it can never decode.

```
┌─────────────────────────────────────────────────────────────┐
│                        SENDER BROWSER                        │
│                                                             │
│   PDF/Doc ──► AES-GCM-256 Encrypt ──► [Ciphertext Blob]   │
│                      ▲                        │             │
│              CSPRNG DocKey              Presigned PUT        │
│                      │                        ▼             │
│              Kept in #fragment      ┌──────────────────┐   │
│                      │              │  Backblaze B2 /  │   │
│                      │              │  Cloudflare R2   │   │
│              Share Link:            │  (Private Bucket)│   │
│   https://app.xyz/view/abc#k=KEY    └──────────────────┘   │
│                      │                        │             │
└──────────────────────┼────────────────────────┼─────────────┘
                       │                        │
                 RFC 3986:                Encrypted bytes
              key NEVER sent           (unreadable garbage)
              to server logs                    │
                       │                        ▼
┌──────────────────────┼────────────────────────────────────┐
│                  RECIPIENT BROWSER                          │
│                                                             │
│   URL #fragment ──► DocKey ──► WebCrypto Decrypt ──► PDF  │
│                                                             │
│   Page events (no PII) ────────────────► Neon DB           │
└─────────────────────────────────────────────────────────────┘

          ┌──────────────────────────────────────┐
          │        SERVER / VERCEL EDGE           │
          │                                       │
          │   Receives: Ciphertext blobs only     │
          │   Cannot decrypt: NO key ever sent    │
          │   Stores: Metadata, analytics, hashes │
          └──────────────────────────────────────┘
```

> **The RFC 3986 Guarantee** — The `#fragment` part of a URL is **never transmitted in HTTP requests**. The decryption key lives only in the recipient's browser memory. Not on the server. Not in logs. Not in the database. Nowhere.

---

## ✨ Features

<details open>
<summary><strong>🔒 Security & Encryption</strong></summary>
<br/>

- **AES-GCM-256** client-side encryption with CSPRNG per-document keys
- **`#k=` URL fragment** key delivery — cryptographically guaranteed to never reach the server
- **PBKDF2 (250,000 iterations)** link password wrapping
- **`__Host-` prefixed** session cookies in production (CSRF-resistant)
- **Brute-force lockout** on login and link password gates
- **Strict Content Security Policy** on every HTTP response
- **Cross-Origin-Opener-Policy** isolation headers
- **PII-redacting structured logger** — no email/IP in logs
- **Gitleaks** secret scanning on every CI run

</details>

<details open>
<summary><strong>📄 Document Management</strong></summary>
<br/>

- Upload **any file type**: PDF, Images, SVG, Markdown, CSV, Audio, Video, ZIP bundles
- Page-by-page **pdf.js renderer** with live dynamic watermark overlay
- **Resume hint** — viewer is shown where they left off
- **Revoke-mid-session watchdog** — pull access from an active viewer instantly
- Multiple **Datarooms** (virtual deal rooms) per user
- **Document versioning** and revision history

</details>

<details open>
<summary><strong>🔗 Link Studio</strong></summary>
<br/>

- **Password protection** with PBKDF2-hashed gate
- **Email gate** — require specific email(s) before access
- **Domain allowlist** — restrict viewing to `@yourcompany.com`
- **NDA clickwrap** — custom terms the viewer must accept
- **Expiry dates** and **max-view limits** per link
- **Download toggle** — prevent viewers from saving files
- **Dynamic watermarks** with viewer's email / IP / timestamp
- **QR code generation** for every share link

</details>

<details>
<summary><strong>📊 Analytics & Tracking</strong></summary>
<br/>

- **Per-page dwell-time sparklines** and completion percentages
- Device class, coarse geo-country, UTM source attribution
- **CSV export** of all view sessions
- Zero-cookie **PrismAnalytics telemetry** (Cloudflare Worker)
- `navigator.sendBeacon` — non-blocking, GDPR-friendly tracking

</details>

<details>
<summary><strong>⚙️ Admin Panel</strong></summary>
<br/>

- User management: roles, suspension, invite code generation
- **Blind audit log** — event trail with zero PII
- Storage usage gauge + free-tier budget ledger
- Maintenance mode and broadcast banner
- **Orphan object sweeper** — clean up abandoned encrypted blobs
- System health dashboard + `/api/health` diagnostic endpoint

</details>

---

## 👥 Access Control

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN (Genesis)                     │
│  ↳ Created automatically — first account on a fresh deploy  │
│  ↳ Full platform control, global audit logs, all invites    │
├─────────────────────────────────────────────────────────────┤
│                         ADMIN                               │
│  ↳ Upload / share documents                                  │
│  ↳ Generate invite codes for team members                    │
│  ↳ View system metrics and storage usage                     │
├─────────────────────────────────────────────────────────────┤
│                    MEMBER (Owner)                            │
│  ↳ Private vault — fully isolated from other users          │
│  ↳ Upload, encrypt, share, create datarooms                  │
│  ↳ Cannot see other users' files or admin settings          │
├─────────────────────────────────────────────────────────────┤
│                   VIEWER / RECIPIENT                         │
│  ↳ External party opening a share link                       │
│  ↳ No account required                                       │
│  ↳ Decrypts in-memory, signs NDAs, enters link passwords     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Deploy

**Zero infrastructure setup required. Runs 100% on free tiers.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SudhirDevOps1/BlindShare)

### Prerequisites (all free)

| Service | Purpose | Link |
|---------|---------|------|
| **Vercel** | Hosting (Next.js) | [vercel.com](https://vercel.com) |
| **Neon** | PostgreSQL database | [neon.tech](https://neon.tech) |
| **Backblaze B2** | Encrypted file storage | [backblaze.com/b2](https://backblaze.com/b2) |

---

### Step 1 — Fork & Deploy

```bash
git clone https://github.com/SudhirDevOps1/BlindShare.git
cd BlindShare
npm install
```

Or click the **Deploy to Vercel** button above for 1-click deployment.

### Step 2 — Neon Database

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the **Pooled Connection String**
3. ✅ No SQL setup needed — all 12 tables are **auto-created on first launch**

### Step 3 — Backblaze B2 Storage

1. Create a free account at [backblaze.com/b2](https://backblaze.com/b2)
2. Create a **Private Bucket** (e.g. `blindshare-vault`)
3. Generate an **Application Key** with read/write access to that bucket

### Step 4 — Environment Variables

Add these in **Vercel → Settings → Environment Variables:**

#### 🔴 Required (Server-only — never exposed to browser)

```env
# Database
DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

# Auth
SESSION_SECRET=<run: openssl rand -hex 64>
ADMIN_BOOTSTRAP_INVITE=BLINDSHARE-GENESIS-2026

# Diagnostics
HEALTH_TOKEN=<run: openssl rand -hex 32>

# Storage — Backblaze B2
STORE_TARGET=b2
B2_ENDPOINT=s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_BUCKET=blindshare-vault
B2_KEY_ID=<from B2 dashboard>
B2_APPLICATION_KEY=<from B2 dashboard>
```

#### 🟡 Optional (Public — browser-safe)

```env
# Zero-cookie telemetry (PrismAnalytics on Cloudflare Worker)
NEXT_PUBLIC_PRISM_ANALYTICS_ID=pa_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_PRISM_ANALYTICS_URL=https://prismanalytics.yourdomain.workers.dev/api/track

# Contact form (FormForge / ApnaForm)
NEXT_PUBLIC_CONTACT_FORM_ACTION=https://apnaform.yourdomain.workers.dev/api/submit/endpoint_xxx

# Branding
PUBLIC_APP_NAME=BlindShare
PUBLIC_BRAND_ACCENT=#f59e0b
```

### Step 5 — First Launch

1. Open your deployed app URL
2. Register — the **first account** on a fresh database is automatically **Super Admin**
3. Start uploading and sharing documents securely!

---

## 💻 Local Development

```bash
# 1. Clone
git clone https://github.com/SudhirDevOps1/BlindShare.git
cd BlindShare

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your Neon, B2, and session credentials

# 4. Start dev server
npm run dev
# → http://localhost:3000
```

**Available commands:**

```bash
npm run dev          # Start development server with hot reload
npm run build        # Production build
npm run typecheck    # TypeScript strict type checking
npm run lint         # ESLint code quality check
```

---

## 🔒 Account & Security Settings

Navigate to **Dashboard → Settings `/dashboard/settings`:**

| Setting | Description |
|---------|-------------|
| **Display Name & Email** | Update your profile credentials instantly |
| **Change Password** | Requires current password; automatically logs out all other devices |
| **Invite Code Generator** | Mint single/multi-use codes with role assignment and expiry |
| **Sign Out All Devices** | Invalidate all active session tokens globally with 1 click |

---

## 🧹 Factory Reset

Wipe everything and start fresh on Neon:

```bash
# In Neon Console → SQL Editor, run scripts/reset-db.sql:
DROP TABLE IF EXISTS page_events, view_sessions, signatures, links,
  dataroom_docs, datarooms, doc_versions, documents, push_subscriptions,
  audit_log, system_settings, invites, users CASCADE;
```

Then reopen your deployed URL and register a fresh Super Admin account.

---

## 🏗️ Tech Stack

```
┌──────────────────────────────────────────────┐
│                  FRONTEND                     │
│  Next.js 16 App Router · Tailwind CSS v4     │
│  WebCrypto API · pdf.js · TypeScript          │
├──────────────────────────────────────────────┤
│                  BACKEND                      │
│  Next.js API Routes (Serverless)              │
│  Zod Validation · HMAC Session Auth          │
│  Drizzle ORM · Rate Limiting                 │
├──────────────────────────────────────────────┤
│                 DATA LAYER                    │
│  Neon PostgreSQL (pg pool)                   │
│  Backblaze B2 / Cloudflare R2 (S3)           │
├──────────────────────────────────────────────┤
│                INFRASTRUCTURE                 │
│  Vercel Edge · Cloudflare Workers            │
│  GitHub Actions CI · Gitleaks Security Scan  │
└──────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
BlindShare/
├── src/
│   ├── app/
│   │   ├── api/                 # REST API: auth, docs, links, admin
│   │   ├── dashboard/           # Authenticated dashboard UI
│   │   │   └── settings/        # Profile, password & invite manager
│   │   ├── view/[id]/           # Zero-knowledge public viewer
│   │   ├── contact/             # Feedback & contact form
│   │   ├── login/               # Auth pages
│   │   └── layout.tsx           # Root layout + PrismAnalytics
│   ├── components/
│   │   ├── analytics/           # PrismTracker
│   │   ├── contact/             # Contact modal
│   │   └── ui/                  # Shared UI primitives
│   ├── db/
│   │   ├── index.ts             # pg pool singleton
│   │   └── auto-migrate.ts      # First-run schema migrator (12 tables)
│   ├── lib/
│   │   ├── auth/                # Session, RBAC, password, brute-force
│   │   ├── crypto/              # AES-GCM-256, PBKDF2 helpers
│   │   ├── storage/             # B2 / R2 / local adapters
│   │   └── i18n/                # EN + HI translations
│   └── middleware.ts            # CSP headers · auth guard · rate limiting
│
├── scripts/
│   ├── reset-db.sql             # One-click factory reset
│   ├── selfcheck-e2ee.mjs       # Zero-knowledge self-audit
│   └── make-demo-pdf.mjs        # Demo document generator
│
├── docs/
│   └── RUNBOOK.md               # Full operations runbook
│
├── .github/
│   └── workflows/
│       ├── ci.yml               # Typecheck · Lint · Build · Security scan
│       └── release.yml          # Auto GitHub Release on tag push
│
├── public/brand/                # Logo · PWA icons · favicons
├── CHANGELOG.md                 # Keep-a-Changelog format
├── SECURITY.md                  # Responsible disclosure policy
└── .env.example                 # All variables with documentation
```

---

## 📋 Roadmap

- **v1.2 — Live Collaboration**
  - Real-time deck sync via WebSocket rooms
  - Request-access flow (viewer can ask for access)
  - Geo/time gates (restrict to country or business hours)
  - Kill-switch — revoke a link from analytics dashboard
  - Q&A ping (viewer can message owner without leaving the doc)

- **v1.3 — Engagement Intelligence**
  - Voice notes per page
  - Lead scoring based on dwell time and engagement
  - Cover-page builder
  - Outgoing webhooks on view events

- **v2.0 — Mobile**
  - Capacitor Android app
  - Share-sheet upload from any app
  - Biometric lock for the vault
  - `FLAG_SECURE` — prevent screenshot on Android

---

## 🔒 Security Policy

We take security seriously. See [SECURITY.md](./SECURITY.md) for responsible disclosure instructions.

**TL;DR** — if you find a vulnerability, please email the maintainer privately before opening a public issue.

---

## 🤝 Contributing

Contributions are welcome! Please read the [contributing guide](./docs/RUNBOOK.md) first.

```bash
# Fork the repo, then:
git checkout -b feat/your-feature
git commit -m "feat: describe your change"
git push origin feat/your-feature
# Open a Pull Request
```

---

## 📜 License

[MIT License](./LICENSE) — Copyright (c) 2026 BlindShare contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies — subject to the MIT License terms.

- ✅ **Free to use** — personal, commercial, or enterprise
- ✅ **Free to self-host** — no licensing fees ever
- ✅ **Free to modify** — fork and build your own version
- ✅ **Free to distribute** — open or closed source


---

<div align="center">

<br/>

**Built with ❤️ · Zero-knowledge by design · Free forever**

<br/>

[⭐ Star on GitHub](https://github.com/SudhirDevOps1/BlindShare) &nbsp;·&nbsp;
[🐛 Report a Bug](https://github.com/SudhirDevOps1/BlindShare/issues/new) &nbsp;·&nbsp;
[💡 Request a Feature](https://github.com/SudhirDevOps1/BlindShare/discussions) &nbsp;·&nbsp;
[📋 Changelog](./CHANGELOG.md)

<br/>

<sub>BlindShare is not affiliated with DocSend or Papermark. All trademarks belong to their respective owners.</sub>

</div>
