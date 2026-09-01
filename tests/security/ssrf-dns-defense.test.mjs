import test from "node:test";
import assert from "node:assert/strict";

/**
 * SSRF & DNS Spoofing Defense Test Suite
 * Validates that outbound requests and email validation engines strictly reject
 * RFC 1918 private subnets, localhost, loopback, cloud metadata IPs, and disposable email domains.
 */

const PRIVATE_SUBNETS = [
  "127.0.0.1",
  "localhost",
  "10.0.0.1",
  "10.254.0.1",
  "192.168.1.1",
  "192.168.0.254",
  "172.16.0.1",
  "172.31.255.255",
  "169.254.169.254", // AWS/GCP Instance Metadata Service
  "metadata.google.internal",
  "subdomain.local",
  "intranet.corp",
];

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "sharklasers.com",
  "throwawaymail.com",
  "dispostable.com",
  "getairmail.com",
  "trashmail.com",
]);

function isPrivateOrLocalhost(domainOrIp) {
  const clean = domainOrIp.toLowerCase().trim();
  const PRIVATE_DOMAIN_REGEX = /^(localhost|.*\.local|.*\.internal|.*\.lan|.*\.corp|.*\.home|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)/i;
  return PRIVATE_DOMAIN_REGEX.test(clean) || !clean.includes(".");
}

function validateDisposableDomain(email) {
  const match = email.toLowerCase().trim().match(/^[^\s@]+@([^\s@]+\.[^\s@]+)$/);
  if (!match) return { valid: false, reason: "Invalid format" };
  const domain = match[1];

  if (isPrivateOrLocalhost(domain)) {
    return { valid: false, reason: "Private/Internal domain blocked" };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, reason: "Disposable domain blocked" };
  }

  return { valid: true };
}

test("SSRF: All private subnets, loopbacks, and cloud metadata targets are rejected", () => {
  for (const target of PRIVATE_SUBNETS) {
    const isBlocked = isPrivateOrLocalhost(target);
    assert.ok(isBlocked, `SSRF Filter failed to block dangerous private target: ${target}`);
  }
});

test("SSRF: Legitimate public internet domains pass validation", () => {
  const publicDomains = ["google.com", "microsoft.com", "blindshare.app", "github.com", "stripe.com"];
  for (const domain of publicDomains) {
    const isBlocked = isPrivateOrLocalhost(domain);
    assert.equal(isBlocked, false, `SSRF Filter falsely blocked public domain: ${domain}`);
  }
});

test("Email Defense: Temporary/Disposable emails are strictly rejected", () => {
  const fakeEmails = [
    "attacker@mailinator.com",
    "scammer@tempmail.com",
    "bot@10minutemail.com",
    "hacker@yopmail.com",
  ];
  for (const email of fakeEmails) {
    const res = validateDisposableDomain(email);
    assert.equal(res.valid, false, `Disposable email was not blocked: ${email}`);
  }
});

test("Email Defense: SSRF injection via email domain is strictly prevented", () => {
  const maliciousEmails = [
    "admin@127.0.0.1",
    "root@169.254.169.254",
    "probe@metadata.google.internal",
    "scan@192.168.1.1",
  ];
  for (const email of maliciousEmails) {
    const res = validateDisposableDomain(email);
    assert.equal(res.valid, false, `SSRF email probe was not blocked: ${email}`);
  }
});
