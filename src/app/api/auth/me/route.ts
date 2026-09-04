import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decryptEmail } from "@/lib/crypto/db-vault";

export async function GET() {
  try {
    const sessionUser = await getSession();
    if (!sessionUser) {
      return NextResponse.json({ user: null });
    }

    const [dbUser] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        masterKeySaltHex: users.masterKeySaltHex,
      })
      .from(users)
      .where(eq(users.id, sessionUser.id))
      .limit(1);

    if (dbUser) {
      return NextResponse.json({ user: { ...dbUser, email: decryptEmail(dbUser.email) } });
    }
    return NextResponse.json({ user: sessionUser });
  } catch {
    return NextResponse.json({ user: null });
  }
}
