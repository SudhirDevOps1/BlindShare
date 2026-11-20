import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const versionTsContent = fs.readFileSync(path.join(rootDir, "src/lib/version.ts"), "utf8");

test("Version Single Source of Truth: src/lib/version.ts matches package.json", () => {
  const match = versionTsContent.match(/export const APP_VERSION = "([^"]+)";/);
  assert.ok(match, "APP_VERSION must be exported from src/lib/version.ts");
  assert.strictEqual(match[1], pkg.version, "APP_VERSION in version.ts must strictly match package.json version");
});

test("Version Environment Awareness: Development mode prefixes -dev in displayVersion", () => {
  // Verify dev badge logic format
  assert.ok(versionTsContent.includes("v${APP_VERSION}-dev"));
  assert.ok(versionTsContent.includes("DEV v${APP_VERSION}"));
  assert.ok(versionTsContent.includes("v${APP_VERSION} E2EE"));
});

test("Version Synchronization: package-lock.json matches package.json", () => {
  const lock = JSON.parse(fs.readFileSync(path.join(rootDir, "package-lock.json"), "utf8"));
  assert.strictEqual(lock.version, pkg.version);
});
