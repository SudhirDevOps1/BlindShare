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
      const res = NextResponse.json({ user: null });
      res.cookies.set("blindshare_session", "", { path: "/", maxAge: 0, expires: new Date(0) });
      res.cookies.set("__Host-blindshare_session", "", { path: "/", maxAge: 0, expires: new Date(0), secure: true });
      return res;
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
    // Database was wiped or user row was purged — actively shred the zombie cookie
    const res = NextResponse.json({ user: null });
    res.cookies.set("blindshare_session", "", { path: "/", maxAge: 0, expires: new Date(0) });
    res.cookies.set("__Host-blindshare_session", "", { path: "/", maxAge: 0, expires: new Date(0), secure: true });
    return res;
  } catch {
    const res = NextResponse.json({ user: null });
    res.cookies.set("blindshare_session", "", { path: "/", maxAge: 0, expires: new Date(0) });
    res.cookies.set("__Host-blindshare_session", "", { path: "/", maxAge: 0, expires: new Date(0), secure: true });
    return res;
  }
}
