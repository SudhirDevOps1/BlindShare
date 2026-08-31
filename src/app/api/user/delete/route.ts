import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { users, documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStorageAdapter } from "@/lib/storage";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    // Purge owner storage ciphertext
    const userDocs = await db.select().from(documents).where(eq(documents.ownerId, auth.user.id));
    const storage = getStorageAdapter();

    for (const d of userDocs) {
      if (d.storageKey) {
        await storage.deleteObject(d.storageKey);
      }
    }

    // Delete user (cascade removes records)
    await db.delete(users).where(eq(users.id, auth.user.id));

    await clearSessionCookie();

    return NextResponse.json({ success: true, message: "Account and encrypted documents purged" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete account" }, { status: 500 });
  }
}
