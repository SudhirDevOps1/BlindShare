import { NextResponse } from "next/server";
import { db } from "@/db";
import { links, documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStorageAdapter } from "@/lib/storage";

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
    const obj = await storage.getObject(doc.storageKey);

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
    return NextResponse.json({ error: err.message || "Failed to retrieve ciphertext" }, { status: 500 });
  }
}
