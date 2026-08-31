import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/db";
import { users, documents, links, viewSessions, systemSettings } from "@/db/schema";
import { sql, gt } from "drizzle-orm";

export async function GET() {
  const auth = await requireAdmin();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [docCount] = await db.select({ count: sql<number>`count(*)` }).from(documents);
    const [linkCount] = await db.select({ count: sql<number>`count(*)` }).from(links);
    const [sessionCount] = await db.select({ count: sql<number>`count(*)` }).from(viewSessions);

    // Sum of storage size
    const [storageSum] = await db.select({ totalBytes: sql<number>`coalesce(sum(${documents.sizeBytes}), 0)` }).from(documents);

    // Views today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [viewsToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(viewSessions)
      .where(gt(viewSessions.startedAt, startOfToday));

    const totalStorageBytes = Number(storageSum?.totalBytes || 0);
    const totalStorageMb = Math.round((totalStorageBytes / (1024 * 1024)) * 10) / 10;
    const maxFreeStorageMb = 8 * 1024; // 8GB budget rule
    const storageUsagePercent = Math.min(100, Math.round((totalStorageMb / maxFreeStorageMb) * 100));

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
        storageBytes: totalStorageBytes,
        storageMb: totalStorageMb,
        storageBudgetMb: maxFreeStorageMb,
        storageUsagePercent,
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
        { service: "Cloudflare Workers/Pages", limit: "100K req/day", currentEst: "Batch APIs active (0.1% budget)", status: "Optimal" },
        { service: "PostgreSQL / D1", limit: "5GB / 100K-w/day", currentEst: `${totalStorageMb}MB / Buffered flushes`, status: "Optimal" },
        { service: "Backblaze B2 / R2", limit: "10GB Free Egress/Store", currentEst: `${totalStorageMb} MB of 8,192 MB (${storageUsagePercent}%)`, status: storageUsagePercent > 80 ? "Warning" : "Optimal" },
        { service: "WebCrypto AES-GCM", limit: "Unlimited Client CPU", currentEst: "100% Client-Side In-Browser", status: "Optimal" },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch admin metrics" }, { status: 500 });
  }
}
