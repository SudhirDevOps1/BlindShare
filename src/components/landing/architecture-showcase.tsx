"use client";

import React, { useState } from "react";
import { Sparkles, ExternalLink, CheckCircle2, ChevronRight, BarChart3, Activity } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function ArchitectureShowcase() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("zkFlow");
  const [selectedGraphNum, setSelectedGraphNum] = useState(30);

  const graphList = [
    { num: 30, file: "30-views-timeline-animated.svg", label: t.charts?.graphItems?.g30?.title || "30-Day Timeline", tag: "Area" },
    { num: 31, file: "31-hourly-heatmap-animated.svg", label: t.charts?.graphItems?.g31?.title || "24×7 Heatmap", tag: "Matrix" },
    { num: 32, file: "32-source-donut-animated.svg", label: t.charts?.graphItems?.g32?.title || "UTM Source", tag: "Donut" },
    { num: 33, file: "33-storage-by-type-animated.svg", label: t.charts?.graphItems?.g33?.title || "Storage Type", tag: "Donut" },
    { num: 34, file: "34-live-pulse-map-animated.svg", label: t.charts?.graphItems?.g34?.title || "Live Pulse Map", tag: "Map" },
    { num: 35, file: "35-dwell-histogram-animated.svg", label: t.charts?.graphItems?.g35?.title || "Dwell Histogram", tag: "Histogram" },
    { num: 36, file: "36-intent-trend-animated.svg", label: t.charts?.graphItems?.g36?.title || "Intent Spline", tag: "Spline" },
    { num: 37, file: "37-journey-sankey-animated.svg", label: t.charts?.graphItems?.g37?.title || "Journey Funnel", tag: "Sankey" },
    { num: 38, file: "38-cost-forecast-animated.svg", label: t.charts?.graphItems?.g38?.title || "$0 Cost Gauge", tag: "Gauge" },
    { num: 39, file: "39-link-leaderboard-animated.svg", label: t.charts?.graphItems?.g39?.title || "Leaderboard", tag: "Ranked" },
    { num: 40, file: "40-question-density-animated.svg", label: t.charts?.graphItems?.g40?.title || "Question Density", tag: "Density" },
    { num: 41, file: "41-weekly-digest-animated.svg", label: t.charts?.graphItems?.g41?.title || "Weekly Digest", tag: "Card KPI" },
  ];

  const showcaseData: Record<
    string,
    {
      id: string;
      svgPath: string;
      title: string;
      subtitle: string;
      badge: string;
      description: string;
      bullets: string[];
    }
  > = {
    zkFlow: {
      id: "zkFlow",
      svgPath: "/brand/03-hero-zero-knowledge-flow.svg",
      ...t.architectureShowcase.tabs.zkFlow,
    },
    blindCourier: {
      id: "blindCourier",
      svgPath: "/brand/04-blind-courier-illustration.svg",
      ...t.architectureShowcase.tabs.blindCourier,
    },
    dataFlow: {
      id: "dataFlow",
      svgPath: "/brand/12-data-flow-diagram.svg",
      ...t.architectureShowcase.tabs.dataFlow,
    },
    leadScoring: {
      id: "leadScoring",
      svgPath: "/brand/08-ai-lead-scoring.svg",
      ...t.architectureShowcase.tabs.leadScoring,
    },
    mockup: {
      id: "mockup",
      svgPath: "/brand/07-document-sharing-mockup.svg",
      ...t.architectureShowcase.tabs.mockup,
    },
    liveAnalytics: {
      id: "liveAnalytics",
      svgPath: "/brand/22-analytics-live-animated.svg",
      ...t.architectureShowcase.tabs.liveAnalytics,
    },
    allDataGraphs: {
      id: "allDataGraphs",
      svgPath: `/brand/graphs/${graphList.find((g) => g.num === selectedGraphNum)?.file || "30-views-timeline-animated.svg"}`,
      ...t.architectureShowcase.tabs.allDataGraphs,
    },
  };

  const currentItem = showcaseData[activeTab] || showcaseData.zkFlow;
  const tabKeys = [
    "zkFlow",
    "blindCourier",
    "dataFlow",
    "leadScoring",
    "mockup",
    "liveAnalytics",
    "allDataGraphs",
  ] as const;

  const currentSvgUrl =
    activeTab === "allDataGraphs"
      ? `/brand/graphs/${graphList.find((g) => g.num === selectedGraphNum)?.file || "30-views-timeline-animated.svg"}`
      : currentItem.svgPath;

  return (
    <section className="relative border-t border-slate-900/80 bg-slate-950/80 py-24 px-4 sm:px-6">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 right-10 -z-10 h-96 w-96 rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-xl shadow-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>{t.architectureShowcase.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.architectureShowcase.title}
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            {t.architectureShowcase.subtitle}
          </p>
        </div>

        {/* 7 Navigation Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
          {tabKeys.map((key) => {
            const item = showcaseData[key];
            const isActive = key === activeTab;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 scale-[1.02]"
                    : "border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* All Data Graphs Interactive Carousel / Pill Selector (when tab is active) */}
        {activeTab === "allDataGraphs" && (
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-slate-900/80 backdrop-blur-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-slate-800">
              <span className="flex items-center gap-2 text-amber-400">
                <BarChart3 className="h-4 w-4" />
                <span>12-Graph Vector Showcase (SVGs 30–41)</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                Selected: #{selectedGraphNum} • {graphList.find((g) => g.num === selectedGraphNum)?.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {graphList.map((g) => (
                <button
                  key={g.num}
                  type="button"
                  onClick={() => setSelectedGraphNum(g.num)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedGraphNum === g.num
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 scale-105"
                      : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  <span className="font-mono opacity-60">#{g.num}</span>
                  <span>{g.label}</span>
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                    {g.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Featured Showcase Display Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
          {/* Left / Top: High-Resolution Scalable SVG Diagram Display with <object> + <img> fallback */}
          <div className="lg:col-span-7 relative group">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-inner flex items-center justify-center min-h-[340px]">
              <img
                src={currentSvgUrl}
                alt={currentItem.title}
                className="w-full h-auto max-h-[460px] object-contain rounded-xl transition-transform duration-500 group-hover:scale-[1.01]"
                loading="lazy"
              />
              <a
                href={currentSvgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition shadow-md z-10"
                title={t.architectureShowcase.enlargeVector}
              >
                <ExternalLink className="h-3 w-3" />
                <span>{t.architectureShowcase.enlargeVector}</span>
              </a>
            </div>
          </div>

          {/* Right / Bottom: Technical Breakdown & Capabilities */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <span className="inline-block rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                {currentItem.badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {currentItem.title}
              </h3>
              <p className="text-xs font-mono text-amber-400/90 mt-1">
                {currentItem.subtitle}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentItem.description}
            </p>

            {/* Bullet Points */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              {currentItem.bullets.map((point, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400">{t.architectureShowcase.svgScalable}</span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] text-emerald-400 font-semibold">{t.architectureShowcase.zkCertified}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
