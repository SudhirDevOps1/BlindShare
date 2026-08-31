/**
 * Structured, PII-redacting logger.
 *
 * INVARIANT (THREAT-MODEL.md / SECURITY.md "observability blind"): logs may
 * contain ids, latencies and counts, but never emails, passwords, invite
 * codes, decryption keys, or filenames. Call sites pass a flat metadata
 * object; this module strips/hashes anything that looks sensitive before it
 * ever reaches stdout (which many free hosts forward to third-party log
 * aggregators outside our control).
 */

import crypto from "crypto";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "email",
  "vieweremail",
  "invitecode",
  "code",
  "wrappedkeyhex",
  "dockey",
  "key",
  "sessionsecret",
  "applicationkey",
  "secretaccesskey",
  "vapidprivatekey",
  "cookie",
  "authorization",
  "originalfilename",
  "filename",
]);

function redactValue(key: string, value: unknown): unknown {
  const lower = key.toLowerCase();
  if (SENSITIVE_KEYS.has(lower)) {
    if (typeof value === "string" && value.length > 0) {
      // One-way, non-reversible fingerprint so duplicate detection is still possible
      // in logs without ever revealing the underlying secret.
      return `[redacted:${crypto.createHash("sha256").update(value).digest("hex").slice(0, 8)}]`;
    }
    return "[redacted]";
  }
  return value;
}

function redact(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = redact(v as Record<string, unknown>);
    } else {
      out[k] = redactValue(k, v);
    }
  }
  return out;
}

type Level = "info" | "warn" | "error";

function emit(level: Level, event: string, meta: Record<string, unknown> = {}) {
  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    ...redact(meta),
  };
  const serialized = JSON.stringify(line);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.log(serialized);
}

export const logger = {
  info: (event: string, meta?: Record<string, unknown>) => emit("info", event, meta),
  warn: (event: string, meta?: Record<string, unknown>) => emit("warn", event, meta),
  error: (event: string, meta?: Record<string, unknown>) => emit("error", event, meta),
};
