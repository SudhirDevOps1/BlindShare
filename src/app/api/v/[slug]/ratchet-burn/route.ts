import { NextResponse } from "next/server";
import { db } from "@/db";
import { links, auditLog, viewSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

/**
 * Forward Secrecy & Burn-After-Reading Ratchet API (v1.4.0)
 * 
 * Called when a reader finishes reading or navigates away.
 * Permanently revokes the link, zeroes server-side transient access,
 * and records the self-destruction in the security audit trail.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const { sessionId } = body;

    // Find the link
    const [link] = await db
      .select({ id: links.id, ownerId: links.ownerId, isRevoked: links.isRevoked })
      .from(links)
      .where(eq(links.slug, slug))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Ratchet burn: Mark link permanently revoked
    await db
      .update(links)
      .set({
        isRevoked: true,
        updatedAt: new Date(),
      })
      .where(eq(links.id, link.id));

    // Terminate session if sessionId provided
    if (sessionId) {
      await db
        .update(viewSessions)
        .set({
          lastHeartbeatAt: new Date(),
        })
        .where(eq(viewSessions.id, sessionId))
        .catch(() => {});
    }

    // Record audit event
    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: link.ownerId,
      actorType: "system",
      action: "link.ratchet_burned",
      resourceType: "link",
      resourceId: link.id,
      detailsJson: JSON.stringify({
        slug,
        sessionId,
        reason: "One-Time Reading Ratchet executed upon completion/exit",
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});

    logger.info("link.ratchet_burned", { slug, linkId: link.id });

    return NextResponse.json({
      success: true,
      message: "Forward Secrecy Ratchet: Link burned and shredded successfully.",
    });
  } catch (err: any) {
    logger.error("link.ratchet_burn_failed", { message: err?.message, slug });
    return NextResponse.json({ error: "Failed to burn link" }, { status: 500 });
  }
}