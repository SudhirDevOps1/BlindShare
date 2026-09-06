"use client";

import React, { useState, useMemo } from "react";
import { Zap, Flame, Snowflake, AlertCircle, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface ScatterDwellIntentProps {
  sessions?: any[];
  totalPages?: number;
}

export function ScatterDwellIntent({ sessions = [], totalPages = 10 }: ScatterDwellIntentProps) {
  const { t } = useI18n();
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  const points = useMemo(() => {
    if (sessions && sessions.length > 0) {
      return sessions.map((s, idx) => {
        const dwellSeconds = s.totalDwellSeconds || s.durationSeconds || 0;
        const dwellMin = Math.round((dwellSeconds / 60) * 10) / 10;
        const reached = Math.min(s.maxPageReached || 1, totalPages);
        const completionPct = Math.round((reached / totalPages) * 100);

        // AI Lead Score Algorithm (0-100)
        // 40% completion rate + 40% dwell maturity + 20% engagement actions
        const dwellScore = Math.min(100, Math.round((dwellSeconds / 300) * 100));
        const actionScore = (s.questionsAsked || 0) * 25 + (s.ndaAgreedAt ? 30 : 0);
        const intentScore = Math.min(
          100,
          Math.max(10, Math.round(completionPct * 0.45 + dwellScore * 0.35 + actionScore * 0.2))
        );

        let category: "hot" | "rapid" | "confused" | "cold" = "cold";
        if (intentScore >= 75 && dwellMin >= 2.0) category = "hot";
        else if (intentScore >= 65 && dwellMin < 2.0) category = "rapid";
        else if (dwellMin >= 3.0 && intentScore < 60) category = "confused";

        return {
          id: s.id || `ses-${idx}`,
          viewer: s.viewerEmail || `Reader #${idx + 1}`,
          dwellMin,
          intentScore,
          completionPct,
          category,
          maxPage: reached,
        };
      });
    }

    return [];
  }, [sessions, totalPages]);

  const maxDwell = Math.max(...points.map((p) => p.dwellMin), 8);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "hot":
        return { fill: "#ef4444", stroke: "#f87171", label: "🔥 Hot Lead" };
      case "rapid":
        return { fill: "#f59e0b", stroke: "#fbbf24", label: "⚡ Rapid Decider" };
      case "confused":
        return { fill: "#3b82f6", stroke: "#60a5fa", label: "⚠️ High Dwell / Drop-off" };
      default:
        return { fill: "#64748b", stroke: "#94a3b8", label: "❄️ Quick Bounce" };
    }
  };

  const svgW = 600;
  const svgH = 220;
  const padL = 45;
  const padR = 25;
  const padT = 20;
  const padB = 30;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t.charts?.scatterDwellIntent?.title || "Dwell Time vs. AI Lead Intent Scatter"}
            </h3>
            <span className="text-[10px] font-mono text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
              {points.length} Readers Mapped
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.charts?.scatterDwellIntent?.subtitle || "Separating high-intent conviction readers from stuck drop-offs"}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-medium flex-wrap">
          <span className="flex items-center gap-1 text-red-400">
            <span className="h-2 w-2 rounded-full bg-red-500" /> Hot Deal
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Fast Decider
          </span>
          <span className="flex items-center gap-1 text-blue-400">
            <span className="h-2 w-2 rounded-full bg-blue-500" /> Confused / Stuck
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/70 p-2">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-52 select-none">
          {/* Quadrant backgrounds */}
          {/* Top Right: Hot Deal Zone */}
          <rect
            x={padL + plotW / 2}
            y={padT}
            width={plotW / 2}
            height={plotH / 2}
            fill="#ef4444"
            fillOpacity="0.04"
          />
          {/* Bottom Right: Confused Zone */}
          <rect
            x={padL + plotW / 2}
            y={padT + plotH / 2}
            width={plotW / 2}
            height={plotH / 2}
            fill="#3b82f6"
            fillOpacity="0.04"
          />

          {/* Quadrant dividing guidelines */}
          <line
            x1={padL}
            y1={padT + plotH / 2}
            x2={padL + plotW}
            y2={padT + plotH / 2}
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1={padL + plotW / 2}
            y1={padT}
            x2={padL + plotW / 2}
            y2={padT + plotH}
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Axes */}
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#475569" strokeWidth="1.5" />
          <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#475569" strokeWidth="1.5" />

          {/* Y Axis Tick Labels */}
          {[0, 25, 50, 75, 100].map((score) => {
            const y = padT + plotH - (score / 100) * plotH;
            return (
              <text key={score} x={padL - 6} y={y + 3} textAnchor="end" className="fill-slate-500 font-mono text-[9px]">
                {score}
              </text>
            );
          })}

          {/* X Axis Tick Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const val = Number((ratio * maxDwell).toFixed(1));
            const x = padL + ratio * plotW;
            return (
              <text key={ratio} x={x} y={padT + plotH + 15} textAnchor="middle" className="fill-slate-500 font-mono text-[9px]">
                {val}m
              </text>
            );
          })}

          {/* Quadrant Labels */}
          <text x={padL + plotW - 6} y={padT + 14} textAnchor="end" className="fill-red-400/40 font-mono text-[9px] font-bold">
            🔥 HOT DEAL ZONE
          </text>
          <text x={padL + plotW - 6} y={padT + plotH - 8} textAnchor="end" className="fill-blue-400/40 font-mono text-[9px] font-bold">
            ⚠️ CONFUSED / STUCK
          </text>

          {/* Scatter Data Points */}
          {points.map((pt) => {
            const x = padL + (pt.dwellMin / maxDwell) * plotW;
            const y = padT + plotH - (pt.intentScore / 100) * plotH;
            const style = getCategoryColor(pt.category);
            const isHovered = hoveredPoint?.id === pt.id;

            return (
              <g
                key={pt.id}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 7 : 5}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={isHovered ? 3 : 1.5}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>

        {points.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <Zap className="h-8 w-8 text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-400">No reader intent data recorded yet</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">Data points will populate automatically as readers open and interact with slides.</p>
          </div>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-3 right-3 rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs shadow-2xl backdrop-blur-md space-y-1 min-w-[200px] pointer-events-none">
            <div className="font-bold text-white truncate">{hoveredPoint.viewer}</div>
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>Intent Score:</span>
              <span className="font-bold font-mono text-amber-400">{hoveredPoint.intentScore}/100</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>Dwell Time:</span>
              <span className="font-mono text-slate-300">{hoveredPoint.dwellMin} mins</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>Completion:</span>
              <span className="font-mono text-slate-300">{hoveredPoint.completionPct}% (p.{hoveredPoint.maxPage})</span>
            </div>
            <div className="pt-1 border-t border-slate-800 text-[10px] text-amber-400 font-semibold">
              {getCategoryColor(hoveredPoint.category).label}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
        <span>X: Dwell Time (minutes) • Y: AI Lead Score (0–100)</span>
        <span className="font-mono text-slate-400">DuckDB Stream Ingest</span>
      </div>
    </div>
  );
}
