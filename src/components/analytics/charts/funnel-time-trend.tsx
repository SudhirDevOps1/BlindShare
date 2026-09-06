"use client";

import React, { useState, useMemo } from "react";
import { TrendingUp, Filter, Sparkles, Activity } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface FunnelTimeTrendProps {
  sessions?: any[];
  funnelStats?: {
    opened?: number;
    reached25?: number;
    reached50?: number;
    reached75?: number;
    completed?: number;
  };
}

export function FunnelTimeTrend({ sessions = [], funnelStats }: FunnelTimeTrendProps) {
  const { t } = useI18n();
  const [activeStage, setActiveStage] = useState<"all" | "open" | "core" | "complete">("all");

  const trendData = useMemo(() => {
    const pointsCount = 6; // 6 intervals covering the last 30 days
    const now =
      sessions && sessions.length > 0
        ? sessions.reduce((max, s) => {
            const t = s.startedAt ? new Date(s.startedAt).getTime() : s.createdAt ? new Date(s.createdAt).getTime() : 0;
            return Math.max(max, t);
          }, 0) || 1725500000000
        : 1725500000000;
    const intervalMs = (30 * 24 * 60 * 60 * 1000) / pointsCount;

    const buckets = Array.from({ length: pointsCount }, (_, i) => {
      const start = now - (pointsCount - i) * intervalMs;
      const end = start + intervalMs;
      const label = new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return { start, end, label, open: 0, core: 0, complete: 0 };
    });

    if (sessions && sessions.length > 0) {
      sessions.forEach((s) => {
        const time = s.startedAt ? new Date(s.startedAt).getTime() : s.createdAt ? new Date(s.createdAt).getTime() : now;
        const bucket = buckets.find((b) => time >= b.start && time < b.end) || buckets[buckets.length - 1];
        bucket.open += 1;
        if ((s.maxPageReached || 1) >= 4 || (s.totalDwellSeconds || 0) >= 60) {
          bucket.core += 1;
        }
        if ((s.completedPages || 0) >= 8 || (s.totalDwellSeconds || 0) >= 200) {
          bucket.complete += 1;
        }
      });
    } else {
      // Clean zero baseline when no sessions exist
      buckets.forEach((b) => {
        b.open = 0;
        b.core = 0;
        b.complete = 0;
      });
    }

    return buckets;
  }, [sessions]);

  const maxVal = Math.max(...trendData.map((d) => d.open), 10);

  // SVG coordinate calculations (width=600, height=180)
  const svgW = 600;
  const svgH = 160;
  const paddingX = 40;
  const paddingY = 25;
  const graphW = svgW - paddingX * 2;
  const graphH = svgH - paddingY * 2;

  function toCoords(arr: number[]) {
    return arr.map((val, idx) => {
      const x = paddingX + (idx / (arr.length - 1)) * graphW;
      const y = paddingY + graphH - (val / maxVal) * graphH;
      return { x, y, val };
    });
  }

  const openCoords = toCoords(trendData.map((d) => d.open));
  const coreCoords = toCoords(trendData.map((d) => d.core));
  const compCoords = toCoords(trendData.map((d) => d.complete));

  function makePath(coords: { x: number; y: number }[]) {
    return coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x},${pt.y}`, "");
  }

  function makeArea(coords: { x: number; y: number }[]) {
    const p = makePath(coords);
    const lastX = coords[coords.length - 1].x;
    const firstX = coords[0].x;
    const bottomY = paddingY + graphH;
    return `${p} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  }

  const openPath = makePath(openCoords);
  const corePath = makePath(coreCoords);
  const compPath = makePath(compCoords);

  const openArea = makeArea(openCoords);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t.charts?.funnelTimeTrend?.title || "30-Day Conversion Velocity Trend"}
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              30-Day Velocity
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.charts?.funnelTimeTrend?.subtitle || "Tracking document drop-off rates and completion momentum over 30 days"}
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px]">
          <button
            type="button"
            onClick={() => setActiveStage("all")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              activeStage === "all" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            All Stages
          </button>
          <button
            type="button"
            onClick={() => setActiveStage("open")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              activeStage === "open" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "text-slate-400 hover:text-white"
            }`}
          >
            Opened
          </button>
          <button
            type="button"
            onClick={() => setActiveStage("core")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              activeStage === "core" ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" : "text-slate-400 hover:text-white"
            }`}
          >
            50% Core
          </button>
          <button
            type="button"
            onClick={() => setActiveStage("complete")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              activeStage === "complete" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "text-slate-400 hover:text-white"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* SVG Multi-Line Trend Chart */}
      <div className="w-full overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/70 p-2">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-44 select-none">
          <defs>
            <linearGradient id="openAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingY + graphH * ratio;
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={svgW - paddingX}
                y2={y}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area Fill for Open */}
          {(activeStage === "all" || activeStage === "open") && (
            <path d={openArea} fill="url(#openAreaGrad)" />
          )}

          {/* Trend Lines */}
          {(activeStage === "all" || activeStage === "open") && (
            <path d={openPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          )}

          {(activeStage === "all" || activeStage === "core") && (
            <path d={corePath} fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" />
          )}

          {(activeStage === "all" || activeStage === "complete") && (
            <path d={compPath} fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
          )}

          {/* Nodes */}
          {openCoords.map((pt, i) => (
            <g key={i}>
              {(activeStage === "all" || activeStage === "open") && (
                <circle cx={pt.x} cy={pt.y} r="4" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
              )}
              {(activeStage === "all" || activeStage === "core") && (
                <circle cx={coreCoords[i].x} cy={coreCoords[i].y} r="3.5" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
              )}
              {(activeStage === "all" || activeStage === "complete") && (
                <circle cx={compCoords[i].x} cy={compCoords[i].y} r="3.5" fill="#10b981" stroke="#0f172a" strokeWidth="2" />
              )}

              {/* X Axis Labels */}
              <text
                x={pt.x}
                y={svgH - 6}
                textAnchor="middle"
                className="fill-slate-500 font-mono text-[9px]"
              >
                {trendData[i].label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend & Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2">
          <div className="flex items-center justify-center gap-1 text-[10px] text-amber-400 font-semibold mb-0.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Opened Stage</span>
          </div>
          <div className="text-base font-bold text-white font-mono">
            {funnelStats?.opened || trendData[trendData.length - 1].open}
          </div>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-2">
          <div className="flex items-center justify-center gap-1 text-[10px] text-blue-400 font-semibold mb-0.5">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span>Core 50%</span>
          </div>
          <div className="text-base font-bold text-white font-mono">
            {funnelStats?.reached50 || trendData[trendData.length - 1].core}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2">
          <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-400 font-semibold mb-0.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Completed</span>
          </div>
          <div className="text-base font-bold text-white font-mono">
            {funnelStats?.completed || trendData[trendData.length - 1].complete}
          </div>
        </div>
      </div>
    </div>
  );
}
