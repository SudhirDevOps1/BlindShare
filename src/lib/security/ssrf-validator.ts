/**
 * Server-Side Request Forgery (SSRF) Defense Engine.
 * Validates outgoing webhook and integration endpoints to prevent attackers
 * from probing internal networks, loopback interfaces, or cloud metadata services.
 *
 * Supports full RFC 1918/3986/4291 validation including alternative IP encodings
 * (hex, octal, dword/integer, mixed, IPv4-mapped IPv6).
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "::",
  "[::]",
  "metadata.google.internal",
  "instance-data",
  "metadata",
  "kubernetes.default",
]);

const BLOCKED_EXTENSIONS = [
  ".localhost",
  ".local",
  ".internal",
  ".lan",
  ".corp",
  ".home",
  ".arpa",
];

/**
 * Parses alternative IPv4 notations:
 * - Decimal dotted quad (e.g. 127.0.0.1)
 * - Octal notation (e.g. 0177.0.0.1)
 * - Hexadecimal notation (e.g. 0x7f.0.0.1 or 0x7f000001)
 * - 32-bit Dword integer (e.g. 2130706433)
 * - Condensed dot notation (e.g. 127.1)
 */
export function parseIPv4(candidate: string): string | null {
  if (!candidate || typeof candidate !== "string") return null;
  const clean = candidate.trim().toLowerCase();

  // 1. Single 32-bit integer or hex dword
  if (/^\d+$/.test(clean)) {
    const num = Number(clean);
    if (!isNaN(num) && num >= 0 && num <= 0xffffffff) {
      return [
        (num >>> 24) & 0xff,
        (num >>> 16) & 0xff,
        (num >>> 8) & 0xff,
        num & 0xff,
      ].join(".");
    }
  }

  if (/^0x[0-9a-f]+$/i.test(clean)) {
    const num = parseInt(clean, 16);
    if (!isNaN(num) && num >= 0 && num <= 0xffffffff) {
      return [
        (num >>> 24) & 0xff,
        (num >>> 16) & 0xff,
        (num >>> 8) & 0xff,
        num & 0xff,
      ].join(".");
    }
  }

  // 2. Dotted parts (1 to 4 parts)
  const parts = clean.split(".");
  if (parts.length >= 1 && parts.length <= 4) {
    const numbers: number[] = [];
    for (const part of parts) {
      let n: number;
      if (/^0x[0-9a-f]+$/i.test(part)) {
        n = parseInt(part, 16);
      } else if (/^0[0-7]+$/.test(part)) {
        n = parseInt(part, 8);
      } else if (/^\d+$/.test(part)) {
        n = parseInt(part, 10);
      } else {
        return null;
      }
      if (isNaN(n) || n < 0) return null;
      numbers.push(n);
    }

    if (numbers.length === 4) {
      if (numbers.every((n) => n <= 255)) {
        return numbers.join(".");
      }
    } else if (numbers.length === 1) {
      const n = numbers[0];
      if (n <= 0xffffffff) {
        return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join(".");
      }
    } else if (numbers.length === 2) {
      const [a, b] = numbers;
      if (a <= 255 && b <= 0xffffff) {
        return [a, (b >>> 16) & 0xff, (b >>> 8) & 0xff, b & 0xff].join(".");
      }
    } else if (numbers.length === 3) {
      const [a, b, c] = numbers;
      if (a <= 255 && b <= 255 && c <= 0xffff) {
        return [a, b, (c >>> 8) & 0xff, c & 0xff].join(".");
      }
    }
  }

  return null;
}

/**
 * Decodes IPv4-mapped IPv6 notations (e.g. ::ffff:127.0.0.1, [::ffff:7f00:1])
 */
