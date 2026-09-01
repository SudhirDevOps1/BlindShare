import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/db";
import { links, liveRooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const [link] = await db
      .select({ id: links.id, isRevoked: links.isRevoked, isActive: links.isActive })
      .from(links)
      .where(eq(links.slug, slug))
      .limit(1);

    if (!link || link.isRevoked || !link.isActive) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const [room] = await db
      .select({
        currentSlide: liveRooms.currentSlide,
        laserX: liveRooms.laserX,
        laserY: liveRooms.laserY,
        presenterActive: liveRooms.presenterActive,
        updatedAt: liveRooms.updatedAt,
      })
      .from(liveRooms)
      .where(eq(liveRooms.linkId, link.id))
      .limit(1);

    const isLive = room ? room.presenterActive && (Date.now() - new Date(room.updatedAt).getTime() < 30000) : false;

    return NextResponse.json({
      isLive,
      currentSlide: room?.currentSlide || 1,
      laserX: room?.laserX || 50,
      laserY: room?.laserY || 50,
    });
  } catch (err: any) {
    logger.error("live_room.get_failed", { slug, message: err?.message });
    return NextResponse.json({ error: "Failed to fetch live room status" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const authUser = await getSession();
    const body = await request.json().catch(() => ({}));
    const { currentSlide, laserX, laserY, presenterActive } = body;

    const [link] = await db
      .select({ id: links.id, ownerId: links.ownerId, isRevoked: links.isRevoked, isActive: links.isActive })
      .from(links)
      .where(eq(links.slug, slug))
      .limit(1);

    if (!link || link.isRevoked || !link.isActive) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Security Check: Only link owner can broadcast and control the presenter room
    if (!authUser || authUser.id !== link.ownerId) {
      return NextResponse.json({ error: "Only the document owner can broadcast in Live Presenter mode" }, { status: 403 });
    }

    const [existingRoom] = await db
      .select({ id: liveRooms.id })
      .from(liveRooms)
      .where(eq(liveRooms.linkId, link.id))
      .limit(1);

    if (existingRoom) {
      await db
        .update(liveRooms)
        .set({
          currentSlide: currentSlide !== undefined ? Math.max(1, parseInt(String(currentSlide), 10)) : 1,
          laserX: laserX !== undefined ? Math.min(100, Math.max(0, parseInt(String(laserX), 10))) : 50,
          laserY: laserY !== undefined ? Math.min(100, Math.max(0, parseInt(String(laserY), 10))) : 50,
          presenterActive: presenterActive !== undefined ? Boolean(presenterActive) : true,
          updatedAt: new Date(),
        })
        .where(eq(liveRooms.id, existingRoom.id));
    } else {
      await db.insert(liveRooms).values({
        id: genId("room"),
        linkId: link.id,
        currentSlide: currentSlide !== undefined ? Math.max(1, parseInt(String(currentSlide), 10)) : 1,
        laserX: laserX !== undefined ? parseInt(String(laserX), 10) : 50,
        laserY: laserY !== undefined ? parseInt(String(laserY), 10) : 50,
        presenterActive: presenterActive !== undefined ? Boolean(presenterActive) : true,
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, currentSlide, isLive: presenterActive });
  } catch (err: any) {
    logger.error("live_room.update_failed", { slug, message: err?.message });
    return NextResponse.json({ error: "Failed to broadcast room update" }, { status: 500 });
  }
}
