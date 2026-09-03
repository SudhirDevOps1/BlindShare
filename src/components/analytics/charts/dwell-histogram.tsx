"use client";

import React, { useMemo } from "react";
import { BarChart2, Timer, Zap, UserCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface DwellHistogramProps {
  sessions?: any[];
}

export function DwellHistogram({ sessions = [] }: DwellHistogramProps) {
  const { t } = useI18n();

  const buckets = useMemo(() => {
    const counts = {
      bounce: 0,
      skim: 0,
      engaged: 0,
      deep: 0,
      diligence: 0,
    };

    if (sessions.length > 0) {
      sessions.forEach((s) => {
        const sec = s.totalDwellSeconds || s.durationSeconds || 0;
        if (sec < 15) counts.bounce++;
        else if (sec < 45) counts.skim++;
        else if (sec < 120) counts.engaged++;
        else if (sec < 300) counts.deep++;
        else counts.diligence++;
      });
    } else {
      // Clean zero counts for new links
      counts.bounce = 0;
      counts.skim = 0;
      counts.engaged = 0;
      counts.deep = 0;
      counts.diligence = 0;
    }

    const total = Math.max(Object.values(counts).reduce((a, b) => a + b, 0), 1);
    const maxVal = Math.max(...Object.values(counts), 1);

    return [
      {
        id: "bounce",
        label: t.charts?.histogram?.bounce || "< 15s (Bounce)",
        count: counts.bounce,
        pct: Math.round((counts.bounce / total) * 100),
        barHeightPct: Math.round((counts.bounce / maxVal) * 100),
        color: "bg-slate-700",
        hoverColor: "hover:bg-slate-600",
        tag: "Quick Bounce",
      },
      {
        id: "skim",
        label: t.charts?.histogram?.skim || "15s-45s (Skim)",
        count: counts.skim,
        pct: Math.round((counts.skim / total) * 100),
        barHeightPct: Math.round((counts.skim / maxVal) * 100),
        color: "bg-amber-700",
        hoverColor: "hover:bg-amber-600",
        tag: "Overview",
      },
      {
        id: "engaged",
        label: t.charts?.histogram?.engaged || "45s-2m (Engaged)",
        count: counts.engaged,
        pct: Math.round((counts.engaged / total) * 100),
        barHeightPct: Math.round((counts.engaged / maxVal) * 100),
        color: "bg-amber-500",
        hoverColor: "hover:bg-amber-400",
        tag: "Core Interest",
      },
      {
        id: "deep",
        label: t.charts?.histogram?.deep || "2m-5m (Deep Read)",
        count: counts.deep,
        pct: Math.round((counts.deep / total) * 100),
        barHeightPct: Math.round((counts.deep / maxVal) * 100),
        color: "bg-emerald-500",
        hoverColor: "hover:bg-emerald-400",
        tag: "Deep Study",
      },
      {
        id: "diligence",
        label: t.charts?.histogram?.diligence || "> 5m (Diligence)",
        count: counts.diligence,
        pct: Math.round((counts.diligence / total) * 100),
        barHeightPct: Math.round((counts.diligence / maxVal) * 100),
        color: "bg-indigo-500",
        hoverColor: "hover:bg-indigo-400",
        tag: "Partner Review",
      },
    ];
  }, [sessions, t]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t.charts?.histogram?.title || "Dwell Time Distribution (Buckets)"}
            </h3>
            <span className="text-[10px] font-mono text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              5 Time Bands
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.charts?.histogram?.subtitle || "Categorization of reader sessions by time spent in deck"}
          </p>
        </div>
      </div>

      {/* Histogram Frequency Bars */}
      <div className="grid grid-cols-5 gap-3 h-44 items-end pt-4 pb-2 px-2 bg-slate-950/60 rounded-xl border border-slate-800">
        {buckets.map((b) => (
          <div key={b.id} className="flex flex-col items-center h-full justify-end group relative">
            {/* Tooltip on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 z-20 rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-[10px] text-white whitespace-nowrap pointer-events-none shadow-lg">
              <span className="font-bold">{b.count}</span> {t.charts?.histogram?.sessionsCount || "sessions"} ({b.pct}%)
            </div>

            <span className="text-xs font-mono font-bold text-white mb-1.5 opacity-80 group-hover:opacity-100">
              {b.count}
            </span>

            {/* Vertical Bar */}
            <div className="w-full max-w-[48px] h-full flex items-end">
              <div
                style={{ height: `${Math.max(b.barHeightPct, 6)}%` }}
                className={`w-full rounded-t-lg transition-all duration-300 ${b.color} ${b.hoverColor} group-hover:scale-105 shadow-md`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bucket Labels below */}
      <div className="grid grid-cols-5 gap-3 text-center">
        {buckets.map((b) => (
          <div key={b.id} className="space-y-0.5">
            <div className="text-[10px] font-bold text-slate-200 truncate" title={b.label}>
              {b.label}
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              {b.pct}% total
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
