<div align="center">

<br />

<img alt="BlindShare" src="public/brand/icon.png" width="128" height="128" style="border-radius: 28px;" />

<h1>🔏 BlindShare</h1>

<p>
  <strong>Zero-Knowledge Encrypted Document Sharing &amp; Analytics Platform</strong><br/>
  <sub>The server never sees your files — ever. Not once. Not ever.</sub>
</p>

<p>
  <a href="https://github.com/SudhirDevOps1/BlindShare/releases/tag/v1.3.0">
    <img src="https://img.shields.io/badge/version-v1.3.0-22c55e?style=for-the-badge&logo=git&logoColor=white" alt="v1.3.0" />
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-3b82f6?style=for-the-badge" alt="MIT License" />
  </a>
  <a href="https://github.com/SudhirDevOps1/BlindShare/security/code-scanning">
    <img src="https://img.shields.io/badge/CodeQL-0%20Alerts%20(100%25%20Clean)-success?style=for-the-badge&logo=github&logoColor=white" alt="CodeQL 100% Clean" />
  </a>
  <a href="https://github.com/SudhirDevOps1/BlindShare/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/SudhirDevOps1/BlindShare/ci.yml?branch=main&style=for-the-badge&label=CI+%2F+CD&logo=githubactions&logoColor=white" alt="CI / CD" />
  </a>
  <img src="https://img.shields.io/badge/cost-%240%2Fmonth-f59e0b?style=for-the-badge&logo=cashapp&logoColor=white" alt="Free Forever" />
</p>

<p>
  <a href="https://github.com/SudhirDevOps1/BlindShare/stargazers">
    <img src="https://img.shields.io/github/stars/SudhirDevOps1/BlindShare?style=social" alt="GitHub Stars" />
  </a>
  <a href="https://nextjs.org">
    <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs" alt="Next.js" />
  </a>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/encryption-AES--GCM--256-ef4444?style=flat-square&logo=gnuprivacyguard&logoColor=white" alt="AES-GCM-256" />
  <img src="https://img.shields.io/badge/i18n-EN%20%2F%20%E0%A4%B9%E0%A4%BF%E0%A4%A8%E0%A5%8D%E0%A4%A6%E0%A5%80-8b5cf6?style=flat-square" alt="Bilingual EN/HI" />
  <img src="https://img.shields.io/badge/PRs-welcome-10b981?style=flat-square" alt="PRs Welcome" />
  <a href="https://github.com/SudhirDevOps1/BlindShare/issues">
    <img src="https://img.shields.io/github/issues/SudhirDevOps1/BlindShare?style=flat-square&color=f97316" alt="Open Issues" />
  </a>
  <a href="https://github.com/SudhirDevOps1/BlindShare/pulls">
    <img src="https://img.shields.io/github/issues-pr/SudhirDevOps1/BlindShare?style=flat-square&color=8b5cf6" alt="Pull Requests" />
  </a>
</p>

<p>
  <a href="#-why-blindshare">Why BlindShare?</a> &nbsp;•&nbsp;
  <a href="#-features">Features</a> &nbsp;•&nbsp;
  <a href="#-1-click-deployment-presets">Deploy</a> &nbsp;•&nbsp;
  <a href="#-how-it-works">How It Works</a> &nbsp;•&nbsp;
  <a href="#-local-development">Local Dev</a> &nbsp;•&nbsp;
  <a href="./docs/CONTRIBUTING.md">Contributing</a> &nbsp;•&nbsp;
  <a href="#-roadmap">Roadmap</a>
</p>

<br/>

> **BlindShare** is a self-hosted, privacy-first alternative to **traditional centralized document sharing tools** — built for founders, lawyers, and creators who need to share sensitive documents without trusting a third-party server with their content.

<br/>

</div>

---

## 🤔 Why BlindShare?

> The only document sharing platform where **the server is mathematically incapable of reading your files.**

| Feature | Traditional Cloud Platforms | Other Web Tools | **BlindShare** |
|---|:---:|:---:|:---:|
| Self-hosted | ❌ | ✅ | ✅ |
| **Server never sees files** | ❌ | ❌ | ✅ |
| Client-side AES-GCM-256 | ❌ | ❌ | ✅ |
| Per-page analytics | ✅ | ✅ | ✅ |
| Password-protected links | ✅ | ✅ | ✅ |
| NDA clickwrap | ✅ | ❌ | ✅ |
| Dynamic watermarks | ✅ | ✅ | ✅ |
| **Permanent indelible PDF watermark on download** | ❌ | ❌ | ✅ |
| **Auto vault unlock on login (Bitwarden model)** | ❌ | ❌ | ✅ |
| **In-doc real-time Q&A with founder replies** | ❌ | ❌ | ✅ |
| **AI lead conviction intent scoring** | ❌ | ❌ | ✅ |
| **Free to host** | ❌ | ❌ | ✅ |
| GDPR-lite data controls | ❌ | ❌ | ✅ |
| **24 automated security tests (CI)** | ❌ | ❌ | ✅ |

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

## 🛡️ Enterprise Zero-Knowledge Key Vault & Cache-Immune Recovery

BlindShare features a **Zero-Knowledge Master Key Vault** that guarantees you never lose access to your document links—even after clearing your browser cache, wiping local storage, or switching to a new laptop/phone.

```
[ User Account Password ] + [ 16-Byte Cryptographic Salt ]
           │
           ▼  (WebCrypto API: 100,000 Rounds PBKDF2-SHA256 in Browser RAM)
[ 256-bit Owner Master Key ] ──(Never leaves device memory)──┐
           │                                                  │
           ▼                                                  ▼
[ Database stores AES-GCM-256 wrapped keys ] ──► [ Unwrapped in RAM on Login ]
```

