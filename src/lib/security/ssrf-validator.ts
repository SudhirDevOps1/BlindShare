/**
 * Server-Side Request Forgery (SSRF) Defense Engine.
 * Validates outgoing webhook and integration endpoints to prevent attackers
 * from probing internal networks, loopback interfaces, or cloud metadata services.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "instance-data",
  "metadata",
]);

/**
 * Checks whether an IPv4 address belongs to a private, loopback, or cloud metadata range.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP, block it safely
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private network)
  if (a === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 169.254.0.0/16 (Link-local / Cloud Metadata like 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private network)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private network)
  if (a === 192 && b === 168) return true;

  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (a >= 224) return true;

  return false;
}

/**
 * Validates whether a target URL is safe for server-side dispatching.
 * Rejects non-HTTP(S), local IPs, cloud metadata endpoints, and internal network ranges.
 */
export function isSafeWebhookUrl(rawUrl: string): { safe: boolean; reason?: string } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { safe: false, reason: "Empty or invalid URL string" };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { safe: false, reason: "Malformed URL syntax" };
  }

  // 1. Protocol validation: HTTPS enforced in production, HTTP permitted only in dev
  const isDev = process.env.NODE_ENV === "development";
  if (parsed.protocol !== "https:" && (parsed.protocol !== "http:" || !isDev)) {
    return { safe: false, reason: "Only secure HTTPS webhook endpoints are permitted" };
  }

  // 2. Reject credentials embedded in URL (e.g. http://user:pass@host)
  if (parsed.username || parsed.password) {
    return { safe: false, reason: "Embedded user credentials in webhook URL are forbidden" };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 3. Reject known private hostnames
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    return { safe: false, reason: "Target host points to a local or internal interface" };
  }

  // 4. IP-based checks
  // IPv4 regex test
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return { safe: false, reason: "Target host points to a private RFC 1918 or metadata IP range" };
    }
  }

  // IPv6 check
  if (hostname.startsWith("[") || hostname.includes(":")) {
    // Block all bracketed IPv6 / local IPv6
    if (hostname === "::1" || hostname === "[::1]" || hostname.startsWith("fc") || hostname.startsWith("fe80")) {
      return { safe: false, reason: "IPv6 private/link-local addresses are forbidden" };
    }
  }

  return { safe: true };
}
