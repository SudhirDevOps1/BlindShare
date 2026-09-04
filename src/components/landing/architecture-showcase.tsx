"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Activity,
  Maximize2,
  X,
  Play,
  Pause,
  Layers,
  Cpu,
  Eye,
  Info,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface GraphItemData {
  num: number;
  file: string;
  tag: string;
}

const TAB_KEYS = [
  "zkFlow",
  "blindCourier",
  "dataFlow",
  "leadScoring",
  "mockup",
  "liveAnalytics",
  "allDataGraphs",
] as const;

type TabKey = (typeof TAB_KEYS)[number];

export function ArchitectureShowcase() {
  const { t, lang } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>("zkFlow");
  const [selectedGraphNum, setSelectedGraphNum] = useState<number>(30);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [isSlideAutoPlaying, setIsSlideAutoPlaying] = useState<boolean>(true);
  const [isCardHovered, setIsCardHovered] = useState<boolean>(false);
  const [slideProgress, setSlideProgress] = useState<number>(0);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState<boolean>(false);
  const [tilt, setTilt] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const cardRef = useRef<HTMLDivElement>(null);

  const SLIDE_DURATION = 8500; // 8.5s relaxed presentation slideshow pace

  // Auto-slideshow timer cycling through the 7 primary architecture tabs
  useEffect(() => {
    if (!isSlideAutoPlaying || isCardHovered) return;
    const tickRate = 85; // 100 ticks across 8500ms
    const interval = setInterval(() => {
      setSlideProgress((prev) => {
        const next = prev + (tickRate / SLIDE_DURATION) * 100;
        if (next >= 100) {
          setActiveTab((curr) => {
            const idx = TAB_KEYS.indexOf(curr);
            const nextIdx = (idx + 1) % TAB_KEYS.length;
            return TAB_KEYS[nextIdx];
          });
          return 0;
        }
        return next;
      });
    }, tickRate);

    return () => clearInterval(interval);
  }, [isSlideAutoPlaying, isCardHovered]);

  // Reset slide progress whenever activeTab changes
  useEffect(() => {
    setSlideProgress(0);
  }, [activeTab]);

  const currentSlideIndex = TAB_KEYS.indexOf(activeTab);

  const nextSlide = () => {
    const nextIdx = (currentSlideIndex + 1) % TAB_KEYS.length;
    setActiveTab(TAB_KEYS[nextIdx]);
    setIsSlideAutoPlaying(false); // Pause immediately on user click
  };

  const prevSlide = () => {
    const prevIdx = (currentSlideIndex - 1 + TAB_KEYS.length) % TAB_KEYS.length;
    setActiveTab(TAB_KEYS[prevIdx]);
    setIsSlideAutoPlaying(false); // Pause immediately on user click
  };

  const handleTabClick = (key: TabKey) => {
    setActiveTab(key);
    setIsSlideAutoPlaying(false); // Pause immediately when user clicks any tab
  };

  const graphList: GraphItemData[] = [
    { num: 30, file: "30-views-timeline-animated.svg", tag: "Area" },
    { num: 31, file: "31-hourly-heatmap-animated.svg", tag: "Matrix" },
    { num: 32, file: "32-source-donut-animated.svg", tag: "Donut" },
    { num: 33, file: "33-storage-by-type-animated.svg", tag: "Donut" },
    { num: 34, file: "34-live-pulse-map-animated.svg", tag: "Map" },
    { num: 35, file: "35-dwell-histogram-animated.svg", tag: "Histogram" },
    { num: 36, file: "36-intent-trend-animated.svg", tag: "Spline" },
    { num: 37, file: "37-journey-sankey-animated.svg", tag: "Sankey" },
    { num: 38, file: "38-cost-forecast-animated.svg", tag: "Gauge" },
    { num: 39, file: "39-link-leaderboard-animated.svg", tag: "Ranked" },
    { num: 40, file: "40-question-density-animated.svg", tag: "Density" },
    { num: 41, file: "41-weekly-digest-animated.svg", tag: "Card KPI" },
  ];

  // Auto-tour rotation timer for the 12 graphs
  useEffect(() => {
    if (!isAutoPlaying || activeTab !== "allDataGraphs") return;
    const interval = setInterval(() => {
      setSelectedGraphNum((prev) => {
        const next = prev + 1;
        return next > 41 ? 30 : next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlaying, activeTab]);

  // Handle 3D Perspective Tilt on Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 14, y: -y * 14, active: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, active: false });
  };

  // Keyboard navigation for full screen modal & graphs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreenModalOpen(false);
      } else if (activeTab === "allDataGraphs") {
        if (e.key === "ArrowRight") {
          setSelectedGraphNum((prev) => (prev >= 41 ? 30 : prev + 1));
          setIsSlideAutoPlaying(false);
        } else if (e.key === "ArrowLeft") {
          setSelectedGraphNum((prev) => (prev <= 30 ? 41 : prev - 1));
          setIsSlideAutoPlaying(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  // High-level 7 primary architecture tabs
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
      engineTag?: string;
      projectContext?: string;
    }
  > = {
    zkFlow: {
      id: "zkFlow",
      svgPath: "/brand/03-hero-zero-knowledge-flow.svg",
      ...t.architectureShowcase.tabs.zkFlow,
      engineTag: "RFC 3986 URL Fragment Encryption",
      projectContext: "Maps to: Client-Side AES-GCM-256 (Plaintext never touches server)",
    },
    blindCourier: {
      id: "blindCourier",
      svgPath: "/brand/04-blind-courier-illustration.svg",
      ...t.architectureShowcase.tabs.blindCourier,
      engineTag: "Zero-Knowledge Blind Courier Model",
      projectContext: "Maps to: Backblaze B2 Ciphertext Store & Zero-PII Relay",
    },
    dataFlow: {
      id: "dataFlow",
      svgPath: "/brand/12-data-flow-diagram.svg",
      ...t.architectureShowcase.tabs.dataFlow,
      engineTag: "Full Telemetry Pipeline & Neon Postgres",
      projectContext: "Maps to: Drizzle ORM Relational Schema & view_sessions",
    },
    leadScoring: {
      id: "leadScoring",
      svgPath: "/brand/08-ai-lead-scoring.svg",
      ...t.architectureShowcase.tabs.leadScoring,
      engineTag: "Catmull-Rom Attention Temperature",
      projectContext: "Maps to: AI Lead Scoring Engine (Hot 85-100, Warm 60-84)",
    },
    mockup: {
      id: "mockup",
      svgPath: "/brand/07-document-sharing-mockup.svg",
      ...t.architectureShowcase.tabs.mockup,
      engineTag: "Mozilla PDF.js Super-Sampled Viewer",
      projectContext: "Maps to: /v/[slug] Interactive In-Doc Reader Studio",
    },
    liveAnalytics: {
      id: "liveAnalytics",
      svgPath: "/brand/22-analytics-live-animated.svg",
      ...t.architectureShowcase.tabs.liveAnalytics,
      engineTag: "navigator.sendBeacon() 15s Heartbeats",
      projectContext: "Maps to: /api/analytics/overview & Live Radar Map",
    },
    allDataGraphs: {
      id: "allDataGraphs",
      svgPath: `/brand/graphs/${graphList.find((g) => g.num === selectedGraphNum)?.file || "30-views-timeline-animated.svg"}`,
      ...t.architectureShowcase.tabs.allDataGraphs,
    },
  };

  // Determine active item data
  let currentItem = showcaseData[activeTab] || showcaseData.zkFlow;

  // When inside allDataGraphs tab, dynamically override with specific graph info from i18n
  const graphKey = `g${selectedGraphNum}` as keyof typeof t.charts.graphItems;
  const currentGraphI18n = t.charts?.graphItems?.[graphKey] as
    | {
        title: string;
        desc: string;
        badge?: string;
        subtitle?: string;
        description?: string;
        bullets?: string[];
        engineTag?: string;
        projectContext?: string;
      }
    | undefined;

  if (activeTab === "allDataGraphs" && currentGraphI18n) {
    currentItem = {
      id: `graph_${selectedGraphNum}`,
      svgPath: `/brand/graphs/${graphList.find((g) => g.num === selectedGraphNum)?.file || "30-views-timeline-animated.svg"}`,
      title: currentGraphI18n.title,
      subtitle: currentGraphI18n.subtitle || currentGraphI18n.desc,
      badge: currentGraphI18n.badge || `Vector • #${selectedGraphNum}`,
      description: currentGraphI18n.description || currentGraphI18n.desc,
      bullets: currentGraphI18n.bullets || [
        currentGraphI18n.desc,
        "Mathematical client-side SVG rendering with zero PII retention",
        "Seamlessly synchronized with BlindShare DuckDB & PostgreSQL schemas",
        "100% scalable vector fidelity on any retina/mobile device",
      ],
      engineTag: currentGraphI18n.engineTag || "DuckDB + Neon Time-Series Engine",
      projectContext: currentGraphI18n.projectContext || "Maps to: /api/analytics/overview & Drizzle ORM",
    };
  }

  const currentSvgUrl =
    activeTab === "allDataGraphs"
      ? `/brand/graphs/${graphList.find((g) => g.num === selectedGraphNum)?.file || "30-views-timeline-animated.svg"}`
      : currentItem.svgPath;

  const nextGraph = () => {
    setSelectedGraphNum((prev) => (prev >= 41 ? 30 : prev + 1));
    setIsSlideAutoPlaying(false);
  };

  const prevGraph = () => {
    setSelectedGraphNum((prev) => (prev <= 30 ? 41 : prev - 1));
    setIsSlideAutoPlaying(false);
  };

  return (
    <section className="relative border-t border-slate-900/80 bg-slate-950/80 py-24 px-4 sm:px-6 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 right-10 -z-10 h-96 w-96 rounded-full bg-amber-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 -z-10 h-80 w-80 rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-8">
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

        {/* Presentation Slideshow Control & Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-slate-800/90 bg-slate-900/80 backdrop-blur-xl shadow-xl">
          {/* Left: Slide Counter & Auto-Play Status */}
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-300 shadow-sm">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>
                {t.architectureShowcase.slideshow?.slide || "स्लाइड"} {currentSlideIndex + 1} {t.architectureShowcase.slideshow?.of || "/"} 7
              </span>
            </div>

            {/* Auto-Slide Status Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSlideAutoPlaying((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer border ${
                isSlideAutoPlaying
                  ? isCardHovered
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30 ring-1 ring-amber-400/20"
                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                  : "bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600"
              }`}
              title={lang === "hi" ? "ऑटो स्लाइड को रोकें या चलाएं" : "Toggle Slideshow Auto-Play"}
            >
              {isSlideAutoPlaying ? (
                isCardHovered ? (
                  <>
                    <Pause className="h-3.5 w-3.5 text-amber-400" />
                    <span>{lang === "hi" ? "होवर पॉज़ (पढ़ें)" : "Hovered (Paused)"}</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{t.architectureShowcase.slideshow?.autoPlaying || "Auto-Slide (8.5s)"}</span>
                  </>
                )
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-amber-400" />
                  <span>{t.architectureShowcase.slideshow?.paused || "Paused (Click to Resume)"}</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-slate-400 hidden lg:inline-block">
              {t.architectureShowcase.slideshow?.slowPaceNotice}
            </span>
          </div>

          {/* Right: Controls (Previous, Play/Pause Toggle, Next) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSlide}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer text-xs font-semibold"
              title={t.architectureShowcase.slideshow?.prevSlide || "Previous Slide"}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{lang === "hi" ? "पिछली" : "Prev"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSlideAutoPlaying((prev) => !prev)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer ${
                isSlideAutoPlaying
                  ? "bg-slate-800 text-amber-300 border border-amber-500/40 hover:bg-slate-700"
                  : "bg-amber-500 text-slate-950 hover:bg-amber-400"
              }`}
            >
              {isSlideAutoPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>{t.architectureShowcase.slideshow?.pause || "Pause"}</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>{t.architectureShowcase.slideshow?.play || "Play"}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={nextSlide}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer text-xs font-semibold"
              title={t.architectureShowcase.slideshow?.nextSlide || "Next Slide"}
            >
              <span className="hidden sm:inline">{lang === "hi" ? "अगली" : "Next"}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Slideshow Ambient Countdown Bar */}
        <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden relative shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-100 ease-linear ${
              isSlideAutoPlaying && !isCardHovered
                ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                : "bg-slate-700 opacity-50"
            }`}
            style={{ width: `${isSlideAutoPlaying ? slideProgress : 100}%` }}
          />
        </div>

        {/* 7 Slide Navigation Tabs with Slide Numbers */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
          {TAB_KEYS.map((key, idx) => {
            const item = showcaseData[key];
            const isActive = key === activeTab;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleTabClick(key)}
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer overflow-hidden ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]"
                    : "border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? "bg-slate-950/25 text-slate-950 font-black" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {idx + 1}
                </span>
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* 12-Graph Vector Showcase (SVGs 30–41) Pills when tab is active */}
        {activeTab === "allDataGraphs" && (
          <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-slate-900/90 backdrop-blur-xl space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-xs font-bold text-amber-400">
                <BarChart3 className="h-4 w-4 text-amber-400" />
                <span className="tracking-wide">
                  {lang === "hi"
                    ? "12-ग्राफ़ वेक्टर एनालिटिक्स सुइट (SVGs 30–41)"
                    : "12-Graph Vector Showcase (SVGs 30–41)"}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {lang === "hi" ? "लाइव इंटरैक्टिव" : "Live Interactive"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Auto Tour Button */}
                <button
                  type="button"
                  onClick={() => setIsAutoPlaying((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
                    isAutoPlaying
                      ? "bg-amber-500 text-slate-950 font-bold animate-pulse"
                      : "bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white"
                  }`}
                  title={lang === "hi" ? "ऑटो टूर चालू/बंद करें" : "Toggle Auto Tour"}
                >
                  {isAutoPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{isAutoPlaying ? (lang === "hi" ? "ऑटो चल रहा है" : "Auto Tour Active") : (lang === "hi" ? "ऑटो टूर" : "Auto Tour")}</span>
                </button>

                {/* Prev / Next Arrows */}
                <button
                  type="button"
                  onClick={prevGraph}
                  className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title={lang === "hi" ? "पिछला ग्राफ़ (←)" : "Previous Graph (←)"}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={nextGraph}
                  className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title={lang === "hi" ? "अगला ग्राफ़ (→)" : "Next Graph (→)"}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <span className="font-mono text-[11px] text-slate-400 ml-1 hidden sm:inline">
                  #{selectedGraphNum} / 41
                </span>
              </div>
            </div>

            {/* 12 Pill Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {graphList.map((g) => {
                const isSelected = selectedGraphNum === g.num;
                const itemI18n = t.charts?.graphItems?.[`g${g.num}` as keyof typeof t.charts.graphItems] as
                  | { title: string }
                  | undefined;
                return (
                  <button
                    key={g.num}
                    type="button"
                    onClick={() => {
                      setSelectedGraphNum(g.num);
                      setIsAutoPlaying(false);
                      setIsSlideAutoPlaying(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30 scale-105 ring-2 ring-amber-400/50"
                        : "bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <span className="font-mono opacity-70">#{g.num}</span>
                    <span>{itemI18n?.title || `Graph #${g.num}`}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                        isSelected ? "bg-slate-900 text-amber-300 font-bold" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {g.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Featured Showcase Display Card with 3D Tilt Canvas */}
        <div
          onMouseEnter={() => setIsCardHovered(true)}
          onMouseLeave={() => {
            setIsCardHovered(false);
            handleMouseLeave();
          }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative transition-all duration-300"
        >
          
          {/* Left / Top: High-Resolution Scalable SVG Diagram Display with 3D Perspective Tilt */}
          <div className="lg:col-span-7 relative group">
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: tilt.active
                  ? `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale3d(1.015, 1.015, 1.015)`
                  : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
                transition: tilt.active ? "transform 0.08s ease-out" : "transform 0.5s ease-out",
              }}
              className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-inner flex items-center justify-center min-h-[360px] group-hover:border-amber-500/50 transition-colors"
            >
              {/* Dynamic Glow Spotlight */}
              {tilt.active && (
                <div
                  className="absolute inset-0 pointer-events-none rounded-2xl opacity-20 bg-gradient-to-tr from-amber-500/20 via-transparent to-blue-500/20"
                  style={{
                    transform: `translate(${tilt.x * 2}px, ${tilt.y * 2}px)`,
                  }}
                />
              )}

              <img
                key={currentSvgUrl}
                src={currentSvgUrl}
                alt={currentItem.title}
                className="w-full h-auto max-h-[460px] object-contain rounded-xl transition-all duration-500 select-none pointer-events-none animate-in fade-in zoom-in-95 duration-400"
                loading="lazy"
              />

              {/* Action Overlay Buttons */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
                {/* Fullscreen Inspector Modal Trigger */}
                <button
                  type="button"
                  onClick={() => setIsFullscreenModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition shadow-md cursor-pointer"
                  title={lang === "hi" ? "फुलस्क्रीन वेक्टर देखें" : "Inspect Fullscreen Vector"}
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>{lang === "hi" ? "फुलस्क्रीन वेक्टर" : "Fullscreen Inspect"}</span>
                </button>

                {/* Open Raw SVG */}
                <a
                  href={currentSvgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg bg-slate-900/90 border border-slate-700/80 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition shadow-md"
                  title={t.architectureShowcase.enlargeVector}
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* 3D Motion Badge Indicator */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md bg-slate-900/80 border border-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400 pointer-events-none">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>3D Vector Motion</span>
              </div>
            </div>

            {/* Quick Prev / Next Pill beneath SVG */}
            {activeTab === "allDataGraphs" && (
              <div className="flex items-center justify-between mt-3 px-1 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={prevGraph}
                  className="flex items-center gap-1 hover:text-amber-300 transition cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>{lang === "hi" ? "पिछला ग्राफ़" : "Previous (#" + (selectedGraphNum <= 30 ? 41 : selectedGraphNum - 1) + ")"}</span>
                </button>

                <span className="font-mono text-[11px] text-slate-500">
                  {lang === "hi" ? "कीबोर्ड: Arrow Left/Right" : "Keyboard: Left/Right arrows"}
                </span>

                <button
                  type="button"
                  onClick={nextGraph}
                  className="flex items-center gap-1 hover:text-amber-300 transition cursor-pointer"
                >
                  <span>{lang === "hi" ? "अगला ग्राफ़" : "Next (#" + (selectedGraphNum >= 41 ? 30 : selectedGraphNum + 1) + ")"}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right / Bottom: Deep Technical Breakdown & Project Reality Context */}
          <div key={currentItem.id} className="lg:col-span-5 space-y-5 animate-in fade-in duration-300">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="inline-block rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  {currentItem.badge}
                </span>

                {currentItem.engineTag && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <Cpu className="h-2.5 w-2.5" />
                    <span>{currentItem.engineTag}</span>
                  </span>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {currentItem.title}
              </h3>
              <p className="text-xs font-mono text-amber-400/90 mt-1.5 leading-relaxed">
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

            {/* BlindShare Project Implementation Context Pill */}
            {currentItem.projectContext && (
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-start gap-2.5 text-xs text-slate-300">
                <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300">
                    {lang === "hi" ? "प्रोजेक्ट आर्किटेक्चर मैपिंग: " : "BlindShare Project Mapping: "}
                  </span>
                  <span className="font-mono text-[11px] text-slate-300">
                    {currentItem.projectContext}
                  </span>
                </div>
              </div>
            )}

            {/* Security Certification Footer */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Layers className="h-3 w-3 text-slate-500" />
                  <span>{t.architectureShowcase.svgScalable}</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span>{t.architectureShowcase.zkCertified}</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] font-mono text-amber-400/80">
                  v1.4.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen High-Resolution SVG Inspector Modal */}
      {isFullscreenModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setIsFullscreenModalOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl rounded-3xl border border-amber-500/40 bg-slate-900 p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {currentItem.badge}
                </span>
                <h4 className="text-lg font-bold text-white">{currentItem.title}</h4>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={currentSvgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsFullscreenModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-rose-900/50 hover:text-rose-300 transition"
                  title="Close (Esc)"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scalable SVG Canvas in Modal */}
            <div className="flex-1 overflow-auto rounded-2xl bg-slate-950 p-4 flex items-center justify-center border border-slate-800 min-h-[400px]">
              <img
                src={currentSvgUrl}
                alt={currentItem.title}
                className="w-full h-auto max-h-[75vh] object-contain select-none"
              />
            </div>

            {/* Modal Footer with quick switcher if in allDataGraphs */}
            {activeTab === "allDataGraphs" && (
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={prevGraph}
                  className="flex items-center gap-1 text-amber-400 hover:underline cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>{lang === "hi" ? "पिछला ग्राफ़" : "Previous (#" + (selectedGraphNum <= 30 ? 41 : selectedGraphNum - 1) + ")"}</span>
                </button>

                <span className="font-mono text-slate-500">
                  #{selectedGraphNum} • {currentItem.subtitle}
                </span>

                <button
                  type="button"
                  onClick={nextGraph}
                  className="flex items-center gap-1 text-amber-400 hover:underline cursor-pointer"
                >
                  <span>{lang === "hi" ? "अगला ग्राफ़" : "Next (#" + (selectedGraphNum >= 41 ? 30 : selectedGraphNum + 1) + ")"}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
