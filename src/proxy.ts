import { NextResponse, type NextRequest } from "next/server";
import { rateLimitDistributed } from "@/lib/security/distributed-rate-limiter";

/**
 * BLINDSHARE Zero-Trust Edge Proxy (Next.js 16)
 *  - strict security headers & hardened CSP without broad wildcards
 *  - Same-Origin & Anti-CSRF verification on mutating HTTP requests
 *  - Edge-level payload size limits against DoS & memory exhaustion
 *  - Anti-spoofing client IP extraction and sanitization
 *  - X-Robots noindex & no-referrer on share/viewer routes
 *  - distributed edge rate limiting (Upstash Redis + memory fallback)
 *  - no-store caching directives on authenticated surfaces
 */

const PRESIGN_PER_MIN = Number(process.env.PRESIGN_REQ_PER_MIN_PER_IP || "20");
const VIEWS_PER_HOUR = Number(process.env.VIEWS_PER_HR_PER_LINK || "300");

/**
 * Validates and extracts a sanitized IP address to prevent header injection or spoofing.
 */
function sanitizeClientIp(request: NextRequest): string {
  const rawIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (!rawIp) return "127.0.0.1";

  // IPv4 standard regex: 0-255.0-255.0-255.0-255
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // IPv6 standard regex
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

  if (ipv4Regex.test(rawIp) || ipv6Regex.test(rawIp)) {
    return rawIp;
  }
  return "127.0.0.1";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = sanitizeClientIp(request);

  // --- 1. Same-Origin & Anti-CSRF Guard (Mutating Methods) --------------------
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json(
            { error: "Cross-Origin Request Blocked. CSRF protection active." },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Malformed or untrusted Origin header provided." },
          { status: 403 }
        );
      }
    }
  }

  // --- 2. Edge Payload Size Guard (Anti-DoS & Memory Exhaustion) --------------
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 0) {
    const isUploadEndpoint = pathname.startsWith("/api/docs") || pathname.startsWith("/api/storage");
    const maxAllowedBytes = isUploadEndpoint ? 52_428_800 : 1_048_576; // 50MB uploads, 1MB standard APIs
    if (contentLength > maxAllowedBytes) {
      return NextResponse.json(
        { error: `Payload too large. Maximum allowed size is ${isUploadEndpoint ? "50MB" : "1MB"}.` },
        { status: 413 }
      );
    }
  }

  // --- 3. Abuse Defence (Distributed Upstash Redis + Memory Fallback) ----------
  if (pathname.startsWith("/api/docs") && request.method === "POST") {
    const check = await rateLimitDistributed(`upload:${ip}`, PRESIGN_PER_MIN, 60_000);
    if (!check.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded for uploads. Please retry shortly." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  // Edge-level throttle on auth endpoints, independent of per-account lockouts
  if ((pathname === "/api/auth/login" || pathname === "/api/auth/register") && request.method === "POST") {
    const check = await rateLimitDistributed(`auth:${ip}`, 30, 60_000);
    if (!check.allowed) {
      return NextResponse.json(
        { error: "Too many authentication requests from this network. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  if (pathname.startsWith("/api/v/")) {
    const parts = pathname.split("/");
    const slug = parts[3] || "unknown";
    const subRoute = parts[4] || "";

    // Initial link view / metadata resolution (/api/v/[slug] directly):
    if (!subRoute) {
      const check = await rateLimitDistributed(`view:${slug}`, VIEWS_PER_HOUR, 3_600_000);
      if (!check.allowed) {
        return NextResponse.json(
          { error: "This link has received too many requests this hour." },
          { status: 429, headers: { "Retry-After": "600" } }
        );
      }
    } else if (subRoute === "verify") {
      // password-gate lockout pressure valve (5 tries / 15 min per IP+link)
      const tries = Number(process.env.PWD_GATE_LOCKOUT_TRIES || "5");
      const gateCheck = await rateLimitDistributed(`gate:${ip}:${slug}`, Math.max(tries * 4, 20), 900_000);
      if (!gateCheck.allowed) {
        return NextResponse.json(
          { error: "Too many access attempts. Try again in 15 minutes." },
          { status: 429, headers: { "Retry-After": "900" } }
        );
      }
    } else {
      // In-session active reading telemetry & polling (questions, room, session, bytes):
      const pollCheck = await rateLimitDistributed(`poll:${ip}:${slug}`, 2400, 3_600_000);
      if (!pollCheck.allowed) {
        return NextResponse.json(
          { error: "Too many requests. Please slow down." },
          { status: 429, headers: { "Retry-After": "60" } }
        );
      }
    }
  }

  // --- 4. Security Headers ---------------------------------------------------
  const response = NextResponse.next();

  const isDev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    // self-hosted pdf.js with CDN fallback, ALTCHA PoW anti-spam, and blob workers
    `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://cdnjs.cloudflare.com https://cdn.jsdelivr.net`,
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    // Strictly allowlisted storage and CDN origins (no wildcard https: to prevent key exfiltration)
    "connect-src 'self' blob: data: https://*.backblazeb2.com https://*.r2.cloudflarestorage.com https://*.workers.dev https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=(self), payment=(), usb=(), fullscreen=(self)"
  );
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  // Share links & their APIs must never be indexed and never leak referrers
  if (pathname.startsWith("/v/") || pathname.startsWith("/api/v/")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
  }

  // Authenticated owner/admin surfaces must never be cached by shared caches or CDNs
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/user") ||
    pathname.startsWith("/api/docs") ||
    pathname.startsWith("/api/links") ||
    pathname.startsWith("/api/datarooms")
  ) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  // Edge-level protection for authenticated pages
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("__Host-blindshare_session")?.value || request.cookies.get("blindshare_session")?.value;
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|manifest.webmanifest|sw.js).*)"],
};
