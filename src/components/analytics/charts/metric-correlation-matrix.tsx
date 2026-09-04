"use client";

import React from "react";
import { GitCompare, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface MetricCorrelationMatrixProps {
  sessions?: any[];
}

export function MetricCorrelationMatrix({ sessions = [] }: MetricCorrelationMatrixProps) {
  const { t } = useI18n();

  const labels = [
    t.charts?.correlation?.dwellTime || "Dwell Time",
    t.charts?.correlation?.pagesRead || "Pages Read",
    t.charts?.correlation?.returnVisits || "Return Visits",
    t.charts?.correlation?.intentScore || "Intent Score",
    t.charts?.correlation?.completion || "Completion %",
  ];

  // Mathematical correlation coefficients: compute real Pearson R when >= 5 sessions, else benchmark seed
  const { matrix, isCalculated } = React.useMemo(() => {
    if (sessions && sessions.length >= 5) {
      // Vectors: [dwellSeconds, maxPageReached, 1 (single/repeat estimate), intentScore, completionRate]
      const rows = sessions.map((s) => [
        s.totalDwellSeconds || 0,
        s.maxPageReached || 1,
        (s.viewerIpHash ? 1 : 1),
        s.intent === "high" ? 90 : (s.intent === "medium" ? 60 : 30),
        s.completionRate || 0,
      ]);

      const n = rows.length;
      const means = [0, 1, 2, 3, 4].map((col) => rows.reduce((sum, r) => sum + r[col], 0) / n);
      const stdDevs = [0, 1, 2, 3, 4].map((col) => {
        const variance = rows.reduce((sum, r) => sum + Math.pow(r[col] - means[col], 2), 0) / n;
        return Math.sqrt(variance) || 1;
      });

      const rMatrix = [0, 1, 2, 3, 4].map((i) =>
        [0, 1, 2, 3, 4].map((j) => {
          if (i === j) return 1.0;
          const cov = rows.reduce((sum, r) => sum + (r[i] - means[i]) * (r[j] - means[j]), 0) / n;
          const rVal = cov / (stdDevs[i] * stdDevs[j]);
          return Math.max(-1, Math.min(1, Math.round(rVal * 100) / 100));
        })
      );
      return { matrix: rMatrix, isCalculated: true };
    }

    return {
      matrix: null,
      isCalculated: false,
    };
  }, [sessions]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t.charts?.correlation?.title || "Metric Correlation Heatmap"}
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Pearson R Coefficients
            </span>
            <span className="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              {isCalculated ? `Live Sessions (N=${sessions.length})` : "Awaiting ≥5 Sessions"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.charts?.correlation?.subtitle || "Cross-variable correlation between dwell, slides read, and deal intent"}
          </p>
        </div>

        {/* Legend */}
        {matrix && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span>+0.5</span>
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-amber-950/60 border border-amber-900/50" />
              <span className="h-3 w-3 rounded bg-amber-700/70 border border-amber-600/50" />
              <span className="h-3 w-3 rounded bg-amber-500 border border-amber-400" />
              <span className="h-3 w-3 rounded bg-amber-300 border border-yellow-200" />
            </div>
            <span>+1.0 (Strong)</span>
          </div>
        )}
      </div>

      {/* Grid Table or Pending State */}
      {matrix ? (
        <div className="overflow-x-auto no-scrollbar">
          <div className="min-w-[480px]">
            {/* Header row */}
            <div className="grid grid-cols-6 gap-1.5 mb-1.5 text-[10px] font-bold text-slate-400 text-center">
              <div className="text-left pl-2">Signal</div>
              {labels.map((l) => (
                <div key={l} className="truncate" title={l}>
                  {l}
                </div>
              ))}
            </div>

            {/* Data rows */}
            {labels.map((rowLabel, rIdx) => (
              <div key={rowLabel} className="grid grid-cols-6 gap-1.5 items-center mb-1.5">
                <span className="text-[10px] font-semibold text-slate-300 truncate pl-2" title={rowLabel}>
                  {rowLabel}
                </span>
                {matrix[rIdx].map((val, cIdx) => {
                  let cellStyle = "bg-slate-950 border-slate-800 text-slate-400";
                  if (val === 1.0) {
                    cellStyle = "bg-slate-800/80 border-slate-700 text-slate-300 font-bold";
                  } else if (val >= 0.9) {
                    cellStyle = "bg-amber-300 text-slate-950 border-yellow-200 font-black shadow-sm";
                  } else if (val >= 0.8) {
                    cellStyle = "bg-amber-500 text-slate-950 border-amber-400 font-bold";
                  } else if (val >= 0.7) {
                    cellStyle = "bg-amber-700/80 text-white border-amber-600/50";
                  } else {
                    cellStyle = "bg-amber-950/60 text-amber-200 border-amber-900/40";
                  }

                  return (
                    <div
                      key={cIdx}
                      className={`h-8 rounded-lg border flex items-center justify-center text-xs font-mono transition-transform hover:scale-110 cursor-pointer ${cellStyle}`}
                      title={`${rowLabel} ↔ ${labels[cIdx]}: r = +${val.toFixed(2)}`}
                    >
                      +{val.toFixed(2)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-44 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center p-6 text-center">
          <GitCompare className="h-8 w-8 text-slate-600 mb-2" />
          <p className="text-xs font-semibold text-slate-400">Insufficient Data for Statistical Correlation</p>
          <p className="text-[11px] text-slate-500 max-w-sm mt-1">
            Pearson R coefficients require at least 5 recorded reader sessions to ensure mathematical validity. (Currently: {sessions.length} session{sessions.length === 1 ? "" : "s"})
          </p>
        </div>
      )}
    </div>
  );
}
