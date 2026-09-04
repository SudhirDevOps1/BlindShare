# AI Verification Checklist for BlindShare

Before completing any task or pushing commits, verify each item:

- [ ] **1. Cryptographic Invariant:** Is the decryption key exclusively in the `#k=` URL fragment?
- [ ] **2. Zero Content Deletion:** Were all existing features and comments preserved?
- [ ] **3. Auth & RBAC:** Are all new privileged routes protected by `requireAuth()`, `requireAdmin()`, or `requireSuperAdmin()`?
- [ ] **4. Ownership Guard (IDOR):** Does every document/link query check `eq(table.ownerId, auth.user.id)`?
- [ ] **5. Input Validation:** Are all request bodies strictly parsed through a Zod schema in `src/lib/validation/schemas.ts`?
- [ ] **6. Concurrency Safety:** Are single-use or counter updates executed with atomic SQL `WHERE` conditions?
- [ ] **7. Dual-Language i18n:** Are new UI labels added to both `en` and `hi` in `src/lib/i18n/dictionary.ts`?
- [ ] **8. PII-Safe Logging:** Are logs using `logger.info/warn/error` instead of raw `console.log`?
- [ ] **9. Version Consistency:** Do `package.json`, `src/app/api/version/route.ts`, `README.md`, and `CHANGELOG.md` all match (`v1.4.0`)?
- [ ] **10. Automated Tests:** Do all 34 security tests pass (`npm test`) with 0 TypeScript/ESLint errors?
