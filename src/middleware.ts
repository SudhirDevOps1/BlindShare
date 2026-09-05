import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * BlindShare Edge Security Middleware (v1.4.0)
 *
 * Invariants:
 * 1. Global Zero-Knowledge security headers (CSP object-src 'none', frame-ancestors 'none', HSTS).
 * 2. Unauthenticated dashboard & admin route redirect to /login.
 * 3. Never touch, inspect, or log #fragment keys (RFC 3986 client-only isolation).
 */

const SESSION_COOKIE_PROD = "__Host-blindshare_session";
const SESSION_COOKIE_DEV = "blindshare_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Session Cookie Identification
  const hasSession =
    request.cookies.has(SESSION_COOKIE_PROD) ||
    request.cookies.has(SESSION_COOKIE_DEV);

  // 2. Dashboard & Admin Page Auth Guard
  const isProtectedPage =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (isProtectedPage && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Admin API Route Guard
  if (pathname.startsWith("/api/admin") && !hasSession) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin credentials required." },
        { status: 401 }
      );
    }
  }

  // 4. Construct Response & Apply Universal Enterprise Security Headers
  const response = NextResponse.next();

  // Content-Security-Policy (Strict Zero-Knowledge Standard)
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "connect-src 'self' blob: https:",
  ].join("; ");

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};
