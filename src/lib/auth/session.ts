import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, ne, sql } from "drizzle-orm";
import crypto from "crypto";
import { hashPassword } from "./password";
import { logger } from "@/lib/logger";
import { genId } from "@/lib/ids";

/**
 * `__Host-` prefix is a strict browser-enforced guarantee: the cookie must be
 * Secure, Path=/, and carry no Domain attribute — it cannot be set or read by
 * subdomains and cannot be forced onto the browser over plain HTTP. Used only
 * in production where HTTPS is guaranteed; local dev keeps the plain name so
 * `http://localhost` still works.
 */
function sessionCookieName(): string {
  return process.env.NODE_ENV === "production" ? "__Host-blindshare_session" : "blindshare_session";
}

/**
 * Auto-seeded placeholder owner. Its presence does NOT count as "this deployment
 * has been claimed" — the first real sign-up still becomes Super Admin without
 * needing an invite code.
 */
export const GENESIS_PLACEHOLDER_EMAIL = "admin@blindshare.local";

const SESSION_SECRET =
  process.env.SESSION_SECRET || "default_blindshare_dev_secret_64_bytes_long_random_key_placeholder";

const SESSION_MAX_AGE_SECONDS = Number(process.env.SESSION_MAX_AGE_DAYS || "30") * 24 * 60 * 60;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "owner";
  isBlocked: boolean;
}

interface SessionTokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  sv: number; // sessionVersion at issue-time — must match the DB row exactly
  exp: number;
}

function signToken(payload: SessionTokenPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

function verifyToken(token: string): SessionTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    return JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

/** Signs a short-lived (5 min) 2FA pre-authentication challenge token. */
export function sign2faPreAuthToken(userId: string): string {
  const payload = {
    sub: userId,
    purpose: "2fa_challenge",
    exp: Date.now() + 5 * 60 * 1000,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

/** Verifies a 2FA pre-authentication challenge token. */
export function verify2faPreAuthToken(token: string): { userId: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (parsed.purpose !== "2fa_challenge" || (parsed.exp && parsed.exp < Date.now())) {
      return null;
    }
    return { userId: parsed.sub };
  } catch {
    return null;
  }
}

export async function createSessionCookie(user: SessionUser, sessionVersion = 1) {
  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    sv: sessionVersion,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  });

  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  // Primary cookie
  cookieStore.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  // Fallback cookie for reverse-proxy and custom domain resilience
  if (isProd) {
    cookieStore.set("blindshare_session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  // Aggressively expire both possible names across all paths
  cookieStore.set(sessionCookieName(), "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  cookieStore.set("__Host-blindshare_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  cookieStore.set("blindshare_session", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  cookieStore.delete(sessionCookieName());
  cookieStore.delete("__Host-blindshare_session");
  cookieStore.delete("blindshare_session");
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get(sessionCookieName())?.value ||
      cookieStore.get("__Host-blindshare_session")?.value ||
      cookieStore.get("blindshare_session")?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload || !payload.id || (payload.exp && payload.exp < Date.now())) {
      return null;
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isBlocked: users.isBlocked,
        sessionVersion: users.sessionVersion,
      })
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1);

    if (!user || user.isBlocked) {
      return null;
    }

    // Any "log out all devices" action bumps sessionVersion in the DB — a token
    // signed against an older version is rejected even though its HMAC is valid.
    if ((user.sessionVersion ?? 1) !== payload.sv) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "super_admin" | "admin" | "owner",
      isBlocked: user.isBlocked,
    };
  } catch {
    return null;
  }
}

/** Invalidate every existing session for this user ("log out of all devices"). */
export async function bumpSessionVersion(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ sessionVersion: sql`${users.sessionVersion} + 1`, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function getUserSessionVersion(userId: string): Promise<number> {
  const [row] = await db.select({ sessionVersion: users.sessionVersion }).from(users).where(eq(users.id, userId)).limit(1);
  return row?.sessionVersion ?? 1;
}

/**
 * Clean up any legacy placeholder account if a real user exists
 */
export async function ensureGenesisAdmin() {
  try {
    // Self-healing schema migration for 2FA & Master Vault columns
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
      ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT,
      ADD COLUMN IF NOT EXISTS master_key_salt_hex TEXT;
    `).catch(() => {});

    const realUsers = await db.select({ id: users.id }).from(users).where(ne(users.email, GENESIS_PLACEHOLDER_EMAIL)).limit(1);
    if (realUsers.length > 0) {
      // Purge default placeholder if real owner exists
      await db.delete(users).where(eq(users.email, GENESIS_PLACEHOLDER_EMAIL));
    }
  } catch (err: any) {
    logger.warn("auth.cleanup_placeholder_skipped", { message: err?.message });
  }
}
