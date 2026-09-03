# 🎨 BlindShare Architecture & Security Visual Blueprint (`v1.4.0`)

> **Zero-Knowledge Secure Document Sharing, Digital Data Room & Pitch Deck Analytics Platform**

---

## 🧭 1. Complete End-to-End Platform Architecture

```mermaid
graph TD
    %% Styling Classes
    classDef client fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#fbbf24;
    classDef server fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#60a5fa;
    classDef storage fill:#111827,stroke:#10b981,stroke-width:2px,color:#34d399;
    classDef crypto fill:#31102f,stroke:#ec4899,stroke-width:2px,color:#f472b6;
    classDef security fill:#1e1b4b,stroke:#8b5cf6,stroke-width:2px,color:#a78bfa;

    subgraph OWNER["👤 Document Owner (Founder)"]
        O1["📄 Plaintext PDF / Image"]:::client
        O2["🗜️ Client-Side GZIP Compression"]:::crypto
        O3["🔑 Generate 256-bit DocKey (RAM)"]:::crypto
        O4["🔒 AES-GCM-256 WebCrypto Encrypt"]:::crypto
        O5["📦 Encrypted Ciphertext (.bin)"]:::client
        O6["🔐 PBKDF2 Master Vault Key Wrap"]:::crypto
    end

    subgraph BACKEND["⚡ Blind Courier Backend (Serverless / VPS)"]
        B1["POST /api/docs (Metadata Only)"]:::server
        B2["POST /api/v/:slug/verify (Gates)"]:::server
        B3["🛡️ ALTCHA PoW Challenge Validator"]:::security
        B4["📊 DuckDB & Analytics Aggregator"]:::server
    end

    subgraph STORAGE_LAYER["💾 ₹0 Storage & Database Layer"]
        S1[("🪣 Backblaze B2 / S3<br/>Encrypted Blobs Only")]:::storage
        S2[("🐘 Neon Postgres / SQLite / Turso<br/>128-bit IDs & Metadata")]:::storage
    end

    subgraph VIEWER["👥 Investor / Reader (Public Viewer)"]
        V1["🌐 Open /v/:slug#k=DocKey"]:::client
        V2["⚡ Solve ALTCHA PoW (250ms)"]:::security
        V3["📥 Stream Encrypted Blob (.bin)"]:::client
        V4["🔓 AES-GCM Decrypt in Browser RAM"]:::crypto
        V5["🗜️ GZIP Decompress"]:::crypto
        V6["🖼️ HTML5 Canvas + Dynamic Watermark"]:::client
    end

    %% Data Flow Connections
    O1 --> O2 --> O4
    O3 --> O4 --> O5
    O3 --> O6
    O5 -->|Upload via Presigned URL| S1
    O6 -->|Store Wrapped Key Only| B1 --> S2

    S2 -->|Serve Link Settings| B2
    V1 -->|1. Request Page & Gates| B2
    B2 -->|2. Issue ALTCHA Challenge| B3
    V2 -->|3. Submit PoW Solution| B3
    B3 -->|4. Gate Passed| V3
    S1 -->|5. Encrypted Bytes Stream| V3
    V3 --> V4
    V1 -.->|#k= Key Never Sent to Server| V4
    V4 --> V5 --> V6
```

---

## 🔒 2. Zero-Knowledge Courier Model (RFC 3986 `#k=` Fragment)

