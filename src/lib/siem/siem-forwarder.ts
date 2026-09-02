import { logger } from "@/lib/logger";

/**
 * Enterprise SIEM & SOC Security Log Forwarder
 * Formats and streams security audit events to enterprise collectors
 * (Splunk HEC, Datadog Logs API, Elastic / Logstash, and generic SIEM Webhooks).
 */

export type SiemEventType =
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILED"
  | "AUTH_ACCOUNT_LOCKED"
  | "AUTH_2FA_VERIFIED"
  | "AUTH_2FA_FAILED"
  | "AUTH_ALL_DEVICES_REVOKED"
  | "SSRF_PROBE_BLOCKED"
  | "RATE_LIMIT_TRIGGERED"
  | "DOC_BURN_AFTER_READING_REVOKED"
  | "ADMIN_STORAGE_PURGE_EXECUTED"
  | "ADMIN_MAINTENANCE_SWEEP";

export interface SiemSecurityEvent {
  event: SiemEventType;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  actor?: {
    id?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
  };
  resource?: {
    type?: string;
    id?: string;
    name?: string;
  };
  details?: Record<string, any>;
  timestamp?: string;
}

/**
 * Formats event according to Common Event Format (CEF) standard used by ArcSight, Splunk, and IBM QRadar.
 */
export function formatCef(e: SiemSecurityEvent): string {
  const ts = e.timestamp || new Date().toISOString();
  const severityNum = e.severity === "CRITICAL" ? 10 : e.severity === "HIGH" ? 7 : e.severity === "MEDIUM" ? 5 : 1;
  const srcIp = e.actor?.ip || "unknown";
  const user = e.actor?.email ? e.actor.email.split("@")[0] : "anonymous";
  const details = Object.entries(e.details || {})
    .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(" ");

  return `CEF:0|BlindShare|E2EE-Platform|1.3.0|${e.event}|${e.event}|${severityNum}|rt=${ts} src=${srcIp} suser=${user} cs1=${e.resource?.type || "none"} cs1Label=ResourceType ${details}`;
}

/**
 * Asynchronously sends event to configured SIEM collectors.
 * Fail-safe: Network timeouts never block user flows.
 */
export async function forwardSiemEvent(event: SiemSecurityEvent): Promise<void> {
  const siemWebhookUrl = process.env.SIEM_WEBHOOK_URL || process.env.SPLUNK_HEC_URL;
  const datadogApiKey = process.env.DATADOG_API_KEY;

  const enrichedEvent: SiemSecurityEvent = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  // 1. Structured Local Audit Log
  logger.info(`siem.${event.event.toLowerCase()}`, {
    severity: event.severity,
    actorId: event.actor?.id,
    resourceId: event.resource?.id,
    details: event.details,
  });

  // 2. Forward to Splunk / Elastic / Generic SIEM Webhook
  if (siemWebhookUrl) {
    try {
      const cefPayload = formatCef(enrichedEvent);
      fetch(siemWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BlindShare-Event": event.event,
        },
        body: JSON.stringify({
          cef: cefPayload,
          json: enrichedEvent,
        }),
        signal: AbortSignal.timeout(3500),
      }).catch((err) => {
        logger.warn("siem.forward_webhook_failed", { message: err?.message });
      });
    } catch {}
  }

  // 3. Forward to Datadog Logs API (if configured)
  if (datadogApiKey) {
    try {
      const ddSite = process.env.DATADOG_SITE || "datadoghq.com";
      fetch(`https://http-intake.logs.${ddSite}/api/v2/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "DD-API-KEY": datadogApiKey,
        },
        body: JSON.stringify({
          ddsource: "blindshare",
          ddtags: `env:${process.env.NODE_ENV || "development"},severity:${event.severity}`,
          hostname: "blindshare-edge",
          message: formatCef(enrichedEvent),
          service: "blindshare-auth-and-crypto",
          ...enrichedEvent,
        }),
        signal: AbortSignal.timeout(3500),
      }).catch(() => {});
    } catch {}
  }
}
