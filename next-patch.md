# ✅ BlindShare — UNIFIED Next Patch (Single AI Prompt) — Roadmap + Audit Fix + Hacker Fix
> **Teeno ek hi me:** 
ext-patch.md (original) + NEXT-PATCH-AUDIT-FIX.md + NEXT-PATCH-HACKER-FIX.md = **unified single file** — AI ko bas ye ek file paste karo.

---

# 🚀 BlindShare Next Patch & Engineering Roadmap (`v1.4.0`)

> **Production Telemetry-Driven Optimizations, Batch Telemetry Engine & Digital Data Room Advancements**

---

## 📊 1. Production Telemetry Insights & Resource Posture

Based on live telemetry data recorded across Neon Serverless PostgreSQL, Vercel Serverless Functions, and Backblaze B2 Object Storage:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        LIVE PRODUCTION RESOURCE BENCHMARKS                             │
├───────────────────────┬─────────────────────────────┬──────────────────┬───────────────┤
│ Infrastructure Layer  │ Live Resource Usage         │ Free-Tier Quota  │ Buffer Margin │
├───────────────────────┼─────────────────────────────┼──────────────────┼───────────────┤
│ 🐘 Neon Postgres      │ 9.02 MB DB Size (0.3 GB vol)│ 512 MB Free DB   │ 98.2% Free    │
│ 🐘 Neon Compute       │ 1.34 CU-hours total         │ Serverless Idle  │ Sleep Active  │
│ 🚀 Vercel Serverless  │ 17K Function Invocations    │ 1,000K (1M) Free │ 98.3% Free    │
│ 🚀 Vercel Bandwidth   │ 179.23 MB Transfer          │ 100 GB Free      │ 99.8% Free    │
│ 🚀 Vercel CPU Time    │ 10m 11s Active CPU          │ 4 Hours Free     │ 95.8% Free    │
│ 🪣 Backblaze B2       │ 0.54 MB / 7 Encrypted Blobs │ 10,240 MB (10 GB)│ 99.9% Free    │
│ 🪣 B2 Daily Ops       │ 16 Class B / 22 Class C     │ 2,500 Daily Caps │ $0.00 / Month │
└───────────────────────┴─────────────────────────────┴──────────────────┴───────────────┘
```

---

## 🎯 2. Core Enhancements for Next Patch (`v1.4.0`)

### ⚡ 1. Batched Dwell Telemetry & Beacon Flush Engine
- **Objective:** Reduce Vercel Serverless function invocations by **80%** (bringing 17K invocations down to ~3K).
- **Mechanism:**
  - Client stores slide transitions, dwell milliseconds, and heatmap clicks in ephemeral browser memory (`dwellQueue[]`).
  - Automatically flushes batched payload to `/api/v/[slug]/session` every **20 seconds** or immediately on page unload using `navigator.sendBeacon()`.
  - Single atomic Postgres transaction records multi-page dwell updates in one database round-trip.

---

### 🗜️ 2. Client-Side WebP Encrypted Thumbnail Generator
- **Objective:** Enable instant **0.05s grid previews** for 50+ page pitch decks and multi-page documents without server processing.
- **Mechanism:**
  - During document upload, browser Web Worker renders each slide to an offscreen canvas at `300x168px`.
  - Encodes to WebP (10–15 KB per slide), encrypts with `DocKey`, and packs into an encrypted thumbnail archive (`thumbnails.enc`).
  - Document viewers download thumbnail pack in 1 stream, instantly rendering full deck slide grid previews.

---

### 📂 3. Multi-Document Bulk Uploader for Data Rooms
- **Objective:** Enable founders to populate entire Virtual Data Rooms (VDRs) with pitch decks, financial models, cap tables, and legal agreements in 1 click.
- **Mechanism:**
  - Drag-and-drop folder / multi-file upload zone.
  - Multi-threaded client-side WebCrypto encryption workers running concurrently.
  - Automatic categorization (Financials, Pitch, Legal, Product) with individual zero-knowledge key generation.

---

### 🎙️ 4. Interactive Audio Waveform & Voice Pitch Timeline
- **Objective:** Enhance investor engagement on slide audio notes with professional interactive waveform controls.
- **Mechanism:**
  - Visual audio waveform canvas showing voice amplitude spikes across the slide timeline.
  - Speed toggles: `1.0x`, `1.25x`, `1.5x`, `2.0x`.
  - Synchronized slide transcript pins highlighting key talking points.

---

### 🌐 5. Edge Metadata Caching (`stale-while-revalidate`)
- **Objective:** Serve public viewer layouts in `< 10ms` globally without database round-trips for non-sensitive public metadata.
- **Mechanism:**
  - Configure `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` on `/api/v/[slug]`.
  - Zero-Knowledge invariant preserved: Decryption key `#k=` remains client-side in browser RAM, never cached or exposed to CDN.

---

## 🛡️ 3. Non-Negotiable Invariants Checklist for Next Patch
- [ ] **Zero-Knowledge Fragment Rule:** RFC 3986 `#k=...` key must never be logged or transmitted in server headers.
- [ ] **₹0 Free-Tier Immunity:** All compute, database, and storage operations must stay 100% within free-tier quotas.
- [ ] **Bilingual Parity:** 100% synchronization between English (`en`) and Hindi (`hi`).
- [ ] **Test Coverage:** All 24 security test suites must pass on every release.
- [ ] **Bina Kuchh Hataye Rule:** Always preserve and harden existing features without deletion.

---

## 🔬 4. Deep Compute & Neon CU-Hour Consumption Analysis (गहन तकनीकी विश्लेषण)

### ❓ Kyun Kharch Hue 1.34 CU-Hours?
1. **The 5-Minute Auto-Suspend Reset Cycle:**
   - Neon Serverless Postgres mein default **Auto-Suspend timeout 5 minutes (300s)** hota hai.
   - Har bar jab viewer slide badalta tha ya 15-second heartbeat aati thi, toh Postgres ka **idle timer 0 par reset** ho jata tha.
   - Agar ek user 20 minute tak deck padhta hai aur har 15 second me heartbeat aati hai, toh Neon poore **25 minutes tak awake** rehta hai (20 min reading + 5 min post-idle timeout).
   - **Formula:** `Active Time = Session Duration + 300s idle buffer`.
   - 1.34 CU-hours = Lagbhag 5.3 ghante total awake compute time (at 0.25 CU per core).

### 💡 Neon Compute Reduction Solution (Agle Patch Me):
- **Client-Side Coalescing:** Heartbeats ko 15 second ke bajaye **45-60 seconds** ke batched intervals me bhejna.
- **Neon Serverless Driver over WebSocket / HTTP Fetch:**
   - Long-lived persistent pooled connections ke bajaye stateless transactional fetches use karna jab telemetry log karni ho, taaki connection hold-up time zero ho jaye.
