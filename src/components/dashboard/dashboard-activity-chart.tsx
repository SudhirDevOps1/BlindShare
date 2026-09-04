"use client";

import React, { useMemo } from "react";
import { BarChart3, HardDrive, Database, TrendingUp, Sparkles, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface DashboardActivityChartProps {
  docs: any[];
  links: any[];
  totalStorageBytes: number;
  dailyViews?: { label: string; views: number; dateStr: string }[];
  dbSizeBytes?: number | null;
}

export function DashboardActivityChart({
  // i18n hook

  docs,
  links,
  totalStorageBytes,
  dailyViews,
  dbSizeBytes,
}: DashboardActivityChartProps) {
  const { t } = useI18n();
  // Generate 7-day activity data based on real session events, or link estimates fallback
  const weeklyData = useMemo(() => {
    if (dailyViews && dailyViews.length === 7) {
      return dailyViews;
    }
    const days: { label: string; views: number; dateStr: string }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = d.toISOString().split("T")[0];

      const totalLinkViews = links.reduce((sum, l) => sum + (l.viewCount || 0), 0);
      const views = totalLinkViews === 0 ? 0 : Math.round(totalLinkViews / 7);

      days.push({ label: dayName, views, dateStr });
    }
    return days;
  }, [links, dailyViews]);

  const maxWeeklyViews = useMemo(() => {
    return Math.max(...weeklyData.map((d) => d.views), 5);
  }, [weeklyData]);

  // Infrastructure storage calculations:
  // Neon PostgreSQL 512 MB Free Tier
  // Backblaze B2 10 GB (10,240 MB) Free Tier
  const usedStorageMb = totalStorageBytes / (1024 * 1024);
  const b2LimitMb = 10240; // 10 GB
  const b2Pct = Math.min(100, Math.max(1, Math.round((usedStorageMb / b2LimitMb) * 100)));

  // Database metadata: use real dbSizeBytes if queried, else labeled estimate
  const estimatedDbMb = dbSizeBytes
    ? dbSizeBytes / (1024 * 1024)
    : Math.max(2.4, (docs.length * 0.15) + (links.length * 0.08));
  const isEstimated = !dbSizeBytes;
  const neonLimitMb = 512;
  const neonPct = Math.min(100, Math.max(1, Math.round((estimatedDbMb / neonLimitMb) * 100)));

  // Circular gauge geometry
  const radius = 38;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius; // ~238.76

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 2-Columns: 7-Day Document Views & Activity Velocity */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                7-Day Reading Velocity & Activity Momentum
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily document views across all active share links
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Sync</span>
          </span>
        </div>

        {/* SVG Bar Chart */}
        <div className="relative w-full h-44 select-none pt-2">
          <svg viewBox="0 0 600 150" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="dashBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Background horizontal guide lines */}
            {[0, 0.33, 0.66, 1].map((ratio, i) => {
              const y = 120 - ratio * 100;
              return (
                <line
                  key={i}
                  x1="30"
                  y1={y}
                  x2="580"
                  y2={y}
                  stroke="rgba(51, 65, 85, 0.3)"
                  strokeDasharray="2,3"
                  strokeWidth="1"
                />
              );
            })}

            {/* Bars */}
            {weeklyData.map((d, i) => {
              const barWidth = 38;
              const x = 55 + i * 78;
              const barHeight = Math.max(6, (d.views / maxWeeklyViews) * 100);
              const y = 120 - barHeight;

              return (
                <g key={i} className="group cursor-pointer">
                  {/* Glowing hover backdrop */}
                  <rect
                    x={x - 4}
                    y={10}
                    width={barWidth + 8}
                    height={115}
                    rx="8"
                    fill="transparent"
                    className="group-hover:fill-slate-800/40 transition-colors"
                  />

                  {/* Visual Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="6"
                    fill="url(#dashBarGradient)"
                    className="transition-all duration-300 group-hover:brightness-125"
                  />

                  {/* Value on top of bar */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fill="#fef08a"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {d.views}
                  </text>

                  {/* Day Label */}
                  <text
                    x={x + barWidth / 2}
                    y="138"
                    textAnchor="middle"
                    fill="rgba(148, 163, 184, 0.8)"
                    fontSize="11"
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                    fontWeight="600"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 1-Column: ₹0 Free-Tier Infrastructure Capacity Gauges */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              ₹0 Free-Tier Infrastructure
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time limits for Neon PostgreSQL & Backblaze B2
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 py-1">
          {/* Gauge 1: Neon PG Database */}
          <div className="flex flex-col items-center text-center p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-2">
            <div className="relative h-20 w-20 flex items-center justify-center">
              <svg viewBox="0 0 90 90" className="h-full w-full -rotate-90">
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  fill="transparent"
                  stroke="#1e293b"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  fill="transparent"
                  stroke="#38bdf8"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${(neonPct / 100) * circumference} ${circumference}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Database className="h-3.5 w-3.5 text-sky-400" />
                <span className="text-[10px] font-bold text-white font-mono">{neonPct}%</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-200 flex items-center justify-center gap-1">
                <span>Neon Postgres</span>
                {isEstimated && (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400" title="Estimated based on table overhead">
                    est.
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {isEstimated ? "~" : ""}{estimatedDbMb.toFixed(1)} / 512 MB
              </div>
            </div>
          </div>

          {/* Gauge 2: Backblaze B2 Object Storage */}
          <div className="flex flex-col items-center text-center p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-2">
            <div className="relative h-20 w-20 flex items-center justify-center">
              <svg viewBox="0 0 90 90" className="h-full w-full -rotate-90">
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  fill="transparent"
                  stroke="#1e293b"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  fill="transparent"
                  stroke="#a855f7"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${(b2Pct / 100) * circumference} ${circumference}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <HardDrive className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-[10px] font-bold text-white font-mono">{b2Pct}%</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-200">Backblaze B2</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {usedStorageMb.toFixed(1)} MB / 10 GB
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Zero Overage Safe</span>
          </div>
          <span className="font-mono text-emerald-400 font-bold">$0.00 / mo</span>
        </div>
      </div>
    </div>
  );
}