export function decodeIpv4MappedIpv6(host: string): string | null {
  const clean = host.toLowerCase().replace(/^\[|\]$/g, "");
  const ffffIdx = clean.lastIndexOf(":ffff:");
  if (ffffIdx === -1 && !clean.startsWith("::ffff:")) return null;

  const rawPart = clean.slice(ffffIdx !== -1 ? ffffIdx + 6 : 7);
  if (rawPart.includes(".")) {
    return parseIPv4(rawPart);
  }

  // Hex word pairs (e.g. 7f00:1 or a9fe:a9fe)
  const parts = rawPart.split(":");
  if (parts.length === 2) {
    const high = parseInt(parts[0], 16);
    const low = parseInt(parts[1], 16);
    if (!isNaN(high) && !isNaN(low)) {
      const b1 = (high >> 8) & 0xff;
      const b2 = high & 0xff;
      const b3 = (low >> 8) & 0xff;
      const b4 = low & 0xff;
      return `${b1}.${b2}.${b3}.${b4}`;
    }
  }

  return null;
}

/**
 * Checks whether an IPv4 address belongs to a private, loopback, or cloud metadata range.
 */
export function isPrivateIPv4(ip: string): boolean {
  const parsed = parseIPv4(ip);
  if (!parsed) return false;

  const parts = parsed.split(".").map((p) => parseInt(p, 10));
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

  // 172.16.0.0/12 (Private network 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24 (IETF protocol assignments) & 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0) return true;

  // 192.168.0.0/16 (Private network)
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 (Network benchmark tests) & 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && ((b >= 18 && b <= 19) || b === 51)) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0) return true;

  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (a >= 224) return true;

  return false;
}

/**
 * Checks whether an IPv6 address belongs to loopback, link-local, or unique local range.
 */
export function isPrivateIPv6(host: string): boolean {
  const clean = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (clean === "::" || clean === "::1" || clean === "0:0:0:0:0:0:0:1") return true;
  // Link-local: fe80::/10 (fe80 to febf)
  if (/^fe[89ab]/i.test(clean)) return true;
  // Unique local addresses (ULA): fc00::/7 (fc00 to fdff)
  if (/^f[cd]/i.test(clean)) return true;
  // Site-local: fec0::/10
  if (/^fec/i.test(clean)) return true;
  // IPv4 compatible (::127.0.0.1 etc)
  if (clean.startsWith("::") && clean.includes(".")) return true;
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
  const cleanHost = hostname.replace(/^\[|\]$/g, "");

  // 3. Reject known private hostnames and suffixes
  if (BLOCKED_HOSTNAMES.has(hostname) || BLOCKED_HOSTNAMES.has(cleanHost)) {
    return { safe: false, reason: "Target host points to a local or internal interface" };
  }

  for (const ext of BLOCKED_EXTENSIONS) {
    if (hostname.endsWith(ext) || cleanHost.endsWith(ext)) {
      return { safe: false, reason: `Target host ends with internal reserved domain (${ext})` };
    }
  }

  // Single-label hostnames (e.g. "http://metadata", "http://intranet") without a dot or IPv6 colons
  if (!cleanHost.includes(".") && !cleanHost.includes(":")) {
    return { safe: false, reason: "Single-label local hostnames without a public domain are forbidden" };
  }

  // 4. IPv4-mapped IPv6 checks (e.g. ::ffff:127.0.0.1, [::ffff:7f00:1])
  const mappedIpv4 = decodeIpv4MappedIpv6(cleanHost);
  if (mappedIpv4) {
    if (isPrivateIPv4(mappedIpv4)) {
      return { safe: false, reason: `Target host maps to private IPv4 address (${mappedIpv4})` };
    }
  }

  // 5. Standard and alternative IPv4 checks (hex, octal, dword)
  const resolvedIpv4 = parseIPv4(cleanHost);
  if (resolvedIpv4) {
    if (isPrivateIPv4(resolvedIpv4)) {
      return { safe: false, reason: `Target host points to a private RFC 1918 or metadata IP range (${resolvedIpv4})` };
    }
  }

  // 6. IPv6 check
  if (cleanHost.includes(":")) {
    if (isPrivateIPv6(cleanHost)) {
      return { safe: false, reason: "IPv6 private/loopback/link-local addresses are forbidden" };
    }
  }

  return { safe: true };
}
