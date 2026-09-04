import { NextResponse } from "next/server";
import { clearSessionCookie, getSession, bumpSessionVersion } from "@/lib/auth/session";

export async function POST() {
  try {
    const user = await getSession();
    if (user?.id) {
      // Invalidate the session version in the database
      await bumpSessionVersion(user.id).catch(() => {});
    }
  } catch {}

  await clearSessionCookie();

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });

  response.cookies.set("blindshare_session", "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
  });

  response.cookies.set("__Host-blindshare_session", "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    secure: true,
  });

  // Complete nuclear purge of client-side cookies and storage
  response.headers.set("Clear-Site-Data", '"cache", "cookies", "storage"');

  return response;
}