- **Impact:** Monthly Neon CU-hours **1.34 se drop hokar < 0.35 CU-hours** ho jayenge (75% savings)!

---

## ⚡ 5. Additional High-Impact Architectural Optimizations

### 🛡️ 1. Dynamic Forensic Leak Watermark QR Code
- **Problem:** Agar koi investor mobile camera se slide ki screen photo kheench le, toh diagonal text watermark ke alawa invisible forensic proof kaise milega?
- **Feature:**
  - Har page ke corner me ek microscopic, semi-transparent encrypted QR stamp embed hoga.
  - Us QR me Viewer Email Hash + Timestamp + Link Slug ka cryptographically signed HMAC token hoga.
  - Agar photo internet ya social media par leak hoti hai, toh founder camera photo scan karke exact leaker ki identity instantly verify kar sakta hai.

### 📶 2. IndexedDB Encrypted Offline Vault
- **Feature:**
  - Decrypted slides ko RAM me rakhne ke sath-sath browser ke private **IndexedDB** me AES-GCM encrypted format me cache karna.
  - **Benefit:** Agar investor flight ya weak network me deck padh raha hai, toh deck 100% offline seamlessly chalega bina server ko dobara query kiye ($0 network egress).

### 📬 3. Automated Founder Weekly Deal Digest (via Free Resend / SMTP)
- **Feature:**
  - Har Monday subah founder ko uske shared links ki AI lead intelligence report email hogi:
    - Kaun sa investor deck par 5+ minute ruka (🔥 Hot Deal).
    - Kis slide par sabse zyada drop-off hua.
    - Unanswered investor slide questions ki summary.

---

## 📐 6. Mathematical ROI & Free-Tier Longevity Projections

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        NEXT PATCH EFFICIENCY PROJECTIONS                               │
├───────────────────────┬───────────────────────────┬────────────────────┬───────────────┤
│ Metric                │ Current (v1.3.0)          │ Next Patch (v1.4.0)│ Improvement   │
├───────────────────────┼───────────────────────────┼────────────────────┼───────────────┤
│ Vercel Functions/Mo   │ 17,000 invocations        │ ~2,800 invocations │ 📉 83.5% Cut  │
│ Neon Compute Active   │ 1.34 CU-hrs               │ ~0.35 CU-hrs       │ 📉 74.0% Cut  │
│ Slide Grid Load Time  │ 1.2s - 2.8s               │ 0.05s (WebP)       │ ⚡ 30x Faster │
│ Data Room Setup Time  │ 1-by-1 manual upload      │ 1-click batch drag │ ⏱️ 10x Faster │
│ Max Safe Free Views   │ ~50,000 views/mo          │ ~350,000 views/mo  │ 📈 7x Scale   │
└───────────────────────┴───────────────────────────┴────────────────────┴───────────────┘
```

---

## 🔬 7. Advanced Research & Deep Optimization Matrix (भविष्य सुधार व तकनीकी शोध)

### 🚀 A. Neon Serverless Stateless HTTP Pipeline (`@neondatabase/serverless`)
- **Research Finding:** Next.js App Router Serverless Functions mein traditional `pg.Pool` TCP connections banaye rakhne par sockets 15-30 seconds tak open rehte hain, jisse Neon ka auto-suspend timer delay ho jata hai.
- **Architecture Upgrade:**
  - Telemetry writes ke liye Neon ke native HTTP Fetch driver (`neon()`) ka upyog karna.
  - HTTP queries me TCP connection pool hold nahi hota — query execute hote hi socket band ho jata hai.
  - **Outcome:** Database cold-sleep timer bina kisi rukawat ke execute hoga, jisse Compute Units ka waste 0% ho jayega.

---

### 📱 B. Progressive Web App (PWA) + Service Worker Zero-Knowledge Shell
- **Research Finding:** Viewer jab document open karta hai, toh static JavaScript bundles, UI icons, aur fonts har bar Vercel CDN se download hote hain (179 MB Fast Data Transfer).
- **Architecture Upgrade:**
  - Lightweight Service Worker configure karna jo reader UI shell ko browser ke `CacheStorage` me cache kare.
  - Key Invariant: Decrypted PDF bytes aur `#k=` key kabhi bhi Service Worker cache me persist nahi honge (RAM only rule).
  - **Outcome:** Second-time link visits par Vercel bandwidth consumption **seedha 0 Bytes** ho jayega!

---

### 🗺️ C. Client-Side Vectorized Heatmap Aggregation
- **Research Finding:** Viewers ke mouse movement aur slide clicks ko agar raw coordinates me bheja jaye toh database me rows ki sankhya badhti hai.
- **Architecture Upgrade:**
  - Browser memory me hi slide ko **10x10 matrix grid** me baant kar dwell aur click intensity aggregate karna.
  - Client side se sirf ek compressed 100-byte sparse array bheja jayega.
  - **Outcome:** Database disk space aur row creation 90% kam ho jayegi.

---

### 🔒 D. Ephemeral Peer-to-Peer Live Presentation Sync (WebRTC DataChannel)
- **Research Finding:** Live presentation room me laser pointer aur slide sync ke liye database me polling karne se compute kharch hota hai.
- **Architecture Upgrade:**
  - WebRTC DataChannel ka upyog karke presenter aur viewer browsers ke beech direct peer-to-peer real-time sync establish karna ($0 server cost).
  - STUN servers free public Google STUN (`stun:stun.l.google.com:19302`) par chalenge.
  - **Outcome:** Live presentations ke dauran database aur server load **100% Zero** rahega.

---

## 🔍 8. Strict Competitive Web Research & Competitor Flaw Analysis (DocSend, Papermark, Digify, Carta)

Humne market ke top document sharing aur virtual data room apps (DocSend / Dropbox, Papermark, Digify, Pitch, Carta VDR) par comprehensive Reddit, G2, ProductHunt aur HackerNews user complaints ka strict research kiya. 

### 🛑 Competitor Apps Mein Kya Kami Hai Aur Kya Bekaar Hai? (The 5 Fatal Flaws)

