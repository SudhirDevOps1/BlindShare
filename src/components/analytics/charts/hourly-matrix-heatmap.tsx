"use client";

import React, { useState, useMemo } from "react";
import { Clock, Zap, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface HourlyMatrixHeatmapProps {
  sessions?: any[];
}

export function HourlyMatrixHeatmap({ sessions = [] }: HourlyMatrixHeatmapProps) {
  const { t } = useI18n();
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number; count: number } | null>(null);

  const days = t.charts?.hourlyMatrix?.days || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Compute 7x24 view density matrix
  const { matrix, maxCount, peakCell } = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let peak = { day: 1, hour: 10, count: 0 };

    if (sessions.length > 0) {
      sessions.forEach((s) => {
        const date = s.createdAt ? new Date(s.createdAt) : new Date();
        const d = (date.getUTCDay() + 6) % 7; // Monday=0
        const h = date.getUTCHours();
        grid[d][h] += 1;
        if (grid[d][h] > peak.count) {
          peak = { day: d, hour: h, count: grid[d][h] };
        }
      });
    } else {
      // Clean zero state if brand new link
    }

    let max = 1;
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        if (grid[d][h] > max) max = grid[d][h];
      }
    }

    return { matrix: grid, maxCount: max, peakCell: peak };
  }, [sessions]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t.charts?.hourlyMatrix?.title || "24×7 Reading Heatmap Matrix"}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
              <Zap className="h-3 w-3" />
              <span>{t.charts?.hourlyMatrix?.bestSendTime || "Best Send Time: Tue 10 AM"}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.charts?.hourlyMatrix?.subtitle || "Investor activity by day of week and hour of day"}
          </p>
        </div>

        {/* Heatmap intensity legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span>0</span>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-slate-950 border border-slate-800" />
            <span className="h-3 w-3 rounded bg-amber-950/60 border border-amber-900/40" />
            <span className="h-3 w-3 rounded bg-amber-700/60 border border-amber-600/50" />
            <span className="h-3 w-3 rounded bg-amber-500 border border-amber-400" />
            <span className="h-3 w-3 rounded bg-amber-300 border border-yellow-200" />
          </div>
          <span>Max</span>
        </div>
      </div>

      {/* 24x7 SVG Heatmap Grid */}
      <div className="relative overflow-x-auto no-scrollbar">
        <div className="min-w-[640px]">
          {/* Hour labels header */}
          <div className="grid grid-cols-[48px_repeat(24,1fr)] gap-1 text-[9px] font-mono text-slate-500 mb-1 text-center">
            <div />
            {hours.map((h) => (
              <div key={h} className={h % 3 === 0 ? "text-slate-400 font-bold" : "opacity-50"}>
                {h % 3 === 0 ? `${h}h` : "•"}
              </div>
            ))}
          </div>

          {/* Day Rows */}
          {days.map((dayLabel, dIdx) => (
            <div key={dayLabel} className="grid grid-cols-[48px_repeat(24,1fr)] gap-1 items-center mb-1">
              <span className="text-[10px] font-semibold text-slate-400">{dayLabel}</span>
              {hours.map((h) => {
                const count = matrix[dIdx]?.[h] || 0;
                const ratio = count / maxCount;
                const isPeak = dIdx === peakCell.day && h === peakCell.hour;

                let cellBg = "bg-slate-950/80 border-slate-800/80";
                if (ratio > 0.8) cellBg = "bg-amber-300 text-slate-950 border-yellow-200 shadow-md shadow-amber-400/20";
                else if (ratio > 0.5) cellBg = "bg-amber-500 text-slate-950 border-amber-400";
                else if (ratio > 0.25) cellBg = "bg-amber-700/80 border-amber-600/50";
                else if (ratio > 0.05) cellBg = "bg-amber-950/60 border-amber-900/40";

                return (
                  <button
                    key={h}
                    type="button"
                    onMouseEnter={() => setHoveredCell({ day: dIdx, hour: h, count })}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`h-6 rounded-md border transition-all duration-150 cursor-pointer relative ${cellBg} hover:scale-125 hover:z-20`}
                    title={`${dayLabel} ${h}:00 — ${count} ${t.charts?.hourlyMatrix?.viewsText || "views"}`}
                  >
                    {isPeak && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Tooltip Bar */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80 text-slate-400">
        {hoveredCell ? (
          <div className="flex items-center gap-2 text-white">
            <span className="font-bold text-amber-400">
              {days[hoveredCell.day]} at {String(hoveredCell.hour).padStart(2, "0")}:00 UTC:
            </span>
            <span className="font-mono font-bold text-white">{hoveredCell.count}</span>
            <span>{t.charts?.hourlyMatrix?.viewsText || "views"}</span>
          </div>
        ) : (
          <span>Hover over any hour cell to inspect visitor frequency</span>
        )}
        <span className="text-[10px] text-slate-500 font-mono">
          Peak Hour: {days[peakCell.day]} {peakCell.hour}:00 ({peakCell.count} views)
        </span>
      </div>
    </div>
  );
}
