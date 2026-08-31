import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { datarooms, dataroomDocs, documents, auditLog } from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { parseBody } from "@/lib/validation";
import { createDataroomSchema } from "@/lib/validation/schemas";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

export async function GET() {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const userDatarooms = await db
      .select()
      .from(datarooms)
      .where(eq(datarooms.ownerId, auth.user.id))
      .orderBy(desc(datarooms.createdAt));

    return NextResponse.json({ datarooms: userDatarooms });
  } catch (err: any) {
    logger.error("datarooms.list_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to fetch datarooms" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const parsed = await parseBody(request, createDataroomSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const { name, description, docIds } = parsed.data;

  try {
    const dataroomId = genId("dr");

    await db.insert(datarooms).values({
      id: dataroomId,
      ownerId: auth.user.id,
      name,
      description: description || null,
    });

    if (Array.isArray(docIds) && docIds.length > 0) {
      // AuthZ: only include documents actually owned by this caller.
      const owned = await db
        .select({ id: documents.id })
        .from(documents)
        .where(and(eq(documents.ownerId, auth.user.id), inArray(documents.id, docIds)));
      const ownedIds = new Set(owned.map((d) => d.id));

      const docRows = docIds
        .filter((id) => ownedIds.has(id))
        .map((docId, idx) => ({
          id: genId("drd"),
          dataroomId,
          docId,
          sortOrder: idx,
        }));

      if (docRows.length > 0) {
        await db.insert(dataroomDocs).values(docRows);
      }
    }

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: auth.user.id,
      actorType: "user",
      action: "dataroom.create",
      resourceType: "dataroom",
      resourceId: dataroomId,
      detailsJson: JSON.stringify({ docCount: docIds?.length || 0 }),
    });

    return NextResponse.json({ success: true, dataroomId });
  } catch (err: any) {
    logger.error("datarooms.create_failed", { ownerId: auth.user.id, message: err?.message });
    return NextResponse.json({ error: "Failed to create dataroom" }, { status: 500 });
  }
}
