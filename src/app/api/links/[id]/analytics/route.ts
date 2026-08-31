import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { links, documents, viewSessions, pageEvents } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { generateCsv, formatDuration } from "@/lib/analytics";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  try {
    const [link] = await db
      .select({
        id: links.id,
        name: links.name,
        slug: links.slug,
        docId: links.docId,
        ownerId: links.ownerId,
        isActive: links.isActive,
        isRevoked: links.isRevoked,
        requiresEmail: links.requiresEmail,
        viewCount: links.viewCount,
        maxViews: links.maxViews,
        expiresAt: links.expiresAt,
        createdAt: links.createdAt,
      })
      .from(links)
      .where(and(eq(links.id, id), eq(links.ownerId, auth.user.id)))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Get document info
    let docInfo = null;
    if (link.docId) {
      const [doc] = await db
        .select({
          id: documents.id,
          title: documents.title,
          pageCount: documents.pageCount,
        })
        .from(documents)
        .where(eq(documents.id, link.docId))
        .limit(1);
      docInfo = doc;
    }

    const totalPages = docInfo?.pageCount || 1;

    // Fetch view sessions
    const sessions = await db
      .select()
      .from(viewSessions)
      .where(eq(viewSessions.linkId, id))
      .orderBy(desc(viewSessions.startedAt));

    // Fetch all page events for this link
    const allPageEvents = await db
      .select({
        id: pageEvents.id,
        sessionId: pageEvents.sessionId,
        pageNumber: pageEvents.pageNumber,
        dwellSeconds: pageEvents.dwellSeconds,
      })
      .from(pageEvents)
      .where(eq(pageEvents.linkId, id));

    // Aggregate per-page dwell events across all sessions
    const pageStatsMap = new Map<number, { pageNumber: number; dwellSeconds: number; viewCount: number }>();
    for (let i = 1; i <= totalPages; i++) {
      pageStatsMap.set(i, { pageNumber: i, dwellSeconds: 0, viewCount: 0 });
    }

    for (const ev of allPageEvents) {
      const cur = pageStatsMap.get(ev.pageNumber) || { pageNumber: ev.pageNumber, dwellSeconds: 0, viewCount: 0 };
      cur.dwellSeconds += ev.dwellSeconds || 0;
      cur.viewCount += 1;
      pageStatsMap.set(ev.pageNumber, cur);
    }

    const pageStats = Array.from(pageStatsMap.values());

    // Per-session page dwell map
    const sessionPagesMap = new Map<string, Record<number, number>>();
    for (const ev of allPageEvents) {
      if (!sessionPagesMap.has(ev.sessionId)) {
        sessionPagesMap.set(ev.sessionId, {});
      }
      const map = sessionPagesMap.get(ev.sessionId)!;
      map[ev.pageNumber] = (map[ev.pageNumber] || 0) + (ev.dwellSeconds || 0);
    }

    // Active live readers (heartbeat within 60s)
    const now = new Date().getTime();
    const activeCutoff = new Date(now - 60 * 1000);
    let activeNow = 0;

    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    const countryCounts: Record<string, number> = {};

    const enrichedSessions = sessions.map((s) => {
      const isLive = new Date(s.lastHeartbeatAt) > activeCutoff;
      if (isLive) activeNow++;

      const dev = (s.uaDevice || "desktop").toLowerCase();
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;

      const cty = s.country || "Unknown";
      countryCounts[cty] = (countryCounts[cty] || 0) + 1;

      const completionRate = Math.min(100, Math.round((s.maxPageReached / totalPages) * 100));
      let intent: "high" | "medium" | "low" = "low";
      if (completionRate >= 75 || s.totalDwellSeconds >= 120) {
        intent = "high";
      } else if (completionRate >= 30 || s.totalDwellSeconds >= 30) {
        intent = "medium";
      }

      return {
        ...s,
        formattedDwell: formatDuration(s.totalDwellSeconds),
        completionRate,
        intent,
        isLive,
        pageBreakdown: sessionPagesMap.get(s.id) || {},
      };
    });

    // Aggregate summary metrics
    const totalSessions = sessions.length;
    const uniqueIps = new Set(sessions.map((s) => s.viewerIpHash)).size;
    const totalDwellAll = sessions.reduce((acc, s) => acc + (s.totalDwellSeconds || 0), 0);
    const avgDwellSeconds = totalSessions > 0 ? Math.round(totalDwellAll / totalSessions) : 0;
    const avgMaxPage = totalSessions > 0 ? sessions.reduce((acc, s) => acc + s.maxPageReached, 0) / totalSessions : 0;
    const avgCompletionPercent = Math.min(100, Math.round((avgMaxPage / totalPages) * 100));

    // Top countries
    const countryBreakdown = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count, percentage: Math.round((count / Math.max(1, totalSessions)) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // If CSV export requested
    if (format === "csv") {
      const headers = [
        "Session ID",
        "Viewer Email / Anon",
        "Country",
        "Device",
        "OS",
        "Browser",
        "Total Dwell (Seconds)",
        "Formatted Dwell",
        "Max Page Read",
        "Total Doc Pages",
        "Completion %",
        "Intent Score",
        "Started At",
        "Last Heartbeat At",
      ];

      const rows: (string | number)[][] = enrichedSessions.map((s) => [
        s.id,
        s.viewerEmail || "Anonymous",
        s.country || "Unknown",
        s.uaDevice || "desktop",
        s.uaOs || "Unknown",
        s.uaBrowser || "Unknown",
        s.totalDwellSeconds,
        formatDuration(s.totalDwellSeconds),
        s.maxPageReached,
        totalPages,
        s.completionRate + "%",
        s.intent.toUpperCase(),
        s.startedAt.toISOString(),
        s.lastHeartbeatAt.toISOString(),
      ]);

      const csvContent = generateCsv(headers, rows);

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="analytics-${link.slug}.csv"`,
        },
      });
    }

    return NextResponse.json({
      link,
      document: docInfo,
      metrics: {
        totalSessions,
        uniqueViewers: uniqueIps,
        avgDwellSeconds,
        avgCompletionPercent,
        totalDwellSeconds: totalDwellAll,
        activeNow,
      },
      pageStats,
      sessions: enrichedSessions,
      deviceBreakdown: deviceCounts,
      countryBreakdown,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