### 🔄 What Happens When You Clear Your Browser Cache?
1. **Cache / Local Storage Wiped**: Local memory is cleared, but your documents and wrapped keys remain encrypted in the database.
2. **Re-Login with Account Password**: When you log in, your browser derives the `OwnerMasterKey` in RAM via 100,000 PBKDF2 rounds.
3. **Instant In-Memory Sync**: The browser retrieves your wrapped document keys and unwraps all 32-byte `DocKeys` locally in 0.1s.
4. **All Links Restored**: Your dashboard links immediately display with `#k=...` ready to share, maintaining 100% Zero-Knowledge confidentiality.

---

## 🔒 Client-Side WebCrypto vs. Server Environment Secrets

| Layer | Environment | Technology | Primary Responsibility |
|---|---|---|---|
| **Client Application** | Browser RAM Only | WebCrypto AES-GCM-256 + PBKDF2 (100k) | Document encryption/decryption, `#k=` fragment delivery, and Master Key unwrapping. |
| **Server Infrastructure** | Vercel / Cloudflare (`.env`) | Node.js Crypto (HMAC-SHA256) | Session token signatures (`SESSION_SECRET`), rate-limiting, and storage routing. |
| **Encrypted Storage** | Backblaze B2 / Cloudflare R2 | S3-Compatible Private Buckets | Stores encrypted ciphertext blobs. Zero plaintext access. |

---

## ✨ Features

<details open>
<summary><strong>🔒 Security & Encryption</strong></summary>
<br/>

- **Enterprise Zero-Knowledge Owner Master Key Vault** — client-side PBKDF2 (100k rounds) + AES-GCM-256 wrapping for seamless cross-device, cache-immune document key persistence
- **Auto Master Vault Unlock on Login (Bitwarden / Proton Model)** — PBKDF2 master key derived automatically on login and 2FA; all document keys unwrapped in background with zero user friction
- **Transparent Client-Side GZIP Compression** — 50–80% storage footprint reduction on B2/R2 with zero server CPU load
- **Live DNS MX Verification & Temp Email Blocker** — real-time Node.js DNS resolution + 40+ disposable domain blocklist + SSRF private IP filter
- **Tab-Switch Anti-Spy Privacy Shield** — auto-obfuscates confidential documents when reader switches tabs/windows
- **Burn-After-Reading Self-Destruct Links** — atomic single-use link crypto-shredding upon initial access
- **Two-Factor Authentication (2FA / TOTP RFC 6238)** — Google Authenticator, Authy, 1Password QR code scan + 8 emergency backup codes
- **AES-GCM-256** client-side encryption with CSPRNG per-document keys
- **`#k=` URL fragment** key delivery — cryptographically guaranteed to never reach the server
- **SSRF Defense Engine** — private RFC 1918 subnets, loopback interfaces, and cloud metadata (`169.254.169.254`) filtering
- **ALTCHA Proof-of-Work Bot Defense** — 100% self-hosted, cookie-less SHA-256 PoW challenge verification with HMAC signatures & replay prevention
- **Distributed Edge Rate Limiting** — Upstash Redis REST support with seamless zero-crash in-memory sliding window fallback
- **PBKDF2 (250,000 iterations)** link password wrapping
- **`__Host-` prefixed** session cookies in production (CSRF-resistant)
- **Brute-force lockout** on login and link password gates
- **Strict Content Security Policy (CSP)** & Cross-Origin-Opener-Policy isolation
- **PII-redacting structured logger** — no email/IP in logs
- **Gitleaks** secret scanning on every CI run
- **CodeQL SAST** — 86/86 alerts resolved, 0 open vulnerabilities
- **24 automated enterprise security tests** (`npm test`) — zero-knowledge crypto, ALTCHA PoW, SSRF, HMAC, XSS, SIEM, DuckDB, AI scoring

</details>

<details open>
<summary><strong>📄 Document Management & Viewer</strong></summary>
<br/>

- Upload **any file type**: PDF, Images (PNG, JPG, WebP, GIF, AVIF, BMP), SVG, Markdown, CSV/Spreadsheet, Audio, Video, ZIP bundles
- **Permanent Indelible PDF Watermark on Download** — `pdf-lib` burns diagonal multi-layer watermarks (email, timestamp, slug, custom text) permanently into every page stream before export
- **Tab-Level Decrypted Session Cache** — 10ms (0.01s) instant F5 refresh reloads using ephemeral `sessionStorage` buffer; auto-wiped on tab close, zero re-download or re-decrypt
- **In-Doc Interactive Question Pins & Live Q&A** — reader click-to-pin question overlay on slides; real-time 3-second watchdog syncs founder replies without requiring page reload
- **Dedicated Q&A Inbox Dashboard** — centralized founder view with search, filter (All/Pending/Resolved), and inline reply composer
- **Voice Pitch Walkthrough Notes** — founder audio explanations attached to slides with floating wave player
- **Live Presenter Room & Co-Browsing** — real-time host-to-viewer slide broadcast and synchronization
- **300+ DPI Retina Crisp Super-Sampling** — ultra-sharp vector rendering on 1080p/2K/4K/Retina displays
- **Interactive Text Layer** — full text selection, clipboard copy, `Ctrl+F` search, and clickable hyperlinks over canvas slides
- **Fullscreen Pitch Presentation Mode** — slideshow presenter view with interactive red laser pointer, keyboard navigation (`Space`, `Arrows`, `L`), and watermark sync
- **Resilient Self-Hosted PDF.js Engine** with high-availability CDN fallback (zero single points of failure)
- **Smart Viewport Auto-Fitting** for seamless mobile and desktop reading
- **Resume hint** — viewer is shown where they left off
- **Revoke-mid-session watchdog** — pull access from an active viewer instantly
- Multiple **Datarooms** (virtual deal rooms) per user
- **Document versioning** and revision history
- **Double-submission lock** — prevents duplicate uploads or datarooms

</details>

