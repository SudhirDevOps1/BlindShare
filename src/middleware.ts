import { NextResponse, type NextRequest } from "next/server";

/**
 * BLINDSHARE edge middleware
 *  - strict security headers (CSP includes worker-src blob: for pdf.js)
 *  - X-Robots noindex on share/viewer routes (share-links must not be indexed)
 *  - coarse per-IP rate limiting for abuse defence, incl. auth brute-force
 *  - no-store caching directives on authenticated surfaces
 *
 * Honest note: the counter map is per-instance memory. On multi-instance or edge
 * deployments this is a first line of defence only; the durable limiter belongs in
 * KV/DO (BACKEND_TARGET=cf) and is documented in THREAT-MODEL.md.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  existing.count += 1;
  if (existing.count > limit) return false;
  return true;
}

// Opportunistic cleanup so the map cannot grow unbounded.
function sweep() {
  if (buckets.size < 5000) return;
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
  }
}

const PRESIGN_PER_MIN = Number(process.env.PRESIGN_REQ_PER_MIN_PER_IP || "20");
const VIEWS_PER_HOUR = Number(process.env.VIEWS_PER_HR_PER_LINK || "120");

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  sweep();

  // --- Abuse defence -------------------------------------------------------
  if (pathname.startsWith("/api/docs") && request.method === "POST") {
    if (!rateLimit(`upload:${ip}`, PRESIGN_PER_MIN, 60_000)) {
      return NextResponse.json(
        { error: "Rate limit exceeded for uploads. Please retry shortly." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  // Coarse edge-level throttle on auth endpoints, independent of the
  // per-account lockout enforced inside the route handlers themselves.
  if ((pathname === "/api/auth/login" || pathname === "/api/auth/register") && request.method === "POST") {
    if (!rateLimit(`auth:${ip}`, 30, 60_000)) {
      return NextResponse.json(
        { error: "Too many authentication requests from this network. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  if (pathname.startsWith("/api/v/")) {
    const slug = pathname.split("/")[3] || "unknown";
    if (!rateLimit(`view:${slug}`, VIEWS_PER_HOUR, 3_600_000)) {
      return NextResponse.json(
        { error: "This link has received too many requests this hour." },
        { status: 429, headers: { "Retry-After": "600" } }
      );
    }
    if (pathname.endsWith("/verify")) {
      // password-gate lockout pressure valve (5 tries / 15 min per IP+link)
      const tries = Number(process.env.PWD_GATE_LOCKOUT_TRIES || "5");
      if (!rateLimit(`gate:${ip}:${slug}`, Math.max(tries * 4, 20), 900_000)) {
        return NextResponse.json(
          { error: "Too many access attempts. Try again in 15 minutes." },
          { status: 429, headers: { "Retry-After": "900" } }
        );
      }
    }
  }

  // --- Headers -------------------------------------------------------------
  const response = NextResponse.next();

  const csp = [
    "default-src 'self'",
    // pdf.js is loaded from cdnjs and spawns a blob worker
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://cdnjs.cloudflare.com blob:",
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
    "camera=(), geolocation=(), microphone=(self), payment=(), usb=(), fullscreen=(self), interest-cohort=()"
  );
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  // Share links & their APIs must never be indexed.
  if (pathname.startsWith("/v/") || pathname.startsWith("/api/v/")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    response.headers.set("Cache-Control", "private, no-store");
  }

  // Authenticated owner/admin surfaces must never be cached by shared caches,
  // CDNs, or the browser's back-forward cache with stale privileged content.
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

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|manifest.webmanifest|sw.js).*)"],
};
