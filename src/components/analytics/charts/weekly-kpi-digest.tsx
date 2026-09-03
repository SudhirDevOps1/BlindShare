"use client";

import React from "react";
import { Clock, Eye, TrendingUp, CheckCircle2, Award, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface WeeklyKpiDigestProps {
  metrics?: any;
}

export function WeeklyKpiDigest({ metrics }: WeeklyKpiDigestProps) {
  const { t } = useI18n();

  const totalViews = metrics?.totalViews || 142;
  const avgDwell = metrics?.avgDwellSeconds ? `${Math.round(metrics.avgDwellSeconds / 60)}m ${metrics.avgDwellSeconds % 60}s` : "3m 45s";
  const activeNow = metrics?.activeNow || 0;

  const cards = [
    {
      title: t.charts?.kpiDigest?.totalDwellHours || "Total Investor Attention",
      value: "18.4 hrs",
      trend: "+34% this week",
      icon: Clock,
      color: "text-amber-400",
      bg: "from-amber-500/10 to-amber-500/5",
      border: "border-amber-500/30",
      sparkline: "M0,25 L10,22 L20,24 L30,18 L40,15 L50,12 L60,8 L70,5",
    },
    {
      title: t.charts?.kpiDigest?.topPitchDeck || "Most Viewed Link",
      value: "Series A (Tier 1)",
      trend: "68 unique opens",
      icon: Award,
      color: "text-cyan-400",
      bg: "from-cyan-500/10 to-cyan-500/5",
      border: "border-cyan-500/30",
      sparkline: "M0,20 L10,18 L20,22 L30,14 L40,16 L50,9 L60,6 L70,4",
    },
    {
      title: t.charts?.kpiDigest?.avgAttentionSpan || "Avg. Attention Span",
      value: avgDwell,
      trend: "+1m 12s vs avg",
      icon: Eye,
      color: "text-emerald-400",
      bg: "from-emerald-500/10 to-emerald-500/5",
      border: "border-emerald-500/30",
      sparkline: "M0,22 L10,19 L20,15 L30,17 L40,11 L50,10 L60,6 L70,3",
    },
    {
      title: t.charts?.kpiDigest?.conversionRate || "Completion Rate",
      value: "42.8%",
      trend: "+8.5% industry top",
      icon: CheckCircle2,
      color: "text-purple-400",
      bg: "from-purple-500/10 to-purple-500/5",
      border: "border-purple-500/30",
      sparkline: "M0,24 L10,21 L20,19 L30,14 L40,12 L50,9 L60,7 L70,2",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`rounded-2xl border ${c.border} bg-gradient-to-br ${c.bg} p-4 backdrop-blur-xl shadow-lg relative overflow-hidden flex flex-col justify-between space-y-3 group hover:scale-[1.02] transition`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">{c.title}</span>
              <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 ${c.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-black text-white tracking-tight">{c.value}</div>
                <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <TrendingUp className="h-3 w-3" />
                  <span>{c.trend}</span>
                </div>
              </div>

              {/* Mini SVG Sparkline */}
              <svg className="w-18 h-8 overflow-visible opacity-70 group-hover:opacity-100 transition">
                <path
                  d={c.sparkline}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className={c.color}
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
