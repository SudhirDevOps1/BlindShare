import { NextResponse } from "next/server";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth/rbac";
import { db } from "@/db";
import { users, documents, auditLog } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getStorageAdapter } from "@/lib/storage";
import { parseBody } from "@/lib/validation";
import { adminUserPatchSchema } from "@/lib/validation/schemas";
import { genId } from "@/lib/ids";
import { bumpSessionVersion } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

export async function GET() {
  const auth = await requireAdmin();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isBlocked: users.isBlocked,
        failedLoginCount: users.failedLoginCount,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ users: allUsers });
  } catch (err: any) {
    logger.error("admin.users_list_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("errorResponse" in auth) return auth.errorResponse;

  const parsed = await parseBody(request, adminUserPatchSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const { userId, isBlocked, role } = parsed.data;

  try {
    if (userId === auth.user.id && isBlocked === true) {
      return NextResponse.json({ error: "Cannot block your own administrator account" }, { status: 400 });
    }

    const updates: any = { updatedAt: new Date() };
    if (isBlocked !== undefined) updates.isBlocked = isBlocked;

    if (role !== undefined) {
      if (auth.user.role !== "super_admin") {
        return NextResponse.json({ error: "Only Super Admin can modify user roles" }, { status: 403 });
      }
      updates.role = role;
    }

    await db.update(users).set(updates).where(eq(users.id, userId));

    // Blocking or demoting a user should also kill any sessions they already hold.
    if (isBlocked === true || role !== undefined) {
      await bumpSessionVersion(userId);
    }

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: auth.user.id,
      actorType: "admin",
      action: "admin.user_update",
      resourceType: "user",
      resourceId: userId,
      detailsJson: JSON.stringify(updates),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error("admin.user_update_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireSuperAdmin();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (userId === auth.user.id) {
      return NextResponse.json({ error: "Cannot delete your own super admin account" }, { status: 400 });
    }

    const userDocs = await db.select().from(documents).where(eq(documents.ownerId, userId));
    const storage = getStorageAdapter();

    for (const d of userDocs) {
      if (d.storageKey) {
        await storage.deleteObject(d.storageKey);
      }
    }

    await db.delete(users).where(eq(users.id, userId));

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: auth.user.id,
      actorType: "admin",
      action: "admin.user_purge",
      resourceType: "user",
      resourceId: userId,
      detailsJson: JSON.stringify({ purgedDocsCount: userDocs.length }),
    });

    return NextResponse.json({ success: true, message: "User account and ciphertext purged" });
  } catch (err: any) {
    logger.error("admin.user_purge_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
