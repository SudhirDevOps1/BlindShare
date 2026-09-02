import test from "node:test";
import assert from "node:assert/strict";

/**
 * Enterprise SIEM CEF Formatter Test
 */
function formatCef(e) {
  const ts = e.timestamp || new Date().toISOString();
  const severityNum = e.severity === "CRITICAL" ? 10 : e.severity === "HIGH" ? 7 : e.severity === "MEDIUM" ? 5 : 1;
  const srcIp = e.actor?.ip || "unknown";
  const user = e.actor?.email ? e.actor.email.split("@")[0] : "anonymous";
  const details = Object.entries(e.details || {})
    .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(" ");

  return `CEF:0|BlindShare|E2EE-Platform|1.3.0|${e.event}|${e.event}|${severityNum}|rt=${ts} src=${srcIp} suser=${user} cs1=${e.resource?.type || "none"} cs1Label=ResourceType ${details}`;
}

test("SIEM: Formats standard Common Event Format (CEF) strings correctly", () => {
  const cef = formatCef({
    event: "AUTH_ACCOUNT_LOCKED",
    severity: "HIGH",
    actor: {
      ip: "198.51.100.42",
      email: "victim@corp.com",
    },
    resource: {
      type: "user_account",
      id: "usr_999",
    },
    details: {
      failedAttempts: 5,
      lockoutMinutes: 15,
    },
    timestamp: "2026-09-01T12:00:00.000Z",
  });

  assert.ok(cef.startsWith("CEF:0|BlindShare|E2EE-Platform|1.3.0|AUTH_ACCOUNT_LOCKED|AUTH_ACCOUNT_LOCKED|7|"));
  assert.ok(cef.includes("src=198.51.100.42"));
  assert.ok(cef.includes("suser=victim"));
  assert.ok(cef.includes("failedAttempts=5"));
});