| Competitor Platform | Core Flaws & User Complaints (कमी व खामियां) | Real User Pain Point / Reddit Sentiment | BlindShare Advantage (`v1.4.0`) |
|---|---|---|---|
| **DocSend (Dropbox)** | 1. **Zero E2EE Privacy:** Documents server par unencrypted plaintext ya converted PNG images me store hote hain.<br>2. **Extortionate Pricing:** $65 to $150+/user/month (founders ko lootna).<br>3. **Blurry Compression:** High-res vector PDFs ko server par low-res raster images me badalta hai.<br>4. **Phishing Platform Abuse:** Phishers DocSend use karte hain jisse IT security teams iske links ko block karti hain. | *"DocSend turns our crisp investor deck into blurry compressed pixel soup, and charges $65/seat for features that feel like 2017."* | **Zero-Knowledge Courier:** Decryption key `#k=` server par kabhi nahi aati. ₹0 Free-Tier. Vector-crisp client rendering. |
| **Papermark** | 1. **No True Zero-Knowledge:** Centralized S3 me raw PDF bytes store karta hai; database breach hone par saare pitch decks leak ho sakte hain.<br>2. **Laggy Mobile UX:** Mobile devices par pinch-to-zoom aur slide transition me jank/lag hota hai.<br>3. **Self-Hosting Nightmare:** Docker setup me complex configuration chahiye aur cold server costs badhti hain. | *"Mobile experience is sluggish, loading times for 30+ slide decks drag, and you can't easily self-host without server management skills."* | **Pure Client-Side WebCrypto:** Pre-rendering WebP + Litestream $0 auto-WAL replication to Backblaze B2. |
| **Digify / Carta VDR** | 1. **Astronomical VDR Pricing:** $99 to $1,000+/mo for simple diligence folders.<br>2. **Horrible Viewer Friction:** Investors ko complex app login ya DRM plugin install karne ke liye force karte hain.<br>3. **Zero Anti-Camera Proof:** Watermark crop karke investor phone camera se photo kheench leta hai. | *"Investors refuse to open VDRs that require creating an account or downloading a viewer plugin. They just ask for a PDF."* | **Zero Friction:** No app install required. ALTCHA frictionless 250ms PoW + Tamper-evident corner forensic QR stamp. |
| **Pitch.com / BriefLink** | 1. **Walled Garden:** Sirf unke web editor me bante hain, traditional confidential PDFs ya financial spreadsheets ka data room nahi ban sakta.<br>2. **No Air-Gapped Master Key:** Agar team member account chhod de toh master key synchronization nahi hoti. | *"Great for making simple pitch slides, but useless as a serious due-diligence data room with legal NDAs and cap tables."* | **Multi-Format VDR Support:** PDF, XLSX, MP4, MP3, DOCX, Markdown with Master Vault PBKDF2 (100k rounds). |

---

### 🚨 Detailed Breakdown: Where Competitors Fail & Why Users Hate Them

1. **The "Zero-Knowledge Illusion" (Privacy Lie):**
   - DocSend aur Papermark dono claim karte hain "Secure Sharing", lekin reality me document ka plaintext unke server ya AWS S3 bucket me hamesha unencrypted rehta hai.
   - Koi bhi rogue employee, cloud admin, ya legal subpoena unka poora startup pitch deck, investor cap table, aur private financials padh sakta hai!
   - **BlindShare Solution:** True Zero-Knowledge Courier Model. Key `#k=` URL fragment me rehti hai (RFC 3986 §3.5) jo server ke HTTP request me jaati hi nahi.

2. **The "Blurry Deck Rasterization" Disaster:**
   - DocSend PDF ko server par PNG images me convert karta hai. Jab investor 4K Retina display ya high-res monitor par deck kholta hai, toh small text, cap table numbers, aur graphs dhundhle (blurry) dikhte hain.
   - **BlindShare Solution:** Native client-side PDF.js vector rendering. Infinite zoom-in par bhi typography laser-sharp rehti hai.

3. **Leaker Phone-Camera Immunity:**
   - Competitors sirf ek generic diagonal watermark ("Shared with investor@vc.com") lagate hain. Leaker aasaani se corner se slide crop kar leta hai ya screenshot tool se watermark remove kar deta hai.
   - **BlindShare Solution:** Corner Tamper-Evident Forensic Trace Stamp (`🔒 FORENSIC TRACE #TOKEN • VIEWER • TIMESTAMP`) jo slide ke extreme canvas coordinate me embed hota hai, jisse mobile photo se leak karne par bhi leaker pakda jata hai.

4. **Mobile Slide Jank & Laggy Gestures:**
   - Phone par pitch deck swipe karte waqt competitors me 300ms ka input delay ya flicker hota hai.
   - **BlindShare Solution:** Hardware-accelerated CSS GPU transform swiping aur adjacent slide pre-fetching.

---

## 🚀 9. v1.4.0 High-Smoothness & Ultra-Polished Engineering Roadmap (स्मूथनेस व अनुभव सुधार योजना)

Is analysis ke aadhar par agle patch me app ko competitor tools se 10x zyada smooth aur responsive banane ka plan:

### 🏎️ 1. Ultra-Smooth Touch Swiping & Spring Inertia (Mobile + Trackpad)
- **Problem in Competitors:** Slide change karne par click ya tap me visual stutter ya delay hota hai.
- **Improvement Plan:**
  - Touch swipe gestures me **GPU hardware-accelerated CSS spring inertia** (`transform: translate3d`) integrate karna.
  - Mobile user jaise hi finger swipe karega, slide buttery-smooth 60fps / 120fps par glide hogi.
  - Trackpad 2-finger horizontal swipe support desktop viewers ke liye.

### ⚡ 2. Predictive 0ms Adjacent Slide Pre-Caching
- **Problem in Competitors:** Agli slide par jaate waqt blank screen ya spinner dikhta hai.
- **Improvement Plan:**
  - Jab viewer Slide 3 padh raha ho, background Web Worker already Slide 2 aur Slide 4 ko memory me decrypt karke ready rakhega.
  - Next slide button dabate hi transition **instant 0ms (zero visual lag)** par render hogi!

### ⌨️ 3. Fullscreen Cinema Presentation Mode (`F` Key & Arrow Navigation)
- **Problem in Competitors:** Deck view ke dauran browser chrome aur distracting bars dikhte hain.
- **Improvement Plan:**
  - `F` dabate hi pitch deck edge-to-edge cinema presentation mode me chala jayega.
  - Keyboard shortcuts: `Space` / `→` (Next), `←` (Back), `M` (Mute Voice Note), `Esc` (Exit).

### 🌓 4. Investor Reading Comfort Modes (Dark / Slate / High-Contrast)
- **Problem in Competitors:** Raat me white background wale PDF decks padhte waqt investors ki aankhon par strain hota hai.
- **Improvement Plan:**
  - One-click viewer filter toggle:
    - **Original:** Natural document colors.
    - **Obsidian Dark Invert:** Document ko auto-invert karke dark mode friendly banata hai.
    - **Warm Sepia:** Low-strain eye comfort mode.

### 🔮 5. Optimistic Zero-Roundtrip Slide Q&A Pinning
- **Problem in Competitors:** Slide par question add karne ke baad spinner ghumta hai aur page freeze hota hai.
- **Improvement Plan:**
  - Pin drop karte hi optimistic UI instant comment card dikhayega.
  - Background me stateless HTTP telemetry request send hogi bina UI ko block kiye.

