import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { sql } from "drizzle-orm";

interface EnvItem {
  key: string;
  category: "Database" | "Storage" | "Security & Secrets" | "Email & Webhooks" | "App Configuration";
  required: boolean;
  isSet: boolean;
  status: "healthy" | "missing" | "warning";
  maskedValue: string | null;
  description: string;
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

  // 2. Storage check
  const b2Bucket = process.env.B2_BUCKET_NAME || process.env.B2_BUCKET || "";
  const b2Key = process.env.B2_APPLICATION_KEY || process.env.B2_APP_KEY || "";
  const b2KeyId = process.env.B2_KEY_ID || process.env.B2_KEYID || "";
  const b2Endpoint = process.env.B2_ENDPOINT || "";

  const storageOperational = Boolean(b2Bucket && b2Key && b2KeyId);

  // Helper to safely mask secrets
  const maskSecret = (val?: string): string | null => {
    if (!val) return null;
    if (val.length <= 8) return "••••••••";
    if (val.startsWith("postgres://") || val.startsWith("postgresql://")) {
      const parts = val.split("@");
      if (parts.length > 1) {
        return `postgresql://••••••••@${parts[1].substring(0, 15)}...`;
      }
      return "postgresql://••••••••";
    }
    if (val.startsWith("http://") || val.startsWith("https://")) {
      try {
        const u = new URL(val);
        return `${u.protocol}//${u.host}${u.pathname.substring(0, 8)}...`;
      } catch {
        return `${val.substring(0, 10)}...••••`;
      }
    }
    return `${val.substring(0, 4)}••••••••${val.substring(val.length - 4)}`;
  };

