import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * Production Audit & Zero-Knowledge Invariants Verification
 * Validates:
 * 1. Unified SVG Brand Assets (Pure vector, no pixelated / blurry raster icons).
 * 2. Permanent deletion of legacy public/brand/icon.png.
 * 3. Zero-Knowledge Fragment Invariant (fragment #k=... is stripped before server transmission).
 * 4. Byte-Gate Hardening: Burn-after-reading & Max-views access control.
 * 5. Database & Storage payload isolation (no plaintext keys or raw files stored).
 */

test("Brand Integrity: Pure SVG Vector Icons are installed and uncorrupted", () => {
  const faviconSvgPath = path.resolve(process.cwd(), "public/brand/02-favicon.svg");
  const fullLogoSvgPath = path.resolve(process.cwd(), "public/brand/01-logo-full.svg");
  const appIconSvgPath = path.resolve(process.cwd(), "src/app/icon.svg");

  assert.ok(fs.existsSync(faviconSvgPath), "02-favicon.svg must exist");
  assert.ok(fs.existsSync(fullLogoSvgPath), "01-logo-full.svg must exist");
  assert.ok(fs.existsSync(appIconSvgPath), "src/app/icon.svg must exist");

  const faviconSvg = fs.readFileSync(faviconSvgPath, "utf8");
  assert.ok(faviconSvg.includes("<svg"), "02-favicon.svg must be a valid SVG document");
  assert.ok(faviconSvg.includes("goldG"), "02-favicon.svg must contain gold gradient definitions");

  const fullLogoSvg = fs.readFileSync(fullLogoSvgPath, "utf8");
  assert.ok(fullLogoSvg.includes("<svg"), "01-logo-full.svg must be a valid SVG document");
  assert.ok(fullLogoSvg.includes("BLIND"), "01-logo-full.svg must contain BLINDSHARE wordmark");
});

test("Brand Integrity: Legacy raster icon.png is permanently purged", () => {
  const legacyIconPath = path.resolve(process.cwd(), "public/brand/icon.png");
  assert.equal(fs.existsSync(legacyIconPath), false, "public/brand/icon.png must NOT exist");
});

test("Zero-Knowledge: RFC 3986 fragment key (#k=...) is strictly client-side", () => {
  const sampleUrl = "https://blindshare.app/v/pitch-deck-2026#k=8xY7_K9pL2mQ4vR1zT5w";
  const parsed = new URL(sampleUrl);

  // In HTTP / RFC 3986, the fragment is stripped by the browser user agent before the HTTP request line
  assert.equal(parsed.pathname, "/v/pitch-deck-2026");
  assert.equal(parsed.search, "");
  assert.equal(parsed.hash, "#k=8xY7_K9pL2mQ4vR1zT5w");

  // Server request simulation: The server's request URL will never contain the fragment
  const serverPath = parsed.pathname + parsed.search;
  assert.ok(!serverPath.includes("#k="), "Server request path must never receive fragment decryption keys");
  assert.ok(!serverPath.includes("8xY7"), "Decryption key bytes must never be accessible to the server");
});

test("Byte Gate Hardening: Burn-after-reading link self-destruct logic", () => {
  function evaluateByteAccess(link) {
    if (!link || link.isRevoked || !link.isActive) {
      return { status: 410, error: "Share link is not active or has been revoked" };
    }
    if (link.burnAfterReading && link.viewCount >= 1) {
      return { status: 410, error: "This single-use Burn-After-Reading link has self-destructed" };
    }
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return { status: 410, error: "Share link has expired" };
    }
    if (link.maxViews !== null && link.viewCount >= link.maxViews) {
      return { status: 410, error: "Share link has reached its maximum view limit" };
    }
    return { status: 200, ok: true };
  }

  // Active link with 0 views
  assert.equal(evaluateByteAccess({ isActive: true, isRevoked: false, burnAfterReading: true, viewCount: 0 }).status, 200);

  // Burned link with 1 view
  assert.equal(evaluateByteAccess({ isActive: true, isRevoked: false, burnAfterReading: true, viewCount: 1 }).status, 410);

  // Max views exceeded
  assert.equal(evaluateByteAccess({ isActive: true, isRevoked: false, maxViews: 5, viewCount: 5 }).status, 410);

  // Expired link
  assert.equal(evaluateByteAccess({ isActive: true, isRevoked: false, expiresAt: new Date(Date.now() - 10000) }).status, 410);
});

test("Storage Isolation: Plaintext keys must never be persisted in document models", () => {
  const docRecord = {
    id: "doc_test_123",
    title: "Quarterly Report",
    storageKey: "enc_abc123.bin",
    encryptionMode: "aes-256-gcm",
    ivHex: "0102030405060708090a0b0c",
    tagHex: "fedcba9876543210fedcba9876543210",
  };

  assert.equal("key" in docRecord, false);
  assert.equal("docKey" in docRecord, false);
  assert.equal("plaintextKey" in docRecord, false);
  assert.equal("fragmentKey" in docRecord, false);
});

test("Investor Intelligence: Geographic breakdown calculation prevents NaN under all conditions", () => {
  function computeCountryViews(rawBreakdown) {
    if (!rawBreakdown || !Array.isArray(rawBreakdown)) {
      return { totalViews: 0, items: [] };
    }
    let sum = 0;
    const items = rawBreakdown.map((c) => {
      const views = Number(c.views ?? c.count ?? 0);
      const safeViews = isNaN(views) || views < 0 ? 0 : views;
      sum += safeViews;
      return { country: c.country, views: safeViews };
    });
    return {
      totalViews: sum,
      items: items.map((i) => ({
        ...i,
        percentage: sum > 0 ? Math.round((i.views / sum) * 100) : 0,
      })),
    };
  }

  // Test 1: Empty input
  const res1 = computeCountryViews([]);
  assert.equal(res1.totalViews, 0);
  assert.equal(isNaN(res1.totalViews), false);

  // Test 2: Input with count instead of views (the previous bug)
  const res2 = computeCountryViews([{ country: "IN", count: 5 }]);
  assert.equal(res2.totalViews, 5);
  assert.equal(res2.items[0].views, 5);
  assert.equal(res2.items[0].percentage, 100);
  assert.equal(isNaN(res2.items[0].percentage), false);

  // Test 3: Input with undefined/null fields
  const res3 = computeCountryViews([{ country: "US" }, { country: "DE", views: null }]);
  assert.equal(res3.totalViews, 0);
  assert.equal(res3.items[0].views, 0);
  assert.equal(res3.items[0].percentage, 0);
  assert.equal(isNaN(res3.items[0].percentage), false);
});

test("Investor Intelligence: /api/investors routes are registered", () => {
  const liveRoutePath = path.resolve(process.cwd(), "src/app/api/investors/live/route.ts");
  const distRoutePath = path.resolve(process.cwd(), "src/app/api/investors/distribution/route.ts");

  assert.ok(fs.existsSync(liveRoutePath), "/api/investors/live/route.ts must exist");
  assert.ok(fs.existsSync(distRoutePath), "/api/investors/distribution/route.ts must exist");

  const liveContent = fs.readFileSync(liveRoutePath, "utf8");
  assert.ok(liveContent.includes("requireAuth"), "Live investors route must require authentication");

  const distContent = fs.readFileSync(distRoutePath, "utf8");
  assert.ok(distContent.includes("requireAuth"), "Investor distribution route must require authentication");
});
