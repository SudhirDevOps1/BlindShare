import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { links, documents, viewSessions, pageEvents } from "@/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { formatDuration } from "@/lib/analytics";
import { decryptField } from "@/lib/crypto/db-vault";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const userId = auth.user.id;

    // 1. Fetch all user links
    const userLinks = await db
      .select({
        id: links.id,
        name: links.name,
        slug: links.slug,
        docId: links.docId,
        isActive: links.isActive,
        isRevoked: links.isRevoked,
        viewCount: links.viewCount,
        createdAt: links.createdAt,
      })
      .from(links)
      .where(eq(links.ownerId, userId));

    const linkIds = userLinks.map((l) => l.id);

    if (linkIds.length === 0) {
      return NextResponse.json({
        metrics: {
          totalViews: 0,
          uniqueViewers: 0,
          totalDwellSeconds: 0,
          avgDwellSeconds: 0,
          activeNow: 0,
          totalLinks: 0,
          totalDocuments: 0,
        },
        topDocuments: [],
        recentSessions: [],
        deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
        countryBreakdown: [],
      });
    }

    // 2. Fetch all user documents
    const userDocs = await db
      .select({
        id: documents.id,
        title: documents.title,
        pageCount: documents.pageCount,
        sizeBytes: documents.sizeBytes,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(eq(documents.ownerId, userId));

    const docMap = new Map(userDocs.map((d) => [d.id, d]));
    const linkMap = new Map(userLinks.map((l) => [l.id, l]));

    // 3. Fetch view sessions across all user links
    const sessions = await db
      .select()
      .from(viewSessions)
      .where(inArray(viewSessions.linkId, linkIds))
      .orderBy(desc(viewSessions.startedAt))
      .limit(100);

    const now = new Date().getTime();
    const activeCutoff = new Date(now - 60 * 1000); // within last 60 seconds

    let activeNow = 0;
    let totalDwellAll = 0;
    const ipSet = new Set<string>();
    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    const countryCounts: Record<string, number> = {};

    const recentSessions = sessions.map((s) => {
      const link = linkMap.get(s.linkId);
      const doc = s.docId ? docMap.get(s.docId) : (link?.docId ? docMap.get(link.docId) : null);
      const isLive = new Date(s.lastHeartbeatAt) > activeCutoff;
      if (isLive) activeNow++;

      totalDwellAll += s.totalDwellSeconds || 0;
      if (s.viewerIpHash) ipSet.add(s.viewerIpHash);

      const dev = (s.uaDevice || "desktop").toLowerCase();
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;

      const cty = s.country || "Unknown";
      countryCounts[cty] = (countryCounts[cty] || 0) + 1;

      // Engagement scoring
      const totalPages = doc?.pageCount || 1;
      const completionRate = Math.min(100, Math.round((s.maxPageReached / totalPages) * 100));
      let intent: "high" | "medium" | "low" = "low";
      if (completionRate >= 75 || s.totalDwellSeconds >= 120) {
        intent = "high";
      } else if (completionRate >= 30 || s.totalDwellSeconds >= 30) {
        intent = "medium";
      }

      return {
        id: s.id,
        linkId: s.linkId,
        linkName: link?.name || "Shared Link",
        linkSlug: link?.slug || "",
        docTitle: doc?.title || "Document",
        docPages: totalPages,
        viewerEmail: decryptField(s.viewerEmail), // decrypt from AES-256-GCM ciphertext
        country: s.country || "Unknown",
        device: s.uaDevice || "desktop",
        os: s.uaOs || "Unknown",
        browser: s.uaBrowser || "Unknown",
        totalDwellSeconds: s.totalDwellSeconds,
        formattedDwell: formatDuration(s.totalDwellSeconds),
        maxPageReached: s.maxPageReached,
        completionRate,
        intent,
        isLive,
        startedAt: s.startedAt,
        lastHeartbeatAt: s.lastHeartbeatAt,
      };
    });

    const totalSessions = sessions.length;
    const avgDwellSeconds = totalSessions > 0 ? Math.round(totalDwellAll / totalSessions) : 0;
    const avgCompletionRate = recentSessions.length > 0
      ? Math.round(recentSessions.reduce((sum, s) => sum + (s.completionRate || 0), 0) / recentSessions.length)
      : 0;

    // 4. Calculate top performing documents
    const docViewsMap = new Map<string, { doc: any; viewCount: number; dwellSeconds: number; linkCount: number }>();
    for (const l of userLinks) {
      if (l.docId && docMap.has(l.docId)) {
        const d = docMap.get(l.docId)!;
        const cur = docViewsMap.get(d.id) || { doc: d, viewCount: 0, dwellSeconds: 0, linkCount: 0 };
        cur.viewCount += l.viewCount;
        cur.linkCount += 1;
        docViewsMap.set(d.id, cur);
      }
    }

    for (const s of sessions) {
      const link = linkMap.get(s.linkId);
      const docId = s.docId || link?.docId;
      if (docId && docViewsMap.has(docId)) {
        docViewsMap.get(docId)!.dwellSeconds += s.totalDwellSeconds || 0;
      }
    }

    const topDocuments = Array.from(docViewsMap.values())
      .sort((a, b) => b.viewCount - a.viewCount || b.dwellSeconds - a.dwellSeconds)
      .slice(0, 5)
      .map((item) => ({
        id: item.doc.id,
        title: item.doc.title,
        pageCount: item.doc.pageCount,
        viewCount: item.viewCount,
        linkCount: item.linkCount,
        totalDwellSeconds: item.dwellSeconds,
        formattedDwell: formatDuration(item.dwellSeconds),
      }));

    const topLinkName = topDocuments.length > 0
      ? topDocuments[0].title
      : (userLinks.length > 0 ? userLinks[0].name : "");

    // Country list sorted
    const countryBreakdown = Object.entries(countryCounts)
      .map(([country, count]) => ({
        country,
        count,
        views: count,
        percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 5. 7-Day Real Daily Views Timeline
    const nowTs = Date.now();
    const dailyMap: Record<string, number> = {};
    for (const s of sessions) {
      if (s.startedAt) {
        const dStr = new Date(s.startedAt).toISOString().split("T")[0];
        dailyMap[dStr] = (dailyMap[dStr] || 0) + 1;
      }
    }
    const dailyViews = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(nowTs - (6 - i) * 86400000);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      return {
        dateStr: key,
        label,
        views: dailyMap[key] || 0,
      };
    });

    // 6. Per-Link Performance (avgDwell and score calculated from actual sessions)
    const linkSessionsMap = new Map<string, { totalDwell: number; count: number; maxCompletion: number }>();
    for (const s of recentSessions) {
      const cur = linkSessionsMap.get(s.linkId) || { totalDwell: 0, count: 0, maxCompletion: 0 };
      cur.totalDwell += s.totalDwellSeconds || 0;
      cur.count += 1;
      cur.maxCompletion = Math.max(cur.maxCompletion, s.completionRate || 0);
      linkSessionsMap.set(s.linkId, cur);
    }

    const linkPerformance = userLinks.map((l) => {
      const stats = linkSessionsMap.get(l.id);
      const avgSec = stats && stats.count > 0 ? Math.round(stats.totalDwell / stats.count) : 0;
      const score = stats && stats.count > 0
        ? Math.min(100, Math.round((avgSec > 60 ? 50 : (avgSec / 60) * 50) + (stats.maxCompletion * 0.5)))
        : 0;
      return {
        linkId: l.id,
        avgDwellSeconds: avgSec,
        formattedAvgDwell: formatDuration(avgSec),
        score: score > 0 ? score : (l.viewCount > 0 ? 60 : 0),
      };
    });

    // 7. DB Size estimation or query
    let dbSizeBytes: number | null = null;
    try {
      const queryRes: any = await db.execute(sql`SELECT pg_database_size(current_database()) as size`);
      const rows = queryRes?.rows || (Array.isArray(queryRes) ? queryRes : []);
      if (rows.length > 0 && rows[0]?.size) {
        dbSizeBytes = Number(rows[0].size);
      }
    } catch {
      // Graceful fallback if pg_database_size is not allowed
      dbSizeBytes = null;
    }

    return NextResponse.json({
      metrics: {
        totalViews: totalSessions,
        uniqueViewers: ipSet.size,
        totalDwellSeconds: totalDwellAll,
        avgDwellSeconds,
        activeNow,
        totalLinks: userLinks.length,
        totalDocuments: userDocs.length,
        avgCompletionRate,
        topLinkName,
        dbSizeBytes,
      },
      topDocuments,
      recentSessions: recentSessions.slice(0, 20),
      deviceBreakdown: deviceCounts,
      countryBreakdown,
      dailyViews,
      linkPerformance,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load analytics overview" }, { status: 500 });
  }
}
