"use client";

import React, { useMemo } from "react";
import { Filter, ArrowRight, CheckCircle2, ChevronRight, UserCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface RetentionFunnelSankeyProps {
  sessions?: any[];
  totalPages?: number;
}

export function RetentionFunnelSankey({ sessions = [], totalPages = 10 }: RetentionFunnelSankeyProps) {
  const { t } = useI18n();

  const stages = useMemo(() => {
    const total = Math.max(sessions.length, 1);
    const midPage = Math.max(1, Math.ceil(totalPages / 2));
    const askPage = Math.max(1, Math.ceil(totalPages * 0.8));

    const s1 = sessions.length;
    const s2 = s1 > 0 ? sessions.filter((s) => s.maxPageReached >= 1).length : 0;
    const s3 = s1 > 0 ? sessions.filter((s) => s.maxPageReached >= midPage).length : 0;
    const s4 = s1 > 0 ? sessions.filter((s) => s.maxPageReached >= askPage).length : 0;
    const s5 = s1 > 0 ? sessions.filter((s) => s.maxPageReached >= totalPages).length : 0;

    const stepDefs = [
      {
        id: "opened",
        label: t.charts?.funnel?.opened || "Link Opened",
        count: s1,
        pct: s1 > 0 ? 100 : 0,
        color: "from-blue-500 to-cyan-400",
        borderColor: "border-blue-500/40",
      },
      {
        id: "firstPage",
        label: t.charts?.funnel?.firstPage || "First Page Read",
        count: s2,
        pct: s1 > 0 ? Math.round((s2 / s1) * 100) : 0,
        color: "from-cyan-400 to-emerald-400",
        borderColor: "border-cyan-500/40",
      },
      {
        id: "midpoint",
        label: `${t.charts?.funnel?.midpoint || "Midpoint Reached"} (p.${midPage})`,
        count: s3,
        pct: s1 > 0 ? Math.round((s3 / s1) * 100) : 0,
        color: "from-emerald-400 to-amber-400",
        borderColor: "border-emerald-500/40",
      },
      {
        id: "financials",
        label: `${t.charts?.funnel?.financials || "Financials / Ask"} (p.${askPage})`,
        count: s4,
        pct: s1 > 0 ? Math.round((s4 / s1) * 100) : 0,
        color: "from-amber-400 to-orange-400",
        borderColor: "border-amber-500/40",
      },
      {
        id: "completed",
        label: `${t.charts?.funnel?.completed || "Fully Completed"} (p.${totalPages})`,
        count: s5,
        pct: s1 > 0 ? Math.round((s5 / s1) * 100) : 0,
        color: "from-orange-400 to-amber-500",
        borderColor: "border-orange-500/40",
      },
    ];

    return stepDefs;
  }, [sessions, totalPages, t]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-5 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t.charts?.funnel?.title || "Reader Journey & Retention Funnel"}
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
              5 Stage Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.charts?.funnel?.subtitle || "Drop-off conversion pipeline from link click to final slide"}
          </p>
        </div>
      </div>

      {/* Funnel Flow Horizontal Stepper with Connectors */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 relative">
        {stages.map((stage, idx) => {
          const prevPct = idx > 0 ? stages[idx - 1].pct : 100;
          const stepDrop = prevPct - stage.pct;

          return (
            <div key={stage.id} className="flex flex-col relative group">
              {/* Card */}
              <div
                className={`rounded-xl border ${stage.borderColor} bg-slate-950/80 p-3.5 space-y-2 flex-1 relative overflow-hidden transition-all duration-200 group-hover:bg-slate-900`}
              >
                {/* Stage header */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Stage #{idx + 1}
                  </span>
                  {idx > 0 && stepDrop > 0 && (
                    <span className="text-[9px] font-mono text-red-400 font-semibold bg-red-950/40 px-1.5 py-0.2 rounded border border-red-500/20">
                      -{stepDrop}% {t.charts?.funnel?.dropoff || "drop"}
                    </span>
                  )}
                </div>

                {/* Percentage & count */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white tracking-tight">
                    {stage.pct}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({stage.count})
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-200 truncate" title={stage.label}>
                  {stage.label}
                </div>

                {/* Visual conversion height bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${stage.color} transition-all duration-500`}
                    style={{ width: `${Math.max(stage.pct, 4)}%` }}
                  />
                </div>
              </div>

              {/* Connecting right arrow on desktop */}
              {idx < stages.length - 1 && (
                <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600 group-hover:text-amber-400 transition-colors pointer-events-none">
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-2 flex items-center justify-between">
        <span>Continuous WebCrypto beacon heartbeats confirm reader perseverance</span>
        <span className="font-mono text-emerald-400 font-semibold">
          {stages[stages.length - 1].pct}% Complete Final Pitch Deck
        </span>
      </div>
    </div>
  );
}
