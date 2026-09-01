# Security Invariants & Attack Mitigations Reference

## 1. Zero-Knowledge Proof Invariant
- **Rule:** Plaintext documents and master encryption keys must NEVER reach the server.
- **Implementation:** AES-GCM-256 with CSPRNG 256-bit keys generated via `crypto.getRandomValues()`.
- **Key Transport:** `https://app.domain/v/{slug}#k={keyBase64}`.
- **RFC 3986 Guarantee:** The fragment identifier after `#` is stripped by user agents before making HTTP requests.

## 2. Server-Side Request Forgery (SSRF) Defense
- **Rule:** Webhook dispatchers must never hit loopback, private subnets, or cloud metadata endpoints.
- **Engine:** `src/lib/security/ssrf-validator.ts` checks URLs before dispatch.
- **Blocked Ranges:**
  - `127.0.0.0/8` (Loopback)
  - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (Private RFC 1918)
  - `169.254.0.0/16` (Link-Local & Cloud Metadata e.g. AWS/GCP 169.254.169.254)
  - `::1`, `fe80::/10` (IPv6 link-local)
  - `metadata.google.internal`, `instance-data`

## 3. Safe HTML & SVG Sanitization (CodeQL SAST Standards)
- **Rule:** Never use vulnerable multi-character regexes for HTML stripping.
- **Character Escaping:** Transform `<` -> `&lt;`, `>` -> `&gt;`, `"` -> `&quot;`, `'` -> `&#39;`, `&` -> `&amp;`.
- **SVG Parsing:** Use browser `DOMParser()` and enforce strict protocol allowlists (`https?:`, `mailto:`, `#`).

## 4. Tainted File Write & Temporary File Safety
- **Rule:** User-controlled keys must never dictate physical file paths on disk.
- **Hashing:** Map keys to `${crypto.createHash('sha256').update(key).digest('hex')}.blob`.
- **Permissions:** Use `mode: 0o700` on storage directories and `mode: 0o600` on file writes.

## 5. Race Condition Immunity (TOCTOU)
- **Rule:** Single-use Burn-After-Reading links and Max-Views limits must be checked and updated in a single atomic SQL step.
- **Query:**
  ```typescript
  await db.update(links)
    .set({ viewCount: sql`${links.viewCount} + 1`, isRevoked: shouldRevoke ? true : links.isRevoked })
    .where(and(eq(links.id, linkId), eq(links.isRevoked, false), or(isNull(links.maxViews), sql`${links.viewCount} < ${links.maxViews}`)));
  ```

## 6. Brute Force Protection
- **Rule:** Password-gated links and user login attempts must enforce progressive lockouts.
- **Thresholds:** 5 failed attempts within 15 minutes trigger a 15-minute IP/account lockout.
