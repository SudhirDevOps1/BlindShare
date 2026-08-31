# Data retention

| Data | Retention | Mechanism |
|---|---|---|
| Ciphertext documents | Until owner deletes; optional `DOC_TTL_SWEEP_DAYS > 0` auto-purge | crypto-shred (object delete) |
| Document versions | With parent document; superseded objects kept until purge | versions table + tombstones |
| `page_events` | `PAGE_EVENTS_RETENTION_DAYS` (default 180 days) | sweep job |
| `view_sessions` | 180 days | sweep job |
| `audit_log` | `AUDIT_RETENTION_DAYS` (default 30 days, rolling) | sweep job |
| Invites | Until expiry + 30 days | sweep job |
| Push subscriptions | Until unsubscribe / 404-410 from push service | auto-clean on send failure |
| Orphaned bucket objects | > 24 h without a DB row | `/api/admin/sweeps` (cron on CF/Render) |
