import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { users, documents } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { getStorageAdapter } from "@/lib/storage";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    if (auth.user.role === "super_admin") {
      const otherSuperAdmins = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.role, "super_admin"), ne(users.id, auth.user.id)))
        .limit(1);
      if (otherSuperAdmins.length === 0) {
        return NextResponse.json(
          { error: "Cannot delete account: You are the sole Super Admin. Please promote another administrator first or perform a factory reset." },
          { status: 400 }
        );
      }
    }

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
