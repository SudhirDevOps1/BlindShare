import test from "node:test";
import assert from "node:assert/strict";

/**
 * DuckDB Columnar Analytics Engine Test
 */

class ColumnarAnalyticsEngine {
  static aggregateSlideHeatmap(events, totalPages) {
    const pageMap = new Map();
    for (let p = 1; p <= totalPages; p++) {
      pageMap.set(p, { totalDwell: 0, uniqueViewers: new Set() });
    }
    for (const evt of events) {
      const entry = pageMap.get(evt.pageNumber) || { totalDwell: 0, uniqueViewers: new Set() };
      entry.totalDwell += evt.dwellSeconds;
      entry.uniqueViewers.add(evt.sessionId);
      pageMap.set(evt.pageNumber, entry);
    }
    const firstPageCount = pageMap.get(1)?.uniqueViewers.size || 1;
    const result = [];
    for (let p = 1; p <= totalPages; p++) {
      const data = pageMap.get(p);
      const viewerCount = data.uniqueViewers.size;
      const avgDwell = viewerCount > 0 ? Math.round(data.totalDwell / viewerCount) : 0;
      const dropOff = firstPageCount > 0 ? Math.round(((firstPageCount - viewerCount) / firstPageCount) * 100) : 0;
      result.push({
        pageNumber: p,
        totalDwellSeconds: data.totalDwell,
        avgDwellSeconds: avgDwell,
        viewerCount,
        dropOffRatePercent: Math.max(0, dropOff),
      });
    }
    return result;
  }

  static computeDwellPercentiles(dwellTimes) {
    if (!dwellTimes || dwellTimes.length === 0) return { p50: 0, p90: 0, p99: 0 };
    const sorted = [...dwellTimes].sort((a, b) => a - b);
    const getPercentile = (p) => {
      const idx = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
    };
    return {
      p50: getPercentile(50),
      p90: getPercentile(90),
      p99: getPercentile(99),
    };
  }
}

test("DuckDB Engine: Aggregates slide heatmaps and drop-off rate percentiles", () => {
  const simulatedEvents = [
    { sessionId: "s1", pageNumber: 1, dwellSeconds: 45 },
    { sessionId: "s1", pageNumber: 2, dwellSeconds: 60 },
    { sessionId: "s1", pageNumber: 3, dwellSeconds: 90 },
    { sessionId: "s2", pageNumber: 1, dwellSeconds: 30 },
    { sessionId: "s2", pageNumber: 2, dwellSeconds: 20 },
    // s2 dropped off before page 3
  ];

  const heatmap = ColumnarAnalyticsEngine.aggregateSlideHeatmap(simulatedEvents, 3);
  assert.equal(heatmap.length, 3);
  assert.equal(heatmap[0].viewerCount, 2);
  assert.equal(heatmap[0].dropOffRatePercent, 0); // 100% on Page 1

  assert.equal(heatmap[2].viewerCount, 1); // Only s1 on Page 3
  assert.equal(heatmap[2].dropOffRatePercent, 50); // 50% drop off
});

test("DuckDB Engine: Computes mathematical dwell percentiles (p50, p90, p99)", () => {
  const dwellTimes = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const p = ColumnarAnalyticsEngine.computeDwellPercentiles(dwellTimes);

  assert.equal(p.p50, 50);
  assert.equal(p.p90, 90);
  assert.equal(p.p99, 100);
});
