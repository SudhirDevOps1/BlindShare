# Secrets inventory (names + rotation only — never values)

| Name | Where | Rotation |
|---|---|---|
| `SESSION_SECRET` | platform secret store | 90 days (rotating logs everyone out) |
| `B2_KEY_ID` / `B2_APPLICATION_KEY` | platform secret store | 90 days or immediately on incident |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Cloudflare | 90 days |
| `CF_API_TOKEN` | GitHub Actions secret | 180 days |
| `DATABASE_URL` / `TURSO_AUTH_TOKEN` / `SUPABASE_SERVICE_ROLE_KEY` | platform secret store | 180 days |
| `VAPID_PRIVATE_KEY` | platform secret store | on compromise (invalidates subscriptions) |
| `ADMIN_BOOTSTRAP_INVITE` | platform secret store | after first admin is created |
| `HEALTH_TOKEN` | platform secret store | 180 days |
| `RESEND_API_KEY`, `ABLY_API_KEY`, `BOT_WEBHOOK_URL` | optional | on compromise |
| Android keystore (Phase-4) | GitHub Secrets, base64 | never in repo |

Rules: `.env` is never committed · secrets never appear in logs, chat or the database ·
presigned-URL signatures are masked in logs.
