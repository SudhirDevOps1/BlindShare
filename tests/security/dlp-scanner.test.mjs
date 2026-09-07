import test from "node:test";
import assert from "node:assert/strict";
import { scanTextForDlp } from "../../src/lib/dlp/scanner.ts";

test("DLP Scanner: Detects AWS Access Key ID with masking", () => {
  const text = "Connecting to S3 bucket using key AKIAIOSFODNN7EXAMPLE for backups.";
  const findings = scanTextForDlp(text, 1);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].type, "aws_key");
  assert.equal(findings[0].severity, "critical");
  assert.ok(findings[0].snippet.includes("••••••••"));
});

test("DLP Scanner: Detects GitHub Personal Access Token", () => {
  const text = "Deploy token: ghp_1234567890abcdefghijklmnopqrstuvwx";
  const findings = scanTextForDlp(text, 2);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].type, "github_pat");
  assert.equal(findings[0].severity, "critical");
});

test("DLP Scanner: Detects RSA Private Key header", () => {
  const text = "Certificate bundle:\n-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...";
  const findings = scanTextForDlp(text, 3);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].type, "private_key");
  assert.equal(findings[0].severity, "critical");
});

test("DLP Scanner: Validates Credit Card via Luhn algorithm (rejects invalid checksums)", () => {
  // Test valid Visa card number (passes Luhn)
  const validCardText = "Billing info: 4111-1111-1111-1111 for cloud billing";
  const findingsValid = scanTextForDlp(validCardText, 4);
  assert.equal(findingsValid.length, 1);
  assert.equal(findingsValid[0].type, "credit_card");

  // Test random 16 digits that fail Luhn
  const invalidCardText = "Transaction ID: 4532-0150-0000-0005 tracking number";
  const findingsInvalid = scanTextForDlp(invalidCardText, 4);
  assert.equal(findingsInvalid.length, 0, "Invalid Luhn checksum must not trigger false positive");
});

test("DLP Scanner: Detects Indian PAN Card", () => {
  const text = "Director PAN: ABCDE1234F verified by MCA";
  const findings = scanTextForDlp(text, 5);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].type, "pan_card");
  assert.equal(findings[0].severity, "medium");
});

test("DLP Scanner: Clean document yields zero findings", () => {
  const text = "BlindShare is a zero-knowledge document sharing platform with real-time analytics.";
  const findings = scanTextForDlp(text, 1);
  assert.equal(findings.length, 0);
});
