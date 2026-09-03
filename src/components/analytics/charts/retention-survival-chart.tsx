"use client";

import React, { useMemo } from "react";
import { TrendingDown, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface SessionData {
  id: string;
  maxPageReached: number;
}

interface RetentionSurvivalChartProps {
  sessions: SessionData[];
  totalPages: number;
}

export function RetentionSurvivalChart({ sessions, totalPages }: RetentionSurvivalChartProps) {
  const { t } = useI18n();
  const totalSessions = Math.max(sessions.length, 1);

  // Compute how many sessions reached each page (1 to totalPages)
  const pageRetention = useMemo(() => {
    const counts = new Array(totalPages).fill(0);
    sessions.forEach((s) => {
      const reached = Math.min(Math.max(s.maxPageReached, 1), totalPages);
      for (let p = 1; p <= reached; p++) {
        counts[p - 1]++;
      }
    });

    return counts.map((count, i) => {
      const pageNumber = i + 1;
      const percentage = Math.round((count / totalSessions) * 100);
      return {
        pageNumber,
        count,
        percentage,
      };
    });
  }, [sessions, totalPages, totalSessions]);

  // Find the single slide with highest reader drop-off ("The Cliff Slide")
  const cliffSlide = useMemo(() => {
    if (pageRetention.length <= 1) return null;
    let maxDrop = 0;
    let dropIndex = -1;

    for (let i = 0; i < pageRetention.length - 1; i++) {
      const drop = pageRetention[i].percentage - pageRetention[i + 1].percentage;
      if (drop > maxDrop) {
        maxDrop = drop;
        dropIndex = i + 1; // page where drop happened
      }
    }

    if (maxDrop > 8) {
      return {
        fromPage: dropIndex,
        toPage: dropIndex + 1,
        dropPercent: maxDrop,
      };
    }
    return null;
  }, [pageRetention]);

  // SVG dimensions
  const width = 800;
  const height = 180;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 30;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const points = useMemo(() => {
    if (pageRetention.length === 0) return [];
    const step = pageRetention.length > 1 ? plotWidth / (pageRetention.length - 1) : plotWidth / 2;
    return pageRetention.map((p, i) => {
      const x = padLeft + (pageRetention.length > 1 ? i * step : plotWidth / 2);
      const y = padTop + plotHeight - (p.percentage / 100) * plotHeight;
      return { x, y, data: p };
    });
  }, [pageRetention, plotWidth, plotHeight, padLeft, padTop]);

  // Step line path
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: "", areaPath: "" };
    let lPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      lPath += ` L ${points[i].x} ${points[i - 1].y} L ${points[i].x} ${points[i].y}`;
    }
    const baselineY = height - padBottom;
    const aPath = `${lPath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;
    return { linePath: lPath, areaPath: aPath };
  }, [points, height, padBottom]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Investor Reading Retention Curve
            </h3>
            {cliffSlide && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
                <AlertTriangle className="h-3 w-3" />
                <span>Cliff at Slide #{cliffSlide.toPage} (-{cliffSlide.dropPercent}%)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Percentage of readers who persisted through each slide without bouncing
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 self-end sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Finished: {pageRetention[pageRetention.length - 1]?.percentage || 0}%</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct, i) => {
            const y = padTop + plotHeight - (pct / 100) * plotHeight;
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="rgba(51, 65, 85, 0.4)"
                  strokeDasharray="2,3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="rgba(148, 163, 184, 0.6)"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Area & Step Line */}
          {areaPath && <path d={areaPath} fill="url(#retentionGradient)" />}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Nodes */}
          {points.map((pt, i) => {
            const isCliff = cliffSlide && pt.data.pageNumber === cliffSlide.toPage;
            return (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isCliff ? "5" : "3.5"}
                  fill={isCliff ? "#ef4444" : "#10b981"}
                  stroke="#0f172a"
                  strokeWidth="2"
                />
              </g>
            );
          })}

          {/* X Labels */}
          {points.map((pt, i) => {
            const step = points.length > 20 ? 4 : points.length > 10 ? 2 : 1;
            if (i % step !== 0 && i !== points.length - 1) return null;
            return (
              <text
                key={i}
                x={pt.x}
                y={height - padBottom + 16}
                textAnchor="middle"
                fill="rgba(148, 163, 184, 0.7)"
                fontSize="10"
              >
                Slide {pt.data.pageNumber}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