  const envVariables: EnvItem[] = [
    // Database
    {
      key: "DATABASE_URL",
      category: "Database",
      required: true,
      isSet: Boolean(process.env.DATABASE_URL),
      status: dbStatus === "operational" ? "healthy" : Boolean(process.env.DATABASE_URL) ? "warning" : "missing",
      maskedValue: maskSecret(process.env.DATABASE_URL),
      description: "Neon PostgreSQL primary connection string for documents, links, audit logs & sessions.",
      diagnosticTest: dbStatus === "operational" ? `Connected (${dbLatencyMs}ms ping)` : `Connection Failed: ${dbError || "Unreachable"}`,
      isWorking: dbStatus === "operational",
    },

    // Storage
    {
      key: "B2_ENDPOINT",
      category: "Storage",
      required: true,
      isSet: Boolean(b2Endpoint),
      status: Boolean(b2Endpoint) ? "healthy" : "missing",
      maskedValue: maskSecret(b2Endpoint),
      description: "Backblaze B2 S3-compatible API endpoint URL (e.g. s3.us-east-005.backblazeb2.com).",
      isWorking: Boolean(b2Endpoint),
    },
    {
      key: "B2_KEY_ID",
      category: "Storage",
      required: true,
      isSet: Boolean(b2KeyId),
      status: Boolean(b2KeyId) ? "healthy" : "missing",
      maskedValue: maskSecret(b2KeyId),
      description: "Backblaze B2 Application Key ID for authenticating encrypted ciphertext uploads.",
      isWorking: Boolean(b2KeyId),
    },
    {
      key: "B2_APPLICATION_KEY",
      category: "Storage",
      required: true,
      isSet: Boolean(b2Key),
      status: Boolean(b2Key) ? "healthy" : "missing",
      maskedValue: maskSecret(b2Key),
      description: "Backblaze B2 Application Key secret token with read/write bucket permissions.",
      isWorking: Boolean(b2Key),
    },
    {
      key: "B2_BUCKET_NAME",
      category: "Storage",
      required: true,
      isSet: Boolean(b2Bucket),
      status: Boolean(b2Bucket) ? "healthy" : "missing",
      maskedValue: b2Bucket || null,
      description: "Encrypted Zero-Knowledge cloud bucket name storing AES-GCM ciphertext objects.",
      diagnosticTest: storageOperational ? "Credentials Configured" : "Missing Bucket Credentials",
      isWorking: storageOperational,
    },

    // Security & Secrets
    {
      key: "SESSION_SECRET",
      category: "Security & Secrets",
      required: true,
      isSet: Boolean(process.env.SESSION_SECRET),
      status: (process.env.SESSION_SECRET?.length || 0) >= 32 ? "healthy" : Boolean(process.env.SESSION_SECRET) ? "warning" : "missing",
      maskedValue: maskSecret(process.env.SESSION_SECRET),
      description: "High-entropy 32+ byte secret key used for signing HMAC HTTP-only authentication session JWTs.",
      diagnosticTest: (process.env.SESSION_SECRET?.length || 0) >= 32 ? "Entropy: Strong (>=32 chars)" : "Entropy: Weak (<32 chars)",
      isWorking: Boolean(process.env.SESSION_SECRET),
    },
    {
      key: "PEPPER_SECRET",
      category: "Security & Secrets",
      required: false,
      isSet: Boolean(process.env.PEPPER_SECRET),
      status: Boolean(process.env.PEPPER_SECRET) ? "healthy" : "warning",
      maskedValue: maskSecret(process.env.PEPPER_SECRET),
      description: "Server-side cryptographic pepper added to PBKDF2 link password hashing rounds.",
      isWorking: true,
    },
    {
      key: "DATA_ENCRYPTION_KEY",
      category: "Security & Secrets",
      required: false,
      isSet: Boolean(process.env.DATA_ENCRYPTION_KEY),
      status: Boolean(process.env.DATA_ENCRYPTION_KEY) ? "healthy" : "warning",
      maskedValue: maskSecret(process.env.DATA_ENCRYPTION_KEY),
      description: "Master key for server-side tenant metadata envelope encryption fallback.",
      isWorking: true,
    },

    // Email & Alerts
    {
      key: "RESEND_API_KEY",
      category: "Email & Webhooks",
      required: false,
      isSet: Boolean(process.env.RESEND_API_KEY),
      status: Boolean(process.env.RESEND_API_KEY) ? "healthy" : "warning",
      maskedValue: maskSecret(process.env.RESEND_API_KEY),
      description: "Resend transactional email API key for reader notifications and OTP authentication.",
      isWorking: Boolean(process.env.RESEND_API_KEY),
    },
    {
      key: "SLACK_WEBHOOK_URL",
      category: "Email & Webhooks",
      required: false,
      isSet: Boolean(process.env.SLACK_WEBHOOK_URL),
      status: Boolean(process.env.SLACK_WEBHOOK_URL) ? "healthy" : "warning",
      maskedValue: maskSecret(process.env.SLACK_WEBHOOK_URL),
      description: "Global fallback Slack/Discord webhook URL for real-time document view alerts.",
      isWorking: Boolean(process.env.SLACK_WEBHOOK_URL),
    },

    // App Configuration
    {
      key: "NEXT_PUBLIC_APP_URL",
      category: "App Configuration",
      required: false,
      isSet: Boolean(process.env.NEXT_PUBLIC_APP_URL),
      status: Boolean(process.env.NEXT_PUBLIC_APP_URL) ? "healthy" : "warning",
      maskedValue: process.env.NEXT_PUBLIC_APP_URL || null,
      description: "Canonical public base URL (e.g. https://blindshare.app) for constructing share links.",
      isWorking: true,
    },
    {
      key: "PUBLIC_APP_NAME",
      category: "App Configuration",
      required: false,
      isSet: Boolean(process.env.PUBLIC_APP_NAME),
      status: "healthy",
      maskedValue: process.env.PUBLIC_APP_NAME || "BlindShare",
      description: "Custom platform branding name displayed across UI, emails, and header.",
      isWorking: true,
    },
    {
      key: "PUBLIC_BRAND_ACCENT",
      category: "App Configuration",
      required: false,
      isSet: Boolean(process.env.PUBLIC_BRAND_ACCENT),
      status: "healthy",
      maskedValue: process.env.PUBLIC_BRAND_ACCENT || "#f59e0b",
      description: "Brand primary color hex code for themed UI buttons, badges, and progress meters.",
      isWorking: true,
    },
  ];

  const total = envVariables.length;
  const setVars = envVariables.filter((v) => v.isSet).length;
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
        bucket: b2Bucket || null,
      },
      crypto: {
        status: "operational",
        algorithm: "AES-GCM-256 (WebCrypto)",
        kdf: "PBKDF2-HMAC-SHA256 (100k rounds)",
      },
      runtime: {
        nodeEnv: process.env.NODE_ENV || "development",
        responseTimeMs: Date.now() - startTime,
      },
    },
    stats: {
      total,
      setVars,
      requiredTotal,
      requiredSet,
      missingRequired,
      score: Math.round((setVars / total) * 100),
    },
    variables: envVariables,
  });
}
