"use client";

import React, { useState, useMemo } from "react";
import { Globe, Radio, Sparkles, Navigation, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface CountryItem {
  country: string;
  views?: number;
  count?: number;
  percentage?: number;
}

interface GeoChoroplethFullProps {
  countryBreakdown?: CountryItem[];
  activeNow?: number;
}

interface CountryMeta {
  code: string;
  name: string;
  flag: string;
  coords: [number, number]; // [x, y] in 800x380 SVG space
}

const COUNTRY_COORDS: Record<string, CountryMeta> = {
  IN: { code: "IN", name: "India", flag: "🇮🇳", coords: [545, 185] },
  US: { code: "US", name: "United States", flag: "🇺🇸", coords: [175, 125] },
  GB: { code: "GB", name: "United Kingdom", flag: "🇬🇧", coords: [385, 105] },
  DE: { code: "DE", name: "Germany", flag: "🇩🇪", coords: [415, 110] },
  FR: { code: "FR", name: "France", flag: "🇫🇷", coords: [398, 125] },
  SG: { code: "SG", name: "Singapore", flag: "🇸🇬", coords: [595, 225] },
  JP: { code: "JP", name: "Japan", flag: "🇯🇵", coords: [675, 135] },
  CA: { code: "CA", name: "Canada", flag: "🇨🇦", coords: [170, 85] },
  AU: { code: "AU", name: "Australia", flag: "🇦🇺", coords: [665, 290] },
  AE: { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", coords: [480, 170] },
  NL: { code: "NL", name: "Netherlands", flag: "🇳🇱", coords: [405, 106] },
  CH: { code: "CH", name: "Switzerland", flag: "🇨🇭", coords: [410, 122] },
  IL: { code: "IL", name: "Israel", flag: "🇮🇱", coords: [460, 155] },
  BR: { code: "BR", name: "Brazil", flag: "🇧🇷", coords: [265, 255] },
  SE: { code: "SE", name: "Sweden", flag: "🇸🇪", coords: [425, 85] },
  IE: { code: "IE", name: "Ireland", flag: "🇮🇪", coords: [370, 105] },
};

export function GeoChoroplethFull({
  countryBreakdown = [],
  activeNow = 0,
}: GeoChoroplethFullProps) {
  const { t } = useI18n();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const topCountries = useMemo(() => {
    if (countryBreakdown && countryBreakdown.length > 0) {
      const total = countryBreakdown.reduce((acc, c) => acc + (c.views || c.count || 0), 0) || 1;
      return countryBreakdown
        .map((c) => {
          const views = c.views || c.count || 0;
          const pct = c.percentage || Math.round((views / total) * 100);
          const meta = COUNTRY_COORDS[c.country.toUpperCase()] || {
            code: c.country,
            name: c.country,
            flag: "🌐",
            coords: [400, 190] as [number, number],
          };
          return {
            code: c.country.toUpperCase(),
            name: meta.name,
            flag: meta.flag,
            views,
            percentage: pct,
            coords: meta.coords,
          };
        })
        .sort((a, b) => b.views - a.views);
    }

    return [];
  }, [countryBreakdown]);

  const maxViews = Math.max(...topCountries.map((c) => c.views), 1);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t.charts?.geoChoropleth?.title || "Global Investor Geography & Telemetry"}
            </h3>
            {activeNow > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                {activeNow} Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.charts?.geoChoropleth?.subtitle || "Encrypted privacy-preserving reader geographic distribution (hashed IP telemetry)"}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Zero Plaintext IP Stored</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* World Vector Map (2 cols) */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/80 p-2 min-h-[220px] flex items-center justify-center">
          <svg viewBox="0 0 800 380" className="w-full h-full max-h-56 select-none opacity-90">
            {/* World Base Graticule Grid */}
            <defs>
              <pattern id="worldGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
              </pattern>
              <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </radialGradient>
            </defs>

            <rect width="800" height="380" fill="url(#worldGrid)" />

            {/* Stylized Simplified Continent Silhouettes */}
            {/* North America */}
            <path
              d="M 110,60 Q 180,50 250,80 Q 230,150 160,180 Q 120,130 110,60 Z"
              fill="#1e293b"
              fillOpacity="0.5"
              stroke="#334155"
              strokeWidth="0.75"
            />
            {/* South America */}
            <path
              d="M 220,195 Q 290,210 270,310 Q 230,340 210,270 Q 200,210 220,195 Z"
              fill="#1e293b"
              fillOpacity="0.5"
              stroke="#334155"
              strokeWidth="0.75"
            />
            {/* Europe */}
            <path
              d="M 370,75 Q 460,70 450,130 Q 380,145 370,75 Z"
              fill="#1e293b"
              fillOpacity="0.5"
              stroke="#334155"
              strokeWidth="0.75"
            />
            {/* Africa */}
            <path
              d="M 380,145 Q 470,160 450,280 Q 390,290 380,200 Z"
              fill="#1e293b"
              fillOpacity="0.5"
              stroke="#334155"
              strokeWidth="0.75"
            />
            {/* Asia */}
            <path
              d="M 460,70 Q 680,60 700,160 Q 560,220 460,140 Z"
              fill="#1e293b"
              fillOpacity="0.5"
              stroke="#334155"
              strokeWidth="0.75"
            />
            {/* Australia */}
            <path
              d="M 620,260 Q 710,250 700,320 Q 630,330 620,260 Z"
              fill="#1e293b"
              fillOpacity="0.5"
              stroke="#334155"
              strokeWidth="0.75"
            />

            {/* Connecting Telemetry Beams between Top Nodes */}
            {topCountries.length >= 2 && (
              <path
                d={`M ${topCountries[0].coords[0]},${topCountries[0].coords[1]} Q 360,90 ${topCountries[1].coords[0]},${topCountries[1].coords[1]}`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                strokeOpacity="0.4"
              />
            )}

            {/* Pulsing Regional Nodes */}
            {topCountries.map((c) => {
              const intensity = c.views / maxViews;
              const radius = 5 + intensity * 7;
              const isHovered = hoveredCountry === c.code;

              return (
                <g
                  key={c.code}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredCountry(c.code)}
                  onMouseLeave={() => setHoveredCountry(null)}
                >
                  {/* Outer pulse aura */}
                  <circle
                    cx={c.coords[0]}
                    cy={c.coords[1]}
                    r={radius * 2.2}
                    fill="url(#nodeGlow)"
                    className={isHovered ? "animate-pulse" : ""}
                  />
                  {/* Main Node */}
                  <circle
                    cx={c.coords[0]}
                    cy={c.coords[1]}
                    r={radius}
                    fill="#f59e0b"
                    stroke="#0f172a"
                    strokeWidth="2"
                    className="transition-all"
                  />
                  {/* Pin label */}
                  <text
                    x={c.coords[0]}
                    y={c.coords[1] - radius - 4}
                    textAnchor="middle"
                    className={`font-mono text-[9px] font-bold ${
                      isHovered ? "fill-amber-300" : "fill-slate-300"
                    }`}
                  >
                    {c.code} ({c.views})
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Top Countries Leaderboard Table (1 col) */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
              <span>Top Geographies</span>
              <span>Share</span>
            </div>

            <div className="space-y-2">
              {topCountries.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No geographic telemetry recorded yet
                </div>
              ) : (
                topCountries.slice(0, 5).map((c) => (
                  <div
                    key={c.code}
                    onMouseEnter={() => setHoveredCountry(c.code)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      hoveredCountry === c.code
                        ? "border-amber-500/50 bg-amber-500/10"
                        : "border-slate-800/60 bg-slate-900/40 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                      <span className="font-mono text-amber-400 font-bold">{c.views} views</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, c.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 text-center font-mono">
            Pairs with SVG 34 Live Pulse Map
          </div>
        </div>
      </div>
    </div>
  );
}
