import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { links, documents, datarooms, auditLog } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { parseBody } from "@/lib/validation";
import { createLinkSchema } from "@/lib/validation/schemas";
import { genId, genUnguessableSlug } from "@/lib/ids";
import { logger } from "@/lib/logger";

export async function GET() {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const userLinks = await db
      .select({
        id: links.id,
        docId: links.docId,
        dataroomId: links.dataroomId,
        ownerId: links.ownerId,
        slug: links.slug,
        name: links.name,
        isActive: links.isActive,
        isRevoked: links.isRevoked,
        requiresEmail: links.requiresEmail,
        hasPassword: sql<boolean>`${links.passwordHash} IS NOT NULL`,
        allowDownload: links.allowDownload,
        watermarkEnabled: links.watermarkEnabled,
        watermarkText: links.watermarkText,
        requiresNda: links.requiresNda,
        maxViews: links.maxViews,
        viewCount: links.viewCount,
        expiresAt: links.expiresAt,
        createdAt: links.createdAt,
        updatedAt: links.updatedAt,
        docTitle: documents.title,
        dataroomName: datarooms.name,
      })
      .from(links)
      .leftJoin(documents, eq(links.docId, documents.id))
      .leftJoin(datarooms, eq(links.dataroomId, datarooms.id))
      .where(eq(links.ownerId, auth.user.id))
      .orderBy(desc(links.createdAt));

    return NextResponse.json({ links: userLinks });
  } catch (err: any) {
    logger.error("links.list_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const parsed = await parseBody(request, createLinkSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const {
    docId,
    dataroomId,
    name,
    slug,
    password,
    passwordSaltHex,
    wrappedKeyHex,
    requiresEmail,
    allowedDomains,
    allowDownload,
    watermarkEnabled,
    watermarkText,
    requiresNda,
    ndaText,
    requiresSignature,
    signaturePrompt,
    webhookUrl,
    brandLogoUrl,
    brandAccentColor,
    antiLeakBlurEnabled,
    antiSpyShieldEnabled,
    burnAfterReading,
    voicePitchEnabled,
    maxViews,
    expiresAt,
  } = parsed.data;

  try {
    // Verify ownership of document or dataroom (authZ on the resource being shared)
    if (docId) {
      const [doc] = await db
        .select({ id: documents.id, ownerId: documents.ownerId })
        .from(documents)
        .where(eq(documents.id, docId))
        .limit(1);
      if (!doc || doc.ownerId !== auth.user.id) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }
    }

    if (dataroomId) {
      const [dr] = await db
        .select({ id: datarooms.id, ownerId: datarooms.ownerId })
        .from(datarooms)
        .where(eq(datarooms.id, dataroomId))
        .limit(1);
      if (!dr || dr.ownerId !== auth.user.id) {
        return NextResponse.json({ error: "Dataroom not found" }, { status: 404 });
      }
    }

    // 128-bit unguessable slug by default; a custom slug is honoured but is
    // inherently weaker (deliberate operator trade-off, documented in THREAT-MODEL).
    let finalSlug = slug && slug.length > 0 ? slug : genUnguessableSlug();

    const [existingSlug] = await db.select({ id: links.id }).from(links).where(eq(links.slug, finalSlug)).limit(1);
    if (existingSlug) {
      finalSlug = `${finalSlug}-${genUnguessableSlug().slice(0, 6)}`;
    }

    let passwordHash: string | null = null;
    if (password && password.trim().length > 0) {
      passwordHash = await hashPassword(password.trim());
    }

    const linkId = genId("lnk");

    // Self-healing schema migration for links table
    await db.execute(sql`
      ALTER TABLE links 
      ADD COLUMN IF NOT EXISTS anti_leak_blur_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS anti_spy_shield_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS burn_after_reading BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS voice_pitch_enabled BOOLEAN NOT NULL DEFAULT TRUE;
    `).catch(() => {});

    await db.insert(links).values({
      id: linkId,
      docId: docId || null,
      dataroomId: dataroomId || null,
      ownerId: auth.user.id,
      slug: finalSlug,
      name,
      isActive: true,
      isRevoked: false,
      passwordHash,
      passwordSaltHex: passwordSaltHex || null,
      wrappedKeyHex: wrappedKeyHex || null,
      requiresEmail: Boolean(requiresEmail),
      allowedDomains: allowedDomains ? allowedDomains.trim().toLowerCase() : null,
      allowDownload: Boolean(allowDownload),
      watermarkEnabled: watermarkEnabled !== undefined ? Boolean(watermarkEnabled) : true,
      watermarkText: watermarkText || null,
      requiresNda: Boolean(requiresNda),
      ndaText: ndaText || null,
      requiresSignature: Boolean(requiresSignature),
      signaturePrompt: signaturePrompt || null,
      webhookUrl: webhookUrl || null,
      brandLogoUrl: brandLogoUrl || null,
      brandAccentColor: brandAccentColor || null,
      antiLeakBlurEnabled: antiLeakBlurEnabled !== undefined ? Boolean(antiLeakBlurEnabled) : true,
      antiSpyShieldEnabled: antiSpyShieldEnabled !== undefined ? Boolean(antiSpyShieldEnabled) : true,
      burnAfterReading: Boolean(burnAfterReading),
      voicePitchEnabled: voicePitchEnabled !== undefined ? Boolean(voicePitchEnabled) : true,
      maxViews: maxViews ? parseInt(String(maxViews), 10) : null,
      viewCount: 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: auth.user.id,
      actorType: "user",
      action: "link.create",
      resourceType: "link",
      resourceId: linkId,
      detailsJson: JSON.stringify({ hasPassword: !!passwordHash, requiresEmail: !!requiresEmail }),
    });

    return NextResponse.json({ success: true, linkId, slug: finalSlug });
  } catch (err: any) {
    logger.error("links.create_failed", { ownerId: auth.user.id, message: err?.message, stack: err?.stack });
    return NextResponse.json({ error: err?.message || "Failed to create link" }, { status: 500 });
  }
}