```mermaid
sequenceDiagram
    autonumber
    actor Owner as 👤 Document Owner
    participant Browser as 🌐 Client Browser (RAM)
    participant Server as ⚡ BlindShare Backend
    participant Storage as 🪣 Backblaze B2 / S3
    actor Reader as 👥 Document Reader

    Note over Owner,Browser: 1. Encryption Phase (Zero Server Visibility)
    Owner->>Browser: Select confidential PDF/Pitch Deck
    Browser->>Browser: Generate 256-bit Key in RAM
    Browser->>Browser: GZIP Compress + AES-GCM-256 Encrypt
    Browser->>Storage: Direct upload encrypted blob (.bin)
    Browser->>Server: Save Metadata (IV, Tag, Page Count - NO KEY!)
    Server-->>Owner: Generate Share Link: /v/abc123#k=SecretKey

    Note over Owner,Reader: 2. Link Distribution (Offline / Direct)
    Owner->>Reader: Send link via Email/WhatsApp (/v/abc123#k=...)

    Note over Reader,Server: 3. Zero-Knowledge Decryption Phase
    Reader->>Server: GET /v/abc123 (HTTP Request - Browser strips #k=...)
    Server-->>Reader: Return HTML Viewer + Document Metadata
    Reader->>Storage: Stream encrypted .bin blob
    Note over Reader: Browser reads #k=SecretKey from window.location.hash
    Reader->>Reader: WebCrypto.subtle.decrypt(AES-GCM-256)
    Reader->>Reader: Decompress GZIP -> Render to Canvas
    Note over Reader: Document displays cleanly on screen with zero disk footprint!
```

---

## 🛡️ 3. ALTCHA Self-Hosted Proof-of-Work (PoW) Architecture

```mermaid
sequenceDiagram
    autonumber
    actor User as 🤖 / 👤 Visitor (Human or Bot)
    participant Client as 🖥️ Browser Web Worker
    participant Server as 🛡️ ALTCHA Engine (/api/altcha)
    participant Backend as 🔒 Protected API (/login, /verify, /questions)

    User->>Server: GET /api/altcha (Fetch PoW challenge)
    Server->>Server: Generate random salt + secret number (0..50000)
    Server->>Server: challenge = SHA256(salt + number)
    Server->>Server: signature = HMAC-SHA256(challenge, ALTCHA_HMAC_KEY)
    Server-->>Client: Return { algorithm, challenge, maxnumber, salt, signature }

    Note over Client: Background Web Worker loops 0..50000 (~250ms)
    Client->>Client: Match SHA256(salt + n) == challenge
    Note over Client: ✓ Solved! Payload encoded { algorithm, challenge, number, salt, signature }

    User->>Backend: Submit Form with ALTCHA payload
    Backend->>Backend: 1. Check expiration (?expires=...)
    Backend->>Backend: 2. Check replay attack cache (10-min memory Map)
    Backend->>Backend: 3. Verify HMAC signature in constant time (timingSafeEqual)
    Backend->>Backend: 4. Verify SHA256(salt + number) == challenge
    
    alt Verification Passed
        Backend-->>User: 200 OK (Process Login / Access Link / Question Pin)
    else Forgery / Expired / Replay Detected
        Backend-->>User: 400 Bad Request ("Bot security verification failed")
    end
```

---

## 🏛️ 4. Owner Master Key Vault (Cross-Device Zero-Knowledge Sync)

```mermaid
graph LR
    subgraph RAM["🧠 Client-Side RAM (Owner Browser)"]
        P["🔑 Master Password"]
        S["🎲 16-byte Salt"]
        PBKDF2["⚡ PBKDF2-SHA256 (100k rounds)"]
        OMK["🛡️ 256-bit Owner Master Key"]
        DK["📄 32-byte Plain DocKey"]
        WRAP["🔒 AES-GCM-256 Key Wrap"]
        WDK["📦 Wrapped DocKey Hex"]
    end

    subgraph CLOUD["☁️ Cloud Database (Neon / SQLite)"]
        DB[("users Table<br/>master_key_salt_hex<br/><br/>documents Table<br/>owner_encrypted_key_hex")]
    end

    P & S --> PBKDF2 --> OMK
    OMK & DK --> WRAP --> WDK
    WDK -->|Save metadata| DB
    DB -.->|On Login: Fetch wrapped key| WRAP
    WRAP -.->|Unwrap using OMK in RAM| DK
```

---

## 📡 5. Interactive Slide Q&A & Live Presentation Room

```mermaid
stateDiagram-v2
    [*] --> Standby: Founder opens presentation

    state Standby {
        [*] --> InDocQuestions: Reader clicks slide pin
        InDocQuestions --> AltchaCheck: Solve PoW
        AltchaCheck --> FounderInbox: Save to /api/questions
        FounderInbox --> LiveReply: Founder publishes reply
        LiveReply --> RealtimeSync: 3-second live watchdog update
    }

    state LiveRoom {
        FounderBroadcast --> ViewerSync: Slide change broadcast (/api/v/:slug/room)
        ViewerSync --> LaserPointer: Synchronized virtual laser pointer & audio
    }

    Standby --> LiveRoom: Founder toggles "Presenter Mode"
    LiveRoom --> Standby: Presentation ended
```

