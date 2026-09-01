export type IntentLevel = "hot" | "warm" | "cold";

export interface ReaderIntentMetric {
  score: number; // 0 - 100
  level: IntentLevel;
  badgeText: string;
  summary: string;
  signals: {
    dwellScore: number; // 0-35
    completionScore: number; // 0-25
    frequencyScore: number; // 0-20
    highInterestScore: number; // 0-20
  };
  keyInsights: string[];
}

interface ComputeIntentInput {
  totalDwellSeconds: number;
  completedPages: number;
  totalPages: number;
  sessionCount?: number;
  ndaSigned?: boolean;
  viewerEmail?: string | null;
  pageDwells?: { pageNumber: number; dwellSeconds: number }[];
}

/**
 * Computes AI Lead Intent Score (0 - 100)
 * Evaluates investor/lead conviction using engagement dwell patterns, completion rate,
 * re-engagement, and focus on high-value pages.
 */
export function computeReaderIntent(input: ComputeIntentInput): ReaderIntentMetric {
  const {
    totalDwellSeconds,
    completedPages,
    totalPages,
    sessionCount = 1,
    ndaSigned = false,
    viewerEmail,
    pageDwells = [],
  } = input;

  const insights: string[] = [];

  // 1. Dwell Score (Max 35 pts)
  // Benchmark: 180s (3 min) is strong engagement, 360s+ (6 min) is high conviction
  let dwellScore = Math.min(35, Math.round((totalDwellSeconds / 300) * 35));
  if (totalDwellSeconds > 300) {
    insights.push(`Deep Reading: Spent ${(totalDwellSeconds / 60).toFixed(1)} mins exploring the document`);
  } else if (totalDwellSeconds < 20) {
    insights.push("Quick Bounce: Viewer skimmed under 20 seconds");
  }

  // 2. Completion Score (Max 25 pts)
  const safeTotal = Math.max(1, totalPages);
  const completionRatio = Math.min(1, completedPages / safeTotal);
  const completionScore = Math.round(completionRatio * 25);
  if (completionRatio >= 0.9) {
    insights.push(`Full Read: Completed ${Math.round(completionRatio * 100)}% of all pages`);
  } else if (completionRatio <= 0.3) {
    insights.push(`Partial Read: Read only ${completedPages} of ${safeTotal} pages`);
  }

  // 3. Frequency & Re-engagement Score (Max 20 pts)
  let frequencyScore = 5;
  if (sessionCount >= 3) {
    frequencyScore = 20;
    insights.push(`High Interest: Re-opened this document ${sessionCount} times`);
  } else if (sessionCount === 2) {
    frequencyScore = 15;
    insights.push("Returned Viewer: Came back for a second review");
  }

  // 4. High-Interest Focus Score & NDA Boost (Max 20 pts)
  let highInterestScore = 0;
  if (ndaSigned) {
    highInterestScore += 8;
    insights.push("Contractual Commitment: Signed NDA/Confidentiality Agreement");
  }
  if (viewerEmail && !viewerEmail.includes("anonymous")) {
    highInterestScore += 5;
  }

  // Check if reader spent extended dwell on specific slides (>45s)
  const highAttentionPages = pageDwells.filter((p) => p.dwellSeconds >= 45);
  if (highAttentionPages.length > 0) {
    const pageNums = highAttentionPages.map((p) => `p.${p.pageNumber}`).join(", ");
    highInterestScore += Math.min(7, highAttentionPages.length * 3);
    insights.push(`Deep Slide Focus: High dwell on ${pageNums} (Financials / Core pitch)`);
  }

  const rawScore = dwellScore + completionScore + frequencyScore + highInterestScore;
  const score = Math.min(100, Math.max(0, rawScore));

  let level: IntentLevel = "cold";
  let badgeText = "👀 Skimmed (Cold)";
  let summary = "Viewer casually skimmed or bounced quickly.";

  if (score >= 75) {
    level = "hot";
    badgeText = "🔥 Hot Deal / High Intent";
    summary = "High conviction reader with extended dwell and repeated reviews. Immediate follow-up recommended.";
  } else if (score >= 45) {
    level = "warm";
    badgeText = "⚡ Engaged Reader";
    summary = "Solid engagement with multiple pages explored.";
  }

  return {
    score,
    level,
    badgeText,
    summary,
    signals: {
      dwellScore,
      completionScore,
      frequencyScore,
      highInterestScore,
    },
    keyInsights: insights.length > 0 ? insights : ["Single glance session recorded."],
  };
}