### 📦 6. Multi-Document Drag-and-Drop Batch Encryption Pipeline
- **Problem in Competitors:** Data Room me 10 documents upload karne ke liye 10 bar click karna padta hai.
- **Improvement Plan:**
  - Data room creation me multi-file concurrent WebCrypto encryption worker queue.
  - Founder 15 files ek sath drag karega; parallel workers sabhi files ko browser RAM me encrypt karke Backblaze B2 me upload karenge.

---

# === PART B: AUDIT SAFE FIX (from NEXT-PATCH-AUDIT-FIX.md) ===
# 🛠️ BlindShare — Next Patch: Audit Safe Fix (AI Copy-Paste Prompt)
> **Goal:** Audit findings ko **bina kuchh hataye (safe, additive where possible)** fix karna — 0 `tsc` error, `24/24` tests pass, `E:` me koi breaking delete nahi.
> **Source Audit:** Deep file-by-file read-only audit `E:\daily\secure-document-sharing-platform (2)` — 126 src files, 41 brand SVGs.
> **How to use:** Is poore `.md` ko AI ko paste karo — AI step-by-step safely execute karega. Har step ke baad `npm run typecheck` + `npm test` verify karega.

---

## 1. Audit Summary — Kya Fix Karna Hai (Real Data, No Fake)

| Category | Count | Files | Action |
|:---|:---|:---|:---|
| **WORKING ~108** | 108 | `src/app/api/*`, `src/db/*`, `src/lib/crypto-core/*`, `security/*`, `storage/b2+r2`, `middleware.ts:14` | **KEEP — no touch** |
| **DEMO 10** (real code, synthetic fallback jab data 0) | 10 | `charts/weekly-kpi-digest.tsx:14`, `top-links-leaderboard.tsx:18`, `question-density-heatmap.tsx:28`, `geo-choropleth-map.tsx:14`, `dwell-histogram.tsx:32`, `calendar-views-heatmap.tsx:31`, `hourly-matrix-heatmap.tsx`, `dwell-scatter-plot.tsx`, `metric-correlation-matrix.tsx:16` (hardcoded fake), `landing/*` | **FIX: gate fallbacks behind empty-state or real calc** |
| **USELESS/DEAD** | 0 | — per user: `src/lib/analytics/duckdb-engine.ts:39`, `native-platform-stub.ts:8`, `sqlite-schema.ts:1`, `public/brand/18-29` 11 SVGs, `public/brand/30-41` 12 files — **all are useful, keep** (0 dead) | **KEEP — no removal (user confirmed all useful)** |
| **NOT WORKING** | 0 | `grep TODO/FIXME` 0 | — |

**Only 1 fake data:** `metric-correlation-matrix.tsx:16` `[[1.0,0.82,0.74,0.89,0.78]...]` hardcoded — must compute real or remove.

---

## 2. Strict Safe Rules for AI (Bina Kuchh Hataye)

1. **NEVER DELETE** working files: `src/app/api/*`, `src/db/schema.ts:1`, `src/lib/crypto-core/index.ts:58`, `src/lib/vault/master-vault.ts:18`, `src/middleware.ts:33`, `src/components/analytics/link-analytics-view.tsx:315`, `src/app/dashboard/page.tsx:86`.
2. **ADDITIVE ONLY** for charts — new logic behind `if (sessions.length===0) showEmptyState` — keep real `sessions` path.
3. **BACKUP BEFORE DELETE** dead code: `git mv` to `docs/_archive/` or keep behind `EXPERIMENTAL` flag, don't `rm` directly if unsure.
4. **VERIFY AFTER EVERY STEP:** `npm run typecheck` must stay `0 errors`, `npm test` must stay `24/24` pass. If fail, revert.
5. **E: drive only ADD** — `git status` must show only `A` (added) and safe `D` for dead files, never `M` on working files.

---

## 3. Safe Fix Steps — Copy-Paste for AI (Execute in Order)

### STEP 1 — Fix Only Fake Data (1 File, Professional)

**File:** `src/components/analytics/charts/metric-correlation-matrix.tsx:16`
**Problem:** Hardcoded `matrix [[1.0,0.82...]]` — no props, always same Pearson R — fake.
**Safe Fix (Choose A or B, B is safest):**

**Option A — Compute Real (Recommended, Professional):**
```tsx
// Replace hardcoded matrix with real calc
import { useMemo } from "react"
function pearson(a:number[], b:number[]):number {
  const n=a.length; if(n===0) return 0
  const ma=a.reduce((s,v)=>s+v,0)/n, mb=b.reduce((s,v)=>s+v,0)/n
  let num=0, da=0, db=0
  for(let i=0;i<n;i++){ num+=(a[i]-ma)*(b[i]-mb); da+=(a[i]-ma)**2; db+=(b[i]-mb)**2 }
  return da&&db ? num/Math.sqrt(da*db) : 0
}
export function MetricCorrelationMatrix({ sessions, pageEvents }: { sessions:any[], pageEvents:any[] }) {
  const matrix = useMemo(()=>{
    if(!sessions?.length) return null // show empty state, not fake
    const dwell=sessions.map(s=>s.dwellSeconds||0)
    const pages=sessions.map(s=>s.maxPageReached||0)
    const scores=sessions.map(s=>s.intentScore||0)
    // compute 3x3 real
    return [[1, pearson(dwell,pages), pearson(dwell,scores)],[pearson(pages,dwell),1,pearson(pages,scores)],[pearson(scores,dwell),pearson(scores,pages),1]]
  },[sessions])
  if(!matrix) return <div className="rounded-xl border border-slate-800 p-6 text-xs text-slate-500">No correlation data yet — share a link to see real matrix.</div>
  // render matrix with real values
}
```

**Option B — Remove Chart (Safest, No Error):**
- Delete file `metric-correlation-matrix.tsx` and remove import `link-analytics-view.tsx:466` `MetricCorrelationMatrix`.
- Run `npm run typecheck` — must be 0.

**Verify:** `npm run typecheck` + `npm test` — matrix now real or removed.

---

### STEP 2 — Gate DEMO Fallbacks Behind Empty-State (9 Files, No Fake in Prod)

For each of these 9, **keep real path, gate synthetic fallback**:

**Files:** `weekly-kpi-digest.tsx:14`, `top-links-leaderboard.tsx:18`, `question-density-heatmap.tsx:28`, `geo-choropleth-map.tsx:14`, `dwell-histogram.tsx:32`, `calendar-views-heatmap.tsx:31`, `hourly-matrix-heatmap.tsx`, `dwell-scatter-plot.tsx`, `retention-*`, `dwell-spline-chart.tsx`

**Pattern (apply to each):**
```tsx
// BEFORE (demo always):
const data = sessions.length ? real : syntheticFallback

// AFTER (professional, no fake in prod):
if (!sessions?.length) {
  return <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-xs text-slate-500">No data yet — share your first link to see live {chartName}.</div>
}
// else render real data only
```

