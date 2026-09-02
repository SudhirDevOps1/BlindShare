import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/rbac";
import { db, pool } from "@/db";
import { users, documents, links, viewSessions, systemSettings } from "@/db/schema";
import { sql, gt } from "drizzle-orm";
import { getStorageAdapter } from "@/lib/storage";

export async function GET() {
  const auth = await requireAdmin();
  if ("errorResponse" in auth) return auth.errorResponse;

  const startTime = Date.now();

  try {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [docCount] = await db.select({ count: sql<number>`count(*)` }).from(documents);
    const [linkCount] = await db.select({ count: sql<number>`count(*)` }).from(links);
    const [sessionCount] = await db.select({ count: sql<number>`count(*)` }).from(viewSessions);

    // Sum of storage size from database document records
    const [storageSum] = await db.select({ totalBytes: sql<number>`coalesce(sum(${documents.sizeBytes}), 0)` }).from(documents);

    // Views today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [viewsToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(viewSessions)
      .where(gt(viewSessions.startedAt, startOfToday));

    // 1. Real Database Disk Footprint & Latency (PostgreSQL / Neon)
    let realDbBytes = 0;
    let dbLatencyMs = 0;
    let activeDbConnections = 1;
    let tableBreakdown: { tableName: string; totalBytes: number; formattedSize: string; estimatedRows: number }[] = [];

    try {
      const dbPingStart = Date.now();
      const sizeResult = await pool.query<{ total_bytes: string }>(
        `SELECT pg_database_size(current_database()) AS total_bytes`
      );
      dbLatencyMs = Date.now() - dbPingStart;
      realDbBytes = parseInt(sizeResult.rows[0]?.total_bytes || "0", 10);

      // Active connections
      const connResult = await pool.query<{ count: string }>(
        `SELECT count(*) AS count FROM pg_stat_activity WHERE datname = current_database()`
      ).catch(() => ({ rows: [{ count: "1" }] }));
      activeDbConnections = parseInt(connResult.rows[0]?.count || "1", 10);

      // Table-by-table live breakdown
      const tablesResult = await pool.query<{ table_name: string; total_bytes: string; estimated_rows: string }>(`
        SELECT 
          relname AS table_name,
          pg_total_relation_size(relid) AS total_bytes,
          n_live_tup AS estimated_rows
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(relid) DESC
      `);

      tableBreakdown = tablesResult.rows.map((row) => {
        const bytes = parseInt(row.total_bytes || "0", 10);
        let formatted = `${Math.round((bytes / 1024) * 10) / 10} KB`;
        if (bytes >= 1024 * 1024) {
          formatted = `${Math.round((bytes / (1024 * 1024)) * 100) / 100} MB`;
        }
        return {
          tableName: row.table_name,
          totalBytes: bytes,
          formattedSize: formatted,
          estimatedRows: parseInt(row.estimated_rows || "0", 10),
        };
      });
    } catch {
      // Graceful fallback for non-Postgres or restricted environments
      realDbBytes = Number(storageSum?.totalBytes || 0);
      dbLatencyMs = Date.now() - startTime;
    }

    // 2. Real Object Storage Bucket Footprint (Backblaze B2 / R2 / Local)
    const storage = getStorageAdapter();
    let realBucketBytes = 0;
    let realBucketObjectCount = 0;

    if (storage.getBucketUsage) {
      const bucketUsage = await storage.getBucketUsage().catch(() => ({ totalBytes: 0, objectCount: 0 }));
      realBucketBytes = bucketUsage.totalBytes;
      realBucketObjectCount = bucketUsage.objectCount;
    }

    // Fallback if bucket list is 0 but documents exist
    if (realBucketBytes === 0 && Number(storageSum?.totalBytes || 0) > 0) {
      realBucketBytes = Number(storageSum?.totalBytes || 0);
      realBucketObjectCount = Number(docCount?.count || 0);
    }

    // 3. Mathematical Ceilings & Free-Tier Percentages
    const neonFreeLimitMb = 512; // Neon Postgres Free Tier: 512 MB
    const b2FreeLimitMb = 10 * 1024; // Backblaze B2 Free Tier: 10,240 MB (10 GB)

    const realDbMb = Math.round((realDbBytes / (1024 * 1024)) * 100) / 100;
    const dbUsagePercent = Math.min(100, Math.round((realDbMb / neonFreeLimitMb) * 1000) / 10);
    const dbFreeMbRemaining = Math.max(0, Math.round((neonFreeLimitMb - realDbMb) * 100) / 100);

    const realBucketMb = Math.round((realBucketBytes / (1024 * 1024)) * 100) / 100;
    const bucketUsagePercent = Math.min(100, Math.round((realBucketMb / b2FreeLimitMb) * 1000) / 10);
    const bucketFreeMbRemaining = Math.max(0, Math.round((b2FreeLimitMb - realBucketMb) * 100) / 100);

    // Get maintenance mode and banner settings
    const settings = await db.select().from(systemSettings);
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    return NextResponse.json({
      metrics: {
        totalUsers: Number(userCount?.count || 0),
        totalDocuments: Number(docCount?.count || 0),
        totalLinks: Number(linkCount?.count || 0),
        totalSessions: Number(sessionCount?.count || 0),
        viewsToday: Number(viewsToday?.count || 0),
        storageBytes: realBucketBytes,
        storageMb: realBucketMb,
        storageBudgetMb: b2FreeLimitMb,
        storageUsagePercent: bucketUsagePercent,
      },
      infrastructure: {
        database: {
          driver: "PostgreSQL (Neon Serverless)",
          totalBytes: realDbBytes,
          usedMb: realDbMb,
          freeLimitMb: neonFreeLimitMb,
          freeRemainingMb: dbFreeMbRemaining,
          usagePercent: dbUsagePercent,
          latencyMs: dbLatencyMs,
          activeConnections: activeDbConnections,
          tables: tableBreakdown,
        },
        storageBucket: {
          driver: storage.name.toUpperCase(),
          totalBytes: realBucketBytes,
          usedMb: realBucketMb,
          freeLimitMb: b2FreeLimitMb,
          freeRemainingMb: bucketFreeMbRemaining,
          usagePercent: bucketUsagePercent,
          objectCount: realBucketObjectCount,
        },
      },
      system: {
        backendTarget: process.env.BACKEND_TARGET || "vercel",
        dbTarget: process.env.DB_TARGET || "neon",
        storeTarget: process.env.STORE_TARGET || "local",
        docsEncryptionMode: process.env.DOCS_ENCRYPTION_MODE || "e2ee-fragment",
        maintenanceMode: settingsMap.get("maintenance_mode") === "true" || process.env.MAINTENANCE_MODE === "true",
        broadcastBanner: settingsMap.get("broadcast_banner") || "",
      },
      budgetLedger: [
        { service: "Cloudflare Workers / Pages", limit: "100K req/day", currentEst: "Batch APIs active (0.1% budget)", status: "Optimal" },
        { service: "Neon Serverless Postgres", limit: `${neonFreeLimitMb} MB Free Tier`, currentEst: `${realDbMb} MB of ${neonFreeLimitMb} MB (${dbUsagePercent}%)`, status: dbUsagePercent > 80 ? "Warning" : "Optimal" },
        { service: "Backblaze B2 / R2 Storage", limit: "10 GB Free Store / $0 Egress", currentEst: `${realBucketMb} MB of ${b2FreeLimitMb} MB (${bucketUsagePercent}%)`, status: bucketUsagePercent > 80 ? "Warning" : "Optimal" },
        { service: "WebCrypto AES-GCM-256", limit: "Unlimited Client CPU", currentEst: "100% Client-Side In-Browser", status: "Optimal" },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch admin metrics" }, { status: 500 });
  }
}
