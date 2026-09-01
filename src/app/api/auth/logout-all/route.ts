import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { bumpSessionVersion, clearSessionCookie } from "@/lib/auth/session";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { genId } from "@/lib/ids";

/**
 * Invalidates every existing session token for the current user (all devices,
 * all browsers) by bumping their sessionVersion in the DB, then clears the
 * cookie on this device too.
 */
export async function POST() {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  await bumpSessionVersion(auth.user.id);
  await clearSessionCookie();

  await db.insert(auditLog).values({
    id: genId("aud"),
    userId: auth.user.id,
    actorType: "user",
    action: "auth.logout_all_devices",
    resourceType: "user",
    resourceId: auth.user.id,
    detailsJson: JSON.stringify({}),
  });

  const response = NextResponse.json({ success: true, message: "All sessions revoked. Please sign in again." });

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

  return response;
}