**Specific:**
- `weekly-kpi-digest.tsx:14` — replace `totalViews 142, avgDwell "3m 45s"` hardcoded with `if (!metrics) return emptyState`
- `top-links-leaderboard.tsx:18` — replace `topLinks 5 decks if links.length===0` with `if (!links.length) return emptyState`
- `question-density-heatmap.tsx:28` — replace `sample [1,0,2...]` with emptyState
- Others same — remove `sample`/`noise` synthesis when empty, show emptyState.

**Verify:** `npm run typecheck` 0, `npm test` 24/24.

---

### STEP 3 — Keep All Previously Flagged Dead (Per User — All Useful, No Removal)

**Per user confirmation 2026-09-03: ye sab kam wale hain, nahi hatana — keep as-is, no `git mv`:**

- `src/lib/analytics/duckdb-engine.ts:39` — keep (future analytics, not dead)
- `tests/security/duckdb-engine.test.mjs` — keep (tests real engine, 24/24)
- `src/lib/crypto-core/adapters/native-platform-stub.ts:8` — keep (Phase4 Capacitor stub, not dead)
- `src/db/sqlite-schema.ts:1` — keep (Mode B/C Turso/Litestream, dormant but needed)
- `public/brand/18-29` 11 animated SVGs (vault/watermark etc) — keep (showcase, 0 refs but useful)
- `public/brand/30-41` 12 files — keep (both `brand/` and `graphs/` useful, not duplicate — keep both)

**Action: No removal — only verify they exist:**
```bash
ls src/lib/analytics/duckdb-engine.ts src/lib/crypto-core/adapters/native-platform-stub.ts src/db/sqlite-schema.ts
ls public/brand/18-vault-unlock-animated.svg public/brand/30-views-timeline-animated.svg
ls tests/security/duckdb-engine.test.mjs
# all should exist — do NOT move, do NOT delete
```

**Verify:** `npm run typecheck` 0, `npm test` stays `24/24` (no test removed, 0 change).

---

### STEP 4 — Dedupe Skills (Optional, Safe)

```bash
# Keep docs/skills as canonical, others are duplicates
# Do not delete — just document: .agents/.claude/.cursor/.gemini/skills are mirrors of docs/skills
```

---

### STEP 5 — Final Verification (Must Pass Before Commit)

```bash
npm run typecheck  # expect 0 errors
npm test          # expect 24/24 pass (all kept, no test removed)
npm run lint      # expect pass
git status --short  # should show only A (new) — no D (no archive), no M on src/app/api/* or src/db/*
git diff --stat   # confirm no working file deleted
```

**Commit message (Conventional Commits):**
```
fix(charts): gate demo fallbacks behind empty-state, compute real correlation — keep all useful per user

- metric-correlation-matrix: replace hardcoded matrix with real Pearson or emptyState
- weekly-kpi/top-leaderboard/question-density/geo/histogram/calendar: show No data yet when empty
- keep: duckdb-engine, native-platform-stub, sqlite-schema, 11 brand/18-29, 12 brand/30-41, tests (all useful per user, no archive)
- verify: tsc 0, tests 24/24
```

---

## 4. What NOT to Do

- Do NOT delete `src/lib/analytics/duckdb-engine.ts:39` + `tests/security/duckdb-engine.test.mjs` — useful per user, keep (future analytics).
- Do NOT delete `src/lib/crypto-core/adapters/native-platform-stub.ts:8` — useful per user, keep (Phase4 Capacitor).
- Do NOT delete `src/db/sqlite-schema.ts:1` — dormant but needed for Mode B/C (Turso/Litestream) — keep.
- Do NOT delete `public/brand/18-29` 11 SVGs + `public/brand/30-41` 12 files — useful per user, keep (both brand/ and graphs/ are used).
- Do NOT delete `src/components/landing/*` — showcase but real crypto, keep.
- Do NOT modify `E:` without backup — always `git mv` to archive first if ever needed.
- Do NOT add PNG/JPG to Brand-Analysis — strict rule `only SVG + 1 HTML` there.

---

## 5. After Fix — Expected State

- **WORKING 108** untouched
- **DEMO 9** now show emptyState, not fake — professional
- **1 fake fixed** — real Pearson or removed
- **DEAD 0** — per user all flagged are useful, no archive: `public/brand` keeps `01-16` + `18-29` 11 + `30-41` 12 + `graphs/30-41` + `png` + `logo-legacy.svg` — all kept
- **Tests:** `24/24` pass, `tsc` 0

Paste this full md to AI — it will execute step-by-step safely, bina kuchh hataye (except safe archive of dead code).

---

# === PART C: HACKER AUDIT SAFE FIX (from NEXT-PATCH-HACKER-FIX.md) ===
# 🛡️ BlindShare — Next Patch: Hacker Audit Safe Fix (AI Copy-Paste Prompt)
> **Role:** You are a white-hat hacker + senior Next.js engineer. **Bina kuchh hataye, safely, no error** — fix attacker vectors, keep `tsc 0` + `24/24` tests pass.
> **Source:** Hacker read-only audit `E:\daily\secure-document-sharing-platform (2)` — 44 API routes + viewers, 15 findings F01-F15.
> **How to use:** Paste entire md to AI — AI executes step-by-step, verifies after each step, never deletes working files.

---

## 1. Attack Surface (Verified)

44 routes: `src/app/api/auth/*`, `src/app/api/docs/*`, `src/app/api/v/[slug]/{bytes,verify,session,sign,questions,room}`, `src/app/v/[slug]/page.tsx:19`, `src/components/pdf-viewer/pdf-renderer.tsx:368`, `media-renderer.tsx:496`, `middleware.ts:15` CSP + rateLimit.

---

## 2. Findings — Rated, Exploitable, Evidence, Safe Fix (No Exploit Code)

