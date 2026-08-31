import { NextResponse } from "next/server";
import { db } from "@/db";
import { viewSessions, pageEvents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { parseBody } from "@/lib/validation";
import { sessionHeartbeatSchema } from "@/lib/validation/schemas";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const parsed = await parseBody(request, sessionHeartbeatSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const { sessionId, events, maxPageReached, completedPages, totalDwellSeconds } = parsed.data;

  try {
    const [session] = await db.select().from(viewSessions).where(eq(viewSessions.id, sessionId)).limit(1);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await db
      .update(viewSessions)
      .set({
        lastHeartbeatAt: new Date(),
        totalDwellSeconds: totalDwellSeconds ?? sql`${viewSessions.totalDwellSeconds} + 10`,
        maxPageReached: Math.max(session.maxPageReached, maxPageReached || 1),
        completedPages: Math.max(session.completedPages, completedPages || 1),
      })
      .where(eq(viewSessions.id, sessionId));

    if (Array.isArray(events) && events.length > 0) {
      const pageEventRows = events.map((ev) => ({
        id: genId("pe"),
        sessionId,
        linkId: session.linkId,
        docId: session.docId,
        pageNumber: ev.pageNumber,
        dwellSeconds: ev.dwellSeconds || 0,
        createdAt: new Date(),
      }));

      await db.insert(pageEvents).values(pageEventRows);
    }

    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (err: any) {
    logger.error("session.heartbeat_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
