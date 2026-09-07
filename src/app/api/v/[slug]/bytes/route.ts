import { NextResponse } from "next/server";
import { db } from "@/db";
import { links, documents, viewSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getStorageAdapter } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { decryptField } from "@/lib/crypto/db-vault";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const [link] = await db
      .select({
        id: links.id,
        docId: links.docId,
        isActive: links.isActive,
        isRevoked: links.isRevoked,
        passwordHash: links.passwordHash,
        requiresEmail: links.requiresEmail,
        requiresNda: links.requiresNda,
        expiresAt: links.expiresAt,
        maxViews: links.maxViews,
        viewCount: links.viewCount,
        burnAfterReading: links.burnAfterReading,
      })
      .from(links)
      .where(eq(links.slug, slug))
      .limit(1);

    if (!link || link.isRevoked || !link.isActive) {
      return NextResponse.json({ error: "Share link is not active or has been revoked" }, { status: 410 });
    }

    if (link.burnAfterReading && link.viewCount >= 1) {
      return NextResponse.json({ error: "This single-use Burn-After-Reading link has self-destructed" }, { status: 410 });
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Share link has expired" }, { status: 410 });
    }

    if (link.maxViews !== null && link.viewCount >= link.maxViews) {
      return NextResponse.json({ error: "Share link has reached its maximum view limit" }, { status: 410 });
    }

    // Gate access defense: If link requires password, email, or NDA, verify active session
    const hasGate = Boolean(link.passwordHash || link.requiresEmail || link.requiresNda);

    // Extract session ID from headers (x-session-id, authorization), query params (?sid, ?sessionId), or cookies
    const url = new URL(request.url);
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(new RegExp(`(?:^|;\\s*)gate_${slug}=([^;]+)`));
    const cookieSessionId = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;

    const sessionId =
      request.headers.get("x-session-id") ||
      bearerToken ||
      url.searchParams.get("sid") ||
      url.searchParams.get("sessionId") ||
      cookieSessionId;

    if (hasGate && !sessionId) {
      return NextResponse.json(
        { error: "Access denied. Document access gate verification required before retrieving content." },
        { status: 403 }
      );
    }

    if (sessionId) {
      const [session] = await db
        .select({
          id: viewSessions.id,
          ndaAgreedAt: viewSessions.ndaAgreedAt,
          viewerEmail: viewSessions.viewerEmail,
        })
        .from(viewSessions)
        .where(and(eq(viewSessions.id, sessionId), eq(viewSessions.linkId, link.id)))
        .limit(1);

      if (hasGate && !session) {
        return NextResponse.json(
          { error: "Invalid or expired viewing session. Please verify document access." },
          { status: 403 }
        );
      }

      if (session) {
        if (link.requiresNda && !session.ndaAgreedAt) {
          return NextResponse.json(
            { error: "NDA confidentiality agreement must be accepted before viewing document content." },
            { status: 403 }
          );
        }
        if (link.requiresEmail && !session.viewerEmail) {
          return NextResponse.json(
            { error: "Email verification is required before viewing document content." },
            { status: 403 }
          );
        }
      }
    }

    if (!link.docId) {
      return NextResponse.json({ error: "No primary document associated" }, { status: 404 });
    }

    const [doc] = await db
      .select({
        id: documents.id,
        storageKey: documents.storageKey,
        encryptionMode: documents.encryptionMode,
        ivHex: documents.ivHex,
        tagHex: documents.tagHex,
        isTombstone: documents.isTombstone,
      })
      .from(documents)
      .where(eq(documents.id, link.docId))
      .limit(1);

    if (!doc || doc.isTombstone) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const storage = getStorageAdapter();
    const resolvedStorageKey = decryptField(doc.storageKey);
    const obj = await storage.getObject(resolvedStorageKey);

    if (!obj) {
      return NextResponse.json({ error: "Encrypted payload not found in storage" }, { status: 404 });
    }

    return new NextResponse(obj.data as any, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-BlindShare-Mode": doc.encryptionMode,
        "X-BlindShare-IV": doc.ivHex || "",
        "X-BlindShare-Tag": doc.tagHex || "",
      },
    });
  } catch (err: any) {
    logger.error("bytes.retrieve_failed", { slug, message: err?.message });
    return NextResponse.json({ error: "Failed to retrieve document bytes" }, { status: 500 });
  }
}