<details open>
<summary><strong>🔗 Link Studio</strong></summary>
<br/>

- **Granular 1-Click Expiry Presets** — `1 Hour`, `24 Hours`, `7 Days`, `30 Days`, and custom date/time picker
- **Granular Max-View Limits** — `1 View (Burn)`, `5 Views`, `25 Views`, `100 Views`, and custom numeric limit
- **Password protection** with PBKDF2-hashed gate
- **Email gate** with live MX DNS validation — require authentic corporate or personal emails before access
- **Domain allowlist** — restrict viewing to `@yourcompany.com`
- **NDA clickwrap** — custom terms the viewer must accept
- **Digital Signatures** — in-app touch/mouse canvas signature signing
- **Download toggle** — prevent viewers from saving files
- **Dynamic watermarks** with viewer's email / IP / timestamp
- **QR code generation** for every share link
- **In-app confirmation modals** replacing native browser popups

</details>

<details open>
<summary><strong>📊 Analytics & AI Intent Scoring</strong></summary>
<br/>

- **AI Lead Conviction Intent Scoring Engine** — 0–100 conviction score (`🔥 HOT DEAL`, `⚡ WARM`, `❄️ CASUAL`) with actionable buyer signal pills
- **Per-page dwell-time sparklines** and completion percentages
- Device class, coarse geo-country, UTM source attribution
- **CSV export** of all view sessions
- Zero-cookie **PrismAnalytics telemetry** (Cloudflare Worker)
- `navigator.sendBeacon` — non-blocking, GDPR-friendly tracking

</details>

<details open>
<summary><strong>⚙️ Admin Panel & Diagnostics</strong></summary>
<br/>

- **Environment & Diagnostics Center** — live Neon Postgres ping latency meter (ms), B2 storage status, WebCrypto cipher tests, and 13+ masked environment keys
- User management: roles, suspension, invite code generation, and 2FA status
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

> **Zero infrastructure setup required. Runs 100% on free tiers without requiring a credit card.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SudhirDevOps1/BlindShare)

---

## 💰 ₹0 / $0 Free-Tier Benchmark & Honest Traffic Analysis

### 📊 Exactly How Much Traffic Can Your App Handle for ₹0/Month?

If you deploy BlindShare on **Vercel + Neon Postgres + Backblaze B2 (Your Current Stack)**, here is the exact, honest capacity breakdown:

| Resource | Free Tier Quota (No Credit Card) | BlindShare Usage Consumption | Real-World Free Capacity |
|---|---|---|---|
| **Vercel Hobby** | 100 GB Fast Bandwidth / month<br/>1,000,000 Serverless Edge Executions / mo | ~50 KB per viewer page load (HTML + JS bundle) | **~5,000 to 10,000 daily views** (~150,000+ views/month) |
| **Neon PostgreSQL** | 512 MB Storage<br/>190 Compute Hours / month (Auto-sleeps on idle) | ~1 KB per document<br/>~0.5 KB per link<br/>~0.4 KB per view session | **~500,000+ document view sessions & links** stored in DB |
| **Backblaze B2** | 10 GB Free Storage Forever<br/>1 GB / day (30 GB / mo) free download egress | Encrypted PDF pitch deck = ~1 MB average | **~5,000 to 10,000 pitch decks & files** in vault |
| **Client-Side Crypto** | $0 (Runs 100% in viewer's browser CPU) | AES-GCM-256 WebCrypto | **Unlimited** (Zero server CPU cost for encryption/decryption) |

> 💡 **Why is it so efficient?** Because BlindShare uses **Presigned S3 Direct Uploads**, document uploads go straight from the owner's browser to Backblaze B2 without passing through Vercel. Your Vercel bandwidth is never consumed by large document uploads!

---

## 🚀 1-Click Deployment Presets

> Choose your desired deployment preset below — all are **100% free, no credit card required.**

### 🟢 Preset A: Cloud Serverless *(Recommended Default)*

**Vercel / Render + Neon Postgres + Backblaze B2**

| | Details |
|---|---|
| ⚡ **Setup Time** | 2 Minutes |
| 💰 **Monthly Cost** | $0 (Free Forever on Neon + Vercel/Render Hobby + B2 10 GB) |
| ⚙️ **Config** | Auto-creates database schema on first launch, zero server management. |

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSudhirDevOps1%2FBlindShare&env=DATABASE_URL,SESSION_SECRET,ADMIN_BOOTSTRAP_INVITE,HEALTH_TOKEN,B2_KEY_ID,B2_APPLICATION_KEY,B2_BUCKET_NAME,B2_ENDPOINT)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/SudhirDevOps1/BlindShare)

---

### 🟢 Preset B: Zero-Cost Self-Hosted *(100% Free DB)*

