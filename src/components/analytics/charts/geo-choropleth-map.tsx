"use client";

import React, { useMemo } from "react";
import { Globe, Radio, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface GeoChoroplethMapProps {
  countryBreakdown?: { country: string; views: number }[];
}

export function GeoChoroplethMap({ countryBreakdown = [] }: GeoChoroplethMapProps) {
  const { t } = useI18n();

  // Normalized sample locations if none provided
  const countries = useMemo(() => {
    if (countryBreakdown && countryBreakdown.length > 0) {
      return countryBreakdown;
    }
    return [
      { country: "US", views: 48 },
      { country: "IN", views: 32 },
      { country: "GB", views: 19 },
      { country: "DE", views: 14 },
      { country: "SG", views: 11 },
      { country: "CA", views: 8 },
    ];
  }, [countryBreakdown]);

  const totalViews = countries.reduce((acc, c) => acc + c.views, 0);

  // Key city coords for SVG world map projection
  const pulseBeacons = [
    { city: "San Francisco", x: 130, y: 110, country: "US" },
    { city: "New York", x: 200, y: 105, country: "US" },
    { city: "London", x: 380, y: 85, country: "GB" },
    { city: "Berlin", x: 410, y: 80, country: "DE" },
    { city: "Bengaluru", x: 540, y: 155, country: "IN" },
    { city: "Singapore", x: 590, y: 175, country: "SG" },
    { city: "Tokyo", x: 670, y: 115, country: "JP" },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t.charts?.geoMap?.title || "Global Investor Distribution & Live Radar"}
            </h3>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 animate-pulse">
              <Radio className="h-3 w-3 animate-ping" />
              <span>{t.charts?.geoMap?.liveSessions || "Live Active Readers"}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.charts?.geoMap?.subtitle || "Real-time geographic dwell and anonymous location density"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
        {/* SVG World Map stylized graphic */}
        <div className="lg:col-span-2 relative rounded-xl border border-slate-800 bg-slate-950/80 p-4 overflow-hidden min-h-[220px] flex items-center justify-center">
          <svg viewBox="0 0 800 350" className="w-full h-auto opacity-70">
            <defs>
              <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Continents abstract silhouette dots */}
            <g fill="#334155" opacity="0.45">
              {/* North America */}
              <circle cx="150" cy="110" r="28" />
              <circle cx="180" cy="90" r="35" />
              <circle cx="210" cy="115" r="25" />
              <circle cx="140" cy="140" r="18" />

              {/* South America */}
              <circle cx="240" cy="220" r="25" />
              <circle cx="255" cy="260" r="30" />
              <circle cx="245" cy="300" r="18" />

              {/* Europe */}
              <circle cx="390" cy="85" r="20" />
              <circle cx="420" cy="95" r="24" />

              {/* Africa */}
              <circle cx="410" cy="170" r="35" />
              <circle cx="430" cy="230" r="30" />

              {/* Asia */}
              <circle cx="530" cy="110" r="45" />
              <circle cx="600" cy="100" r="50" />
              <circle cx="540" cy="160" r="30" />
              <circle cx="610" cy="170" r="22" />

              {/* Australia */}
              <circle cx="650" cy="260" r="26" />
            </g>

            {/* Latitude / Longitude subtle gridlines */}
            <line x1="0" y1="175" x2="800" y2="175" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="1" />
            <line x1="400" y1="0" x2="400" y2="350" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="1" />

            {/* Pulsing Active Investor Beacons */}
            {pulseBeacons.map((beacon, idx) => (
              <g key={idx} className="cursor-pointer">
                {/* Ping wave */}
                <circle cx={beacon.x} cy={beacon.y} r="14" fill="url(#radarGlow)">
                  <animate attributeName="r" values="4;18;24" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0.3;0" dur="2.5s" repeatCount="indefinite" />
                </circle>

                {/* Core dot */}
                <circle cx={beacon.x} cy={beacon.y} r="4" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
                <text
                  x={beacon.x + 8}
                  y={beacon.y + 3}
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                  className="select-none pointer-events-none"
                >
                  {beacon.city}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Ranked Country Breakdown Table */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-slate-800">
            <span>{t.charts?.geoMap?.topCountries || "Top Investor Countries"}</span>
            <span className="font-mono text-slate-400">{totalViews} views</span>
          </div>

          <div className="space-y-2">
            {countries.slice(0, 6).map((c) => {
              const pct = Math.round((c.views / Math.max(totalViews, 1)) * 100);
              return (
                <div key={c.country} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      {c.country.toUpperCase()}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {c.views} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
