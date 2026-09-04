import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { getStorageAdapter } from "@/lib/storage";
import { rateLimitDistributed } from "@/lib/security/distributed-rate-limiter";

export async function GET(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  const isAllowed = await rateLimitDistributed(`health:${ip}`, 60, 60 * 1000);
  if (!isAllowed) {
    return NextResponse.json(
      { error: "Too many health check requests. Rate limit exceeded." },
      { status: 429 }
    );
  }

  const startTime = Date.now();
  let dbStatus = "unknown";
  let storageStatus = "unknown";
  let dbLatencyMs = 0;

  // DB connectivity test
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = "healthy";
  } catch (err: any) {
    dbStatus = `unhealthy: ${err.message}`;
  }

  // Storage adapter test
  try {
    const storage = getStorageAdapter();
    storageStatus = `ready (${storage.name})`;
  } catch (err: any) {
    storageStatus = `error: ${err.message}`;
  }

  const isHealthy = dbStatus === "healthy";
  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
      responseTimeMs: Date.now() - startTime,
      version: "1.4.0",
      backend: process.env.BACKEND_TARGET || "vercel",
      db: {
        target: process.env.DB_TARGET || "neon",
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      storage: {
        target: process.env.STORE_TARGET || "local",
        status: storageStatus,
      },
      encryptionMode: process.env.DOCS_ENCRYPTION_MODE || "e2ee-fragment",
      zeroKnowledgeProof:
        "Blind courier: zero server-side document-decrypt call sites (verified by scripts/selfcheck-e2ee.mjs)",
    },
    { status: statusCode }
  );
}
