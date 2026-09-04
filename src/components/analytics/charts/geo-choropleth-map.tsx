"use client";

import React, { useState, useMemo } from "react";
import { Globe, Radio, Sparkles, Navigation, Activity, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface CountryItem {
  country: string;
  views?: number;
  count?: number;
  percentage?: number;
}

interface GeoChoroplethMapProps {
  countryBreakdown?: CountryItem[];
  recentSessions?: any[];
  activeNow?: number;
}

interface CountryMeta {
  code: string;
  name: string;
  nameHi: string;
  flag: string;
  coords: [number, number]; // [x, y] in 800x360 SVG space
}

const COUNTRY_REGISTRY: Record<string, CountryMeta> = {
  IN: { code: "IN", name: "India", nameHi: "भारत", flag: "🇮🇳", coords: [545, 175] },
  US: { code: "US", name: "United States", nameHi: "अमेरिका", flag: "🇺🇸", coords: [175, 115] },
  GB: { code: "GB", name: "United Kingdom", nameHi: "यूके", flag: "🇬🇧", coords: [385, 95] },
  DE: { code: "DE", name: "Germany", nameHi: "जर्मनी", flag: "🇩🇪", coords: [415, 100] },
  FR: { code: "FR", name: "France", nameHi: "फ़्रांस", flag: "🇫🇷", coords: [398, 115] },
  SG: { code: "SG", name: "Singapore", nameHi: "सिंगापुर", flag: "🇸🇬", coords: [595, 215] },
  JP: { code: "JP", name: "Japan", nameHi: "जापान", flag: "🇯🇵", coords: [675, 125] },
  CA: { code: "CA", name: "Canada", nameHi: "कनाडा", flag: "🇨🇦", coords: [170, 75] },
  AU: { code: "AU", name: "Australia", nameHi: "ऑस्ट्रेलिया", flag: "🇦🇺", coords: [665, 280] },
  AE: { code: "AE", name: "United Arab Emirates", nameHi: "यूएई", flag: "🇦🇪", coords: [480, 160] },
  NL: { code: "NL", name: "Netherlands", nameHi: "नीदरलैंड", flag: "🇳🇱", coords: [405, 96] },
  CH: { code: "CH", name: "Switzerland", nameHi: "स्विट्जरलैंड", flag: "🇨🇭", coords: [410, 112] },
  IL: { code: "IL", name: "Israel", nameHi: "इज़राइल", flag: "🇮🇱", coords: [460, 145] },
  BR: { code: "BR", name: "Brazil", nameHi: "ब्राज़ील", flag: "🇧🇷", coords: [265, 245] },
  SE: { code: "SE", name: "Sweden", nameHi: "स्वीडन", flag: "🇸🇪", coords: [425, 75] },
  IE: { code: "IE", name: "Ireland", nameHi: "आयरलैंड", flag: "🇮🇪", coords: [370, 95] },
  ES: { code: "ES", name: "Spain", nameHi: "स्पेन", flag: "🇪🇸", coords: [385, 130] },
  IT: { code: "IT", name: "Italy", nameHi: "इटली", flag: "🇮🇹", coords: [420, 125] },
  ZA: { code: "ZA", name: "South Africa", nameHi: "दक्षिण अफ्रीका", flag: "🇿🇦", coords: [435, 290] },
  KR: { code: "KR", name: "South Korea", nameHi: "दक्षिण कोरिया", flag: "🇰🇷", coords: [650, 125] },
};

function getCountryMeta(rawCode: string): CountryMeta {
  const code = (rawCode || "UNKNOWN").toUpperCase().trim();
  if (COUNTRY_REGISTRY[code]) return COUNTRY_REGISTRY[code];
  return {
    code,
    name: code === "UNKNOWN" ? "Anonymous Reader" : code,
    nameHi: code === "UNKNOWN" ? "अनाम पाठक" : code,
    flag: "🌐",
    coords: [400, 180],
  };
}

export function GeoChoroplethMap({
  countryBreakdown = [],
  recentSessions = [],
  activeNow = 0,
}: GeoChoroplethMapProps) {
  const { t, lang } = useI18n();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Normalize incoming countryBreakdown safely to eliminate all NaN errors
  const { countries, totalViews } = useMemo(() => {
    if (!countryBreakdown || !Array.isArray(countryBreakdown)) {
      return { countries: [], totalViews: 0 };
    }

    let sum = 0;
    const items = countryBreakdown
      .map((c) => {
        const rawCode = (c.country || "Unknown").toUpperCase();
        // Support views, count, or numeric fallbacks safely
        const views = Number(c.views ?? (c as any).count ?? 0);
        const safeViews = isNaN(views) || views < 0 ? 0 : views;
        sum += safeViews;
        const meta = getCountryMeta(rawCode);
        return {
          country: rawCode,
          name: lang === "hi" ? meta.nameHi : meta.name,
          flag: meta.flag,
          coords: meta.coords,
          views: safeViews,
        };
      })
      .filter((c) => c.views > 0)
      .sort((a, b) => b.views - a.views);

    return { countries: items, totalViews: sum };
  }, [countryBreakdown, lang]);

  // Compute live active reader count
  const liveCount = activeNow > 0 ? activeNow : recentSessions.filter((s) => s.isLive).length;

  // Active radar beacon coordinates
  const activeBeacons = useMemo(() => {
    if (countries.length > 0) {
      return countries.map((c) => ({
        country: c.country,
        name: c.name,
        flag: c.flag,
        x: c.coords[0],
        y: c.coords[1],
        views: c.views,
      }));
    }
    return [];
  }, [countries]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Globe className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t.charts?.geoMap?.title || "Global Investor Distribution & Live Radar"}
            </h3>
            {liveCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{liveCount} {lang === "hi" ? "लाइव सक्रिय पाठक" : (liveCount === 1 ? "Live Reader" : "Live Readers")}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 border border-slate-700 px-2.5 py-0.5 text-[10px] font-medium text-slate-400">
                <Radio className="h-3 w-3 text-slate-500" />
                <span>{lang === "hi" ? "लाइव रडार सक्रिय" : "Radar Listening"}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t.charts?.geoMap?.subtitle || "Real-time geographic dwell and anonymous location density"}
          </p>
        </div>

        {/* Total Views Safe Badge (Zero NaN) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[11px] font-mono text-amber-400 font-semibold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
            {totalViews} {totalViews === 1 ? (lang === "hi" ? "व्यू" : "view") : (lang === "hi" ? "व्यूज" : "views")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Umami-Style SVG World Map Graphic with Real Continents */}
        <div className="lg:col-span-2 relative rounded-xl border border-slate-800 bg-slate-950/90 p-4 overflow-hidden min-h-[260px] flex items-center justify-center">
          {/* Subtle Radar Scanner Background Effect */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />

          <svg viewBox="0 0 800 360" className="w-full h-auto select-none">
            <defs>
              {/* Radar Ping Radial Gradient */}
              <radialGradient id="radarPingGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="scanLineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Latitude / Longitude Equator and Graticule Grid */}
            <g stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6">
              <line x1="0" y1="180" x2="800" y2="180" />
              <line x1="0" y1="100" x2="800" y2="100" />
              <line x1="0" y1="260" x2="800" y2="260" />
              <line x1="200" y1="0" x2="200" y2="360" />
              <line x1="400" y1="0" x2="400" y2="360" />
              <line x1="600" y1="0" x2="600" y2="360" />
            </g>

            {/* Realistic Continental Landmasses (High Contrast Dark Silhouettes) */}
            <g fill="#1e293b" stroke="#334155" strokeWidth="1" strokeLinejoin="round" opacity="0.85">
              {/* North America */}
              <path d="M 80 50 L 120 40 L 170 45 L 210 50 L 235 75 L 215 95 L 245 110 L 225 140 L 195 145 L 180 180 L 155 160 L 145 125 L 115 115 L 90 90 Z" />
              {/* Greenland */}
              <path d="M 270 25 L 320 20 L 335 45 L 295 65 L 275 45 Z" />
              {/* South America */}
              <path d="M 220 190 L 255 185 L 290 220 L 285 270 L 255 330 L 235 325 L 220 255 L 210 215 Z" />
              {/* Europe */}
              <path d="M 370 70 L 430 65 L 450 90 L 440 120 L 400 130 L 375 125 L 365 95 Z" />
              {/* United Kingdom & Ireland */}
              <path d="M 365 85 L 380 80 L 385 95 L 370 100 Z" />
              {/* Africa */}
              <path d="M 370 140 L 440 135 L 485 180 L 465 240 L 445 305 L 415 305 L 385 245 L 355 185 Z" />
              {/* Asia / Eurasia */}
              <path d="M 450 65 L 560 55 L 680 70 L 730 110 L 710 140 L 665 135 L 610 170 L 585 210 L 550 205 L 530 155 L 490 150 L 460 125 Z" />
              {/* India Subcontinent */}
              <path d="M 525 155 L 560 155 L 555 205 L 540 220 L 525 185 Z" />
              {/* Japan */}
              <path d="M 685 115 L 700 110 L 695 135 L 680 140 Z" />
              {/* Australia */}
              <path d="M 630 250 L 700 240 L 715 285 L 680 320 L 635 300 Z" />
              {/* New Zealand */}
              <path d="M 735 310 L 745 305 L 740 330 Z" />
            </g>

            {/* Radar Scan Sweep Line */}
            <line x1="0" y1="0" x2="0" y2="360" stroke="url(#scanLineGrad)" strokeWidth="3">
              <animate attributeName="x1" values="0;800" dur="6s" repeatCount="indefinite" />
              <animate attributeName="x2" values="0;800" dur="6s" repeatCount="indefinite" />
            </line>

            {/* Dynamic Active Investor Radar Beacons */}
            {activeBeacons.map((beacon) => {
              const isHovered = hoveredCountry === beacon.country;
              return (
                <g
                  key={beacon.country}
                  className="cursor-pointer transition-transform duration-200"
                  onMouseEnter={() => setHoveredCountry(beacon.country)}
                  onMouseLeave={() => setHoveredCountry(null)}
                >
                  {/* Concentric Ping Waves */}
                  <circle cx={beacon.x} cy={beacon.y} r="16" fill="url(#radarPingGrad)">
                    <animate attributeName="r" values="6;22;30" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0.35;0" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={beacon.x} cy={beacon.y} r="8" fill="none" stroke="#f59e0b" strokeWidth="1.2">
                    <animate attributeName="r" values="3;14" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0" dur="2.4s" repeatCount="indefinite" />
                  </circle>

                  {/* Solid Center Core */}
                  <circle
                    cx={beacon.x}
                    cy={beacon.y}
                    r={isHovered ? 6 : 4.5}
                    fill="#fbbf24"
                    stroke="#0f172a"
                    strokeWidth="1.8"
                    className="shadow-lg"
                  />

                  {/* Flag & Name Label on Map */}
                  <g transform={`translate(${beacon.x + 8}, ${beacon.y - 8})`}>
                    <rect
                      x="-2"
                      y="-10"
                      width="58"
                      height="16"
                      rx="4"
                      fill="#090d16"
                      stroke={isHovered ? "#f59e0b" : "#334155"}
                      strokeWidth="1"
                      opacity="0.92"
                    />
                    <text x="3" y="1" fill="#f8fafc" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      {beacon.flag} {beacon.country}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Floating Details Tooltip */}
          {hoveredCountry && (
            <div className="absolute top-3 left-3 rounded-xl bg-slate-900/95 border border-amber-500/40 px-3.5 py-2 text-xs text-white shadow-2xl backdrop-blur-md pointer-events-none z-10 flex items-center gap-3 animate-in fade-in zoom-in-95">
              <span className="text-xl">{getCountryMeta(hoveredCountry).flag}</span>
              <div>
                <div className="font-bold text-amber-300">
                  {lang === "hi" ? getCountryMeta(hoveredCountry).nameHi : getCountryMeta(hoveredCountry).name}
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  {countries.find((c) => c.country === hoveredCountry)?.views || 0} {lang === "hi" ? "व्यूज" : "views"} ·{" "}
                  {totalViews > 0
                    ? Math.round(((countries.find((c) => c.country === hoveredCountry)?.views || 0) / totalViews) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Umami-Style Ranked Country Table */}
        <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-200">
            <span>{t.charts?.geoMap?.topCountries || "Top Investor Countries"}</span>
            <span className="font-mono text-slate-400 text-[11px]">
              {totalViews} {lang === "hi" ? "व्यूज" : "views"}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {countries.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Navigation className="h-6 w-6 text-slate-600 mx-auto animate-bounce" />
                <p className="text-xs font-medium text-slate-400">
                  {lang === "hi" ? "अभी तक कोई अंतर्राष्ट्रीय दर्शक डेटा नहीं मिला है" : "No international reader telemetry yet"}
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  {lang === "hi" ? "जैसे ही पाठक आपके शेयर लिंक खोलेंगे, उनकी भौगोलिक उपस्थिति यहाँ लाइव दिखेगी।" : "Geographic radar beacons and country dwell metrics will appear here in real time."}
                </p>
              </div>
            ) : (
              countries.slice(0, 7).map((c) => {
                // Guarantee mathematical safety - ZERO NaN under any circumstances
                const views = c.views || 0;
                const pct = totalViews > 0 ? Math.round((views / totalViews) * 100) : 0;
                const isHovered = hoveredCountry === c.country;

                return (
                  <div
                    key={c.country}
                    onMouseEnter={() => setHoveredCountry(c.country)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    className={`space-y-1 p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isHovered ? "bg-slate-800/80 ring-1 ring-amber-500/40" : "hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-semibold text-slate-200">
                        <span className="text-base">{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                      <span className="font-mono text-slate-300 text-[11px] font-bold">
                        {views} <span className="text-slate-500 font-normal">({pct}%)</span>
                      </span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Umami-Style Live Reader Radar Ticker Feed */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-medium text-slate-300">
            {lang === "hi" ? "लाइव रडार सिग्नल्स" : "Live Reader Telemetry"}:
          </span>
          <span className="text-slate-400">
            {liveCount > 0
              ? (lang === "hi" ? `${liveCount} पाठक सक्रिय हैं` : `${liveCount} active reader sessions online`)
              : (lang === "hi" ? "कोई लाइव पाठक नहीं है (रडार सक्रिय)" : "Listening for reader heartbeats")}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
          <span>{lang === "hi" ? "ज़ीरो-नॉलेज अनाम IP हैश" : "Zero-Knowledge Anonymized Telemetry"}</span>
        </div>
      </div>
    </div>
  );
}
