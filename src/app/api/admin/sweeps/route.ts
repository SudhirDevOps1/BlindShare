import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/db";
import { documents, links, pageEvents, viewSessions, auditLog, docVersions, pageQuestions, docAudioNotes, liveRooms } from "@/db/schema";
import { eq, and, lt, or, sql, inArray } from "drizzle-orm";
import { getStorageAdapter } from "@/lib/storage";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

export async function GET() {
  const auth = await requireAdmin();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const storage = getStorageAdapter();
    const storedKeys = await storage.listObjects("docs/").catch(() => []);

    const allDocs = await db
      .select({ id: documents.id, storageKey: documents.storageKey, isTombstone: documents.isTombstone })
      .from(documents);
    const allVersions = await db
      .select({ storageKey: docVersions.storageKey })
      .from(docVersions);

    const validKeySet = new Set([
      ...allDocs.filter((d) => !d.isTombstone).map((d) => d.storageKey),
      ...allVersions.map((v) => v.storageKey),
    ].filter(Boolean));
    const orphanCount = storedKeys.filter((k) => !validKeySet.has(k)).length;
    const tombstoneCount = allDocs.filter((d) => d.isTombstone).length;

    const now = new Date();
    const expiredLinks = await db
      .select({ id: links.id })
      .from(links)
      .where(or(lt(links.expiresAt, now), eq(links.isRevoked, true)));

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const [oldTelemetry] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageEvents)
      .where(lt(pageEvents.createdAt, ninetyDaysAgo));

    return NextResponse.json({
      stats: {
        totalBucketObjects: storedKeys.length,
        orphanObjectsCount: orphanCount,
        tombstonedDocsCount: tombstoneCount,
        expiredOrRevokedLinksCount: expiredLinks.length,
        staleTelemetryRowsCount: Number(oldTelemetry?.count || 0),
      },
    });
  } catch (err: any) {
    logger.error("admin.sweep_stats_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to load sweep statistics" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await request.json().catch(() => ({}));
    const { action = "orphan_sweep", olderThanDays = 30 } = body;

    const storage = getStorageAdapter();
    let scannedKeys = 0;
    let purgedOrphanCount = 0;
    let purgedTombstonesCount = 0;
    let prunedLinksCount = 0;
    let prunedTelemetryRowsCount = 0;

    // 1. Sweep Orphan Objects in Storage Bucket
    if (action === "orphan_sweep" || action === "full_clean") {
      const storedKeys = await storage.listObjects("docs/").catch(() => []);
      scannedKeys = storedKeys.length;

      const allDocs = await db.select({ storageKey: documents.storageKey }).from(documents);
      const allVersions = await db.select({ storageKey: docVersions.storageKey }).from(docVersions);
      const validKeySet = new Set([...allDocs.map((d) => d.storageKey), ...allVersions.map((v) => v.storageKey)].filter(Boolean));

      for (const key of storedKeys) {
        if (!validKeySet.has(key)) {
          await storage.deleteObject(key).catch(() => {});
          purgedOrphanCount++;
        }
      }
    }

    // 2. Permanently Purge Tombstoned (Soft-Deleted) Documents
    if (action === "purge_tombstones" || action === "full_clean") {
      const tombstoned = await db
        .select({ id: documents.id, storageKey: documents.storageKey })
        .from(documents)
        .where(eq(documents.isTombstone, true));

      if (tombstoned.length > 0) {
        const tombstoneIds = tombstoned.map((d) => d.id);

        for (const doc of tombstoned) {
          if (doc.storageKey) {
            await storage.deleteObject(doc.storageKey).catch(() => {});
          }
        }

        // Clean dependent rows
        await db.delete(docVersions).where(inArray(docVersions.docId, tombstoneIds)).catch(() => {});
        await db.delete(docAudioNotes).where(inArray(docAudioNotes.docId, tombstoneIds)).catch(() => {});
        await db.delete(pageQuestions).where(inArray(pageQuestions.docId, tombstoneIds)).catch(() => {});
        await db.delete(documents).where(inArray(documents.id, tombstoneIds)).catch(() => {});

        purgedTombstonesCount = tombstoned.length;
      }
    }

    // 3. Prune Expired & Revoked Links
    if (action === "prune_expired_links" || action === "full_clean") {
      const now = new Date();
      const staleLinks = await db
        .select({ id: links.id })
        .from(links)
        .where(or(lt(links.expiresAt, now), eq(links.isRevoked, true)));

      if (staleLinks.length > 0) {
        const linkIds = staleLinks.map((l) => l.id);
        await db.delete(liveRooms).where(inArray(liveRooms.linkId, linkIds)).catch(() => {});
        await db.delete(pageQuestions).where(inArray(pageQuestions.linkId, linkIds)).catch(() => {});
        await db.delete(links).where(inArray(links.id, linkIds)).catch(() => {});
        prunedLinksCount = staleLinks.length;
      }
    }

    // 4. Prune Stale Page Event Telemetry
    if (action === "prune_telemetry" || action === "full_clean") {
      const cutoff = new Date(Date.now() - Math.max(7, parseInt(String(olderThanDays), 10)) * 24 * 60 * 60 * 1000);
      const res = await db.delete(pageEvents).where(lt(pageEvents.createdAt, cutoff));
      prunedTelemetryRowsCount = (res as any)?.rowCount || 0;
    }

    // Log Action in Blind Audit Trail
    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: auth.user.id,
      actorType: "admin",
      action: `admin.maintenance.${action}`,
      resourceType: "storage_and_db",
      detailsJson: JSON.stringify({
        action,
        scannedKeys,
        purgedOrphanCount,
        purgedTombstonesCount,
        prunedLinksCount,
        prunedTelemetryRowsCount,
      }),
    });

    return NextResponse.json({
      success: true,
      action,
      summary: {
        scannedBucketKeys: scannedKeys,
        purgedOrphanObjects: purgedOrphanCount,
        purgedTombstonedDocs: purgedTombstonesCount,
        prunedStaleLinks: prunedLinksCount,
        prunedTelemetryRows: prunedTelemetryRowsCount,
      },
    });
  } catch (err: any) {
    logger.error("admin.sweep_failed", { message: err?.message });
    return NextResponse.json({ error: "Maintenance action failed" }, { status: 500 });
  }
}
