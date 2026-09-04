import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { links, viewSessions } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

export async function GET() {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const userId = auth.user.id;

    // Get user links
    const userLinks = await db
      .select({ id: links.id })
      .from(links)
      .where(eq(links.ownerId, userId));

    const linkIds = userLinks.map((l) => l.id);
    if (linkIds.length === 0) {
      return NextResponse.json({
        totalViews: 0,
        countries: [],
      });
    }

    const sessions = await db
      .select({
        country: viewSessions.country,
        viewerIpHash: viewSessions.viewerIpHash,
        totalDwellSeconds: viewSessions.totalDwellSeconds,
      })
      .from(viewSessions)
      .where(inArray(viewSessions.linkId, linkIds));

    const totalViews = sessions.length;
    const countryMap = new Map<string, { views: number; ips: Set<string>; totalDwell: number }>();

    for (const s of sessions) {
      const code = (s.country || "Unknown").toUpperCase();
      const cur = countryMap.get(code) || { views: 0, ips: new Set<string>(), totalDwell: 0 };
      cur.views += 1;
      if (s.viewerIpHash) cur.ips.add(s.viewerIpHash);
      cur.totalDwell += s.totalDwellSeconds || 0;
      countryMap.set(code, cur);
    }

    const countries = Array.from(countryMap.entries())
      .map(([country, stats]) => ({
        country,
        views: stats.views,
        count: stats.views,
        uniqueViewers: stats.ips.size,
        avgDwellSeconds: stats.views > 0 ? Math.round(stats.totalDwell / stats.views) : 0,
        percentage: totalViews > 0 ? Math.round((stats.views / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.views - a.views);

    return NextResponse.json({
      totalViews,
      countries,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch investor distribution" }, { status: 500 });
  }
}
