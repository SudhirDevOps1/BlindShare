import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, auditLog } from "@/db/schema";
import { eq, ne, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { emailSchema, nameSchema, passwordSchema } from "@/lib/validation/schemas";
import { z } from "zod";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema().optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const { name, email, currentPassword, newPassword } = parsed.data;

    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updates: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    // 1. Update Name
    if (name && name !== currentUser.name) {
      updates.name = name;
    }

    // 2. Update Email (Check unique)
    if (email && email !== currentUser.email) {
      const [existingEmail] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, session.id)))
        .limit(1);

      if (existingEmail) {
        return NextResponse.json({ error: "This email is already in use by another account" }, { status: 400 });
      }
      updates.email = email;
    }

    // 3. Update Password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to set a new password" }, { status: 400 });
      }

      const isCurrentValid = await verifyPassword(currentPassword, currentUser.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      updates.passwordHash = await hashPassword(newPassword);
      // Invalidate old sessions on other devices
      updates.sessionVersion = currentUser.sessionVersion + 1;
    }

    if (Object.keys(updates).length > 1) {
      await db.update(users).set(updates).where(eq(users.id, session.id));

      await db.insert(auditLog).values({
        id: genId("aud"),
        userId: session.id,
        actorType: "user",
        action: "user.profile_updated",
        resourceType: "user",
        resourceId: session.id,
        detailsJson: JSON.stringify({
          nameChanged: !!updates.name,
          emailChanged: !!updates.email,
          passwordChanged: !!updates.passwordHash,
        }),
      });

      logger.info("user.profile_updated", { userId: session.id });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: session.id,
        name: updates.name || currentUser.name,
        email: updates.email || currentUser.email,
        role: currentUser.role,
      },
    });
  } catch (err: any) {
    logger.error("user.profile_update_failed", { error: err?.message });
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
