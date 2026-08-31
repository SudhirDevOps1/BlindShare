import { NextResponse } from "next/server";
import { db } from "@/db";
import { links, documents, datarooms, dataroomDocs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const [link] = await db
      .select({
        id: links.id,
        slug: links.slug,
        name: links.name,
        docId: links.docId,
        dataroomId: links.dataroomId,
        isActive: links.isActive,
        isRevoked: links.isRevoked,
        hasPassword: sql<boolean>`${links.passwordHash} IS NOT NULL`,
        passwordSaltHex: links.passwordSaltHex,
        wrappedKeyHex: links.wrappedKeyHex,
        requiresEmail: links.requiresEmail,
        allowedDomains: links.allowedDomains,
        allowDownload: links.allowDownload,
        watermarkEnabled: links.watermarkEnabled,
        watermarkText: links.watermarkText,
        requiresNda: links.requiresNda,
        ndaText: links.ndaText,
        requiresSignature: links.requiresSignature,
        signaturePrompt: links.signaturePrompt,
        brandLogoUrl: links.brandLogoUrl,
        brandAccentColor: links.brandAccentColor,
        antiLeakBlurEnabled: links.antiLeakBlurEnabled,
        maxViews: links.maxViews,
        viewCount: links.viewCount,
        expiresAt: links.expiresAt,
      })
      .from(links)
      .where(eq(links.slug, slug))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (link.isRevoked || !link.isActive) {
      return NextResponse.json({
        isRevoked: true,
        error: "This share link has been revoked by the owner",
      }, { status: 410 });
    }

    const isExpired = (link.expiresAt && new Date(link.expiresAt) < new Date()) ||
      (link.maxViews !== null && link.viewCount >= link.maxViews);

    if (isExpired) {
      return NextResponse.json({
        isExpired: true,
        error: "This share link has expired or reached its maximum view limit",
      }, { status: 410 });
    }

    let docData = null;
    let dataroomData = null;

    if (link.docId) {
      const [doc] = await db
        .select({
          id: documents.id,
          title: documents.title,
          originalFilename: documents.originalFilename,
          pageCount: documents.pageCount,
          currentVersion: documents.currentVersion,
          sizeBytes: documents.sizeBytes,
          encryptionMode: documents.encryptionMode,
          ivHex: documents.ivHex,
          tagHex: documents.tagHex,
          isTombstone: documents.isTombstone,
        })
        .from(documents)
        .where(eq(documents.id, link.docId))
        .limit(1);

      if (!doc || doc.isTombstone) {
        return NextResponse.json({ error: "Underlying document not found" }, { status: 404 });
      }

      docData = doc;
    } else if (link.dataroomId) {
      const [dr] = await db
        .select()
        .from(datarooms)
        .where(eq(datarooms.id, link.dataroomId))
        .limit(1);

      if (dr) {
        const drDocs = await db
          .select({
            id: documents.id,
            title: documents.title,
            originalFilename: documents.originalFilename,
            pageCount: documents.pageCount,
            currentVersion: documents.currentVersion,
            sizeBytes: documents.sizeBytes,
            encryptionMode: documents.encryptionMode,
            ivHex: documents.ivHex,
          })
          .from(dataroomDocs)
          .innerJoin(documents, eq(dataroomDocs.docId, documents.id))
          .where(eq(dataroomDocs.dataroomId, link.dataroomId))
          .orderBy(dataroomDocs.sortOrder);

        dataroomData = {
          ...dr,
          documents: drDocs,
        };
      }
    }

    return NextResponse.json({
      link: {
        id: link.id,
        slug: link.slug,
        name: link.name,
        hasPassword: link.hasPassword,
        passwordSaltHex: link.passwordSaltHex,
        wrappedKeyHex: link.wrappedKeyHex,
        requiresEmail: link.requiresEmail,
        allowedDomains: link.allowedDomains,
        allowDownload: link.allowDownload,
        watermarkEnabled: link.watermarkEnabled,
        watermarkText: link.watermarkText,
        requiresNda: link.requiresNda,
        ndaText: link.ndaText,
        requiresSignature: link.requiresSignature,
        signaturePrompt: link.signaturePrompt,
        brandLogoUrl: link.brandLogoUrl,
        brandAccentColor: link.brandAccentColor,
        antiLeakBlurEnabled: link.antiLeakBlurEnabled,
        isExpired: false,
        isRevoked: false,
      },
      document: docData,
      dataroom: dataroomData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load link" }, { status: 500 });
  }
}