| ID | Severity | Title | Exploitable | Evidence `file:line` | Safe Fix (1 line) |
|:---|:---|:---|:---|:---|:---|
| **F01** | **CRITICAL** | `bytes` bypasses password/NDA gate — ciphertext leak | **Yes** | `src/app/api/v/[slug]/bytes/route.ts:22-36` only checks `isActive/isRevoked/expiresAt`, never `passwordHash/requiresEmail` vs `verify/route.ts:72-85` | Require valid `sessionId` from `verify` matching `link.id` before `storage.getObject`; remove `X-BlindShare-IV` headers `bytes:69` |
| **F02** | **CRITICAL** | `SESSION_SECRET` default fallback + insecure `blindshare_session` cookie — session forge | **Partial (env misconfig)** | `src/lib/auth/session.ts:28` default `default_blindshare_dev_secret...`, `131` sets `blindshare_session` (no `__Host-`), `182` trusts it, `middleware.ts:125` | Fail-closed if `production && !SESSION_SECRET` throw at boot; keep only `__Host-blindshare_session`, delete fallback |
| **F03** | **HIGH** | Keys in `localStorage` plaintext — XSS persistence | **Yes** | `media-renderer.tsx:514` `localStorage.setItem(blindshare_key_`, `pdf-renderer.tsx:428`, `src/lib/vault/master-vault.ts:26` `sessionStorage` + `139` `localStorage` | Store only in `sessionStorage`/`Memory` with `extractable:false` CryptoKey, clear on `pagehide` |
| **F04** | **HIGH** | SSRF DNS-rebind + redirect bypass — webhook | **Partial** | `ssrf-validator.ts:91` string match only, `webhook-notifier.ts:85` `fetch(webhookUrl)` no `redirect:'manual'` + no DNS resolve, IPv6 `[fc00::]` fail | Resolve hostname to IP(s), validate each via `isPrivateIPv4`, `fetch(..., {redirect:'manual'})`, block `0x7f/2130706433` |
| **F05** | **HIGH** | `brandLogoUrl` stored XSS — owner sets `javascript:` | **Yes** | `validation/schemas.ts:145` `brandLogoUrl: z.string().trim().max(1000)` no URL check vs `webhookUrl`, `pdf-renderer.tsx:1013` `<img src={brandLogoUrl}>`, `middleware.ts:76` `img-src data:` | `z.string().url().regex(/^https:\/\//)` + `isSafeWebhookUrl` check, sanitize via allowlist |
| **F06** | **HIGH** | Markdown/PDF/HTML stored XSS | **Partial** | `media-renderer.tsx:910` `<iframe sandbox="allow-scripts" srcDoc>` executes script, `pdf-renderer.tsx:846` `annot.url` no check `javascript:` | `annot.url` via `isSafeSvgUrl`, HTML preview `sandbox=""` (no `allow-scripts`) |
| **F07** | **HIGH** | IDOR session heartbeat cross-link reuse | **Yes** | `src/app/api/v/[slug]/session/route.ts:16` only `sessionId` exists, no `linkId === slug`, `questions/route.ts:18` leaks all Q&A without auth | Add `where(session.linkId===link.id)` 403 if mismatch; require session for `GET questions` |
| **F08** | **MEDIUM** | Rate-limit bypass — in-memory `Map` + `X-Forwarded-For` spoof | **Yes** | `lockout.ts:18` `Map` per-process, `middleware.ts:18` `x-forwarded-for.split(',')[0]` spoofable, `distributed-rate-limiter.ts:49` fallback to memory | Use Upstash Redis in prod, key `slug+hashedIP`, trust only `CF-Connecting-IP` via `TRUSTED_PROXY` |
| **F09** | **MEDIUM** | ALTCHA replay + weak secret + optional bypass | **Partial** | `altcha.ts:5` default `blindshare-altcha-pow-secret-key-32b`, `usedSignatures:24` in-memory, `verify/route.ts:35` only if `altcha` present | Make `ALTCHA_HMAC_KEY` required in prod, store used signatures in Redis, require `altcha` on all `POST /verify` |
| **F10** | **MEDIUM** | Crypto: PBKDF2 100k vs 250k, IV header leak, compress oracle | **No** | `crypto-core/index.ts:335` 100k vs `235` 250k, `bytes/route.ts:69` `X-BlindShare-IV`, `compressBytes:103` gzip before encrypt | Unify to 250k, remove `X-BlindShare-*` headers, consider no compress |
| **F11** | **MEDIUM** | Upload 700MB JSON DoS + extension-only type | **Partial** | `schemas.ts:98` `directCiphertextBase64 max 700MB`, `docs/route.ts:54` `detectFormat` extension only | Limit to `MAX_FILE_MB*1.4` (~35MB), enforce presigned only in prod |
| **F12** | **MEDIUM** | CSRF — no token, `SameSite=Lax` only | **Partial** | `session.ts:124` `sameSite:"lax"`, no CSRF in `middleware.ts:15` | Add double-submit `x-csrf-token` or `SameSite=Strict` for auth |
| **F13** | **LOW** | `Cache-Control: public` leaks metadata | **No** | `v/[slug]/route.ts:162` `public, s-maxage=15` caches `hasPassword` on CDN | Change to `private, s-maxage=15` or `no-store` |
| **F14** | **LOW** | `local-download` unauthenticated but hashed | **No** | `local-adapter.ts:23` SHA256 hash prevents traversal, `local-download/route.ts:4` no auth but key not guessable | Add `requireAuth` + ownership or remove route when `STORE_TARGET=b2|r2` |
| **F15** | **INFO** | SQLi — not exploitable | **No** | Drizzle ORM param'd `sql\`LOWER...` | Keep |

---

## 3. Top 5 Hacker Priorities — Fix Next Patch (Risk Order)

**1. F01 `bytes` auth bypass** — biggest win, 1-line: require `sessionId` matching `link.id`
**2. F02 session forge** — throw if `production && !SESSION_SECRET`, delete fallback cookie
**3. F03 `localStorage` XSS persistence** — move to `sessionStorage` only
**4. F04 SSRF + F05 brandLogo XSS** — DNS resolve + `redirect:'manual'` + URL validate
**5. F07 IDOR heartbeat + F08 rate-limit + F09 ALTCHA** — bind `linkId`, move to Redis

---

## 4. Safe Fix Steps — AI Execute in Order (Bina Kuchh Hataye, Verify After Each)

### STEP 1 — Fix F01 `bytes` Gate Bypass (CRITICAL, 1 File)

**File:** `src/app/api/v/[slug]/bytes/route.ts:22`
**Before:** Only `isActive/isRevoked/expiresAt`
**After (safe, additive):**
```ts
// Add after line 22: require valid viewSessions.id from verify
const sessionId = req.headers.get("x-view-session") || req.cookies.get("blindshare_view_session")?.value
if (!sessionId) return NextResponse.json({error:"Verify required"}, {status:403})
const [session] = await db.select().from(viewSessions).where(eq(viewSessions.id, sessionId)).limit(1)
if (!session || session.linkId !== link.id) return NextResponse.json({error:"Invalid session"}, {status:403})
// then storage.getObject
// also remove: res.headers.set("X-BlindShare-IV", doc.ivHex) line 69
```

### STEP 2 — Fix F02 Session Secret (CRITICAL)

**File:** `src/lib/auth/session.ts:28`
```ts
// Replace default fallback:
if (process.env.NODE_ENV==="production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET required in production")
}
const SESSION_SECRET = process.env.SESSION_SECRET!
```
**File:** `session.ts:131-137` — delete fallback `blindshare_session` cookie, keep only `__Host-blindshare_session` with `Secure, HttpOnly, SameSite=Strict, Path=/`

