# Zero-Cost Deployment Presets Blueprint

## Overview
BlindShare is engineered to run permanently on $0 / month free tiers without requiring credit cards or risking unexpected bills.

| Preset | Hosting / Compute | Database | Encrypted Storage | Monthly Cost | Credit Card? | Best For |
|---|---|---|---|:---:|:---:|---|
| **Preset A** | Vercel / Render Hobby | Neon Serverless PostgreSQL | Backblaze B2 (Direct) | **$0** | ❌ No | 1-Click Fast Deployment |
| **Preset B** | Docker / VPS / Fly.io | SQLite + Litestream Daemon | Backblaze B2 (WAL Stream) | **$0** | ❌ No | Self-Hosted / Zero DB Fees |
| **Preset C** | Cloudflare Pages | Turso libSQL Edge | Backblaze B2 + Cloudflare CDN | **$0** | ❌ No | High Viral Traffic & $0 Egress |

### Cloudflare + B2 Bandwidth Alliance Architecture
When Backblaze B2 is paired with Cloudflare CDN via a Proxied CNAME (`download.yourdomain.com -> f005.backblazeb2.com`), all egress bandwidth is wavered under the Bandwidth Alliance agreement, enabling **100% Unlimited $0 Egress**.
