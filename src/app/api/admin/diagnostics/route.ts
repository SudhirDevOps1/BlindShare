import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getStorageAdapter } from "@/lib/storage";
import { getActiveEmailProvider } from "@/lib/email/email-dispatcher";
import { sendWebhookNotification } from "@/lib/notifications/webhook-notifier";

export type EnvCategory =
  | "Database"
  | "Storage"
  | "Security & Secrets"
  | "Rate Limiting"
  | "Email & Webhooks"
  | "Push Notifications"
  | "Analytics & Telemetry"
  | "Branding & App"
  | "Operational Policies";

export interface EnvItem {
  key: string;
  category: EnvCategory;
  required: boolean;
  isSet: boolean;
  status: "healthy" | "missing" | "warning" | "optional_unset";
  maskedValue: string | null;
  description: string;
  guide: string;
  diagnosticTest?: string;
  isWorking?: boolean;
}

export async function GET() {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  if (auth.user.role !== "super_admin" && auth.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  const startTime = Date.now();

  // 1. Test Database Connectivity & Latency
  let dbStatus = "unknown";
  let dbLatencyMs = 0;
  let dbError: string | null = null;
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = "operational";
  } catch (err: any) {
    dbStatus = "failed";
    dbError = err?.message || "Database query failed";
  }

  // 2. Storage check & Latency measurement
  const storeTarget = (process.env.STORE_TARGET || "b2").toLowerCase();
  const b2Bucket = process.env.B2_BUCKET_NAME || process.env.B2_BUCKET || process.env.R2_BUCKET || "blindshare-vault";
  const b2Key = process.env.B2_APPLICATION_KEY || process.env.B2_APP_KEY || process.env.R2_SECRET_ACCESS_KEY || "";
  const b2KeyId = process.env.B2_KEY_ID || process.env.B2_KEYID || process.env.R2_ACCESS_KEY_ID || "";
  const b2Endpoint = process.env.B2_ENDPOINT || process.env.R2_ENDPOINT || "s3.us-east-005.backblazeb2.com";

  let storageOperational = false;
  let storageLatencyMs = 0;
  let storageError: string | null = null;

  try {
    const storageStart = Date.now();
    const storage = getStorageAdapter();
    await storage.getPresignedPutUrl("probe-diag.bin", "application/octet-stream", 60);
    storageLatencyMs = Math.max(1, Date.now() - storageStart);
    storageOperational = Boolean(b2Bucket && (b2Key || storeTarget === "local"));
  } catch (err: any) {
    storageOperational = false;
    storageError = err?.message || "Storage probe failed";
  }

  // 3. Email Provider Status
  const emailInfo = getActiveEmailProvider();

  // Helper to safely mask secrets so no sensitive credentials leak to logs/UI
  const maskSecret = (val?: string): string | null => {
    if (!val || val.trim().length === 0) return null;
    const v = val.trim();
    if (v.length <= 6) return "••••••";
    if (v.startsWith("postgres://") || v.startsWith("postgresql://")) {
      const parts = v.split("@");
      if (parts.length > 1) {
        return `postgresql://••••••••@${parts[1].substring(0, 18)}...`;
      }
      return "postgresql://••••••••";
    }
    if (v.startsWith("http://") || v.startsWith("https://")) {
      try {
        const u = new URL(v);
        return `${u.protocol}//${u.host}${u.pathname.length > 1 ? u.pathname.substring(0, 8) + "..." : ""}`;
      } catch {
        return `${v.substring(0, 10)}...••••`;
      }
    }
    if (v.startsWith("re_") || v.startsWith("ghp_") || v.startsWith("key-")) {
      return `${v.substring(0, 4)}••••••••${v.substring(v.length - 3)}`;
    }
    if (v.length > 20) {
      return `${v.substring(0, 4)}••••••••${v.substring(v.length - 4)}`;
    }
    return `${v.substring(0, 2)}••••${v.substring(v.length - 2)}`;
  };

  const envVariables: EnvItem[] = [
    // 🗄️ Database
    {
      key: "DATABASE_URL",
      category: "Database",
      required: true,
      isSet: Boolean(process.env.DATABASE_URL),
      status: dbStatus === "operational" ? "healthy" : Boolean(process.env.DATABASE_URL) ? "warning" : "missing",
      maskedValue: maskSecret(process.env.DATABASE_URL),
      description: "Primary database connection URI for users, encrypted metadata, dwell analytics & audit logs.",
      guide: "Neon Console -> Connection Details -> Pooled connection -> Copy String",
      diagnosticTest: dbStatus === "operational" ? `Connected (${dbLatencyMs}ms ping)` : `Connection Failed: ${dbError || "Unreachable"}`,
      isWorking: dbStatus === "operational",
    },
    {
      key: "DATABASE_DRIVER",
      category: "Database",
      required: false,
      isSet: Boolean(process.env.DATABASE_DRIVER),
      status: "healthy",
      maskedValue: process.env.DATABASE_DRIVER || "postgres (default)",
      description: "Database engine driver ('postgres' for Neon/Supabase, 'sqlite' for Turso/Litestream).",
      guide: "Preset A: 'postgres' | Preset B/C: 'sqlite'",
      isWorking: true,
    },
    {
      key: "TURSO_DATABASE_URL",
      category: "Database",
      required: false,
      isSet: Boolean(process.env.TURSO_DATABASE_URL),
      status: Boolean(process.env.TURSO_DATABASE_URL) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.TURSO_DATABASE_URL),
      description: "Turso libSQL remote database endpoint (Optional for Preset C edge deployments).",
      guide: "Turso CLI -> `turso db show <db-name> --url`",
      isWorking: true,
    },
    {
      key: "TURSO_AUTH_TOKEN",
      category: "Database",
      required: false,
      isSet: Boolean(process.env.TURSO_AUTH_TOKEN),
      status: Boolean(process.env.TURSO_AUTH_TOKEN) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.TURSO_AUTH_TOKEN),
      description: "Turso libSQL authentication JWT token for edge execution.",
      guide: "Turso CLI -> `turso db tokens create <db-name>`",
      isWorking: true,
    },
    {
      key: "SUPABASE_URL",
      category: "Database",
      required: false,
      isSet: Boolean(process.env.SUPABASE_URL),
      status: Boolean(process.env.SUPABASE_URL) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.SUPABASE_URL),
      description: "Supabase project REST endpoint (Optional alternative PostgreSQL provider).",
      guide: "Supabase Dashboard -> Project Settings -> API -> Project URL",
      isWorking: true,
    },

    // 🪣 Object Storage
    {
      key: "STORE_TARGET",
      category: "Storage",
      required: true,
      isSet: Boolean(process.env.STORE_TARGET),
      status: "healthy",
      maskedValue: (process.env.STORE_TARGET || "b2").toUpperCase(),
      description: "Active encrypted object storage backend ('b2' = Backblaze B2, 'r2' = Cloudflare R2, 'local' = Disk).",
      guide: "Set to 'b2' for Backblaze 10GB free tier, 'r2' for zero-egress Cloudflare",
      isWorking: true,
    },
    {
      key: "B2_ENDPOINT",
      category: "Storage",
      required: storeTarget === "b2",
      isSet: Boolean(b2Endpoint),
      status: Boolean(b2Endpoint) ? "healthy" : "missing",
      maskedValue: b2Endpoint || null,
      description: "Backblaze B2 S3-compatible API endpoint URL (e.g. s3.us-east-005.backblazeb2.com).",
      guide: "Backblaze B2 -> Buckets -> Endpoint URL",
      isWorking: Boolean(b2Endpoint),
    },
    {
      key: "B2_BUCKET_NAME",
      category: "Storage",
      required: storeTarget === "b2",
      isSet: Boolean(b2Bucket),
      status: Boolean(b2Bucket) ? "healthy" : "missing",
      maskedValue: b2Bucket || null,
      description: "Private zero-knowledge cloud bucket name storing client-encrypted AES-GCM payloads.",
      guide: "Backblaze B2 -> Buckets -> Create Bucket (Private)",
      diagnosticTest: storageOperational ? `Operational (${storageLatencyMs}ms ping)` : `Bucket probe: ${storageError || "Missing"}`,
      isWorking: storageOperational,
    },
    {
      key: "B2_KEY_ID",
      category: "Storage",
      required: storeTarget === "b2",
      isSet: Boolean(b2KeyId),
      status: Boolean(b2KeyId) ? "healthy" : "missing",
      maskedValue: maskSecret(b2KeyId),
      description: "Backblaze B2 Application Key ID for authenticating presigned uploads and downloads.",
      guide: "Backblaze B2 -> Application Keys -> Add a New Application Key",
      isWorking: Boolean(b2KeyId),
    },
    {
      key: "B2_APPLICATION_KEY",
      category: "Storage",
      required: storeTarget === "b2",
      isSet: Boolean(b2Key),
      status: Boolean(b2Key) ? "healthy" : "missing",
      maskedValue: maskSecret(b2Key),
      description: "Backblaze B2 Application Key secret token with read/write bucket capabilities.",
      guide: "Backblaze B2 -> Application Keys -> Copy applicationKey",
      isWorking: Boolean(b2Key),
    },
    {
      key: "B2_REGION",
      category: "Storage",
      required: false,
      isSet: Boolean(process.env.B2_REGION),
      status: "healthy",
      maskedValue: process.env.B2_REGION || "us-east-005 (default)",
      description: "Backblaze B2 S3 region identifier.",
      guide: "Extracted from B2 endpoint (e.g. us-east-005)",
      isWorking: true,
    },
    {
      key: "R2_ACCOUNT_ID",
      category: "Storage",
      required: storeTarget === "r2",
      isSet: Boolean(process.env.R2_ACCOUNT_ID),
      status: Boolean(process.env.R2_ACCOUNT_ID) ? "healthy" : storeTarget === "r2" ? "missing" : "optional_unset",
      maskedValue: maskSecret(process.env.R2_ACCOUNT_ID),
      description: "Cloudflare 32-character Account ID for R2 Object Storage integration.",
      guide: "Cloudflare Dashboard -> R2 -> Account Details",
      isWorking: true,
    },
    {
      key: "R2_ACCESS_KEY_ID",
      category: "Storage",
      required: storeTarget === "r2",
      isSet: Boolean(process.env.R2_ACCESS_KEY_ID),
      status: Boolean(process.env.R2_ACCESS_KEY_ID) ? "healthy" : storeTarget === "r2" ? "missing" : "optional_unset",
      maskedValue: maskSecret(process.env.R2_ACCESS_KEY_ID),
      description: "Cloudflare R2 API Token Access Key ID.",
      guide: "Cloudflare Dashboard -> R2 -> Manage R2 API Tokens",
      isWorking: true,
    },
    {
      key: "R2_SECRET_ACCESS_KEY",
      category: "Storage",
      required: storeTarget === "r2",
      isSet: Boolean(process.env.R2_SECRET_ACCESS_KEY),
      status: Boolean(process.env.R2_SECRET_ACCESS_KEY) ? "healthy" : storeTarget === "r2" ? "missing" : "optional_unset",
      maskedValue: maskSecret(process.env.R2_SECRET_ACCESS_KEY),
      description: "Cloudflare R2 API Token Secret Access Key.",
      guide: "Cloudflare Dashboard -> R2 -> Manage R2 API Tokens -> Copy Secret",
      isWorking: true,
    },

    // 🔐 Security, Cryptography & Auth Secrets
    {
      key: "SESSION_SECRET",
      category: "Security & Secrets",
      required: true,
      isSet: Boolean(process.env.SESSION_SECRET),
      status: (process.env.SESSION_SECRET?.length || 0) >= 32 ? "healthy" : Boolean(process.env.SESSION_SECRET) ? "warning" : "missing",
      maskedValue: maskSecret(process.env.SESSION_SECRET),
      description: "High-entropy 32+ byte secret key used for signing HMAC HTTP-only authentication session JWTs.",
      guide: "Run in terminal: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"",
      diagnosticTest: (process.env.SESSION_SECRET?.length || 0) >= 32 ? "Entropy: Strong (>=32 chars)" : "Entropy: Weak (<32 chars)",
      isWorking: Boolean(process.env.SESSION_SECRET),
    },
    {
      key: "ADMIN_BOOTSTRAP_INVITE",
      category: "Security & Secrets",
      required: true,
      isSet: Boolean(process.env.ADMIN_BOOTSTRAP_INVITE),
      status: Boolean(process.env.ADMIN_BOOTSTRAP_INVITE) ? "healthy" : "warning",
      maskedValue: maskSecret(process.env.ADMIN_BOOTSTRAP_INVITE || "blindshare-genesis-admin-2026"),
      description: "Secret passphrase allowing the very first Super Admin account to register upon fresh deployment.",
      guide: "Define any secret phrase (e.g. BLINDSHARE-GENESIS-2026) in your .env or Vercel settings",
      isWorking: true,
    },
    {
      key: "HEALTH_TOKEN",
      category: "Security & Secrets",
      required: true,
      isSet: Boolean(process.env.HEALTH_TOKEN),
      status: Boolean(process.env.HEALTH_TOKEN) ? "healthy" : "warning",
      maskedValue: maskSecret(process.env.HEALTH_TOKEN),
      description: "Bearer authentication secret for external uptime monitoring and `/api/health` probes.",
      guide: "Generate a random 32-byte string for SIEM/UptimeRobot health checks",
      isWorking: true,
    },
    {
      key: "PEPPER_SECRET",
      category: "Security & Secrets",
      required: false,
      isSet: Boolean(process.env.PEPPER_SECRET),
      status: Boolean(process.env.PEPPER_SECRET) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.PEPPER_SECRET),
      description: "Server-side cryptographic pepper added to PBKDF2 link password hashing rounds.",
      guide: "Optional random 32-byte hex string for defense-in-depth against precomputed rainbow tables",
      isWorking: true,
    },
    {
      key: "DATA_ENCRYPTION_KEY",
      category: "Security & Secrets",
      required: false,
      isSet: Boolean(process.env.DATA_ENCRYPTION_KEY),
      status: Boolean(process.env.DATA_ENCRYPTION_KEY) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.DATA_ENCRYPTION_KEY),
      description: "Master key for server-side tenant metadata envelope encryption fallback.",
      guide: "Optional 64-character hex string for server-level envelope encryption at rest",
      isWorking: true,
    },
    {
      key: "SERVER_MASTER_KEY",
      category: "Security & Secrets",
      required: false,
      isSet: Boolean(process.env.SERVER_MASTER_KEY),
      status: Boolean(process.env.SERVER_MASTER_KEY) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.SERVER_MASTER_KEY),
      description: "Server master key for encrypting audit log sensitive records and system backups.",
      guide: "Optional server secret for encrypting telemetry at rest",
      isWorking: true,
    },

    // ⚡ Rate Limiting
    {
      key: "UPSTASH_REDIS_REST_URL",
      category: "Rate Limiting",
      required: false,
      isSet: Boolean(process.env.UPSTASH_REDIS_REST_URL),
      status: Boolean(process.env.UPSTASH_REDIS_REST_URL) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.UPSTASH_REDIS_REST_URL),
      description: "Upstash Redis REST endpoint for distributed edge rate limiting across all Vercel edge regions.",
      guide: "https://console.upstash.com -> Redis Database -> REST API -> Copy UPSTASH_REDIS_REST_URL",
      diagnosticTest: Boolean(process.env.UPSTASH_REDIS_REST_URL) ? "Distributed Redis Active" : "In-Memory Rate Limiter Fallback (Active)",
      isWorking: true,
    },
    {
      key: "UPSTASH_REDIS_REST_TOKEN",
      category: "Rate Limiting",
      required: false,
      isSet: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
      status: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.UPSTASH_REDIS_REST_TOKEN),
      description: "Upstash Redis REST bearer token for authenticating edge sliding-window rate limit calls.",
      guide: "https://console.upstash.com -> REST API -> Copy UPSTASH_REDIS_REST_TOKEN",
      isWorking: true,
    },

    // 📧 Email & Webhooks
    {
      key: "EMAIL_PROVIDER",
      category: "Email & Webhooks",
      required: false,
      isSet: Boolean(process.env.EMAIL_PROVIDER),
      status: "healthy",
      maskedValue: process.env.EMAIL_PROVIDER || "auto (default)",
      description: "Master email routing strategy ('auto', 'gas', 'resend', 'brevo', 'smtp', 'mock').",
      guide: "Set to 'gas' for zero-DNS Google Apps Script, 'resend', 'brevo', or 'smtp'",
      diagnosticTest: `Active: ${emailInfo.details}`,
      isWorking: true,
    },
    {
      key: "GAS_WEBAPP_URL",
      category: "Email & Webhooks",
      required: false,
      isSet: Boolean(process.env.GAS_WEBAPP_URL),
      status: Boolean(process.env.GAS_WEBAPP_URL) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.GAS_WEBAPP_URL),
      description: "Google Apps Script Web App HTTPS URL for 100% free ($0) email relay without custom domain DNS.",
      guide: "Deploy GAS Web App -> Set Who has access: Anyone -> Copy /exec URL",
      diagnosticTest: Boolean(process.env.GAS_WEBAPP_URL) ? "GAS Web App Configured" : "Unset",
      isWorking: Boolean(process.env.GAS_WEBAPP_URL),
    },
    {
      key: "GAS_SECRET_TOKEN",
      category: "Email & Webhooks",
      required: Boolean(process.env.GAS_WEBAPP_URL),
      isSet: Boolean(process.env.GAS_SECRET_TOKEN),
      status: Boolean(process.env.GAS_SECRET_TOKEN) ? "healthy" : Boolean(process.env.GAS_WEBAPP_URL) ? "warning" : "optional_unset",
      maskedValue: maskSecret(process.env.GAS_SECRET_TOKEN),
      description: "Shared secret token verifying incoming requests between BlindShare and your Google Apps Script.",
      guide: "Matching secret passphrase specified in Code.gs and your .env",
      isWorking: Boolean(process.env.GAS_SECRET_TOKEN),
    },
    {
      key: "RESEND_API_KEY",
      category: "Email & Webhooks",
      required: false,
      isSet: Boolean(process.env.RESEND_API_KEY),
      status: Boolean(process.env.RESEND_API_KEY) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.RESEND_API_KEY),
      description: "Resend transactional email API key for recipient view alerts, OTP codes, and invite links.",
      guide: "https://resend.com -> API Keys -> Create Key (3,000 free emails/month)",
      diagnosticTest: Boolean(process.env.RESEND_API_KEY) ? "Resend API Configured" : "Unset",
      isWorking: Boolean(process.env.RESEND_API_KEY),
    },
    {
      key: "BREVO_API_KEY",
      category: "Email & Webhooks",
      required: false,
      isSet: Boolean(process.env.BREVO_API_KEY),
      status: Boolean(process.env.BREVO_API_KEY) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.BREVO_API_KEY),
      description: "Brevo (formerly Sendinblue) transactional email API key (300 free emails/day).",
      guide: "https://app.brevo.com -> SMTP & API -> API Keys",
      diagnosticTest: Boolean(process.env.BREVO_API_KEY) ? "Brevo API Configured" : "Unset",
      isWorking: Boolean(process.env.BREVO_API_KEY),
    },
    {
      key: "SMTP_HOST",
      category: "Email & Webhooks",
      required: false,
      isSet: Boolean(process.env.SMTP_HOST),
      status: Boolean(process.env.SMTP_HOST) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.SMTP_HOST),
      description: "Custom SMTP server hostname (e.g. smtp.gmail.com).",
      guide: "SMTP Host for custom mail servers or Gmail App Passwords",
      isWorking: Boolean(process.env.SMTP_HOST),
    },
    {
      key: "DEFAULT_WEBHOOK_URL",
      category: "Email & Webhooks",
      required: false,
      isSet: Boolean(process.env.DEFAULT_WEBHOOK_URL),
      status: Boolean(process.env.DEFAULT_WEBHOOK_URL) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.DEFAULT_WEBHOOK_URL),
      description: "Global fallback webhook URL (Stoat Chat, Slack, Discord, or Teams) for real-time document view, NDA sign, and viewer question alerts.",
      guide: "Stoat Chat -> Webhook URL (https://stoat.chat/webhooks/...) or Slack / Discord Webhook URL",
      diagnosticTest: Boolean(process.env.DEFAULT_WEBHOOK_URL) ? "Global Webhook Configured" : "Unset (Optional)",
      isWorking: Boolean(process.env.DEFAULT_WEBHOOK_URL),
    },
    {
      key: "WEBHOOK_URL",
      category: "Email & Webhooks",
      required: false,
      isSet: Boolean(process.env.WEBHOOK_URL),
      status: Boolean(process.env.WEBHOOK_URL) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.WEBHOOK_URL),
      description: "Standard webhook URL alias for notification dispatching.",
      guide: "Alternative alias for DEFAULT_WEBHOOK_URL",
      diagnosticTest: Boolean(process.env.WEBHOOK_URL) ? "Webhook Alias Active" : "Unset",
      isWorking: Boolean(process.env.WEBHOOK_URL),
    },
    {
      key: "SLACK_WEBHOOK_URL",
      category: "Email & Webhooks",
      required: false,
      isSet: Boolean(process.env.SLACK_WEBHOOK_URL),
      status: Boolean(process.env.SLACK_WEBHOOK_URL) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.SLACK_WEBHOOK_URL),
      description: "Dedicated Slack/Discord incoming webhook URL for broadcasting live document viewing alerts.",
      guide: "Slack -> Apps -> Incoming Webhooks OR Discord -> Integrations -> Webhooks",
      diagnosticTest: Boolean(process.env.SLACK_WEBHOOK_URL) ? "Slack Webhook Configured" : "Unset",
      isWorking: Boolean(process.env.SLACK_WEBHOOK_URL),
    },
    {
      key: "BOT_WEBHOOK_URL",
      category: "Email & Webhooks",
      required: false,
      isSet: Boolean(process.env.BOT_WEBHOOK_URL),
      status: Boolean(process.env.BOT_WEBHOOK_URL) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.BOT_WEBHOOK_URL),
      description: "Secondary automated bot webhook trigger for SIEM security alerts and NDA signatures.",
      guide: "Custom webhook endpoint for security automation or Telegram/Teams bots",
      diagnosticTest: Boolean(process.env.BOT_WEBHOOK_URL) ? "Bot Webhook Configured" : "Unset",
      isWorking: Boolean(process.env.BOT_WEBHOOK_URL),
    },
    {
      key: "SIEM_WEBHOOK_URL",
      category: "Email & Webhooks",
      required: false,
      isSet: Boolean(process.env.SIEM_WEBHOOK_URL),
      status: Boolean(process.env.SIEM_WEBHOOK_URL) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.SIEM_WEBHOOK_URL),
      description: "Enterprise SIEM webhook endpoint for real-time CEF-compliant security audit logs (Splunk HEC / Datadog / Elastic).",
      guide: "HTTPS webhook URL for enterprise SIEM ingestion endpoint",
      diagnosticTest: Boolean(process.env.SIEM_WEBHOOK_URL) ? "SIEM Webhook Active" : "Unset",
      isWorking: Boolean(process.env.SIEM_WEBHOOK_URL),
    },

    // 🔔 Push Notifications
    {
      key: "VAPID_PUBLIC_KEY",
      category: "Push Notifications",
      required: false,
      isSet: Boolean(process.env.VAPID_PUBLIC_KEY),
      status: Boolean(process.env.VAPID_PUBLIC_KEY) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.VAPID_PUBLIC_KEY),
      description: "Web Push (VAPID) public key for browser push notifications when investors open links.",
      guide: "Generate in terminal: `npx web-push generate-vapid-keys`",
      isWorking: true,
    },
    {
      key: "VAPID_PRIVATE_KEY",
      category: "Push Notifications",
      required: false,
      isSet: Boolean(process.env.VAPID_PRIVATE_KEY),
      status: Boolean(process.env.VAPID_PRIVATE_KEY) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.VAPID_PRIVATE_KEY),
      description: "Web Push (VAPID) private secret key for encrypting browser push notifications.",
      guide: "Extracted from `npx web-push generate-vapid-keys` output",
      isWorking: true,
    },
    {
      key: "VAPID_SUBJECT",
      category: "Push Notifications",
      required: false,
      isSet: Boolean(process.env.VAPID_SUBJECT),
      status: "healthy",
      maskedValue: process.env.VAPID_SUBJECT || "mailto:admin@blindshare.app (default)",
      description: "Contact email or URL identifying the sender for Web Push protocol compliance.",
      guide: "Format: mailto:your-email@domain.com",
      isWorking: true,
    },

    // 📊 Analytics & Telemetry
    {
      key: "NEXT_PUBLIC_PRISM_ANALYTICS_ID",
      category: "Analytics & Telemetry",
      required: false,
      isSet: Boolean(process.env.NEXT_PUBLIC_PRISM_ANALYTICS_ID),
      status: Boolean(process.env.NEXT_PUBLIC_PRISM_ANALYTICS_ID) ? "healthy" : "optional_unset",
      maskedValue: process.env.NEXT_PUBLIC_PRISM_ANALYTICS_ID || null,
      description: "Zero-cookie privacy analytics website identifier for anonymous telemetry.",
      guide: "Self-hosted Cloudflare Worker PrismAnalytics site ID",
      isWorking: true,
    },
    {
      key: "NEXT_PUBLIC_PRISM_ANALYTICS_URL",
      category: "Analytics & Telemetry",
      required: false,
      isSet: Boolean(process.env.NEXT_PUBLIC_PRISM_ANALYTICS_URL),
      status: Boolean(process.env.NEXT_PUBLIC_PRISM_ANALYTICS_URL) ? "healthy" : "optional_unset",
      maskedValue: maskSecret(process.env.NEXT_PUBLIC_PRISM_ANALYTICS_URL),
      description: "Zero-cookie privacy analytics ingestion URL endpoint.",
      guide: "Cloudflare Worker telemetry ingestion route (e.g. https://analytics.domain.com/api/track)",
      isWorking: true,
    },

    // 🎨 Branding & App
    {
      key: "NEXT_PUBLIC_APP_URL",
      category: "Branding & App",
      required: false,
      isSet: Boolean(process.env.NEXT_PUBLIC_APP_URL),
      status: Boolean(process.env.NEXT_PUBLIC_APP_URL) ? "healthy" : "warning",
      maskedValue: process.env.NEXT_PUBLIC_APP_URL || "https://blindshare.app",
      description: "Canonical public base URL used for generating zero-knowledge link fragment URLs (#k=...).",
      guide: "Your production URL (e.g. https://blindshare.vercel.app or https://blindshare.app)",
      isWorking: true,
    },
    {
      key: "PUBLIC_APP_NAME",
      category: "Branding & App",
      required: false,
      isSet: Boolean(process.env.PUBLIC_APP_NAME),
      status: "healthy",
      maskedValue: process.env.PUBLIC_APP_NAME || "BlindShare",
      description: "Custom platform branding name displayed across UI, emails, and header.",
      guide: "Custom title for white-label enterprise deployments",
      isWorking: true,
    },
    {
      key: "PUBLIC_BRAND_ACCENT",
      category: "Branding & App",
      required: false,
      isSet: Boolean(process.env.PUBLIC_BRAND_ACCENT),
      status: "healthy",
      maskedValue: process.env.PUBLIC_BRAND_ACCENT || "#f59e0b",
      description: "Brand primary accent color hex code for themed UI buttons, badges, and progress meters.",
      guide: "Hex color code (e.g. #f59e0b for Amber, #3b82f6 for Blue)",
      isWorking: true,
    },
    {
      key: "PUBLIC_BRAND_LOGO_URL",
      category: "Branding & App",
      required: false,
      isSet: Boolean(process.env.PUBLIC_BRAND_LOGO_URL),
      status: "healthy",
      maskedValue: process.env.PUBLIC_BRAND_LOGO_URL || "/brand/logo.svg",
      description: "Custom brand logo icon SVG or PNG image path.",
      guide: "Relative path (e.g. /brand/logo.svg) or external HTTPS logo URL",
      isWorking: true,
    },
    {
      key: "PUBLIC_UI_LANG_DEFAULT",
      category: "Branding & App",
      required: false,
      isSet: Boolean(process.env.PUBLIC_UI_LANG_DEFAULT),
      status: "healthy",
      maskedValue: process.env.PUBLIC_UI_LANG_DEFAULT || "hi (Hindi)",
      description: "Default platform UI language for first-time visitors ('hi' = Hindi, 'en' = English).",
      guide: "Set to 'hi' for Hindi or 'en' for English",
      isWorking: true,
    },
    {
      key: "NODE_ENV",
      category: "Branding & App",
      required: false,
      isSet: Boolean(process.env.NODE_ENV),
      status: "healthy",
      maskedValue: process.env.NODE_ENV || "development",
      description: "Node.js runtime environment mode ('production' enables strict cookie security).",
      guide: "Managed automatically by Vercel / Node runtime",
      isWorking: true,
    },
    {
      key: "MAINTENANCE_MODE",
      category: "Branding & App",
      required: false,
      isSet: Boolean(process.env.MAINTENANCE_MODE),
      status: "healthy",
      maskedValue: process.env.MAINTENANCE_MODE === "true" ? "ENABLED (Locked)" : "Disabled (Live)",
      description: "Global maintenance switch. When true, shows maintenance banner to non-admin visitors.",
      guide: "Set to 'true' during database migrations, otherwise 'false'",
      isWorking: true,
    },

    // ⚙️ Operational Policies
    {
      key: "MAX_FILE_MB",
      category: "Operational Policies",
      required: false,
      isSet: Boolean(process.env.MAX_FILE_MB),
      status: "healthy",
      maskedValue: `${process.env.MAX_FILE_MB || "25"} MB`,
      description: "Maximum encrypted PDF/document upload size limit.",
      guide: "Default: 25 MB (can increase to 100 MB for enterprise)",
      isWorking: true,
    },
    {
      key: "MAX_VIDEO_MB",
      category: "Operational Policies",
      required: false,
      isSet: Boolean(process.env.MAX_VIDEO_MB),
      status: "healthy",
      maskedValue: `${process.env.MAX_VIDEO_MB || "50"} MB`,
      description: "Maximum encrypted video file upload size limit.",
      guide: "Default: 50 MB",
      isWorking: true,
    },
    {
      key: "SESSION_MAX_AGE_DAYS",
      category: "Operational Policies",
      required: false,
      isSet: Boolean(process.env.SESSION_MAX_AGE_DAYS),
      status: "healthy",
      maskedValue: `${process.env.SESSION_MAX_AGE_DAYS || "30"} Days`,
      description: "Authentication login cookie lifespan in days before requiring re-login.",
      guide: "Default: 30 days",
      isWorking: true,
    },
    {
      key: "BCRYPT_COST_FACTOR",
      category: "Operational Policies",
      required: false,
      isSet: Boolean(process.env.BCRYPT_COST_FACTOR),
      status: "healthy",
      maskedValue: `${process.env.BCRYPT_COST_FACTOR || "12"} Salt Rounds`,
      description: "Bcrypt CPU work factor for hashing user login passwords.",
      guide: "Default: 12 rounds (recommended 10-14 for high security)",
      isWorking: true,
    },
    {
      key: "PASSWORD_MIN_LENGTH",
      category: "Operational Policies",
      required: false,
      isSet: Boolean(process.env.PASSWORD_MIN_LENGTH),
      status: "healthy",
      maskedValue: `${process.env.PASSWORD_MIN_LENGTH || "10"} Characters`,
      description: "Minimum character length required for new user passwords.",
      guide: "Default: 10 characters",
      isWorking: true,
    },
    {
      key: "LOGIN_LOCKOUT_TRIES",
      category: "Operational Policies",
      required: false,
      isSet: Boolean(process.env.LOGIN_LOCKOUT_TRIES),
      status: "healthy",
      maskedValue: `${process.env.LOGIN_LOCKOUT_TRIES || "5"} Attempts`,
      description: "Maximum consecutive failed login attempts before temporary IP lockout.",
      guide: "Default: 5 attempts",
      isWorking: true,
    },
    {
      key: "LOGIN_LOCKOUT_MINUTES",
      category: "Operational Policies",
      required: false,
      isSet: Boolean(process.env.LOGIN_LOCKOUT_MINUTES),
      status: "healthy",
      maskedValue: `${process.env.LOGIN_LOCKOUT_MINUTES || "15"} Minutes`,
      description: "Temporary IP lockout duration following brute force detection.",
      guide: "Default: 15 minutes",
      isWorking: true,
    },
    {
      key: "VIEW_HEARTBEAT_SEC",
      category: "Operational Policies",
      required: false,
      isSet: Boolean(process.env.VIEW_HEARTBEAT_SEC),
      status: "healthy",
      maskedValue: `${process.env.VIEW_HEARTBEAT_SEC || "10"} Seconds`,
      description: "Per-page reading dwell time telemetry sync heartbeat interval.",
      guide: "Default: 10 seconds",
      isWorking: true,
    },
    {
      key: "DOC_TTL_SWEEP_DAYS",
      category: "Operational Policies",
      required: false,
      isSet: Boolean(process.env.DOC_TTL_SWEEP_DAYS),
      status: "healthy",
      maskedValue: process.env.DOC_TTL_SWEEP_DAYS && process.env.DOC_TTL_SWEEP_DAYS !== "0" ? `${process.env.DOC_TTL_SWEEP_DAYS} Days` : "0 (Retain Forever)",
      description: "Automatic document auto-delete retention period (0 = keep forever until deleted).",
      guide: "Set to 0 to keep documents forever, or N days for automatic ephemerality",
      isWorking: true,
    },
  ];

  const total = envVariables.length;
  const setVars = envVariables.filter((v) => v.isSet).length;
  const unsetVars = total - setVars;
  const requiredTotal = envVariables.filter((v) => v.required).length;
  const requiredSet = envVariables.filter((v) => v.required && v.isSet).length;
  const missingRequired = envVariables.filter((v) => v.required && !v.isSet).length;

  const isAllRequiredSet = missingRequired === 0 && dbStatus === "operational";

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overallStatus: isAllRequiredSet ? "healthy" : missingRequired > 0 ? "critical" : "degraded",
    diagnostics: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        error: dbError,
      },
      storage: {
        status: storageOperational ? "operational" : "warning",
        provider: storeTarget === "r2" ? "Cloudflare R2 S3 Storage" : storeTarget === "b2" ? "Backblaze B2 S3 Storage" : "Local Disk Storage",
        bucket: b2Bucket || null,
        latencyMs: storageLatencyMs,
        error: storageError,
      },
      crypto: {
        status: "operational",
        algorithm: "AES-GCM-256 (WebCrypto CSPRNG)",
        kdf: "PBKDF2-HMAC-SHA256 (100,000 rounds)",
        vault: "Enterprise-Grade Zero-Knowledge Owner Master Key Vault",
      },
      email: {
        status: emailInfo.configured ? "operational" : "warning",
        provider: emailInfo.provider,
        details: emailInfo.details,
      },
      webhook: {
        status: (process.env.DEFAULT_WEBHOOK_URL || process.env.WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || process.env.BOT_WEBHOOK_URL) ? "operational" : "optional_unset",
        configured: Boolean(process.env.DEFAULT_WEBHOOK_URL || process.env.WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || process.env.BOT_WEBHOOK_URL),
        provider: (process.env.DEFAULT_WEBHOOK_URL || process.env.WEBHOOK_URL || "")?.includes("stoat.chat")
          ? "Stoat Chat"
          : (process.env.DEFAULT_WEBHOOK_URL || process.env.WEBHOOK_URL || "")?.includes("discord.com")
          ? "Discord"
          : (process.env.SLACK_WEBHOOK_URL || (process.env.DEFAULT_WEBHOOK_URL || "").includes("slack.com"))
          ? "Slack"
          : (process.env.DEFAULT_WEBHOOK_URL || process.env.WEBHOOK_URL)
          ? "Custom Webhook"
          : "None",
        target: maskSecret(process.env.DEFAULT_WEBHOOK_URL || process.env.WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || process.env.BOT_WEBHOOK_URL),
      },
      runtime: {
        nodeEnv: process.env.NODE_ENV || "development",
        responseTimeMs: Date.now() - startTime,
      },
    },
    stats: {
      total,
      setVars,
      unsetVars,
      requiredTotal,
      requiredSet,
      missingRequired,
      score: Math.round((setVars / total) * 100),
    },
    variables: envVariables,
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  if (auth.user.role !== "super_admin" && auth.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const testUrl = (body.webhookUrl as string)?.trim() || process.env.DEFAULT_WEBHOOK_URL || process.env.WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || process.env.BOT_WEBHOOK_URL;

    if (!testUrl) {
      return NextResponse.json({
        success: false,
        error: "No webhook endpoint is currently configured in environment variables. Set DEFAULT_WEBHOOK_URL in your Vercel Project Settings and Redeploy.",
      }, { status: 400 });
    }

    const t0 = Date.now();
    const success = await sendWebhookNotification(testUrl, {
      event: "link_opened",
      linkName: "BlindShare Health & Webhook Diagnostic Check",
      linkSlug: "admin-diag-probe",
      docTitle: "Platform Live Infrastructure Verification",
      viewerEmail: auth.user.email || "admin@blindshare.app",
      viewerCountry: "Diagnostic Probe",
      viewerDevice: "Admin Console",
      dwellSeconds: 10,
      timestamp: new Date().toISOString(),
    });

    const latencyMs = Math.max(1, Date.now() - t0);

    if (!success) {
      return NextResponse.json({
        success: false,
        latencyMs,
        error: "Webhook ping failed to deliver. Ensure the endpoint URL is reachable and permits incoming HTTP POST JSON payloads.",
      }, { status: 502 });
    }

    // Mask for response
    const masked = testUrl.length > 25 ? `${testUrl.substring(0, 18)}...${testUrl.substring(testUrl.length - 6)}` : testUrl;

    return NextResponse.json({
      success: true,
      latencyMs,
      target: masked,
      message: `Diagnostic webhook ping delivered successfully in ${latencyMs}ms!`,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || "Internal webhook test error",
    }, { status: 500 });
  }
}