---

## 💰 6. Three ₹0 Free-Tier Deployment Presets

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        BLINDSHARE ₹0 FREE-TIER PRESETS                                 │
├───────────────────────┬────────────────────────────────┬───────────────────────────────┤
│ PRESET A: CLOUD       │ PRESET B: DOCKER / VPS         │ PRESET C: CLOUDFLARE EDGE     │
├───────────────────────┼────────────────────────────────┼───────────────────────────────┤
│ 🚀 Vercel / Render    │ 🐳 Self-Hosted Docker          │ ⚡ Cloudflare Pages           │
│ 🐘 Neon Postgres      │ 🗄️ SQLite + Litestream         │ 🌐 Turso libSQL Edge          │
│ 🪣 Backblaze B2 (S3)  │ 🪣 B2 Continuous WAL Stream    │ 🪣 B2 Bandwidth Alliance      │
│ 💰 $0 / Month         │ 💰 $0 / Month                  │ 💰 $0 / Month (0 Egress Cost) │
└───────────────────────┴────────────────────────────────┴───────────────────────────────┘
```

---

## 🛡️ 7. Security Invariant Matrix

```text
+---------------------------------------------------------------------------------------+
| INVARIANT 1: Zero-Knowledge Fragment (#k=...) never touches server logs or databases. |
| INVARIANT 2: 128-bit random tokens (genId) eliminate IDOR & enumeration attacks.      |
| INVARIANT 3: Timing-safe HMAC & PoW comparisons (crypto.timingSafeEqual).             |
| INVARIANT 4: SSRF engine blocks private RFC-1918 subnets & cloud metadata endpoints.  |
| INVARIANT 5: Automated 24/24 enterprise security tests pass on every build.           |
+---------------------------------------------------------------------------------------+
```

---

## 📚 Related Documentation & Knowledge Base

- 🏠 **[Project Root & Overview](../README.md)** — Core mission, feature list, and deployment presets.
- 🏗️ **[Architecture Core](./ARCHITECTURE.md)** — Multi-cloud adapter specs, WebCrypto encryption flow, and data models.
- 🛡️ **[Security Policy](./SECURITY.md)** — Vulnerability disclosure, cryptographic invariants, and security headers.
- 🎯 **[Threat Model & Attack Surface](./THREAT-MODEL.md)** — Attack surface and honest residual risks.
- 📄 **[Supported File Formats](./FORMATS.md)** — File format handling, client-side renderers, and size caps.
- 📖 **[Operations Runbook](./RUNBOOK.md)** — Production migrations, health checks, and debugging procedures.
- 🔑 **[Secrets Reference](./SECRETS.md)** — Comprehensive list of required and optional environment keys.
- 🧹 **[Data Retention Policy](./DATA-RETENTION.md)** — Free-tier retention policies and cleanup sweeps.
- 🚨 **[Incident Response Plan](./INCIDENT-RESPONSE.md)** — Compromise triage, key rotation, and containment runbooks.
- 🌊 **[Litestream Self-Hosting](./LITESTREAM-SELFHOSTING.md)** — Zero-cost SQLite continuous WAL streaming to B2.
- 📋 **[Changelog & Patch Logs](./CHANGELOG.md)** — Chronological release history and version tracking.
- 📦 **[Release Process](./RELEASES.md)** — SemVer versioning and tagging protocol.
- 🔒 **[Privacy Policy](./PRIVACY-POLICY.md)** & ⚖️ **[Terms of Service](./TERMS.md)** — Privacy commitments and legal terms.
- 🤝 **[Contributing Guide](./CONTRIBUTING.md)** & 👥 **[Code of Conduct](./CODE_OF_CONDUCT.md)** — Community development pledge.
- 🧠 **[Architecture Skill](./skills/blindshare-architecture/SKILL.md)** — Definitive agent standards and verification checklist.
