## 📝 Summary of Changes
<!-- Provide a high-level summary of what this PR accomplishes and why it is needed. -->

## 🎯 Type of Change
- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] 🚀 New feature (non-breaking change adding functionality)
- [ ] 🔒 Security patch (critical vulnerability or hardening improvement)
- [ ] ⚡ Performance improvement (latency, memory, or rendering optimization)
- [ ] 🔨 Refactoring (no functional changes, code cleanup)
- [ ] 📚 Documentation update (docs, runbooks, architecture diagrams)
- [ ] ⚠️ Breaking change (fix or feature causing existing functionality to not work as expected)

## 🔗 Related Issues / Advisories
<!-- Link to related issues or private security advisories e.g. Fixes #123 -->
- Closes: #

---

## 🛡️ Zero-Knowledge & Cryptographic Invariants Checklist
<!-- ALL pull requests modifying crypto, storage, or viewer code MUST verify these invariants: -->
- [ ] **Zero-Knowledge Guarantee**: Server NEVER touches plaintext documents, raw encryption keys, or unencrypted byte streams.
- [ ] **URL Fragment RFC 3986 Compliance**: Secret key material (`#k=...`) remains strictly client-side and is never sent in HTTP headers or request paths.
- [ ] **RAM & Buffer Zeroing**: All raw byte arrays and key buffers in client memory are zeroized (`zeroizeBuffer()`) immediately after consumption.
- [ ] **No Local Storage Secret Caching**: Decrypted PDF/media buffers and cryptographic keys are NEVER persisted in `localStorage`, `sessionStorage`, or IndexedDB.
- [ ] **Database Connection Safety**: Zero runtime DDL operations (`ALTER TABLE`) on live API request paths; all SQL uses parameterization.
- [ ] **SSRF & Outbound Protection**: Webhooks and HTTP requests strictly forbid internal IP addresses (`127.0.0.1`, `169.254.169.254`, `10.0.0.0/8`, etc.) and enforce `redirect: "error"`.
- [ ] **Signed Storage Authorization**: Local storage file delivery requires cryptographically signed HMAC-SHA256 bearer tokens.

---

## 🧪 Testing & Verification Checklist
- [ ] Automated security suite passes locally: `npm test` (`tests/run-all-security-tests.mjs`) -> 48/48 tests green.
- [ ] Zero-Knowledge server isolation self-check passes: `node scripts/selfcheck-e2ee.mjs` -> 0 server decrypt calls.
- [ ] TypeScript compilation passes with zero errors: `npm run typecheck`.
- [ ] ESLint passes with zero warnings: `npm run lint`.
- [ ] Production build succeeds locally: `npm run build`.

## 📦 Deployment & Rollback Notes
- **Database Migrations**: Are schema changes backward-compatible? (Yes / No / N/A)
- **Environment Variables**: Are new `.env` variables required? (Yes / No)
- **Rollback Procedure**: Can this PR be safely reverted if needed? (Yes / No)
