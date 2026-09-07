# 📸 BlindShare v1.4.0 — Live Production Showcase & Proof Gallery

> **Verified Visual Proof of Zero-Knowledge Document Sharing, Real-Time Founder Alerting, and Deep Pitch Deck Telemetry**  
> *All 47 captures below were produced during authentic live user testing on production infrastructure (Neon PostgreSQL, Backblaze B2, Google Apps Script Email Relay, and Stoat Chat Webhooks).*  
> **Strict Policy:** 100% Real Database Queries · Zero Mock Graphs · Zero Fake Synthetic VC Records.

---

## 🧭 Showcase Index

1. [Zero-Knowledge & Cryptographic Vault Proofs](#1-zero-knowledge--cryptographic-vault-proofs)
2. [Real-Time Founder Alerting (Stoat Chat & Revolt Webhooks)](#2-real-time-founder-alerting-stoat-chat--revolt-webhooks)
3. [Transactional Email Relay (Google Apps Script ₹0 Engine)](#3-transactional-email-relay-google-apps-script-0-engine)
4. [Live Infrastructure, Diagnostics & Blind Security Audit Ledger](#4-live-infrastructure-diagnostics--blind-security-audit-ledger)
5. [Client-Side Encryption, Link Studio & Access Controls](#5-client-side-encryption-link-studio--access-controls)
6. [Secure Document Viewer, Ergonomics & Slide Q&A](#6-secure-document-viewer-ergonomics--slide-qa)
7. [Deep Analytics, Columnar DuckDB Telemetry & Heatmaps](#7-deep-analytics-columnar-duckdb-telemetry--heatmaps)

---

## 1. Zero-Knowledge & Cryptographic Vault Proofs

BlindShare enforces the **RFC 3986 URL Fragment Courier Model**: Decryption keys `#k=...` reside solely in the client fragment and never touch server access logs or database columns.

| Feature / Verification | Screenshot | Architectural Proof Points |
| :--- | :---: | :--- |
| **Raw Backblaze B2 Ciphertext in Notepad3**<br>`Notepad3_bkYXOeH1CB.png` | [![Ciphertext Proof](../public/showcase/Notepad3_bkYXOeH1CB.png)](../public/showcase/Notepad3_bkYXOeH1CB.png) | • **100% Encrypted Bytes:** Raw file opened in Notepad3 contains pure high-entropy ciphertext.<br>• **0 Plaintext Strings:** No headers, no document metadata, no unencrypted bytes on storage disk.<br>• Storage admin has zero visibility into file contents. |
| **Backblaze B2 Cloud Vault Console**<br>`brave_yTfqtB0lpn.png` | [![B2 Console](../public/showcase/brave_yTfqtB0lpn.png)](../public/showcase/brave_yTfqtB0lpn.png) | • **Opaque Chunks:** `doc_...cipher` (2.6 MB) stored with zero-knowledge metadata.<br>• **Cloudflare Bandwidth Alliance:** Unlimited $0 egress transfer.<br>• Standard S3 API compatibility. |
| **Client-Side Master Vault Key Derivation**<br>`brave_eEweBvIWAP.png` | [![Vault Derivation](../public/showcase/brave_eEweBvIWAP.png)](../public/showcase/brave_eEweBvIWAP.png) | • **WebCrypto PBKDF2:** 100,000 rounds computed in-browser in **4,561ms**.<br>• **Zero Plaintext Password Over Wire:** Unlocks document keys locally without transmitting master password.<br>• AES-KW-256 wrapped key architecture. |
| **Decrypted Master Vault Active State**<br>`brave_i1nnbgU2e0.png` | [![Decrypted Vault](../public/showcase/brave_i1nnbgU2e0.png)](../public/showcase/brave_i1nnbgU2e0.png) | • **Instant Cross-Device Sharing:** Decrypted keys held in isolated browser session memory.<br>• **Memory Zeroizing:** Automatic buffer wiping upon inactivity or tab closing.<br>• Encrypted vault payloads backed by Neon DB. |
| **Forensic Steganography Leak Scanner**<br>`brave_Tc1PUfLrsy.png` | [![Forensic Scanner](../public/showcase/brave_Tc1PUfLrsy.png)](../public/showcase/brave_Tc1PUfLrsy.png) | • **99% Confidence Match:** Detects exfiltrated screenshots with pinpoint forensic accuracy.<br>• **Zero-Width Watermarking:** Extracts invisible viewer email and timestamp signatures.<br>• CRC-32 integrity validation. |
| **Cryptographic Vault & KDF Security Panel**<br>`brave_EpDcNoQyCA.png` | [![KDF Settings](../public/showcase/brave_EpDcNoQyCA.png)](../public/showcase/brave_EpDcNoQyCA.png) | • **Configurable KDF Engine:** Choose between Argon2id memory-hard hashing and PBKDF2 100k.<br>• **Buffer Zeroize Timer:** Proactive `zeroizeBuffer()` RAM clearing.<br>• Hardware key isolation enforcement. |

---

## 2. Real-Time Founder Alerting (Stoat Chat & Revolt Webhooks)

When an investor opens a deck or asks a question, BlindShare dispatches edge alerts in **under 50ms** directly to Stoat Chat channels.

| Alert Type | Screenshot | Dispatch Telemetry & Payload |
| :--- | :---: | :--- |
| **Document Opened Alert**<br>`gMGRTq3zGO.png` | [![Stoat Doc Opened](../public/showcase/gMGRTq3zGO.png)](../public/showcase/gMGRTq3zGO.png) | • **Instant Notification:** Dispatched to `#form-logs` channel in sub-50ms.<br>• **Viewer Metadata:** Recipient email (`demo@gmail.com`), country, device, and start timestamp.<br>• Rich Markdown embed with zero SaaS subscription fees. |
| **Slide Question Asked Alert**<br>`qZoGhGMXzD.png` | [![Stoat Question](../public/showcase/qZoGhGMXzD.png)](../public/showcase/qZoGhGMXzD.png) | • **In-Doc Question Pin:** Alerts founder that a reader placed a question on Slide 1.<br>• **Direct Deep Link:** Direct link to reply inside founder dashboard Q&A inbox.<br>• Reader anonymity isolated per link. |
| **Continuous Live Telemetry Stream**<br>`qnVN75d3pi.png` | [![Stoat Stream](../public/showcase/qnVN75d3pi.png)](../public/showcase/qnVN75d3pi.png) | • **High-Velocity Feed:** Link creation, document views, slide turns, and diligence events.<br>• Multi-channel webhook routing with in-memory circuit breaker. |

---

## 3. Transactional Email Relay (Google Apps Script ₹0 Engine)

BlindShare operates transactional email authentication and administrative notifications via Google Apps Script, delivering **100 emails/day at ₹0 cost** with 100% DKIM and SPF compliance.

| Dispatch Scenario | Screenshot | Verification Highlights |
| :--- | :---: | :--- |
| **Live Relay Diagnostic Verified**<br>`brave_hetLrAlKER.png` | [![GAS Diagnostic](../public/showcase/brave_hetLrAlKER.png)](../public/showcase/brave_hetLrAlKER.png) | • **Live Inbound Email:** Subject `🧪 BlindShare Email Relay Active: Live Diagnostic Verified`.<br>• **Zero Third-Party Cost:** Bypasses paid SendGrid/Resend limits with Gmail infrastructure.<br>• Sub-2 second delivery latency. |
| **Admin Invitation Email**<br>`brave_9lp57u15IS.png` | [![Admin Invite](../public/showcase/brave_9lp57u15IS.png)](../public/showcase/brave_9lp57u15IS.png) | • **Signed Invite Token:** Delivers one-click onboarding token (`sherinv_...`).<br>• **Anti-Phishing Security:** Formatted 1-click magic link button and token fallback.<br>• Role-based access with time expiration. |

---

## 4. Live Infrastructure, Diagnostics & Blind Security Audit Ledger

| Component | Screenshot | Production Verification |
| :--- | :---: | :--- |
| **Admin System Diagnostics**<br>`brave_GvQULOUNpK.png` | [![Admin Diagnostics](../public/showcase/brave_GvQULOUNpK.png)](../public/showcase/brave_GvQULOUNpK.png) | • **Neon PostgreSQL Ping:** **224ms** live query check.<br>• **Backblaze B2 Ping:** **28ms** sub-30ms storage response.<br>• **54 Environment Variables:** All cryptographic secrets and service credentials validated. |
| **Zero-Mock Real Storage Footprint**<br>`brave_TnjWnN8Uho.png` | [![Storage Footprint](../public/showcase/brave_TnjWnN8Uho.png)](../public/showcase/brave_TnjWnN8Uho.png) | • **Genuine DB Utilization:** 9.34 MB / 512 MB measured from PostgreSQL `pg_database_size()`.<br>• **Genuine B2 Vault:** 2.46 MB / 10 GB measured from live bucket byte summation.<br>• Zero mock or dummy constants. |
| **Storage Sweeper & Tombstone Purge**<br>`brave_xc8cQo3S74.png` | [![Storage Sweeper](../public/showcase/brave_xc8cQo3S74.png)](../public/showcase/brave_xc8cQo3S74.png) | • **Orphan Object Sweeper:** Identifies dangling B2 ciphertext blobs lacking database rows.<br>• **Tombstone Purger:** Cleans soft-deleted documents and expired share links.<br>• Preserves ₹0 free tier quotas permanently. |
| **Immutable Blind Audit Ledger**<br>`brave_cY6swqN4a1.png` | [![Audit Ledger](../public/showcase/brave_cY6swqN4a1.png)](../public/showcase/brave_cY6swqN4a1.png) | • **SHA-256 Hash Chain:** Sequences `link.create`, `doc.upload`, `doc.crypto_shred`.<br>• **Tamper Evident:** Cryptographic verification of historical actions.<br>• CEF and SIEM format ready. |
| **Role-Based Invite Generator**<br>`brave_T7bLtlKEc8.png` | [![Invite Generator](../public/showcase/brave_T7bLtlKEc8.png)](../public/showcase/brave_T7bLtlKEc8.png) | • Controlled registration for `admin` and `owner` tiers.<br>• Configurable 24h / 7d time-locks. |

---

## 5. Client-Side Encryption, Link Studio & Access Controls

| Stage / Dialog | Screenshot | Architectural Invariants |
| :--- | :---: | :--- |
| **Genesis Admin Setup (ALTCHA PoW)**<br>`brave_zKb6k3akcq.png` | [![Genesis Admin](../public/showcase/brave_zKb6k3akcq.png)](../public/showcase/brave_zKb6k3akcq.png) | • Self-hosted cryptographic proof-of-work anti-bot challenge.<br>• Zero Google reCAPTCHA tracking cookies or third-party ad beacons.<br>• One-time initialization lock. |
| **Password Strength & Entropy Validator**<br>`brave_eJinVE5Tai.png` | [![Password Entropy](../public/showcase/brave_eJinVE5Tai.png)](../public/showcase/brave_eJinVE5Tai.png) | • In-browser zxcvbn entropy scoring before key derivation.<br>• Enforces minimum 12-char passphrase with mixed character classes. |
| **Client-Side Document Encryption**<br>`brave_qPrN3yk6BV.png` | [![Upload Flow](../public/showcase/brave_qPrN3yk6BV.png)](../public/showcase/brave_qPrN3yk6BV.png) | • Browser-level AES-GCM-256 chunk encryption in RAM before transmission.<br>• Generates unique 256-bit AES key per document. |
| **RFC 3986 URL Fragment Generation**<br>`brave_ksQFF8RRXR.png` | [![URL Fragment](../public/showcase/brave_ksQFF8RRXR.png)](../public/showcase/brave_ksQFF8RRXR.png) | • `#k=...` fragment is strictly client-side per RFC 3986.<br>• Never logged by Nginx, Cloudflare, or Vercel edge routers. |
| **Link Studio: Watermark & Passcode**<br>`brave_SrkW9m1rpy.png` | [![Link Studio 1](../public/showcase/brave_SrkW9m1rpy.png)](../public/showcase/brave_SrkW9m1rpy.png) | • Dynamic email watermark projection.<br>• Mandatory email capture gate and granular expiration timers. |
| **Link Studio: Anti-Spy & NDA Clickwrap**<br>`brave_ulWNGF5nWO.png` | [![Link Studio 2](../public/showcase/brave_ulWNGF5nWO.png)](../public/showcase/brave_ulWNGF5nWO.png) | • Tab-Switch Anti-Spy Shield (blurs canvas and pauses timer on defocus).<br>• Burn-After-Reading ratchet and Clickwrap NDA agreement. |
| **Viewer Access Gate (Email + NDA + PoW)**<br>`brave_XyJO2IR0zL.png` | [![Viewer Gate](../public/showcase/brave_XyJO2IR0zL.png)](../public/showcase/brave_XyJO2IR0zL.png) | • Enforces verified recipient email entry and legal confidentiality acceptance.<br>• Automated ALTCHA challenge prevents scraping bots. |
| **Two-Factor TOTP QR Provisioning**<br>`brave_5Oh8XVWJiD.png` | [![2FA Setup](../public/showcase/brave_5Oh8XVWJiD.png)](../public/showcase/brave_5Oh8XVWJiD.png) | • RFC 6238 TOTP QR code compatible with Google Authenticator.<br>• Secret encrypted with Master Key prior to database persistence. |
| **2FA Challenge & Recovery Codes**<br>`brave_ZzZcU246iw.png` | [![2FA Challenge](../public/showcase/brave_ZzZcU246iw.png)](../public/showcase/brave_ZzZcU246iw.png) | • 6-digit TOTP verification challenge.<br>• Bcrypt-hashed single-use emergency backup recovery keys. |

---

## 6. Secure Document Viewer, Ergonomics & Slide Q&A

| Capability | Screenshot | Reader Experience |
| :--- | :---: | :--- |
| **Dynamic Watermark on 288-Page PDF**<br>`brave_WGPvXSEEGx.png` | [![Viewer Watermark](../public/showcase/brave_WGPvXSEEGx.png)](../public/showcase/brave_WGPvXSEEGx.png) | • **Non-Removable Watermark:** Diagonal overlay of recipient email (`demo@gmail.com`).<br>• **288-Page Rendering:** Sub-second per-slide HKDF key derivation.<br>• Unrestricted header-to-footer smooth scroll with cyber companion. |
| **Dual Fit Engine & Isolated Wheel Scroll**<br>`brave_ZAzBNcK66w.png` | [![Dual Fit](../public/showcase/brave_ZAzBNcK66w.png)](../public/showcase/brave_ZAzBNcK66w.png) | • Toggle between `Fit Width` and `Fit Page`.<br>• Isolated mouse wheel navigation prevents page scroll hijacking. |
| **Slide Q&A: Coordinate Pin Placement**<br>`brave_kiqWuRIf2T.png` | [![Slide Pin](../public/showcase/brave_kiqWuRIf2T.png)](../public/showcase/brave_kiqWuRIf2T.png) | • Readers drop contextual question pins directly on slide elements.<br>• Relative X/Y coordinate storage with reader session isolation. |
| **Slide Q&A: Confidential Submission**<br>`brave_NXg4xHhYaN.png` | [![Submit Question](../public/showcase/brave_NXg4xHhYaN.png)](../public/showcase/brave_NXg4xHhYaN.png) | • Clean question compose dialog with XSS sanitization.<br>• Direct association with share link token. |
| **Slide Q&A: Real-Time Canvas Pin**<br>`brave_H4Br4owHrn.png` | [![Live Pin](../public/showcase/brave_H4Br4owHrn.png)](../public/showcase/brave_H4Br4owHrn.png) | • Pulsating coordinate pin with read/unread status badge.<br>• High-contrast styling over dark and light PDF backgrounds. |
| **Slide Q&A: Founder Reply Inbox**<br>`brave_HopjAoBcun.png` | [![Founder Inbox](../public/showcase/brave_HopjAoBcun.png)](../public/showcase/brave_HopjAoBcun.png) | • Founder dashboard inbox listing queries grouped by document and slide.<br>• Confidential reply delivered directly to investor's reading session. |
| **Full-Canvas Immersive Reading**<br>`brave_3iRp1Yic0W.png` | [![Fullscreen Inspection](../public/showcase/brave_3iRp1Yic0W.png)](../public/showcase/brave_3iRp1Yic0W.png) | • Distraction-free executive presentation review mode.<br>• WebAssembly PDF engine with high-DPI vector sharpness. |

---

## 7. Deep Analytics, Columnar DuckDB Telemetry & Heatmaps

All telemetry is 100% computed from real database records (Neon PostgreSQL + Drizzle ORM) and aggregated in-memory via DuckDB.

| Analytics View | Screenshot | Metric Details |
| :--- | :---: | :--- |
| **Truthful Zero-State Dashboard**<br>`brave_qlXpwmfF1X.png` | [![Zero State](../public/showcase/brave_qlXpwmfF1X.png)](../public/showcase/brave_qlXpwmfF1X.png) | • **Strict Zero Fake Data:** Displays clean 0 views, 0 sessions before traffic arrives.<br>• Zero synthetic curves or dummy investor lists. |
| **Populated Analytics Dashboard**<br>`brave_kdj9xJeKxV.png` | [![Live Dashboard](../public/showcase/brave_kdj9xJeKxV.png)](../public/showcase/brave_kdj9xJeKxV.png) | • Authenticated reader telemetry across all documents.<br>• Total views, average dwell duration, and active share links. |
| **Real-Time Live Readers & Dwell**<br>`brave_Cf1uBsiaG6.png` | [![Realtime Overview](../public/showcase/brave_Cf1uBsiaG6.png)](../public/showcase/brave_Cf1uBsiaG6.png) | • 1 Live reader active right now.<br>• 2m 30s total dwell time, 100% Desktop, Indian geolocation origin. |
| **365-Day Heatmap & Live Activity Stream**<br>`brave_sfeDwvXr9a.png` | [![Heatmap & Stream](../public/showcase/brave_sfeDwvXr9a.png)](../public/showcase/brave_sfeDwvXr9a.png) | • GitHub-style 365-day engagement matrix.<br>• Automated intent scoring (`🔥 High Intent`) based on dwell velocity. |
| **5-Stage Retention Funnel Hub**<br>`brave_668uP09lqE.png` | [![Retention Funnel](../public/showcase/brave_668uP09lqE.png)](../public/showcase/brave_668uP09lqE.png) | • Link Clicked → Gate Passed → Page 1 Viewed → Midpoint → Final Slide.<br>• Drop-off cliff warnings pinpoint where diligence stalls. |
| **Cubic Spline Page Dwell Curve**<br>`brave_NahVot5a9R.png` | [![Dwell Spline](../public/showcase/brave_NahVot5a9R.png)](../public/showcase/brave_NahVot5a9R.png) | • Attention velocity across all slides with 3D perspective tilt.<br>• Hover tooltips showing exact seconds spent per slide. |
| **Page Dwell Heatmap (Slide 2: 5m 3s)**<br>`brave_hWmy8aftd3.png` | [![Slide Heatmap](../public/showcase/brave_hWmy8aftd3.png)](../public/showcase/brave_hWmy8aftd3.png) | • Slide 2 peak diligence: **5 minutes 3 seconds**.<br>• Re-read tracking reveals readers flipping backward to check unit economics. |
| **Device Breakdown & Deal Temperature**<br>`brave_7WlelRyZj9.png` | [![Deal Temperature](../public/showcase/brave_7WlelRyZj9.png)](../public/showcase/brave_7WlelRyZj9.png) | • Hardware distribution (100% Desktop).<br>• Deal Temperature rating investor excitement from Warm to Scorching. |
| **Individual Viewer Session Replay**<br>`brave_lZYdWpxz0d.png` | [![Session Replay](../public/showcase/brave_lZYdWpxz0d.png)](../public/showcase/brave_lZYdWpxz0d.png) | • Atomic timeline of enter/exit timestamps and slide transitions.<br>• AI conviction scoring per investor session. |
| **Live Presence Telemetry Indicator**<br>`brave_bdnDpfif08.png` | [![Live Presence](../public/showcase/brave_bdnDpfif08.png)](../public/showcase/brave_bdnDpfif08.png) | • Heartbeat presence polling flashes emerald status when reader is in-doc.<br>• Automatically pauses via Page Visibility API when tab loses focus. |
| **Link Performance Leaderboard**<br>`brave_noOaOVOMtz.png` | [![Link Leaderboard](../public/showcase/brave_noOaOVOMtz.png)](../public/showcase/brave_noOaOVOMtz.png) | • Compare conversion and engagement across multiple VC distribution channels.<br>• Sort by total dwell, completion rate, or recent activity. |
| **Reader Geolocation Breakdown**<br>`brave_sI5HQ5KbGu.png` | [![Geolocation](../public/showcase/brave_sI5HQ5KbGu.png)](../public/showcase/brave_sI5HQ5KbGu.png) | • Geographic country and city distribution.<br>• GDPR-compliant: IP addresses are salted and hashed before logging. |
| **Hourly Reading Habits Matrix**<br>`brave_tFUOQmcsQ9.png` | [![Hourly Matrix](../public/showcase/brave_tFUOQmcsQ9.png)](../public/showcase/brave_tFUOQmcsQ9.png) | • 24x7 matrix charting reader time-of-day patterns.<br>• Pinpoints the optimal time window to send pitch follow-ups. |
| **Document Management Overview**<br>`brave_O3NReRlLXk.png` | [![Doc Management](../public/showcase/brave_O3NReRlLXk.png)](../public/showcase/brave_O3NReRlLXk.png) | • Vault listing with page counts, file sizes, and quick share links.<br>• One-click cryptographic shredding for permanent destruction. |
| **Complete End-to-End Platform Capture**<br>`brave_ztHXsz4Akb.png` | [![Full Platform Capture](../public/showcase/brave_ztHXsz4Akb.png)](../public/showcase/brave_ztHXsz4Akb.png) | • Ultra-high-resolution panoramic capture of BlindShare v1.4.0.<br>• Confirms harmonious integration of all 15 architectural pillars. |

---

## 🌐 Live Interactive Gallery

Experience the interactive gallery directly in the browser with category filtering, instant search, and full-resolution lightbox inspection at:
**[https://blindshare.vercel.app/showcase](https://blindshare.vercel.app/showcase)** (or locally at `/showcase`).
