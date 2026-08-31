import crypto from "crypto";

/**
 * Hash IP address with daily rotating salt so raw IPs are never stored in DB
 */
export function hashIp(rawIp: string | null | undefined): string {
  if (!rawIp) return "anonymous";
  const dateSalt = new Date().toISOString().substring(0, 10);
  return crypto.createHmac("sha256", dateSalt).update(rawIp).digest("hex").substring(0, 16);
}

export interface ParsedUA {
  browser: string;
  os: string;
  device: "desktop" | "mobile" | "tablet";
}

export function parseUserAgent(uaString: string | null | undefined): ParsedUA {
  if (!uaString) {
    return { browser: "Unknown", os: "Unknown", device: "desktop" };
  }

  const ua = uaString.toLowerCase();
  let device: "desktop" | "mobile" | "tablet" = "desktop";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    device = "tablet";
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    device = "mobile";
  }

  let os = "Other";
  if (ua.includes("win")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) os = "iOS";
  else if (ua.includes("linux")) os = "Linux";

  let browser = "Other";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("opera") || ua.includes("opr/")) browser = "Opera";

  return { browser, os, device };
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;
  if (mins < 60) return `${mins}m ${remSecs}s`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

export function generateCsv(headers: string[], rows: (string | number)[][]): string {
  const escapeCsv = (val: string | number) => {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ];
  return lines.join("\n");
}
