import { getSession, SessionUser } from "./session";
import { NextResponse } from "next/server";

export async function requireAuth(): Promise<{ user: SessionUser } | { errorResponse: NextResponse }> {
  const user = await getSession();
  if (!user) {
    return {
      errorResponse: NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 }),
    };
  }
  return { user };
}

export async function requireAdmin(): Promise<{ user: SessionUser } | { errorResponse: NextResponse }> {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth;

  if (auth.user.role !== "super_admin" && auth.user.role !== "admin") {
    return {
      errorResponse: NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 }),
    };
  }

  return auth;
}

export async function requireSuperAdmin(): Promise<{ user: SessionUser } | { errorResponse: NextResponse }> {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth;

  if (auth.user.role !== "super_admin") {
    return {
      errorResponse: NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 }),
    };
  }

  return auth;
}
