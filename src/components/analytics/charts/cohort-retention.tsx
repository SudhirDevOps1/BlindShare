"use client";

import React, { useMemo } from "react";
import { Users, Sparkles, TrendingUp, Calendar } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface CohortRetentionProps {
  sessions?: any[];
}

export function CohortRetention({ sessions = [] }: CohortRetentionProps) {
  const { t } = useI18n();

  const cohorts = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return [
        { label: "Week -4", size: 0, rates: [100, 78, 64, 52, 45] },
        { label: "Week -3", size: 0, rates: [100, 82, 70, 58, 49] },
        { label: "Week -2", size: 0, rates: [100, 85, 74, 62, 55] },
        { label: "Week -1", size: 0, rates: [100, 89, 79, 68, 60] },
        { label: "Current Week", size: 0, rates: [100, 92, 83, 75, 68] },
      ];
    }

    const now = sessions.reduce((max, s) => {
      const t = s.startedAt ? new Date(s.startedAt).getTime() : s.createdAt ? new Date(s.createdAt).getTime() : 0;
      return Math.max(max, t);
    }, 0) || 1725500000000;
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const groups: { [key: number]: any[] } = { 0: [], 1: [], 2: [], 3: [], 4: [] };

    sessions.forEach((s) => {
      const d = s.startedAt ? new Date(s.startedAt).getTime() : s.createdAt ? new Date(s.createdAt).getTime() : now;
      const diffWeeks = Math.floor((now - d) / oneWeekMs);
      const bucket = Math.min(Math.max(diffWeeks, 0), 4);
      groups[bucket].push(s);
    });

    const labels = ["Current Week", "Week -1", "Week -2", "Week -3", "Week -4"];

    return [4, 3, 2, 1, 0].map((weekIndex) => {
      const cohortSessions = groups[weekIndex] || [];
      const size = cohortSessions.length;
      if (size === 0) {
        return {
          label: labels[weekIndex],
          size: 0,
          rates: [100, 0, 0, 0, 0],
        };
      }

      // Milestones: W0 = Started (100%), W1 = 25% completed, W2 = 50% completed, W3 = 75% completed, W4 = 100% completed
      const m1 = cohortSessions.filter((s) => (s.maxPageReached || 1) >= 2 || (s.totalDwellSeconds || 0) >= 30).length;
      const m2 = cohortSessions.filter((s) => (s.maxPageReached || 1) >= 4 || (s.totalDwellSeconds || 0) >= 60).length;
      const m3 = cohortSessions.filter((s) => (s.maxPageReached || 1) >= 6 || (s.totalDwellSeconds || 0) >= 120).length;
      const m4 = cohortSessions.filter((s) => (s.completedPages || 0) >= 8 || (s.totalDwellSeconds || 0) >= 240).length;

      return {
        label: labels[weekIndex],
        size,
        rates: [
          100,
          Math.round((m1 / size) * 100),
          Math.round((m2 / size) * 100),
          Math.round((m3 / size) * 100),
          Math.round((m4 / size) * 100),
        ],
      };
    });
  }, [sessions]);

  const hasData = sessions && sessions.length > 0;

  function getIntensity(pct: number) {
    if (pct >= 80) return "bg-amber-500 text-slate-950 font-black";
    if (pct >= 60) return "bg-amber-500/70 text-slate-950 font-bold";
    if (pct >= 40) return "bg-amber-500/40 text-amber-200 font-semibold";
    if (pct >= 20) return "bg-amber-500/20 text-amber-300";
    if (pct > 0) return "bg-amber-500/10 text-amber-400";
    return "bg-slate-900/50 text-slate-600";
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t.charts?.cohortRetention?.title || "Weekly Reader Cohort Retention"}
            </h3>
            <span className="text-[10px] font-mono text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
              {hasData ? `${sessions.length} sessions` : "Cohort Model"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.charts?.cohortRetention?.subtitle || "Tracking document attention and slide completion across weekly reader cohorts"}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Calendar className="h-3.5 w-3.5 text-amber-500/70" />
          <span>5-Week Window</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[480px]">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-2 px-3">Cohort</th>
              <th className="py-2 px-3 text-center">Readers</th>
              <th className="py-2 px-3 text-center">Start</th>
              <th className="py-2 px-3 text-center">25% Read</th>
              <th className="py-2 px-3 text-center">50% Core</th>
              <th className="py-2 px-3 text-center">75% Ask</th>
              <th className="py-2 px-3 text-center">Complete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
            {cohorts.map((cohort, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 px-3 font-medium text-slate-200 text-[11px] whitespace-nowrap">
                  {cohort.label}
                </td>
                <td className="py-2.5 px-3 text-center text-slate-400 text-[11px]">
                  {cohort.size > 0 ? cohort.size : "-"}
                </td>
                {cohort.rates.map((rate, rIdx) => (
                  <td key={rIdx} className="py-1.5 px-2 text-center">
                    <div
                      className={`mx-auto rounded-lg py-1 px-2 text-[11px] transition-all ${getIntensity(
                        rate
                      )}`}
                    >
                      {rate}%
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <span>Drop-off Gradient:</span>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-amber-500/10" />
            <span>&lt;20%</span>
            <span className="h-2 w-2 rounded bg-amber-500/40 ml-1" />
            <span>40%</span>
            <span className="h-2 w-2 rounded bg-amber-500/70 ml-1" />
            <span>60%</span>
            <span className="h-2 w-2 rounded bg-amber-500 ml-1" />
            <span>80%+</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-amber-400/80">
          <Sparkles className="h-3 w-3" />
          <span>Automated Cohort Grouping</span>
        </div>
      </div>
    </div>
  );
}
