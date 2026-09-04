/**
 * Detects the real public origin URL of the application from the incoming request.
 * Prioritizes actual reverse-proxy headers (x-forwarded-host, origin, referer, host)
 * before falling back to NEXT_PUBLIC_APP_URL.
 *
 * This prevents broken links (e.g. 404 DEPLOYMENT_NOT_FOUND) caused by mismatches
 * between environment variables and actual live Vercel / Cloudflare domains.
 */

export function getRequestOrigin(request: Request): string {
  // 1. Check x-forwarded-host & x-forwarded-proto (standard on Vercel, Cloudflare, AWS, Nginx)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) {
    const firstHost = forwardedHost.split(",")[0].trim();
    return `${forwardedProto}://${firstHost}`.replace(/\/$/, "");
  }

  // 2. Check Origin header (sent by modern browsers on POST/PUT requests)
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    return originHeader.replace(/\/$/, "");
  }

  // 3. Check Referer header
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin.replace(/\/$/, "");
    } catch {}
  }

  // 4. Check Host header
  const host = request.headers.get("host");
  if (host) {
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const proto = isLocal ? "http" : "https";
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  // 5. Explicitly configured NEXT_PUBLIC_APP_URL fallback
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  // 6. Native request URL origin
  try {
    return new URL(request.url).origin.replace(/\/$/, "");
  } catch {
    return "https://blind-share.vercel.app";
  }
}
