"use client";

import React, { useState, useMemo } from "react";
import { formatDuration } from "@/lib/analytics";
import { TrendingUp, Flame, Sparkles } from "lucide-react";

interface PageStat {
  pageNumber: number;
  dwellSeconds: number;
  viewCount: number;
}

interface DwellSplineChartProps {
  pageStats: PageStat[];
  totalPages: number;
}

export function DwellSplineChart({ pageStats, totalPages }: DwellSplineChartProps) {
  const [chartType, setChartType] = useState<"spline" | "bars">("spline");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Normalize data ensuring all pages 1 to totalPages are represented
  const fullStats = useMemo(() => {
    const map = new Map<number, PageStat>();
    pageStats.forEach((p) => map.set(p.pageNumber, p));
    const result: PageStat[] = [];
    for (let i = 1; i <= Math.max(totalPages, pageStats.length); i++) {
      result.push(map.get(i) || { pageNumber: i, dwellSeconds: 0, viewCount: 0 });
    }
    return result;
  }, [pageStats, totalPages]);

  const maxDwell = useMemo(() => {
    const max = Math.max(...fullStats.map((p) => p.dwellSeconds), 1);
    return max;
  }, [fullStats]);

  const peakPage = useMemo(() => {
    if (fullStats.length === 0) return null;
    let peak = fullStats[0];
    for (const p of fullStats) {
      if (p.dwellSeconds > peak.dwellSeconds) peak = p;
    }
    return peak.dwellSeconds > 0 ? peak : null;
  }, [fullStats]);

  // Chart dimensions in virtual SVG coordinates
  const width = 800;
  const height = 240;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 35;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  // Calculate coordinates for points
  const points = useMemo(() => {
    if (fullStats.length === 0) return [];
    const step = fullStats.length > 1 ? plotWidth / (fullStats.length - 1) : plotWidth / 2;
    return fullStats.map((p, i) => {
      const x = padLeft + (fullStats.length > 1 ? i * step : plotWidth / 2);
      const ratio = p.dwellSeconds / maxDwell;
      const y = padTop + plotHeight - ratio * plotHeight;
      return { x, y, data: p };
    });
  }, [fullStats, maxDwell, plotWidth, plotHeight, padLeft, padTop]);

  // Generate smooth cubic bezier curve
  const { curvePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { curvePath: "", areaPath: "" };
    if (points.length === 1) {
      const p = points[0];
      return {
        curvePath: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`,
        areaPath: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y} L ${p.x + 20} ${height - padBottom} L ${p.x - 20} ${height - padBottom} Z`,
      };
    }

    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const baselineY = (height - padBottom).toFixed(1);
    const area = `${path} L ${points[points.length - 1].x.toFixed(1)} ${baselineY} L ${points[0].x.toFixed(1)} ${baselineY} Z`;

    return { curvePath: path, areaPath: area };
  }, [points, height, padBottom]);

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
      {/* Header with Title, Peak Pill & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Page-by-Page Reading Dwell & Velocity Curve
            </h3>
            {peakPage && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 shadow-sm">
                <Flame className="h-3 w-3 text-amber-400 animate-pulse" />
                <span>Peak: Slide #{peakPage.pageNumber} ({formatDuration(peakPage.dwellSeconds)})</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time attention distribution across all pitch deck slides
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-end sm:self-auto">
          <button
            onClick={() => setChartType("spline")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
              chartType === "spline"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Spline Curve
          </button>
          <button
            onClick={() => setChartType("bars")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
              chartType === "bars"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Bar Columns
          </button>
        </div>
      </div>

      {/* SVG Visualization Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const svgX = ((e.clientX - rect.left) / rect.width) * width;
            let closestIdx = 0;
            let minDist = Infinity;
            points.forEach((pt, idx) => {
              const dist = Math.abs(pt.x - svgX);
              if (dist < minDist) {
                minDist = dist;
                closestIdx = idx;
              }
            });
            setHoverIndex(closestIdx);
          }}
        >
          <defs>
            {/* Ambient amber glowing gradient */}
            <linearGradient id="dwellAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.00" />
            </linearGradient>

            {/* Glowing stroke filter */}
            <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Bar gradient */}
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Guidelines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padTop + plotHeight - ratio * plotHeight;
            const labelSeconds = Math.round(ratio * maxDwell);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="rgba(51, 65, 85, 0.4)"
                  strokeDasharray={ratio === 0 ? "none" : "3,4"}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="rgba(148, 163, 184, 0.6)"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {formatDuration(labelSeconds)}
                </text>
              </g>
            );
          })}

          {/* Mode 1: Continuous Spline Curve */}
          {chartType === "spline" && (
            <>
              {/* Area Fill */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="url(#dwellAreaGradient)"
                  className="transition-all duration-300"
                />
              )}

              {/* Glowing Line Stroke */}
              {curvePath && (
                <path
                  d={curvePath}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glowAmber)"
                  className="transition-all duration-300"
                />
              )}

              {/* Data points */}
              {points.map((pt, i) => {
                const isHovered = hoverIndex === i;
                const isPeak = peakPage && pt.data.pageNumber === peakPage.pageNumber;
                return (
                  <g key={i}>
                    {isPeak && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="7"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        className="animate-ping opacity-60"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? "6" : isPeak ? "4.5" : "3"}
                      fill={isHovered ? "#ffffff" : isPeak ? "#f59e0b" : "#d97706"}
                      stroke="#0f172a"
                      strokeWidth="2"
                      className="transition-all duration-150 cursor-pointer"
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* Mode 2: Column Bars */}
          {chartType === "bars" && (
            <>
              {points.map((pt, i) => {
                const barWidth = Math.max(8, Math.min(28, (plotWidth / points.length) * 0.65));
                const barHeight = Math.max(3, height - padBottom - pt.y);
                const isHovered = hoverIndex === i;
                return (
                  <rect
                    key={i}
                    x={pt.x - barWidth / 2}
                    y={pt.y}
                    width={barWidth}
                    height={barHeight}
                    rx="3"
                    fill={isHovered ? "#fef08a" : "url(#barGradient)"}
                    className="transition-all duration-150 cursor-pointer"
                    opacity={isHovered ? 1 : 0.85}
                  />
                );
              })}
            </>
          )}

          {/* Active Hover Crosshair Line */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={padTop}
                x2={activePoint.x}
                y2={height - padBottom}
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="2,3"
                opacity="0.8"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="6.5"
                fill="#fef08a"
                stroke="#78350f"
                strokeWidth="2"
              />
            </g>
          )}

          {/* X-Axis Page Labels */}
          {points.map((pt, i) => {
            const step = points.length > 20 ? 4 : points.length > 10 ? 2 : 1;
            const showLabel = i % step === 0 || i === points.length - 1;
            if (!showLabel) return null;
            return (
              <text
                key={i}
                x={pt.x}
                y={height - padBottom + 16}
                textAnchor="middle"
                fill="rgba(148, 163, 184, 0.7)"
                fontSize="10"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontWeight={hoverIndex === i ? "bold" : "normal"}
              >
                p.{pt.data.pageNumber}
              </text>
            );
          })}
        </svg>

        {/* Floating Glassmorphic Interactive Tooltip */}
        {activePoint && (
          <div
            style={{
              left: `${Math.min(Math.max((activePoint.x / width) * 100, 10), 90)}%`,
              top: `${Math.max(10, (activePoint.y / height) * 100 - 32)}%`,
            }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full z-20 rounded-xl border border-amber-500/40 bg-slate-950/90 px-3 py-2 text-white shadow-2xl backdrop-blur-md whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Slide #{activePoint.data.pageNumber}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2 text-[11px] text-slate-300">
              <span>Time:</span>
              <span className="font-mono font-bold text-amber-400">
                {formatDuration(activePoint.data.dwellSeconds)}
              </span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-slate-300">
                {activePoint.data.viewCount} view{activePoint.data.viewCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {Math.round((activePoint.data.dwellSeconds / maxDwell) * 100)}% of peak interest
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
