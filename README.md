<div align="center">

<img src="public/brand/logo.svg" alt="BlindShare Logo" width="80" height="80" />

# BlindShare

**Zero-Knowledge Secure Document Sharing & Analytics**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.0-blue?style=flat-square)](https://github.com/SudhirDevOps1/BlindShare/releases/tag/v1.1.0)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![PostgreSQL](https://img.shields.io/badge/Database-Neon%20PostgreSQL-336791?style=flat-square&logo=postgresql)](https://neon.tech)
[![Storage](https://img.shields.io/badge/Storage-Backblaze%20B2-E05025?style=flat-square)](https://www.backblaze.com/b2/cloud-storage.html)

A privacy-first, self-hosted alternative to DocSend and Papermark — built for sharing sensitive pitches, contracts, and confidential files with per-page view analytics. **Completely free to deploy and run on the \$0 free tiers.**

[🚀 Quick Deploy](#-quick-deployment) · [📖 Documentation](./docs/RUNBOOK.md) · [🔒 Security](./SECURITY.md) · [📋 Changelog](./CHANGELOG.md)

</div>

---

## 🔐 How Zero-Knowledge Works

Ordinary document platforms store readable files on their servers. BlindShare never does — **the server is a blind courier:**

```
Owner Browser                   Encrypted Storage (B2/R2)
     │                                     │
     ├─1. Generate 256-bit DocKey          │
     ├─2. AES-GCM-256 Encrypt (Client)     │
     ├─3. Upload Ciphertext ──────────────►│
     ├─4. Share Link: /view/xyz#k=<key>    │
     │                                     │
Recipient Browser                          │
     ├─5. Fetch Ciphertext ───────────────►│
     ├─6. WebCrypto Decrypt (In-Memory)    │
     └─7. Render Document                  │
                                           │
          Server / Vercel Edge ──────────✗─┘
          (Cannot read the files — ever)
```

> **The RFC 3986 Guarantee:** The `#k=...` decryption key is a URL **fragment** — it is **never transmitted** in HTTP requests to the server, database, or logs. The server is cryptographically blind to your file contents.

---

## ✨ Features

### 🔒 Security & Encryption
- **AES-GCM-256** client-side encryption with CSPRNG per-document keys
- **`#k=` URL fragment** delivery — key never reaches the server
- **PBKDF2 (250k iterations)** link password hashing
- **`__Host-` prefixed** session cookies in production
- **Brute-force lockout** on login and link password gates
- **Cross-Origin-Opener-Policy** + strict CSP security headers

### 📄 Document Management
- Upload any file type: PDF, Images, SVG, Markdown, CSV, Audio, Video, ZIP bundles
- Page-by-page **pdf.js renderer** with live watermark overlay
- Multiple **Datarooms** (virtual deal rooms) per user
- Document versioning and revision history

### 🔗 Link Studio
- Password protection, email gate, and domain allowlist per link
- NDA clickwrap and custom terms before access
- Expiry dates, max-view limits, and download toggle
- Dynamic watermarks with viewer's email/IP
- QR code generation for every share link

### 📊 Analytics
- Per-page dwell-time sparklines and completion percentages
- Device class, coarse geo-country, UTM attribution
- CSV export of all view sessions
- Zero-cookie PrismAnalytics telemetry (Cloudflare Worker)

### 👥 Multi-Role Access Control
| Role | Description |
|------|-------------|
| 👑 **Super Admin** | First account registered. Full platform control, global audit logs, master invite creation. |
| 🛡️ **Admin** | Can upload/share documents and mint new invite codes for team members. |
| 👤 **Member** | Private vault with isolated documents. Cannot see other users' files or admin settings. |
| 👁️ **Viewer / Recipient** | External party opening a share link. No account required. |

### ⚙️ Admin Panel
- User management: roles, suspension, and invite code generation
- Blind audit log (zero-PII event trail)
- Storage usage gauge + free-tier budget ledger
- Maintenance mode and broadcast banner
- Orphan object sweeper (clean up abandoned encrypted blobs)

---

## 🚀 Quick Deployment

**Stack:** Vercel (hosting) + Neon (PostgreSQL) + Backblaze B2 (encrypted blob storage)

### Step 1 — Clone & Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SudhirDevOps1/BlindShare)

Or deploy manually:

```bash
git clone https://github.com/SudhirDevOps1/BlindShare.git
cd BlindShare
npm install
```

### Step 2 — Create a Free Neon Database

1. Sign up at [neon.tech](https://neon.tech) (free tier is sufficient)
2. Create a project and copy the **Pooled Connection String**
3. ✅ **No manual SQL needed** — BlindShare auto-creates all 12 tables on first launch

### Step 3 — Create a Backblaze B2 Bucket

1. Sign up at [backblaze.com/b2](https://www.backblaze.com/b2/cloud-storage.html)
2. Create a **Private Bucket** (e.g. `blindshare-vault`)
3. Generate an **Application Key** with read/write access to that bucket

### Step 4 — Set Environment Variables

Add these to your Vercel project dashboard under **Settings → Environment Variables:**

#### 🔴 Required — Server Only (Never expose to browser)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon Postgres connection string | `postgres://user:pass@ep-...neon.tech/neondb?sslmode=require` |
| `SESSION_SECRET` | 64+ char random hex for HMAC session cookies | `openssl rand -hex 64` |
| `ADMIN_BOOTSTRAP_INVITE` | Secret code for first-run Super Admin registration | `BLINDSHARE-GENESIS-2026` |
| `HEALTH_TOKEN` | Token to access `/api/health` diagnostics endpoint | `openssl rand -hex 32` |
| `STORE_TARGET` | Storage backend | `b2` |
| `B2_ENDPOINT` | Backblaze S3-compatible endpoint | `s3.us-east-005.backblazeb2.com` |
| `B2_REGION` | B2 region identifier | `us-east-005` |
| `B2_BUCKET` | Your B2 bucket name | `blindshare-vault` |
| `B2_KEY_ID` | Backblaze Application Key ID | *(from B2 dashboard)* |
| `B2_APPLICATION_KEY` | Backblaze Application Key Secret | *(from B2 dashboard)* |

#### 🟡 Optional — Public (Safe for browser)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_PRISM_ANALYTICS_ID` | PrismAnalytics Site ID (`pa_...`) |
| `NEXT_PUBLIC_PRISM_ANALYTICS_URL` | PrismAnalytics Track URL |
| `NEXT_PUBLIC_CONTACT_FORM_ACTION` | FormForge / ApnaForm submit endpoint |
| `PUBLIC_APP_NAME` | Override the app name (default: `BlindShare`) |

### Step 5 — Register Your Super Admin Account

1. Open your deployed app URL
2. Register — the **first account** on a fresh database is **automatically** granted Super Admin
3. Log in and start uploading documents!

---

## 🔧 Account & Security Settings

Navigate to **Dashboard → Settings** to manage:

- **Profile:** Update display name and login email
- **Password:** Change password (requires current password; logs out all other devices automatically)
- **Invite Codes:** Generate invite codes for team members with role assignment (`Member`, `Admin`, `Super Admin`), custom expiry, and 1-click clipboard copy
- **Sessions:** Sign out of all devices simultaneously

---

## 💻 Local Development

```bash
# Clone the repo
git clone https://github.com/SudhirDevOps1/BlindShare.git
cd BlindShare

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env

# Start development server
npm run dev
# → http://localhost:3000
```

**Available Scripts:**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run build` | Production build |
| `npm run typecheck` | Run TypeScript type checks |
| `npm run lint` | Run ESLint |

---

## 🧹 Factory Reset (Database Wipe)

To completely wipe all data and start fresh on Neon:

1. Open [Neon Console](https://console.neon.tech) → **SQL Editor**
2. Paste and run [`scripts/reset-db.sql`](./scripts/reset-db.sql):

```sql
DROP TABLE IF EXISTS page_events, view_sessions, signatures, links,
  dataroom_docs, datarooms, doc_versions, documents, push_subscriptions,
  audit_log, system_settings, invites, users CASCADE;
```

3. Reopen your deployed URL → Register a fresh Super Admin account

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | Neon PostgreSQL (via `pg` pool) |
| **ORM** | Drizzle ORM |
| **Storage** | Backblaze B2 / Cloudflare R2 (S3-compatible) |
| **Encryption** | WebCrypto API (AES-GCM-256, PBKDF2) |
| **Auth** | Custom HMAC session cookies (`__Host-` prefix) |
| **Hosting** | Vercel (Edge + Serverless) |
| **Analytics** | PrismAnalytics (Cloudflare Worker, zero-cookie) |
| **Contact** | FormForge / ApnaForm (Cloudflare Worker) |
| **Styling** | Tailwind CSS v4 |
| **Validation** | Zod |
| **CI/CD** | GitHub Actions (CI + Auto Release) |

---

## 📁 Project Structure

```
BlindShare/
├── src/
│   ├── app/                  # Next.js App Router pages & API routes
│   │   ├── api/              # REST API endpoints
│   │   ├── dashboard/        # Authenticated dashboard views
│   │   ├── login/            # Authentication pages
│   │   ├── view/             # Public document viewer
│   │   └── contact/          # Feedback & contact form
│   ├── components/           # Reusable UI components
│   ├── db/                   # Database pool & auto-migrator
│   ├── lib/
│   │   ├── auth/             # Session, RBAC, password utilities
│   │   ├── crypto/           # E2EE helpers
│   │   ├── storage/          # B2/R2/local storage adapters
│   │   └── i18n/             # EN + HI translations
│   └── middleware.ts          # CSP headers, auth guards, rate limiting
├── scripts/
│   ├── reset-db.sql          # Factory reset script
│   ├── selfcheck-e2ee.mjs    # Zero-knowledge self-audit
│   └── make-demo-pdf.mjs     # Demo document generator
├── docs/
│   └── RUNBOOK.md            # Full operations runbook
├── public/brand/             # Logo and PWA icons
├── .github/workflows/        # CI + Auto Release GitHub Actions
├── CHANGELOG.md
└── SECURITY.md
```

---

## 🔒 Security Policy

See [SECURITY.md](./SECURITY.md) for responsible disclosure instructions and our security policy.

**Security features at a glance:**
- Zero plain-text file storage — server is cryptographically blind
- Strict Content Security Policy on every response
- PII-redacting structured logger
- GDPR-lite: data export and account deletion built-in
- Automated secret scanning with Gitleaks on every CI run

---

## 📋 Roadmap

- **Phase 2:** Live deck sync (WebSocket rooms), request-access flow, geo/time gates, kill-switch
- **Phase 3:** Voice notes per page, lead scoring, cover-page builder, webhooks
- **Phase 4:** Capacitor Android app (share-sheet upload, biometric lock, `FLAG_SECURE`)

---

## 📜 License

[MIT License](./LICENSE) — Free to use, self-host, and modify.

---

<div align="center">

Built with ❤️ · Zero-knowledge by design · Free forever on open infrastructure

**[⭐ Star on GitHub](https://github.com/SudhirDevOps1/BlindShare)** · **[📋 View Changelog](./CHANGELOG.md)** · **[🐛 Report Issue](https://github.com/SudhirDevOps1/BlindShare/issues)**

</div>
