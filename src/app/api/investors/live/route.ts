import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { links, documents, viewSessions } from "@/db/schema";
import { eq, desc, inArray, gte, and } from "drizzle-orm";
import { formatDuration } from "@/lib/analytics";

export async function GET() {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const userId = auth.user.id;

    // Get user links
    const userLinks = await db
      .select({
        id: links.id,
        name: links.name,
        slug: links.slug,
        docId: links.docId,
      })
      .from(links)
      .where(eq(links.ownerId, userId));

    const linkIds = userLinks.map((l) => l.id);
    if (linkIds.length === 0) {
      return NextResponse.json({
        activeCount: 0,
        activeSessions: [],
        timestamp: new Date().toISOString(),
      });
    }

    // Active in last 2 minutes
    const cutoff = new Date(Date.now() - 120 * 1000);

    const activeSessions = await db
      .select()
      .from(viewSessions)
      .where(and(inArray(viewSessions.linkId, linkIds), gte(viewSessions.lastHeartbeatAt, cutoff)))
      .orderBy(desc(viewSessions.lastHeartbeatAt))
      .limit(50);

    const userDocs = await db
      .select({ id: documents.id, title: documents.title, pageCount: documents.pageCount })
      .from(documents)
      .where(eq(documents.ownerId, userId));

    const docMap = new Map(userDocs.map((d) => [d.id, d]));
    const linkMap = new Map(userLinks.map((l) => [l.id, l]));

    const items = activeSessions.map((s) => {
      const link = linkMap.get(s.linkId);
      const doc = s.docId ? docMap.get(s.docId) : (link?.docId ? docMap.get(link.docId) : null);
      return {
        sessionId: s.id,
        linkName: link?.name || "Shared Link",
        linkSlug: link?.slug || "",
        docTitle: doc?.title || "Pitch Deck",
        country: s.country || "Unknown",
        device: s.uaDevice || "desktop",
        browser: s.uaBrowser || "Unknown",
        os: s.uaOs || "Unknown",
        currentSlide: s.maxPageReached || 1,
        totalPages: doc?.pageCount || 1,
        dwellSeconds: s.totalDwellSeconds || 0,
        formattedDwell: formatDuration(s.totalDwellSeconds || 0),
        viewerEmail: s.viewerEmail || null,
        startedAt: s.startedAt,
        lastHeartbeatAt: s.lastHeartbeatAt,
      };
    });

    return NextResponse.json({
      activeCount: items.length,
      activeSessions: items,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch live investors" }, { status: 500 });
  }
}
