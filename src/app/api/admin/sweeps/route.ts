import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/db";
import { documents, auditLog } from "@/db/schema";
import { getStorageAdapter } from "@/lib/storage";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

export async function POST() {
  const auth = await requireAdmin();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const storage = getStorageAdapter();
    const storedKeys = await storage.listObjects("docs/");

    const allDocs = await db.select({ storageKey: documents.storageKey }).from(documents);
    const validKeySet = new Set(allDocs.map((d) => d.storageKey));

    let purgedOrphanCount = 0;
    for (const key of storedKeys) {
      if (!validKeySet.has(key)) {
        await storage.deleteObject(key);
        purgedOrphanCount++;
      }
    }

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: auth.user.id,
      actorType: "admin",
      action: "admin.storage_sweep",
      resourceType: "storage",
      detailsJson: JSON.stringify({ scannedKeys: storedKeys.length, purgedOrphanCount }),
    });

    return NextResponse.json({ success: true, scannedKeys: storedKeys.length, purgedOrphanCount });
  } catch (err: any) {
    logger.error("admin.sweep_failed", { message: err?.message });
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}
