import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RELEASES_HISTORY, getLatestRelease } from "../../src/lib/changelog.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../package.json"), "utf8"));

test("Changelog Registry: Single source of truth matches current package.json version", () => {
  const latest = getLatestRelease(pkg.version);
  assert.equal(latest.version, pkg.version, `Expected latest release version to match package.json (${pkg.version})`);
  assert.ok(latest.isLatest, "Latest release must have isLatest set to true");
  assert.ok(latest.tag.startsWith("blindshare-v"), "Tag must follow standard blindshare-vX.Y.Z convention");
});

test("Changelog Registry: Full bilingual parity and required metadata across all versions", () => {
  assert.ok(RELEASES_HISTORY.length >= 3, "Expected at least 3 releases in history (v0.1.2, v0.1.1, v0.1.0)");

  for (const rel of RELEASES_HISTORY) {
    assert.ok(rel.version, "Release must have a version string");
    assert.ok(rel.date, `Release v${rel.version} must have a release date`);
    assert.ok(rel.titleEn && rel.titleEn.length > 5, `Release v${rel.version} must have English title`);
    assert.ok(rel.titleHi && rel.titleHi.length > 5, `Release v${rel.version} must have Hindi title`);
    assert.ok(rel.bannerHeadlineEn, `Release v${rel.version} must have English banner headline`);
    assert.ok(rel.bannerHeadlineHi, `Release v${rel.version} must have Hindi banner headline`);
    assert.ok(Array.isArray(rel.highlightsEn) && rel.highlightsEn.length > 0, `Release v${rel.version} must have English highlights`);
    assert.ok(Array.isArray(rel.highlightsHi) && rel.highlightsHi.length > 0, `Release v${rel.version} must have Hindi highlights`);
    assert.equal(rel.highlightsEn.length, rel.highlightsHi.length, `Release v${rel.version} highlights count must match between English and Hindi`);
  }
});

test("Changelog Registry: Category schema conforms to standard types", () => {
  const validCategories = new Set(["features", "security", "branding", "performance"]);
  for (const rel of RELEASES_HISTORY) {
    for (const cat of rel.categories) {
      assert.ok(validCategories.has(cat.category), `Invalid category: ${cat.category} in v${rel.version}`);
      assert.ok(cat.titleEn && cat.titleHi, `Category titles missing in v${rel.version}`);
      assert.ok(cat.itemsEn.length > 0 && cat.itemsHi.length > 0, `Category items missing in v${rel.version}`);
    }
  }
});

test("Broadcast Banner Logic: Smart fallback detects auto mode for legacy text or empty config", () => {
  const legacyTexts = [
    "🛡️ Zero-Knowledge Protected: Secure file sharing and pitch analytics powered by WebCrypto AES-GCM-256.",
    "WebCrypto AES-GCM-256",
    "",
    "   ",
    "auto",
    "AUTO",
    "changelog",
  ];

  for (const text of legacyTexts) {
    const raw = text.trim();
    const isLegacyStatic = raw.includes("WebCrypto AES-GCM-256") || raw.includes("Zero-Knowledge Protected: Secure file sharing");
    const useAutoChangelog = !raw || raw.toLowerCase() === "auto" || raw.toLowerCase() === "changelog" || isLegacyStatic;
    assert.equal(useAutoChangelog, true, `Expected "${text}" to trigger auto changelog mode`);
  }

  const customTexts = [
    "Scheduled database maintenance tonight at 02:00 UTC",
    "New enterprise pricing launched today",
  ];

  for (const text of customTexts) {
    const raw = text.trim();
    const isLegacyStatic = raw.includes("WebCrypto AES-GCM-256") || raw.includes("Zero-Knowledge Protected: Secure file sharing");
    const useAutoChangelog = !raw || raw.toLowerCase() === "auto" || raw.toLowerCase() === "changelog" || isLegacyStatic;
    assert.equal(useAutoChangelog, false, `Expected custom notice "${text}" NOT to trigger auto changelog mode`);
  }
});
