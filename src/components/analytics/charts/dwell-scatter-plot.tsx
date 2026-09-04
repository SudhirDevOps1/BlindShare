"use client";

import React, { useState, useMemo } from "react";
import { ScatterChart, Flame, Zap, Snowflake, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface DwellScatterPlotProps {
  sessions?: any[];
  totalPages?: number;
}

export function DwellScatterPlot({ sessions = [], totalPages = 10 }: DwellScatterPlotProps) {
  const { t } = useI18n();
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  const points = useMemo(() => {
    if (sessions.length > 0) {
      return sessions.map((s, idx) => {
        const dwellMin = (s.totalDwellSeconds || s.durationSeconds || 0) / 60;
        const completionPct = Math.min(Math.round(((s.maxPageReached || 1) / totalPages) * 100), 100);
        const intent = s.intent || (dwellMin > 3 && completionPct > 70 ? "high" : dwellMin > 1 ? "medium" : "low");
        return {
          id: s.id || `s-${idx}`,
          dwellMin: Number(dwellMin.toFixed(1)),
          completionPct,
          intent,
          viewerName: s.viewerEmail || `Investor #${idx + 1}`,
        };
      });
    }

    return [];
  }, [sessions, totalPages]);

  const maxDwell = Math.max(...points.map((p) => p.dwellMin), 10);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t.charts?.scatter?.title || "Dwell Time vs. Slide Completion Matrix"}
            </h3>
            <span className="text-[10px] font-mono text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              {points.length} Data Points
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.charts?.scatter?.subtitle || "Identifying high-engagement readers who dropped off before the final ask"}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-red-400 font-bold">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> {t.charts?.scatter?.hotDeals || "Hot"}
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-bold">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> {t.charts?.scatter?.warmLeads || "Warm"}
          </span>
          <span className="flex items-center gap-1 text-slate-400 font-bold">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500" /> {t.charts?.scatter?.casual || "Casual"}
          </span>
        </div>
      </div>

      {/* SVG Scatter Plot Grid */}
      <div className="relative h-60 w-full bg-slate-950/80 rounded-xl border border-slate-800 p-4">
        {/* Quadrant Highlight: High Dwell & Incomplete */}
        <div className="absolute top-4 left-4 w-[45%] h-[45%] bg-amber-500/5 border border-dashed border-amber-500/20 rounded-lg pointer-events-none flex items-start p-2">
          <span className="text-[9px] text-amber-400/80 font-bold">
            {t.charts?.scatter?.engagedIncomplete || "High Attention / Drop-off"}
          </span>
        </div>

        <svg className="w-full h-full overflow-visible">
          {/* Grid lines */}
          <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#1e293b" strokeDasharray="3,3" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#1e293b" strokeDasharray="3,3" />
          <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#1e293b" strokeDasharray="3,3" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#1e293b" strokeDasharray="3,3" />

          {/* Scatter dots */}
          {points.map((pt) => {
            const xPct = Math.max(pt.completionPct, 5);
            const yPct = Math.max(100 - (pt.dwellMin / maxDwell) * 100, 5);

            let dotColor = "#64748b";
            if (pt.intent === "high") dotColor = "#ef4444";
            else if (pt.intent === "medium") dotColor = "#f59e0b";

            return (
              <g
                key={pt.id}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer transition-transform duration-150 hover:scale-150"
              >
                <circle
                  cx={`${xPct}%`}
                  cy={`${yPct}%`}
                  r={pt.intent === "high" ? 7 : 5}
                  fill={dotColor}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                  className="shadow-md"
                />
              </g>
            );
          })}
        </svg>

        {points.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <ScatterChart className="h-8 w-8 text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-400">No session telemetry recorded yet</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">Data points will populate automatically as readers open and interact with slides.</p>
          </div>
        )}

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white shadow-xl pointer-events-none">
            <div className="font-bold text-amber-300">{hoveredPoint.viewerName}</div>
            <div className="text-[11px] text-slate-300 font-mono">
              {hoveredPoint.dwellMin} min • {hoveredPoint.completionPct}% completion
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
        <span>0% Completion</span>
        <span>50%</span>
        <span>100% (Completed Deck)</span>
      </div>
    </div>
  );
}
