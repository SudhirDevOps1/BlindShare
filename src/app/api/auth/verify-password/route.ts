import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { parseBody } from "@/lib/validation";
import { z } from "zod";
import crypto from "crypto";

const verifyPasswordSchema = z.object({
  password: z.string().min(1, "Password is required").max(256),
});

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const parsed = await parseBody(request, verifyPasswordSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;

  const { password } = parsed.data;

  const [dbUser] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      masterKeySaltHex: users.masterKeySaltHex,
    })
    .from(users)
    .where(eq(users.id, auth.user.id))
    .limit(1);

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isMatch = await verifyPassword(password, dbUser.passwordHash);
  if (!isMatch) {
    return NextResponse.json(
      { valid: false, error: "Incorrect account password. Please try again." },
      { status: 401 }
    );
  }

  let masterKeySaltHex = dbUser.masterKeySaltHex;
  if (!masterKeySaltHex) {
    masterKeySaltHex = crypto.randomBytes(16).toString("hex");
    await db
      .update(users)
      .set({ masterKeySaltHex })
      .where(eq(users.id, dbUser.id))
      .catch(() => {});
  }

  return NextResponse.json({
    valid: true,
    masterKeySaltHex,
  });
}
