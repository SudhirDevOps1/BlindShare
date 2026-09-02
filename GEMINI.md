# BlindShare Master Context & Agent Directives (Google Gemini & Antigravity)

> **Zero-Knowledge Secure Document Sharing & Enterprise Pitch Deck Analytics Platform**

## 🧠 1. Architectural Knowledge & Cryptographic Rules
1. **Zero-Knowledge Courier Model:** Decryption keys `#k=...` reside in the URL fragment. The backend never receives, processes, or logs plaintext keys or unencrypted document bytes.
2. **Owner Master Key Vault:** AES-GCM-256 wrapped key architecture powered by PBKDF2 (100k rounds) enables zero-knowledge cross-device synchronization.
3. **Interactive Slide Q&A & Voice Pitch:** Real-time in-doc question pins (`page_questions`), live presentation room sync with virtual laser pointer, and slide-level audio voice notes.
4. **Three ₹0 Free-Tier Presets:**
   - **Preset A:** Vercel / Render + Neon Serverless PostgreSQL + Backblaze B2 ($0/mo).
   - **Preset B:** Self-hosted Docker + SQLite + Litestream B2 Continuous WAL streaming ($0/mo).
   - **Preset C:** Cloudflare Pages + Turso libSQL Edge + Backblaze B2 with Bandwidth Alliance ($0 Unlimited Egress).

## 🛡️ 2. Verification Protocol
- Run `npm run typecheck && npm test && npm run lint` before completing any task.
- Ensure all 24 security tests pass with 0 failures.
- Version string must strictly be `1.3.0`.