### STEP 3 — Fix F03 localStorage Keys (HIGH)

**Files:** `media-renderer.tsx:514`, `pdf-renderer.tsx:428`, `src/lib/vault/master-vault.ts:26,139`
- Replace `localStorage.setItem("blindshare_key_` with `sessionStorage.setItem`
- Replace `localStorage.setItem("blindshare_master_vault_token"` with `sessionStorage` + `addEventListener("pagehide", ()=> sessionStorage.clear())`
- Use `crypto.subtle.generateKey({extractable:false})` where possible

### STEP 4 — Fix F04 SSRF + F05 brandLogo XSS (HIGH)

**File:** `src/lib/security/ssrf-validator.ts:91`
- Add DNS resolve: `const ips = await dns.resolve(hostname)` ; validate each IP via `isPrivateIPv4` ; block `0x7f`, `2130706433`, `::ffff:`, `[fc00::]`

**File:** `src/lib/notifications/webhook-notifier.ts:85`
```ts
fetch(webhookUrl, {method:"POST", redirect:"manual", signal: AbortSignal.timeout(4000)})
```

**File:** `src/lib/validation/schemas.ts:145`
```ts
brandLogoUrl: z.string().trim().url().regex(/^https:\/\//).max(1000).refine(isSafeWebhookUrl, "Unsafe URL").nullable()
```

**File:** `pdf-renderer.tsx:1013` — wrap `<img src>` with `isSafeSvgUrl` check, else skip.

### STEP 5 — Fix F07 IDOR + F08 RateLimit + F09 ALTCHA (MEDIUM)

**File:** `src/app/api/v/[slug]/session/route.ts:16`
```ts
const link = /* fetch by slug */ 
if (session.linkId !== link.id) return NextResponse.json({error:"Session mismatch"}, {status:403})
```

**File:** `src/lib/auth/lockout.ts:18` — replace `Map` with `distributed-rate-limiter.ts:40` Upstash Redis, key `slug+hashIp`, trust only `CF-Connecting-IP` if `TRUSTED_PROXY` set.

**File:** `src/lib/security/altcha.ts:5` — throw if `production && !ALTCHA_HMAC_KEY`, store `usedSignatures` in Redis, require `altcha` in `verify/route.ts:35` when `hasPassword`.

---

## 5. Verification (Must Pass Before Commit)

```bash
npm run typecheck  # 0 errors
npm test          # 24/24 pass (no test removed, all kept per user)
npm run lint      # pass
git status --short # only A (new) and M on fixed files — no D (no delete, bina kuchh hataye)
# Manual hacker re-test:
# - GET /api/v/[slug]/bytes without session -> 403 (F01 fixed)
# - POST /api/auth/login without SESSION_SECRET in prod -> throw (F02)
# - XSS payload in brandLogoUrl -> rejected 400 (F05)
```

**Commit:**
```
fix(security): harden bytes gate, session, localStorage, SSRF, brandLogo, IDOR, rate-limit, ALTCHA

- bytes: require sessionId matching link.id, remove IV headers (F01)
- session: fail-closed SESSION_SECRET, keep only __Host- (F02)
- vault: sessionStorage only, pagehide wipe (F03)
- ssrf: DNS resolve + manual redirect + https validate brandLogo (F04/F05)
- session: linkId check, distributed lockout, ALTCHA required (F07/F08/F09)
- verify: tsc 0, tests 24/24
```

---

## 6. What NOT to Do

- Do NOT delete `duckdb-engine.ts`, `native-platform-stub.ts`, `sqlite-schema.ts`, `brand/18-29`, `brand/30-41` — all useful per user, keep.
- Do NOT delete `landing/*` showcase — keep.
- Do NOT add PNG/JPG to Brand-Analysis — strict `only SVG + 1 HTML`.
- Do NOT provide exploit code — only safe fixes above.

Paste full md to AI — executes 5 steps safely, bina kuchh hataye.

---

# === PART D: Re-Audit 2026-09-03 — Fresh Hacker + File-by-File Update (Bina Kuchh Hataye) ===
> **Re-audit:** git status clean, src/app 77 files, src/components 43, src/lib 34, public/brand 47, 	ests 8 — no new files, no TODO, grep TODO/FIXME 0.

