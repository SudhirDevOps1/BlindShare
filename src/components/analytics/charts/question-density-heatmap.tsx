"use client";

import React, { useMemo } from "react";
import { MessageSquare, Flame, HelpCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface QuestionDensityHeatmapProps {
  questions?: any[];
  totalPages?: number;
}

export function QuestionDensityHeatmap({ questions = [], totalPages = 10 }: QuestionDensityHeatmapProps) {
  const { t } = useI18n();

  const { pagePins, maxPins, hottestPage } = useMemo(() => {
    const counts = Array(totalPages).fill(0);
    let peak = { page: 1, count: 0 };

    if (questions.length > 0) {
      questions.forEach((q) => {
        const p = Math.min(Math.max((q.pageNumber || 1) - 1, 0), totalPages - 1);
        counts[p]++;
        if (counts[p] > peak.count) {
          peak = { page: p + 1, count: counts[p] };
        }
      });
    } else {
      // Mock pitch deck questions distribution if none yet
      const sample = [1, 0, 2, 1, 3, 2, 6, 2, 1, 0];
      for (let i = 0; i < totalPages; i++) {
        counts[i] = sample[i % sample.length];
        if (counts[i] > peak.count) {
          peak = { page: i + 1, count: counts[i] };
        }
      }
    }

    const max = Math.max(...counts, 1);
    return { pagePins: counts, maxPins: max, hottestPage: peak };
  }, [questions, totalPages]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t.charts?.questionDensity?.title || "In-Doc Slide Question Density Heatmap"}
            </h3>
            {hottestPage.count > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-bold text-red-400">
                <Flame className="h-3 w-3" />
                <span>
                  {t.charts?.questionDensity?.hottestSlide
                    ?.replace("{page}", String(hottestPage.page))
                    ?.replace("{count}", String(hottestPage.count)) || `Slide #${hottestPage.page} (${hottestPage.count} questions)`}
                </span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.charts?.questionDensity?.subtitle || "Friction analysis and interactive question pins per slide"}
          </p>
        </div>
      </div>

      {/* Slide Pin Density Heatmap Cells */}
      <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
        {pagePins.map((count, idx) => {
          const pageNum = idx + 1;
          const ratio = count / maxPins;
          const isHottest = pageNum === hottestPage.page && count > 0;

          let bgStyle = "bg-slate-950/80 border-slate-800 text-slate-400";
          if (isHottest) {
            bgStyle = "bg-red-950/80 border-red-500/60 text-red-300 shadow-md shadow-red-500/10 ring-1 ring-red-500/40";
          } else if (ratio > 0.6) {
            bgStyle = "bg-purple-950/80 border-purple-500/50 text-purple-300";
          } else if (ratio > 0.2) {
            bgStyle = "bg-purple-950/40 border-purple-800/40 text-purple-400";
          }

          return (
            <div
              key={pageNum}
              className={`rounded-xl border p-3 flex flex-col justify-between items-center text-center transition-all duration-150 relative group cursor-pointer hover:scale-105 ${bgStyle}`}
            >
              {isHottest && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
              )}

              <span className="text-[10px] font-mono font-bold opacity-75">
                p.{pageNum}
              </span>

              <div className="my-1 text-base font-black font-mono">
                {count}
              </div>

              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-60">
                {t.charts?.questionDensity?.pins || "pins"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-2 flex items-center justify-between">
        <span>High pin density indicates either complex unit economics or critical deal interest</span>
        <span className="font-mono text-purple-400 font-semibold">
          {pagePins.reduce((a, b) => a + b, 0)} Total Pinned Inquiries
        </span>
      </div>
    </div>
  );
}
