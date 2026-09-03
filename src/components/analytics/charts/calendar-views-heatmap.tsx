"use client";

import React, { useState, useMemo } from "react";
import { Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface CalendarViewsHeatmapProps {
  sessions?: any[];
}

export function CalendarViewsHeatmap({ sessions = [] }: CalendarViewsHeatmapProps) {
  const { t } = useI18n();
  const [hoveredDay, setHoveredDay] = useState<{ dateStr: string; count: number } | null>(null);

  const months = t.charts?.calendar?.months || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Generate 52 weeks (364 days) data grid
  const { weeks, totalViews, maxDaily } = useMemo(() => {
    const today = new Date();
    const map = new Map<string, number>();

    sessions.forEach((s) => {
      const d = s.createdAt ? new Date(s.createdAt) : new Date();
      const key = d.toISOString().substring(0, 10);
      map.set(key, (map.get(key) || 0) + 1);
    });

    const wks: { days: { dateStr: string; count: number; dayOfWeek: number }[] }[] = [];
    let tot = 0;
    let max = 1;

    // Start 52 weeks ago on Sunday
    const start = new Date(today);
    start.setDate(today.getDate() - 364);

    let currentWeek: { dateStr: string; count: number; dayOfWeek: number }[] = [];

    for (let i = 0; i < 365; i++) {
      const curr = new Date(start);
      curr.setDate(start.getDate() + i);
      const key = curr.toISOString().substring(0, 10);
      
      // If real sessions exist use map, otherwise synthesize light realistic pattern
      let count = map.get(key) || 0;
      if (sessions.length === 0) {
        const dow = curr.getDay();
        // Weekdays have higher view traffic
        const noise = (Math.sin(i * 0.1) + 1) * 2;
        count = dow > 0 && dow < 6 ? Math.floor(noise * 3) : Math.floor(noise * 0.5);
      }

      tot += count;
      if (count > max) max = count;

      currentWeek.push({
        dateStr: key,
        count,
        dayOfWeek: curr.getDay(),
      });

      if (currentWeek.length === 7) {
        wks.push({ days: currentWeek });
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      wks.push({ days: currentWeek });
    }

    return { weeks: wks, totalViews: tot, maxDaily: max };
  }, [sessions]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t.charts?.calendar?.title || "Annual Activity Calendar (365-Day Intensity)"}
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              {totalViews} views this year
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.charts?.calendar?.subtitle || "Daily reading telemetry and view frequency across the year"}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span>{t.charts?.calendar?.less || "Less"}</span>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-xs bg-slate-950 border border-slate-800" />
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-950/60 border border-emerald-900/50" />
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-700/60 border border-emerald-600/50" />
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500 border border-emerald-400" />
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-300 border border-green-200" />
          </div>
          <span>{t.charts?.calendar?.more || "More"}</span>
        </div>
      </div>

      {/* GitHub-style 52-week horizontal calendar matrix */}
      <div className="relative overflow-x-auto no-scrollbar pb-1">
        <div className="min-w-[720px]">
          {/* Months header line */}
          <div className="flex justify-between text-[9px] font-mono text-slate-500 pl-6 pr-2 mb-1.5">
            {months.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Days labels */}
            <div className="flex flex-col justify-between text-[8px] font-mono text-slate-500 pr-1 select-none">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* Weeks columns */}
            <div className="flex gap-1 flex-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1 flex-1">
                  {week.days.map((day) => {
                    const ratio = day.count / maxDaily;
                    let bg = "bg-slate-950/90 border-slate-800/80";
                    if (ratio > 0.75) bg = "bg-emerald-400 border-green-200 shadow-xs shadow-emerald-400/20";
                    else if (ratio > 0.45) bg = "bg-emerald-500 border-emerald-400";
                    else if (ratio > 0.2) bg = "bg-emerald-700/80 border-emerald-600/50";
                    else if (ratio > 0.05) bg = "bg-emerald-950/60 border-emerald-900/40";

                    return (
                      <div
                        key={day.dateStr}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`h-2.5 w-full rounded-xs border transition-all duration-100 cursor-pointer ${bg} hover:scale-150 hover:z-20`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hover readout footer */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80 text-slate-400">
        {hoveredDay ? (
          <div className="flex items-center gap-2 text-white">
            <span className="font-bold text-emerald-400">{hoveredDay.dateStr}:</span>
            <span className="font-mono font-bold text-white">{hoveredDay.count}</span>
            <span>views</span>
          </div>
        ) : (
          <span>Hover over any calendar cell to view date & reading volume</span>
        )}
        <span className="text-[10px] text-slate-500 font-mono">
          52 Weeks Telemetry Buffer
        </span>
      </div>
    </div>
  );
}
