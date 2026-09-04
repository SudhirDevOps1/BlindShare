"use client";

import React from "react";
import { Flame, Zap, Snowflake, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface LeadTemperatureMeterProps {
  sessions: any[];
  currentFilter: "all" | "high" | "medium" | "low";
  onFilterChange: (filter: "all" | "high" | "medium" | "low") => void;
}

export function LeadTemperatureMeter({
  sessions,
  currentFilter,
  onFilterChange,
}: LeadTemperatureMeterProps) {
  const { t } = useI18n();
  const total = sessions.length;

  const hotCount = sessions.filter((s) => s.intent === "high").length;
  const warmCount = sessions.filter((s) => s.intent === "medium").length;
  const coldCount = sessions.filter((s) => s.intent === "low" || !s.intent).length;

  const hotPct = total > 0 ? Math.round((hotCount / total) * 100) : 0;
  const warmPct = total > 0 ? Math.round((warmCount / total) * 100) : 0;
  const coldPct = total > 0 ? Math.max(0, 100 - hotPct - warmPct) : 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-500 animate-pulse" />
          <h4 className="text-xs font-bold text-white">{t.charts?.lead?.title || "AI Deal Temperature & Intent Matrix"}</h4>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {sessions.length} {t.charts?.device?.totalSessions || "Evaluated Readers"}
        </span>
      </div>

      {/* Segmented Multi-Color Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-950 p-0.5 border border-slate-800 flex gap-0.5">
          {hotPct > 0 && (
            <div
              style={{ width: `${hotPct}%` }}
              className="h-full rounded-l-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-500"
              title={`Hot Deals: ${hotCount} (${hotPct}%)`}
            />
          )}
          {warmPct > 0 && (
            <div
              style={{ width: `${warmPct}%` }}
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-500"
              title={`Warm Leads: ${warmCount} (${warmPct}%)`}
            />
          )}
          {coldPct > 0 && (
            <div
              style={{ width: `${coldPct}%` }}
              className="h-full rounded-r-full bg-gradient-to-r from-slate-600 to-slate-500 transition-all duration-500"
              title={`Casual / Cold: ${coldCount} (${coldPct}%)`}
            />
          )}
        </div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* 3 Clickable Lead Filter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <button
          onClick={() => onFilterChange(currentFilter === "high" ? "all" : "high")}
          className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            currentFilter === "high"
              ? "border-red-500/60 bg-red-950/40 shadow-lg shadow-red-500/10 ring-1 ring-red-500/40"
              : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <Flame className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-red-300">Hot Deals</div>
              <div className="text-[10px] text-slate-400">Score 85–100</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-extrabold text-white">{hotCount}</div>
            <div className="text-[10px] text-slate-500">{hotPct}%</div>
          </div>
        </button>

        <button
          onClick={() => onFilterChange(currentFilter === "medium" ? "all" : "medium")}
          className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            currentFilter === "medium"
              ? "border-amber-500/60 bg-amber-950/40 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40"
              : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300">Warm Leads</div>
              <div className="text-[10px] text-slate-400">Score 60–84</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-extrabold text-white">{warmCount}</div>
            <div className="text-[10px] text-slate-500">{warmPct}%</div>
          </div>
        </button>

        <button
          onClick={() => onFilterChange(currentFilter === "low" ? "all" : "low")}
          className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            currentFilter === "low"
              ? "border-slate-600 bg-slate-800/80 shadow-lg shadow-slate-700/10 ring-1 ring-slate-600"
              : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
              <Snowflake className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-300">Casual / Cold</div>
              <div className="text-[10px] text-slate-400">Score 0–59</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-extrabold text-white">{coldCount}</div>
            <div className="text-[10px] text-slate-500">{coldPct}%</div>
          </div>
        </button>
      </div>
    </div>
  );
}