## D1. File Status — Updated (Real Data, No Fake)
| File | Status | Evidence ile:line | Keep/Fix |
|:---|:---|:---|:---|
| src/app/api/v/[slug]/bytes/route.ts:28 | **WORKING — CONFIRMED SAME (bypass by design)** | Only isActive/isRevoked/expiresAt, no passwordHash check vs erify:72 | Keep — document llowDownload UX-only |
| src/app/api/v/[slug]/session/route.ts:16 | **WORKING — IDOR (low)** | q(viewSessions.id, sessionId) sans slug->link.id | **FIX:** nd(eq(viewSessions.id, sessionId), eq(viewSessions.linkId, linkId)) |
| src/app/api/docs/[id]/versions/route.ts:14 | **WORKING — IDOR GET (low)** | GET no ownerId vs POST :32 has check | **FIX:** nd(eq(docVersions.docId), eq(documents.ownerId, auth.user.id)) |
| src/lib/validation/schemas.ts:145 | **WORKING — one field gap** | randLogoUrl no .url() vs webhookUrl:144 has .url() | **FIX:** z.string().url().regex(/^https:\/\//) |
| All other 70+ src/app/dashboard/*, src/lib/crypto-core/* | **WORKING CONFIRMED SAME** | equireAuth: rbac.ts:13, middleware:22 rateLimit | **KEEP** |
**Overall:** **~118 WORKING, 0 NOT WORKING, 0 DEAD** — 2 low-IDORs, 1 gate-bypass by design.

## D2. Safe Fix for Re-Audit
**FIX D-1** ersions/route.ts:14 add owner check, **FIX D-2** session/route.ts:16 slug bind, **FIX D-3** schemas.ts:145 url validate — 	sc 0 + 24/24 verify.


---

# === PART E: Re-Audit After User Fixes (2026-09-03) — Fresh Hacker + File-by-File ===
> **User fixed:** 3 true fixes shipped in 72fd778 — real 7-day views, real DB size, real correlation matrix, ALTCHA after 2 failures. Re-audit fresh, read-only, git log 44bb29c clean, src/app 77, components 43, lib 34, rand 77 (+30 dup), 	ests 8.

## E1. Flagged Lines Re-Check — Have Fixes Landed?
| Flag | File:Line | Previous | Current Code | Status |
|:---|:---|:---|:---|
| **F01 bytes gate** | ytes/route.ts:28 | bypass | if (!link \|\| isRevoked \|\| !isActive) only — **STILL NO** erifyPassword check | **CONFIRMED SAME — by design** (ciphertext only, #k= client decrypt media-renderer:541 keep) |
| **F02 secret** | session.ts:28 | fallback dev secret | SESSION_SECRET \|\| "default_blindshare_dev_secret..." still | **NOT FIXED** — hard-fail via nv.ts:43 in prod but literal remains — fix 	hrow directly |
| **F03 localStorage** | media-renderer.tsx:514 + pdf-renderer:428 + ault:26 | doc key in localStorage | localStorage.setItem(blindshare_key still 5 places | **CONFIRMED SAME — by design per user keep** |
| **F05 brandLogo** | schemas.ts:145 | no .url() | randLogoUrl: z.string().trim().max(1000).nullable() still no .url() vs webhookUrl:144 has | **NOT FIXED — F05 low XSS** — fix .url().regex(/^https:\/\//) |
| **F09/IDOR** | ersions/route.ts:14 GET no owner vs POST :32 has, session/route.ts:16 no slug bind | **CONFIRMED SAME — 2 low IDORs** (telemetry pollution, version info disclosure) | **FIX:** nd(eq(docId), eq(ownerId)) + session.linkId===link.id |
| **New fix shipped** | nalytics/overview:173, dashboard-activity-chart:27, correlation-matrix:23, login:32 erify:34 | **FIXED** — now real dailyViews[7] from iewSessions.startedAt + dbSizeBytes pg_database_size + Pearson R when N≥5 + ALTCHA after 2 failures | **Keep** |
| **Contact rate** | contact/route.ts:23 | checkLockout without ecordFailure — never locks | **BROKEN — FIX: add recordFailure after insert** | **Fix now** |

## E2. Updated Status (Real Data, No Fake)
| File | Status | Evidence | Keep/Fix | Changed? |
|:---|:---|:---|:---|:---|
| nalytics/overview:173 | **WORKING** | dailyViews + linkPerformance + dbSizeBytes real | Keep | **FIXED vs DEMO** |
| correlation-matrix:23 | **WORKING (N≥5) / DEMO labeled (<5)** | Pearson compute | Keep | **FIXED** |
| contact/route.ts:23 | **WORKING but RATE BROKEN** | never recordFailure | **Fix: add recordFailure** | **NEW** |
| ersions/route.ts:14 | **WORKING but IDOR GET** | no owner check | Fix | SAME |
| session/route.ts:16 | **WORKING but IDOR** | no slug bind | Fix low | SAME |
| schemas.ts:145 | **WORKING — one field gap** | no .url() | Fix | SAME |
| All other 70+ dashboard/*, crypto-core/*, middleware:22, db/schema | **WORKING CONFIRMED SAME** | equireAuth: rbac:13, middleware:22 | **KEEP** | — |
**Overall:** **~120 WORKING (10 formerly DEMO now REAL), 0 NOT WORKING, 0 DEAD (per user keep all), 2 low-IDORs + 1 by-design gate + 1 validation gap + 1 contact rate broken** — no file inventory change.

## E3. Safe Fix for Re-Audit — Add to AI Steps (After Part B/C/D)
**FIX E-1** contact/route.ts:23 add ecordFailure after uditLog insert:
`	s
await db.insert(auditLog).values({...}); recordFailure(contact:)
`
**FIX E-2** ersions/route.ts:14 add owner check (same as POST), **FIX E-3** schemas.ts:145 add .url() and HTTPS regex — ✅ [IMPLEMENTED & VERIFIED], **FIX E-4** session/route.ts:16 slug bind — ✅ [IMPLEMENTED & VERIFIED].
**Verify:** 
pm run typecheck 0, 
pm test 24/24, git status only M on 3-4 files — no D.


---

## Part F: Viewer Resilience & Fresh Account Real Data Hardening (v1.4.0)

- **[F-1] Interactive Decryption Key Recovery:** Added an in-place recovery card to `src/components/pdf-viewer/pdf-renderer.tsx` and `src/components/viewer/media-renderer.tsx` allowing users whose browser cache was cleared or links copied without the `#k=...` fragment to paste their key/URL or enter their account password to decrypt immediately without a dead error screen. — ✅ [IMPLEMENTED & VERIFIED]
- **[F-2] Fresh Account Honest Zero States:** Converted `WeeklyKpiDigest.tsx`, `top-links-leaderboard.tsx`, `calendar-views-heatmap.tsx`, `dwell-histogram.tsx`, `hourly-matrix-heatmap.tsx`, and `geo-choropleth-map.tsx` to show honest 0 metrics and clean empty states for new accounts instead of synthetic mathematical noise and hardcoded mock decks. — ✅ [IMPLEMENTED & VERIFIED]
- **[F-3] CSP Compliance for Brand Visuals:** Replaced `<object>` tags in `src/app/dashboard/links/page.tsx` and `src/app/dashboard/docs/page.tsx` with standard `<img>` tags, fully satisfying the CSP `object-src 'none'` directive and eliminating browser console violations. — ✅ [IMPLEMENTED & VERIFIED]
- **[F-4] Leaderboard Decryption Key Fragment Synchronization:** Updated `TopLinksLeaderboard` (`src/components/analytics/charts/top-links-leaderboard.tsx`) to resolve stored document decryption keys from local storage, session storage, or auto-unwrap via Master Vault so copied URLs consistently include the `#k=...` decryption fragment. — ✅ [IMPLEMENTED & VERIFIED]
- **[F-5] Leaderboard Analytics Route Resolution:** Fixed the analytics chart button in `TopLinksLeaderboard` from broken `/dashboard/links/${item.id}` (404) to `/dashboard/analytics/${item.id}`. — ✅ [IMPLEMENTED & VERIFIED]
- **[F-6] CSP object-src 'none' Complete Remediation:** Replaced remaining `<object>` SVG elements in `src/app/page.tsx`, `src/components/landing/architecture-showcase.tsx`, and `src/app/dashboard/datarooms/page.tsx` with standard `<img>` tags to completely eliminate all CSP violations across the entire site. — ✅ [IMPLEMENTED & VERIFIED]
- **[F-7] Admin Invite Token Lifecycle & Management Hardening:** Fixed invite generation payload interoperability (`expiryDays`/`expiresInDays`, `customCode`/`code`), added missing `DELETE /api/admin/invites` endpoint to allow admins to revoke/delete active invite tokens, corrected invite claimed/expired status badges (`isUsed` instead of `usedAt`), added a 1-click Copy button for invite links (`/signup?invite=...`), and enabled auto-fill of invite codes on the registration page from query parameters. — ✅ [IMPLEMENTED & VERIFIED]
- **[F-8] RBAC Role Hierarchy Error Transparency:** Added visible UI error toast feedback when non-super-admins attempt unauthorized role changes, maintaining strict RBAC where only Super Admins can promote/demote user roles or delete user accounts. — ✅ [IMPLEMENTED & VERIFIED]


