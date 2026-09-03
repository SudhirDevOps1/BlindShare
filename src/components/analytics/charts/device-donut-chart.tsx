"use client";

import React, { useState } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
}

interface DeviceDonutChartProps {
  deviceCounts: DeviceBreakdown;
  totalSessions: number;
}

export function DeviceDonutChart({ deviceCounts, totalSessions }: DeviceDonutChartProps) {
  const { t } = useI18n();
  const [hoveredSegment, setHoveredSegment] = useState<"desktop" | "mobile" | "tablet" | null>(null);

  const total = Math.max(totalSessions, 1);
  const desktopPct = Math.round((deviceCounts.desktop / total) * 100);
  const mobilePct = Math.round((deviceCounts.mobile / total) * 100);
  const tabletPct = Math.max(0, 100 - desktopPct - mobilePct);

  // SVG circular geometry
  const radius = 62;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius; // ~389.55

  const segments = [
    {
      key: "desktop" as const,
      label: "Desktop",
      count: deviceCounts.desktop,
      pct: desktopPct,
      color: "#3b82f6", // blue-500
      hoverColor: "#60a5fa",
      icon: Monitor,
    },
    {
      key: "mobile" as const,
      label: "Mobile",
      count: deviceCounts.mobile,
      pct: mobilePct,
      color: "#10b981", // emerald-500
      hoverColor: "#34d399",
      icon: Smartphone,
    },
    {
      key: "tablet" as const,
      label: "Tablet",
      count: deviceCounts.tablet,
      pct: tabletPct,
      color: "#a855f7", // purple-500
      hoverColor: "#c084fc",
      icon: Tablet,
    },
  ];

  let accumulatedPct = 0;

  const currentHighlight = hoveredSegment
    ? segments.find((s) => s.key === hoveredSegment)
    : null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <Monitor className="h-4 w-4 text-blue-400" />
          <span>Device Distribution</span>
        </h4>
        <span className="text-[10px] text-slate-400">
          {totalSessions} viewer{totalSessions === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-1">
        {/* SVG Donut Circle */}
        <div className="relative h-44 w-44 shrink-0 flex items-center justify-center select-none">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90 transform">
            {/* Background Empty Ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#1e293b"
              strokeWidth={strokeWidth}
            />

            {/* Segments */}
            {segments.map((seg) => {
              const dashLength = (seg.pct / 100) * circumference;
              const dashOffset = -((accumulatedPct / 100) * circumference);
              accumulatedPct += seg.pct;

              if (seg.pct === 0) return null;

              const isHovered = hoveredSegment === seg.key;

              return (
                <circle
                  key={seg.key}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={isHovered ? seg.hoverColor : seg.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredSegment(seg.key)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              );
            })}
          </svg>

          {/* Center Readout */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {currentHighlight ? (
              <>
                <span className="text-xl font-extrabold text-white">
                  {currentHighlight.pct}%
                </span>
                <span className="text-[10px] font-semibold text-slate-400 capitalize">
                  {currentHighlight.label}
                </span>
              </>
            ) : (
              <>
                <span className="text-xl font-extrabold text-white">
                  {totalSessions}
                </span>
                <span className="text-[10px] text-slate-400">Total Views</span>
              </>
            )}
          </div>
        </div>

        {/* Legend Breakdown List */}
        <div className="w-full sm:w-auto flex-1 space-y-2.5">
          {segments.map((seg) => {
            const Icon = seg.icon;
            const isHovered = hoveredSegment === seg.key;
            return (
              <div
                key={seg.key}
                onMouseEnter={() => setHoveredSegment(seg.key)}
                onMouseLeave={() => setHoveredSegment(null)}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isHovered
                    ? "border-slate-700 bg-slate-800/80 scale-[1.02]"
                    : "border-slate-800/60 bg-slate-950/40 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    {seg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-400">{seg.count}</span>
                  <span className="font-bold text-white">{seg.pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
