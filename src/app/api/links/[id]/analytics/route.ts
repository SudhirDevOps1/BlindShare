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

    // Fetch per-page dwell events
    const events = await db
      .select({
        pageNumber: pageEvents.pageNumber,
        totalDwell: sql<number>`sum(${pageEvents.dwellSeconds})`,
        eventCount: sql<number>`count(${pageEvents.id})`,
      })
      .from(pageEvents)
      .where(eq(pageEvents.linkId, id))
      .groupBy(pageEvents.pageNumber)
      .orderBy(pageEvents.pageNumber);

    // Calculate per-page stats array (1..totalPages)
    const pageStatsMap = new Map<number, { pageNumber: number; dwellSeconds: number; viewCount: number }>();
    for (let i = 1; i <= totalPages; i++) {
      pageStatsMap.set(i, { pageNumber: i, dwellSeconds: 0, viewCount: 0 });
    }

    for (const ev of events) {
      pageStatsMap.set(ev.pageNumber, {
        pageNumber: ev.pageNumber,
        dwellSeconds: Number(ev.totalDwell) || 0,
        viewCount: Number(ev.eventCount) || 0,
      });
    }

    const pageStats = Array.from(pageStatsMap.values());

    // Aggregate summary metrics
    const totalSessions = sessions.length;
    const uniqueIps = new Set(sessions.map((s) => s.viewerIpHash)).size;
    const totalDwellAll = sessions.reduce((acc, s) => acc + (s.totalDwellSeconds || 0), 0);
    const avgDwellSeconds = totalSessions > 0 ? Math.round(totalDwellAll / totalSessions) : 0;
    const avgMaxPage = totalSessions > 0 ? sessions.reduce((acc, s) => acc + s.maxPageReached, 0) / totalSessions : 0;
    const avgCompletionPercent = Math.min(100, Math.round((avgMaxPage / totalPages) * 100));

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
        "Started At",
        "Last Heartbeat At",
      ];

      const rows: (string | number)[][] = sessions.map((s) => [
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
        Math.min(100, Math.round((s.maxPageReached / totalPages) * 100)) + "%",
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
      },
      pageStats,
      sessions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
