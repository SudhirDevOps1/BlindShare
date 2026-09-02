# BlindShare Universal Multi-Agent Directives (Universal Agent Standard)

## Mission
BlindShare is a high-security, zero-knowledge document sharing, digital data room, and pitch deck analytics platform designed for founders, enterprises, and privacy-conscious teams.

## Non-Negotiable Invariants
1. **Zero-Knowledge Fragment Rule:** RFC 3986 fragment key `#k=...` must never touch server-side logs or database columns.
2. **Preserve Everything:** Never remove existing features or documentation ("Bina kuchh hataye").
3. **Bilingual Parity:** Maintain 100% synchronization between English (`en`) and Hindi (`hi`) translations.
4. **Security Hardening:** Ensure CodeQL SAST compliance, SSRF blocklists, Timing-Safe HMAC, and XSS sanitization.

