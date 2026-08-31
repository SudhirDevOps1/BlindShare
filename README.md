# BLINDSHARE 🔐📄
### Zero-Knowledge Secure Document Sharing Platform (DocSend & Papermark Alternative)

BlindShare is a high-security, privacy-first document sharing and tracking platform designed for sharing sensitive pitches, financial models, contracts, and confidential files with per-page view analytics — **operating completely within ₹0 / $0 Free Tiers**.

---

## 🌟 Why BlindShare is Different

Ordinary document platforms store decrypted, readable files on their servers. BlindShare operates in `DOCS_ENCRYPTION_MODE=e2ee-fragment` where the **server is a blind courier**:

```mermaid
flowchart LR
  A[Owner Browser] -->|1. Generate 256-bit DocKey| A
  A -->|2. AES-GCM-256 Encrypt Client-Side| B[(Encrypted Ciphertext)]
  B -->|3. Presigned PUT| C[Private Storage: Backblaze B2 / R2]
  A -->|4. Share Link + #k=fragment| D[Recipient Viewer]
  D -->|5. GET Ciphertext Object| C
  D -->|6. WebCrypto Decrypt in Browser| E[Zero-Leak Document Viewer]
  D -.->|Page Dwell Events / No PII| F[(Neon Database)]
  C -.-x|Cannot Decrypt| G((Server / Host))
```

> **The RFC 3986 Guarantee:** The `#k=...` decryption key fragment is **never transmitted in HTTP requests** to the server, Vercel edge functions, or database. The server literally cannot read your files.

---

## 🚀 Quick Deployment Guide (Vercel + Neon + Backblaze B2)

### 1. Database Setup (Neon PostgreSQL)
1. Go to [Neon Console](https://console.neon.tech) and create a free PostgreSQL project.
2. Copy your pooled connection string:
   ```env
   DATABASE_URL=postgres://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. *Note:* You do **not** need to manually create tables — BlindShare automatically creates and migrates all 12 database tables on first launch!

### 2. Private Storage Setup (Backblaze B2)
1. Create a free account on [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html).
2. Create a **Private Bucket** (e.g. `blindshare-vault`).
3. Under *Application Keys*, generate a key with read/write access to your bucket.

### 3. Vercel Environment Configuration
Add the following Environment Variables in your Vercel Project Settings:

| Environment Variable | Description / Example Value |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string with `sslmode=require` |
| `SESSION_SECRET` | 64+ character random hex string for HMAC session cookies |
| `ADMIN_BOOTSTRAP_INVITE` | Secret genesis onboarding code (e.g. `BLINDSHARE-GENESIS-2026`) |
| `HEALTH_TOKEN` | Secret token to access `/api/health` diagnostics |
| `STORE_TARGET` | Set to `b2` |
| `B2_ENDPOINT` | Your B2 S3 endpoint (e.g. `s3.us-east-005.backblazeb2.com`) |
| `B2_REGION` | Your B2 region (e.g. `us-east-005`) |
| `B2_BUCKET` | Your B2 bucket name (e.g. `blindshare-vault`) |
| `B2_KEY_ID` | Backblaze Application Key ID |
| `B2_APPLICATION_KEY` | Backblaze Application Key Secret |
| `NEXT_PUBLIC_PRISM_ANALYTICS_ID` | *(Optional)* Prism Analytics Site ID (`pa_...`) |
| `NEXT_PUBLIC_PRISM_ANALYTICS_URL` | *(Optional)* Prism Track URL (`https://...workers.dev/api/track`) |
| `NEXT_PUBLIC_CONTACT_FORM_ACTION` | *(Optional)* FormForge/ApnaForm Submit Endpoint |

---

## 👥 Access Control & User Roles

| Role | Permissions & Capabilities |
|---|---|
| 👑 **Super Admin (Genesis Owner)** | • The **first person** who creates an account during deployment setup automatically becomes Super Admin.<br>• Full platform control, database health, audit logs, and master invite creation.<br>• Only 1 main owner per deployment. |
| 🛡️ **Admin** | • Can upload, encrypt, and share documents.<br>• Can generate invite codes for team members and view system metrics. |
| 👤 **Member / Standard User** | • Private vault user.<br>• Can upload, manage datarooms, and create secure links.<br>• **Cannot** view other users' documents or access admin settings. |
| 👁️ **Recipient / Viewer** | • External party opening a share link.<br>• Decrypts in-memory, signs NDAs, agrees to clickwraps, and enters link passwords without creating an account. |

---

## 🛠️ Account & Security Management (`/dashboard/settings`)

- **Change Display Name & Login Email (Username):** Update your profile credentials instantly.
- **Change Security Password:** Set a new strong password (requires entering current password). All active sessions on other browsers are immediately logged out.
- **Custom Invite Code Generator:** Super Admin and Admins can mint single-use or multi-use invite codes (`customCode`, `expiryDays`, `role`) with 1-click clipboard copy.
- **Sign Out All Devices:** Invalidate all active session tokens with a single click.

---

## 💬 Contact Form & Zero-Cookie Analytics

- **FormForge Feedback Page (`/contact`):** Built-in contact form with honeypot bot trap, FormData and JSON failover, and localStorage backup.
- **PrismAnalytics (`PrismTracker`):** Zero-cookie, privacy-friendly telemetry powered by Cloudflare Workers. Fully compliant with strict Content Security Policy (`connect-src`).

---

## 🧹 Complete Database Factory Reset (Neon PostgreSQL)

If you ever want to wipe all test documents, links, and accounts to start fresh:

1. Open your [Neon Dashboard](https://console.neon.tech) ➔ Click on **SQL Editor**.
2. Run the SQL script from [`scripts/reset-db.sql`](./scripts/reset-db.sql):
   ```sql
   DROP TABLE IF EXISTS page_events, view_sessions, signatures, links, 
     dataroom_docs, datarooms, doc_versions, documents, push_subscriptions, 
     audit_log, system_settings, invites, users CASCADE;
   ```
3. Re-open your deployed website ➔ Register your fresh **Super Admin** account!

---

## 💻 Local Development

```bash
# 1. Clone repository
git clone https://github.com/SudhirDevOps1/BlindShare.git
cd BlindShare

# 2. Install dependencies
npm install

# 3. Setup local environment
cp .env.example .env

# 4. Start development server
npm run dev
```

---

## 📜 License & Compliance

MIT License. Designed with GDPR-lite privacy controls, client-side cryptographic guarantees, and zero permanent plain-text data storage.
