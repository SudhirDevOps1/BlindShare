# BlindShare Master Context & Architectural Rules (Claude Code & Anthropic AI)

> **Zero-Knowledge Secure Document Sharing & Enterprise Pitch Deck Analytics Platform**

## 🔐 1. Core Invariants & Cryptographic Rules
1. **Zero-Knowledge Fragment Key (RFC 3986):** Master decryption key `#k=...` MUST ONLY live in URL fragment. Never sent in HTTP requests, server logs, or CDN.
2. **Client-Side RAM Decrypt:** All decryption occurs inside browser WebCrypto (`crypto.subtle.decrypt("AES-GCM", ...)`). Server acts as a blind courier.
3. **Owner Master Key Vault:** PBKDF2 (100,000 iterations) derives deterministic 256-bit AES-GCM master key for seamless cross-device document key wrapping.
4. **GZIP Stream Compression:** Native browser CompressionStream reduces ciphertext payload size by 50-80% before AES-GCM-256 encryption.
5. **CSPRNG Invariant:** Never use `Math.random()`. Always use `crypto.getRandomValues()` or `crypto.randomUUID()`.

## 🛠️ 2. Development & Verification Commands
- **Lint:** `npm run lint`
- **Typecheck:** `npm run typecheck`
- **Security & Crypto Tests:** `npm test` (Must pass 20/20 tests)
- **Build:** `npm run build`

## 📋 3. Strict Development Protocols
- **Bina Kuchh Hataye (Zero Deletion):** Never delete existing features, endpoints, or translations. Always harden, extend, and preserve.
- **Bilingual Parity:** All UI strings must exist in English and Hindi in `src/lib/i18n/dictionary.ts`.
- **Strict Versioning:** Platform version is `1.2.0` across `package.json`, health, version, and headers.
- **Commitlint Standard:** Conventional commit headers must be <= 100 characters.

