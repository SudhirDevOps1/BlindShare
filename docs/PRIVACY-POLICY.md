# Privacy policy (source of truth for /privacy)

## 1. NEVER COLLECTED
Document plaintext · DocKeys · password plaintext · third-party trackers. Retention: N/A.

## 2. CIPHERTEXT
Encrypted document bytes, encrypted thumbnails, IVs and wrap parameters.
Retention: until owner deletes (crypto-shred) or `DOC_TTL_SWEEP_DAYS` purge.

## 3. METADATA-LITE
Session id, page number + dwell seconds, UA class, coarse country (provider header),
salted daily IP hash (raw-IP storage OFF by default), viewer e-mail only when the owner
enabled the e-mail gate. Retention: `PAGE_EVENTS_RETENTION_DAYS` (180d), audit 30d rolling.

## 4. PLATFORM LOGS
Hosting/CDN and object-store provider logs under their own policies (Cloudflare, Vercel,
Netlify, Deno, Render, Backblaze). We do not copy these into our database.

## Rights
Owners: `/api/user/export` and Settings → Delete Account (purges objects + rows).
Viewers: contact the owner who shared the link. No ads, no data sale, no 3rd-party analytics.

## Honest limitations
Watermark/anti-download are deterrents, not DRM. Fragment holders can decrypt. Geo gates are coarse.