**Docker / VPS + SQLite + Litestream B2**
[![Deploy with Docker](https://img.shields.io/badge/Deploy-Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](./docs/LITESTREAM-SELFHOSTING.md)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/new)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/SudhirDevOps1/BlindShare)

Run BlindShare on any VPS, Docker host, Raspberry Pi, Render, or Railway with **zero database hosting fees**. Litestream streams your SQLite Write-Ahead Logs (WAL) continuously to your private **Backblaze B2** bucket with sub-second Recovery Point Objective (RPO).

```mermaid
graph LR
    User[👥 Viewers & Owners] -->|HTTP / API| App[⚡ Next.js App]
    App -->|Reads/Writes 0ms latency| SQLite[(📁 Local SQLite DB)]
    Litestream[🌊 Litestream Daemon] -->|Streams WAL every 1s| B2[☁️ Backblaze B2 Vault]
    SQLite -.->|Monitors WAL changes| Litestream
    B2 -.->|Auto-Restore on Boot| SQLite
```

#### 🛠️ 1-Command Startup:
```bash
# 1. Clone repository
git clone https://github.com/SudhirDevOps1/BlindShare.git && cd BlindShare

# 2. Configure your .env for Mode B (SQLite + B2)
cp .env.example .env

# 3. Launch container with embedded Litestream auto-replication
docker compose -f deploy/docker-compose.yml up -d --build
```

#### ⚙️ Preset B Environment Configuration (`.env`):
```ini
NODE_ENV=production
DATABASE_DRIVER=sqlite
DATABASE_URL=file:/data/blindshare.db
SESSION_SECRET=generate_with_openssl_rand_hex_64
ADMIN_BOOTSTRAP_INVITE=SUPER-ADMIN-PASS-999
HEALTH_TOKEN=health_secret_token_99x

# Backblaze B2 (Handles both encrypted documents & database WAL replicas for $0)
B2_KEY_ID=your_b2_key_id
B2_APPLICATION_KEY=your_b2_app_key
B2_BUCKET_NAME=your_b2_bucket_name
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
STORE_TARGET=b2
DOCS_ENCRYPTION_MODE=e2ee-fragment
```

#### 🛡️ Key Advantages of Preset B:
- 💰 **$0 Database Cost Forever:** No expensive managed cloud databases (Neon/Supabase/RDS) required.
- ⚡ **Zero-Latency In-Process Queries:** Reads and writes execute directly on local disk with 0 network latency.
- 🔄 **Autonomous Disaster Recovery:** On boot, `deploy/entrypoint.sh` checks if the local DB exists; if not, it automatically downloads and recovers the latest snapshot from Backblaze B2 in seconds.
- 🦆 **Built-In DuckDB Analytics:** Page dwell-time aggregations and percentiles are processed instantly without taxing your database.
- 📖 **Full Self-Hosting Guide:** See [docs/LITESTREAM-SELFHOSTING.md](./docs/LITESTREAM-SELFHOSTING.md) for Nginx reverse proxy, SSL certbot, and systemd service scripts.

---

### 🌐 Dual-Language Support (English / हिन्दी)

BlindShare features first-class internationalization out of the box:
- **Instant Language Switching:** Toggle seamlessly between **English (EN)** and **हिन्दी (HI)** from the navigation header without reloading or losing state.
- **100% Localized:** Document Viewer, Security Watermarks, Lead Scoring Analytics, In-Doc Question Pins, Audio Walkthrough Notes, and System Admin Panel are fully translated.
- **Type-Safe i18n:** Built on typed dictionaries with zero runtime overhead or external translation API delays.

---

### 🟢 Preset C: Edge & Infinite Bandwidth *(100% Free, Zero Card, Unlimited Egress)*

**Cloudflare Pages / Vercel + Turso / Neon + Backblaze B2 (Bandwidth Alliance)**

| | Details |
|---|---|
| ⚡ **Setup Time** | 3 Minutes |
| 💰 **Monthly Cost** | $0 (1 Billion Reads Turso + 10 GB B2 + $0 Unlimited Egress via Bandwidth Alliance) |
| 💳 **Credit Card** | **Zero / None Required** (100% Free Forever Tiers) |
| 🚀 **Deploy Target** | Cloudflare Pages / Vercel / Netlify |

Combine **Cloudflare's Global CDN** with **Backblaze B2** under the **Bandwidth Alliance** to get **100% $0 unlimited download bandwidth** without paying egress fees or needing a credit card.

```mermaid
graph LR
    User["👥 Viewers & Downloaders"] -->|"Unlimited $0 Egress"| CF["⚡ Cloudflare CDN Edge<br/>(Free Plan, No Card)"]
    CF -->|"Bandwidth Alliance: $0 Transfer"| B2["☁️ Backblaze B2 Vault<br/>(10 GB Free, No Card)"]
    App["🚀 BlindShare App<br/>(Cloudflare Pages / Vercel)"] -->|"Fast Edge Queries"| Turso[("⚡ Turso SQLite Edge<br/>(9 GB, 1B Reads, No Card)")]
```

#### 🛠️ 1-Command Edge Deploy:
```bash
# 1. Clone repository
git clone https://github.com/SudhirDevOps1/BlindShare.git && cd BlindShare

# 2. Deploy to Cloudflare Pages (or link Git repo in Cloudflare dashboard)
npx wrangler pages deploy .next --project-name blindshare
```

#### ⚙️ Preset C Environment Configuration (`.env`):
```ini
NODE_ENV=production
DATABASE_DRIVER=sqlite
DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
SESSION_SECRET=generate_with_openssl_rand_hex_64
ADMIN_BOOTSTRAP_INVITE=BLINDSHARE-GENESIS-2026
HEALTH_TOKEN=health_secret_token_99x

# Backblaze B2 + Cloudflare CDN (Bandwidth Alliance = $0 Egress Forever)
STORE_TARGET=b2
B2_ENDPOINT=download.yourdomain.com
B2_BUCKET=blindshare-vault
B2_KEY_ID=your_b2_key_id
B2_APPLICATION_KEY=your_b2_app_key
DOCS_ENCRYPTION_MODE=e2ee-fragment
```

#### 🛡️ Key Advantages of Preset C:
- 💳 **100% No Credit Card Needed:** Neither Cloudflare, Turso, nor Backblaze B2 require a credit card for their free tier.
- 🚀 **1 Billion DB Reads / Month:** Turso gives 9 GB free storage and 1,000,000,000 reads/month on edge nodes.
- 🌐 **Bandwidth Alliance Free Egress:** Cloudflare Proxied CNAME routes all file downloads through Cloudflare CDN, eliminating B2 egress bills.
- ⚡ **Global Sub-30ms Latency:** Pages and files load from the nearest Cloudflare Edge data center worldwide.


---

### 🔄 All Zero-Cost 100% Free-Tier Architecture Combinations

BlindShare is built with adapter abstraction (`STORE_TARGET`, `DB_TARGET`, `BACKEND_TARGET`), allowing you to mix and match any of these **100% free (₹0 / $0, No Credit Card)** stacks:

| Combination Stack | Hosting / Edge | Database | Encrypted Storage | Monthly Free Limits | Daily Traffic Capacity | Best For | No Card Needed? |
|---|---|---|---|---|---|---|:---:|
| **Combo 1<br/>*(Mode A: Vercel Default)*** | **Vercel Hobby**<br/>(100 GB band, 1M calls) | **Neon Postgres**<br/>(512 MB, auto-sleep) | **Backblaze B2**<br/>(10 GB free forever) | 1M requests<br/>10 GB files<br/>500k DB rows | **3,000 – 5,000 views/day**<br/>(Up to 10,000 documents) | **Recommended**: 1-click deploy, instant setup, zero config | ✅ Yes |
| **Combo 2<br/>*(Mode B: Litestream B2)*** | **Docker / VPS / Fly.io**<br/>(Single small container) | **SQLite + Litestream**<br/>(Real-time B2 WAL streaming) | **Backblaze B2**<br/>(10 GB free forever) | Unlimited DB rows<br/>10 GB files | **5,000 – 10,000 views/day** | **Zero DB Cost**: Full data durability with $0 database hosting fees | ✅ Yes |
| **Combo 3<br/>*(Cloudflare Infinite Edge)*** | **Cloudflare Pages / Workers**<br/>(100k requests/day free) | **Cloudflare D1 (SQL)**<br/>(5M rows read/day, 5 GB storage) | **Cloudflare R2**<br/>(10 GB free, **$0 egress fees**) | 3M req/mo<br/>10 GB storage<br/>Zero bandwidth egress bill | **5,000 – 10,000 views/day**<br/>(Up to 10,000 documents) | High-volume viral decks where bandwidth spikes happen | ✅ Yes |
| **Combo 4<br/>*(Turso Ultra-Generous DB)*** | **Vercel / Netlify**<br/>(100 GB band) | **Turso SQLite Edge**<br/>(9 GB storage, 1 Billion reads/mo) | **Backblaze B2 / Cloudflare R2**<br/>(10 GB free) | 1 Billion DB reads<br/>9 GB DB storage | **5,000 – 8,000 views/day**<br/>(Up to 10,000 documents) | Retaining multi-year granular analytics history | ✅ Yes |
| **Combo 5<br/>*(Supabase BaaS)*** | **Vercel Hobby** | **Supabase Postgres**<br/>(500 MB DB, 50,000 MAU) | **Backblaze B2**<br/>(10 GB) | 500 MB DB<br/>10 GB B2 storage | **2,000 – 4,000 views/day** | Developers who want Supabase Studio table visualizer | ⚠️ Pauses if inactive >7d |

---

### 💡 3 Pro-Tips to Keep Your Stack Free Forever

1. **Direct Presigned S3 Transfers:** Owners and viewers upload/download encrypted ciphertext directly to Backblaze B2 / Cloudflare R2, bypassing hosting compute limits.
2. **Batched Heartbeat Analytics:** Viewers buffer page dwell times and flush once every 10 seconds via `navigator.sendBeacon` instead of writing to the database on every scroll.
3. **Admin Orphan Sweeper:** Use `/admin` → **Orphan Object Sweeper** periodically to crypto-shred abandoned temporary blobs and reclaim storage.

---

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
npm test             # Run 20-test enterprise security & analytics suite
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
┌──────────────────────────────────────────────────────────────┐
│                         FRONTEND                              │
│  Next.js 16.2.6 App Router · React 19 · Tailwind CSS v4     │
│  WebCrypto API (AES-GCM-256 + PBKDF2) · CompressionStream   │
│  pdfjs-dist 6.x (self-hosted) · pdf-lib 1.17 (watermarking)  │
│  lucide-react icons · TypeScript 5.9 strict                  │
├──────────────────────────────────────────────────────────────┤
│                         BACKEND                               │
│  Next.js 16 API Routes (Serverless / Cloudflare Workers)     │
│  Zod v4 schema validation · bcryptjs 3 · HMAC-SHA256 auth   │
│  Drizzle ORM 0.45 · web-push VAPID · jszip · qrcode          │
├──────────────────────────────────────────────────────────────┤
│                        DATA LAYER                             │
│  Neon PostgreSQL (pg 8.20, pooled) — Preset A                │
│  SQLite + Litestream WAL replication — Preset B              │
│  Turso libSQL Edge — Preset C                                 │
│  AWS S3 SDK v3 · Backblaze B2 / Cloudflare R2 (presigned)   │
├──────────────────────────────────────────────────────────────┤
│                      INFRASTRUCTURE                            │
│  Vercel Edge · Cloudflare Pages (next-on-pages)              │
│  GitHub Actions CI/CD · Gitleaks · CodeQL · Aqua Trivy       │
│  Husky + CommitLint (Conventional Commits)                    │
│  Upstash Redis (distributed rate limiting) · DuckDB in-proc  │
└──────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Package / Version |
|---|---|---|
| **Framework** | Next.js App Router | `next@16.2.6` |
| **UI Runtime** | React | `react@19.2.6` · `react-dom@19.2.6` |
| **Styling** | Tailwind CSS | `tailwindcss@4.1.17` |
| **Language** | TypeScript Strict | `typescript@5.9.3` |
| **Icons** | Lucide React | `lucide-react@1.37.0` |
| **Encryption** | WebCrypto API (browser-native) | AES-GCM-256 · PBKDF2 (100k–250k rounds) |
| **PDF Renderer** | PDF.js (self-hosted + CDN fallback) | `pdfjs-dist@6.3.289` |
| **PDF Watermarking** | pdf-lib (client-side burn) | `pdf-lib@1.17.1` |
| **ORM** | Drizzle ORM (Postgres + SQLite dual-mode) | `drizzle-orm@0.45.2` |
| **Database A** | Neon PostgreSQL (serverless pool) | `pg@8.20.0` |
| **Database B** | SQLite + Litestream WAL to B2 | *(self-hosted Docker preset)* |
| **Database C** | Turso libSQL Edge | *(Cloudflare preset)* |
| **Object Storage** | Backblaze B2 / Cloudflare R2 (S3-compat) | `@aws-sdk/client-s3@3.1121` · `@aws-sdk/s3-request-presigner@3.1121` |
| **ZIP Bundles** | JSZip | `jszip@3.10.1` |
| **QR Codes** | qrcode | `qrcode@1.5.4` |
| **Push Notifications** | Web Push VAPID | `web-push@3.6.7` |
| **Password Hashing** | bcryptjs | `bcryptjs@3.0.3` |
| **Validation** | Zod | `zod@4.5.2` |
| **Analytics Engine** | DuckDB In-Process Columnar | *(wasm, in-memory)* |
| **Auth** | HMAC-SHA256 session cookies · 2FA TOTP RFC 6238 | *(WebCrypto + custom TOTP)* |
| **Rate Limiting** | Upstash Redis REST + in-memory sliding window fallback | `src/lib/security/distributed-rate-limiter.ts` |
| **CI/CD** | GitHub Actions · Gitleaks · CodeQL · Aqua Trivy | `.github/workflows/` |
| **Git Hooks** | Husky + CommitLint | `husky@9.1.7` · `@commitlint/cli@21.2.2` |
| **i18n** | Type-safe dictionary | EN + हिन्दी (`src/lib/i18n/dictionary.ts`) |
| **Cloudflare Build** | next-on-pages | `@cloudflare/next-on-pages@1.13.16` |


---

## 📁 Project Structure

```
BlindShare/
├── src/
│   ├── app/
│   │   ├── .well-known/security.txt       # Security contact disclosure
│   │   ├── admin/                         # Admin panel (users, audit, settings)
│   │   ├── api/
│   │   │   ├── admin/                     # audit · diagnostics · invites · metrics · settings · sweeps · users
│   │   │   ├── analytics/overview/        # Analytics aggregations
│   │   │   ├── auth/                      # login · logout · logout-all · me · register · 2fa · bootstrap
│   │   │   ├── datarooms/[id]/            # Dataroom CRUD
│   │   │   ├── docs/[id]/                 # doc CRUD · audio · download · questions · versions
│   │   │   ├── health/                    # Health check + diagnostics (v1.3.0)
│   │   │   ├── links/[id]/analytics/      # Link analytics
│   │   │   ├── push/subscribe/            # VAPID push subscription
│   │   │   ├── questions/                 # Founder Q&A inbox (reply, filter)
│   │   │   ├── storage/                   # local-upload · local-download
│   │   │   ├── user/                      # profile · 2fa · delete · export
│   │   │   ├── v/[slug]/                  # bytes · questions · room · session · sign · verify
│   │   │   └── version/                   # Platform version endpoint (1.3.0)
│   │   ├── contact/                       # Contact form page
│   │   ├── dashboard/
│   │   │   ├── analytics/[id]/            # Per-link analytics view
│   │   │   ├── datarooms/                 # Virtual deal rooms
│   │   │   ├── docs/                      # Document management
│   │   │   ├── links/                     # Link Studio + Zero-Knowledge key recovery
│   │   │   ├── questions/                 # Q&A Inbox (All / Pending / Resolved)
│   │   │   └── settings/                  # Profile, password, 2FA, invite manager
│   │   ├── login/                         # Auth (auto master vault unlock on login)
│   │   ├── privacy/                       # Privacy Policy page
│   │   ├── security/                      # Public security page
│   │   ├── signup/                        # Registration page
│   │   ├── terms/                         # Terms of Service page
│   │   └── v/[slug]/                      # Zero-knowledge public document viewer
│   │
│   ├── components/
│   │   ├── admin/                         # Admin panel UI components
│   │   ├── analytics/
│   │   │   ├── link-analytics-view.tsx    # Per-session analytics UI
│   │   │   └── prism-tracker.tsx          # Zero-cookie PrismAnalytics beacon
│   │   ├── auth/                          # Auth forms, 2FA setup, backup codes
│   │   ├── contact/                       # Contact modal
│   │   ├── gates/
│   │   │   └── viewer-gates.tsx           # Email, password, NDA, signature gates
│   │   ├── landing/                       # Landing page sections
│   │   ├── link-studio/
│   │   │   └── create-link-modal.tsx      # Full link creation wizard
│   │   ├── pdf-viewer/
│   │   │   └── pdf-renderer.tsx           # PDF.js render + pdf-lib watermark burn + Q&A + tab cache
│   │   ├── upload/
│   │   │   └── doc-uploader.tsx           # Encrypted document upload
│   │   ├── viewer/
│   │   │   ├── media-renderer.tsx         # Image/Video/Audio/Markdown/SVG viewer
│   │   │   ├── presenter-mode-view.tsx    # Fullscreen pitch + laser pointer
│   │   │   ├── signature-pad-modal.tsx    # In-app NDA digital signature
│   │   │   └── voice-note-player.tsx      # Founder audio pitch player
│   │   ├── brand-footer.tsx               # Footer
│   │   └── brand-header.tsx               # Scrollable nav tabs + v1.3.0 badge
│   │
│   ├── db/
│   │   ├── index.ts                       # pg pool (RFC URL hostname validation)
│   │   ├── schema.ts                      # Drizzle Postgres schema (12+ tables)
│   │   ├── sqlite-schema.ts               # Drizzle SQLite schema (self-hosted)
│   │   └── auto-migrate.ts                # First-run schema auto-migrator
│   │
│   └── lib/
│       ├── analytics/
│       │   ├── duckdb-engine.ts           # In-process DuckDB columnar analytics
│       │   ├── index.ts                   # Analytics helpers
│       │   └── intent-scorer.ts           # AI lead conviction scoring (0–100)
│       ├── auth/
│       │   ├── lockout.ts                 # Brute-force lockout engine
│       │   ├── password.ts                # bcryptjs helpers + strength validation
│       │   ├── rbac.ts                    # Role-Based Access Control
│       │   ├── session.ts                 # HMAC-SHA256 signed session cookies
│       │   └── totp.ts                    # 2FA TOTP RFC 6238 + backup codes
│       ├── crypto-core/
│       │   ├── index.ts                   # AES-GCM-256 + GZIP CompressionStream
│       │   └── adapters/                  # Crypto environment adapters
│       ├── formats/                       # Supported file format detection
│       ├── i18n/
│       │   ├── context.tsx                # Language context provider
│       │   └── dictionary.ts              # EN + हिन्दी type-safe translations
│       ├── notifications/
│       │   └── webhook-notifier.ts        # Outbound webhook (RFC URL validated)
│       ├── push/
│       │   └── index.ts                   # VAPID Web Push notifications
│       ├── security/
│       │   ├── anti-leak-detector.ts      # Link/key leakage detection
│       │   ├── distributed-rate-limiter.ts # Upstash Redis + in-memory fallback
│       │   └── ssrf-validator.ts          # Private subnet + metadata IP blocklist
│       ├── siem/
│       │   └── siem-forwarder.ts          # CEF/JSON logs → Splunk / Datadog / Elastic
│       ├── storage/
│       │   ├── b2-adapter.ts              # Backblaze B2 (AWS S3 SDK v3)
│       │   ├── r2-adapter.ts              # Cloudflare R2 (AWS S3 SDK v3)
│       │   ├── local-adapter.ts           # Local filesystem adapter
│       │   ├── index.ts                   # StorageAdapter factory
│       │   └── types.ts                   # Shared storage interface
│       ├── validation/
│       │   ├── email-validator.ts         # Live DNS MX + disposable domain filter
│       │   ├── schemas.ts                 # Zod v4 API request schemas
│       │   └── index.ts
│       ├── vault/
│       │   └── master-vault.ts            # Zero-knowledge PBKDF2 Owner Master Key Vault
│       ├── env.ts                         # Fail-fast environment validation
│       ├── ids.ts                         # CSPRNG 128-bit ID generator
│       └── logger.ts                      # PII-redacting structured logger
│
├── tests/
│   └── security/
│       ├── auth-session-lockout.test.mjs  # HMAC timing-safe · session revocation · 2FA codes
│       ├── crypto-zk-proof.test.mjs       # AES-GCM-256 · ZK key integrity · GZIP · Master Vault · RFC 3986
│       ├── duckdb-engine.test.mjs         # DuckDB dwell percentiles · heatmap aggregations
│       ├── intent-and-sanitization.test.mjs # AI scoring · XSS sanitization
│       ├── siem-forwarder.test.mjs        # CEF string format
│       └── ssrf-dns-defense.test.mjs      # SSRF private IP blocks · email MX defense
│
├── scripts/
│   ├── reset-db.sql                       # One-click factory reset
│   ├── selfcheck-e2ee.mjs                 # Zero-knowledge self-audit
│   └── make-demo-pdf.mjs                  # Demo document generator
│
├── docs/
│   ├── ARCHITECTURE.md                    # Adapter model, data ER, crypto pipeline
│   ├── CHANGELOG.md                       # Keep-a-Changelog (v1.3.0 current)
│   ├── CODE_OF_CONDUCT.md
│   ├── CONTRIBUTING.md
│   ├── DATA-RETENTION.md
│   ├── FORMATS.md
│   ├── INCIDENT-RESPONSE.md
│   ├── LITESTREAM-SELFHOSTING.md
│   ├── PRIVACY-POLICY.md
│   ├── RELEASES.md
│   ├── RUNBOOK.md
│   ├── SECRETS.md
│   ├── SECURITY.md                        # 86/86 CodeQL clean
│   ├── TERMS.md
│   └── THREAT-MODEL.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml                         # Typecheck · Lint · Build · Security scan
│       └── release.yml                    # Auto GitHub Release on tag push
│
├── public/brand/                          # Logo · PWA icons · favicons
├── AGENTS.md                              # Multi-agent universal directives
├── CLAUDE.md                              # Claude agent context
├── GEMINI.md                              # Gemini agent context
├── SECURITY.md
├── README.md
└── .env.example                           # All environment variables documented
```

---

## 📋 Roadmap

- **v1.2 — Live Collaboration** ✅ *Shipped*
  - Real-time deck sync via WebSocket rooms
  - Q&A ping (viewer can message owner without leaving the doc)
  - Kill-switch — revoke a link from analytics dashboard
  - Geo/time gates (restrict to country or business hours)
  - Request-access flow (viewer can ask for access)

- **v1.3 — Engagement Intelligence** ✅ *Shipped · Current Release*
  - Voice notes per page
  - AI lead conviction intent scoring (HOT/WARM/COLD)
  - Permanent indelible PDF watermark burning on download (`pdf-lib`)
  - Dedicated Q&A Inbox dashboard with real-time live reply sync
  - Auto vault unlock on login (Bitwarden/Proton model)
  - Tab-level decrypted session cache (10ms F5 reload)
  - Interactive text layer + clickable hyperlinks in PDF viewer
  - Scrollable nav bar with pinned left/right controls
  - CodeQL 86/86 alerts resolved · 24 automated security tests

- **v2.0 — Mobile & Enterprise** *(Planned)*
  - Capacitor Android app
  - Share-sheet upload from any app
  - Biometric lock for the vault
  - `FLAG_SECURE` — prevent screenshot on Android
  - Enterprise SSO (SAML 2.0 / OIDC)
  - Multi-tenant organization workspaces

---

## 🔒 Security Policy

We take security seriously. See [SECURITY.md](./docs/SECURITY.md) for responsible disclosure instructions.

**TL;DR** — if you find a vulnerability, please email the maintainer privately before opening a public issue.

---

## 🤝 Contributing

We love contributions! BlindShare is built **by the community, for the community.**

Please read **[CONTRIBUTING.md](./docs/CONTRIBUTING.md)** for the full guide covering:
- 🐛 How to report bugs
- 💡 How to suggest features
- 🔀 Pull request workflow
- ✍️ Commit message conventions
- 🧹 Coding standards

**Quick start for contributors:**

```bash
# 1. Fork this repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/BlindShare.git
cd BlindShare && npm install && cp .env.example .env

# 2. Create a branch
git checkout -b feat/your-amazing-feature

# 3. Make changes, then verify
npm run typecheck && npm run lint && npm run build

# 4. Commit with Conventional Commits
git commit -m "feat(links): add geo-based access gates"

# 5. Push and open a PR
git push origin feat/your-amazing-feature
```

> 💬 **Have a question before contributing?** Open a [Discussion](https://github.com/SudhirDevOps1/BlindShare/discussions) — we're happy to help!

---

## 📚 Documentation & Reference Index

All deep technical references, security specifications, and operational runbooks are organized in the [`docs/`](./docs) directory:

| Document | Description |
|---|---|
| 🏗️ [Architecture Overview](./docs/ARCHITECTURE.md) | Multi-adapter core, client-side GZIP + WebCrypto AES-GCM-256 pipeline, data model & telemetry batching |
| 🛡️ [Security Policy](./docs/SECURITY.md) | Vulnerability disclosure, cryptographic invariants, 2FA, SSRF defense & headers |
| 🎯 [Threat Model & Attack Surface](./docs/THREAT-MODEL.md) | Threat modeling across sender, viewer, server, bucket, and network layers |
| 📋 [Changelog](./docs/CHANGELOG.md) | Chronological release history, timestamps, bug fixes, and feature additions |
| 📄 [Supported File Formats](./docs/FORMATS.md) | PDF, Image, SVG, Markdown, Code, CSV, Video, Audio and presentation specs |
| 📖 [Operations Runbook](./docs/RUNBOOK.md) | Deployment guides, DB schema migrations, health checks, and troubleshooting |
| 🔑 [Secrets & Environment Reference](./docs/SECRETS.md) | Complete list of all mandatory and optional environment keys |
| 🧹 [Data Retention Policy](./docs/DATA-RETENTION.md) | Free-tier retention periods, tombstone lifecycle, and automatic sweep rules |
| 🚨 [Incident Response Plan](./docs/INCIDENT-RESPONSE.md) | Security incident triage, key compromise procedures, and containment steps |
| 🔒 [Privacy Policy](./docs/PRIVACY-POLICY.md) | Zero-knowledge architecture, no-log privacy commitments, and GDPR-lite rights |
| ⚖️ [Terms of Service](./docs/TERMS.md) | Platform usage terms, open-source conditions, and liability disclaimers |
| 🌊 [Zero-Cost Litestream Guide](./docs/LITESTREAM-SELFHOSTING.md) | Self-hosting with SQLite, Litestream streaming WAL to Backblaze B2 ($0 DB cost) |
| 🚀 [Enterprise Upgrade Prompt](./docs/ENTERPRISE-UPGRADE-PROMPT.txt) | 1-click copy-paste master AI prompt for full free-tier enterprise production upgrade |
| 🤝 [Contribution Guide](./docs/CONTRIBUTING.md) | Local setup, commit linting, pull request rules, and coding standards |
| 👥 [Code of Conduct](./docs/CODE_OF_CONDUCT.md) | Community pledge and standards of respectful collaboration |

---

## 👥 Community & Support

| Resource | Link |
|----------|------|
| 🐛 Bug Reports | [GitHub Issues](https://github.com/SudhirDevOps1/BlindShare/issues) |
| 💡 Feature Requests | [GitHub Discussions](https://github.com/SudhirDevOps1/BlindShare/discussions) |
| 📋 Changelog | [CHANGELOG.md](./docs/CHANGELOG.md) |
| 🔒 Security Policy | [SECURITY.md](./docs/SECURITY.md) |
| 🤝 Code of Conduct | [CODE_OF_CONDUCT.md](./docs/CODE_OF_CONDUCT.md) |
| 📖 Operations Runbook | [RUNBOOK.md](./docs/RUNBOOK.md) |

---

## 📜 License

[MIT License](./LICENSE) — Copyright (c) 2026 BlindShare contributors

- ✅ **Free to use** — personal, commercial, or enterprise
- ✅ **Free to self-host** — no licensing fees ever
- ✅ **Free to modify** — fork and build your own version
- ✅ **Free to distribute** — open or closed source

---

<div align="center">

<br/>

<img alt="BlindShare" src="public/brand/icon.png" width="56" height="56" style="border-radius:12px;" />

<br/>

**Built with ❤️ · Zero-knowledge by design · Free forever on open infrastructure**

<br/>

[![Star on GitHub](https://img.shields.io/github/stars/SudhirDevOps1/BlindShare?style=social)](https://github.com/SudhirDevOps1/BlindShare)

<br/>

[⭐ Star on GitHub](https://github.com/SudhirDevOps1/BlindShare) &nbsp;·&nbsp;
[🐛 Report a Bug](https://github.com/SudhirDevOps1/BlindShare/issues/new) &nbsp;·&nbsp;
[💡 Request a Feature](https://github.com/SudhirDevOps1/BlindShare/discussions) &nbsp;·&nbsp;
[📋 Changelog](./docs/CHANGELOG.md) &nbsp;·&nbsp;
[🤝 Contribute](./docs/CONTRIBUTING.md)

</div>

