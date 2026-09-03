"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useI18n } from "@/lib/i18n/context";
import { formatDuration } from "@/lib/analytics";
import {
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  Download,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  AlertCircle,
  Shield,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Ban,
  Radio,
  Flame,
  Zap,
  Snowflake,
  ChevronDown,
  ChevronUp,
  Sliders,
  Check,
  Search,
  Filter,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  DwellSplineChart,
  RetentionSurvivalChart,
  DeviceDonutChart,
  LeadTemperatureMeter,
  RetentionFunnelSankey,
  HourlyMatrixHeatmap,
  DwellHistogram,
  DwellScatterPlot,
  QuestionDensityHeatmap,
  MetricCorrelationMatrix,
} from "./charts";

interface LinkAnalyticsViewProps {
  linkId: string;
}

export function LinkAnalyticsView({ linkId }: LinkAnalyticsViewProps) {
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [intentFilter, setIntentFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [sessionSearch, setSessionSearch] = useState("");

  const fetchAnalytics = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      const res = await fetch(`/api/links/${linkId}/analytics`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load analytics");
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Live Auto-Refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchAnalytics(true);
    }, 10000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchAnalytics]);

  const handleToggleRevoke = async () => {
    if (!data?.link) return;
    try {
      setRevoking(true);
      const newRevokedState = !data.link.isRevoked;
      const res = await fetch(`/api/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRevoked: newRevokedState }),
      });
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          link: { ...prev.link, isRevoked: newRevokedState },
        }));
      }
    } catch {
    } finally {
      setRevoking(false);
    }
  };

  const { link, document: docInfo, metrics, pageStats, sessions, deviceBreakdown, countryBreakdown } = data || {};
  const maxDwell = Math.max(...(pageStats?.map((p: any) => p.dwellSeconds) || [1]), 1);
  const totalPages = docInfo?.pageCount || 1;

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter((s: any) => {
      const matchesIntent = intentFilter === "all" || s.intent === intentFilter;
      const matchesSearch =
        !sessionSearch.trim() ||
        (s.viewerEmail && s.viewerEmail.toLowerCase().includes(sessionSearch.toLowerCase())) ||
        (s.country && s.country.toLowerCase().includes(sessionSearch.toLowerCase())) ||
        (s.uaDevice && s.uaDevice.toLowerCase().includes(sessionSearch.toLowerCase()));
      return matchesIntent && matchesSearch;
    });
  }, [sessions, intentFilter, sessionSearch]);

  // Funnel calculation
  const funnelStats = useMemo(() => {
    if (!sessions || sessions.length === 0) return { started: 0, midpoint: 0, completed: 0 };
    const total = sessions.length;
    const midpointPage = Math.max(1, Math.ceil(totalPages / 2));
    const started = total;
    const midpoint = sessions.filter((s: any) => s.maxPageReached >= midpointPage).length;
    const completed = sessions.filter((s: any) => s.maxPageReached >= totalPages).length;
    return {
      started: 100,
      midpoint: Math.round((midpoint / total) * 100),
      completed: Math.round((completed / total) * 100),
      rawStarted: started,
      rawMidpoint: midpoint,
      rawCompleted: completed,
    };
  }, [sessions, totalPages]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-xs text-slate-400">Loading Document Tracking Intelligence...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <h3 className="text-base font-bold text-white mb-2">Error Loading Analytics</h3>
          <p className="text-xs text-slate-300 mb-4">{error}</p>
          <button
            onClick={() => fetchAnalytics(false)}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalDev = (deviceBreakdown?.desktop || 0) + (deviceBreakdown?.mobile || 0) + (deviceBreakdown?.tablet || 0) || 1;
  const desktopPct = Math.round(((deviceBreakdown?.desktop || 0) / totalDev) * 100);
  const mobilePct = Math.round(((deviceBreakdown?.mobile || 0) / totalDev) * 100);
  const tabletPct = Math.round(((deviceBreakdown?.tablet || 0) / totalDev) * 100);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 border border-amber-500/40 p-1.5 shadow-md shadow-amber-500/20 shrink-0">
            <object
              data="/brand/02-favicon.svg"
              type="image/svg+xml"
              className="h-full w-full object-contain pointer-events-none"
              aria-label="BlindShare Logo"
            >
              <img
                src="/brand/02-favicon.svg"
                alt="BlindShare"
                className="h-full w-full object-contain"
              />
            </object>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/dashboard/links"
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Links</span>
              </Link>
              <span className="text-slate-600">•</span>
              <Link
                href="/dashboard/analytics"
                className="text-xs text-slate-400 hover:text-amber-400 transition"
              >
                All Analytics Hub
              </Link>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{link.name}</span>
              {link.isRevoked ? (
                <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
                  Link Revoked (Kill Switch Active)
                </span>
              ) : metrics.activeNow > 0 ? (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {metrics.activeNow} Reading Right Now
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Slug: <code className="text-amber-400 font-mono">/v/{link.slug}</code> • Target:{" "}
              <span className="text-slate-200 font-medium">{docInfo?.title || "Document"}</span> ({totalPages} pages)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live Auto-Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
              autoRefresh
                ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-emerald-400" : "bg-slate-600"}`} />
            <span>{autoRefresh ? "Live (10s)" : "Auto Off"}</span>
          </button>

          {/* Kill switch / revoke toggle */}
          <button
            onClick={handleToggleRevoke}
            disabled={revoking}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
              link.isRevoked
                ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40"
                : "border-red-500/30 bg-red-950/30 text-red-300 hover:bg-red-900/40"
            }`}
            title={link.isRevoked ? "Un-revoke this link" : "Instantly revoke access for all viewers"}
          >
            <Ban className="h-3.5 w-3.5" />
            <span>{link.isRevoked ? "Restore Access" : "Kill Link (Revoke)"}</span>
          </button>

          <button
            onClick={() => fetchAnalytics(false)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>

          <a
            href={`/api/links/${linkId}/analytics?format=csv`}
            download
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Reading Sessions</span>
            <BarChart3 className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.totalSessions}</div>
          <div className="text-[10px] text-slate-500 mt-1">Recorded viewer visits</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Unique Viewers</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.uniqueViewers}</div>
          <div className="text-[10px] text-slate-500 mt-1">Anonymously hashed IPs</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Avg. Dwell Time</span>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatDuration(metrics.avgDwellSeconds)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Total: {formatDuration(metrics.totalDwellSeconds)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Avg. Completion</span>
            <CheckCircle className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.avgCompletionPercent}%</div>
          <div className="text-[10px] text-slate-500 mt-1">Across {totalPages} pages</div>
        </div>
      </div>

      {/* Reader Funnel Drop-off Analysis (Enterprise Analytics) */}
      <RetentionFunnelSankey sessions={sessions || []} totalPages={totalPages} />

      {/* Reader Retention Survival Curve (Drop-off & Churn Analysis) */}
      <RetentionSurvivalChart sessions={sessions} totalPages={totalPages} />

      {/* Interactive Spline Dwell Velocity Chart */}
      <DwellSplineChart pageStats={pageStats} totalPages={totalPages} />

      {/* Per-Page Reading Dwell Time Chart (Papermark Heatmap Style) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-400" />
              <span>Page-by-Page Dwell Heatmap</span>
            </h3>
            <p className="text-xs text-slate-400">
              Granular time spent reading each page across all viewers
            </p>
          </div>
        </div>

        {pageStats?.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No page views recorded yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
            {pageStats?.map((p: any) => {
              const percentage = Math.round((p.dwellSeconds / maxDwell) * 100);
              return (
                <div
                  key={p.pageNumber}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      Page {p.pageNumber}
                    </span>
                    <span className="font-mono text-amber-400 font-bold">
                      {formatDuration(p.dwellSeconds)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{p.viewCount} reads</span>
                    <span>{percentage}% of peak</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2-Column Middle Row: Interactive Device Donut & Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Interactive Device Donut Chart */}
        <DeviceDonutChart
          deviceCounts={deviceBreakdown || { desktop: 0, mobile: 0, tablet: 0 }}
          totalSessions={metrics.totalSessions}
        />

        {/* Top Locations */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-400" />
              <span>Top Reader Locations</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Geographic reader distribution across countries
            </p>
          </div>
          {countryBreakdown?.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">No location data yet</div>
          ) : (
            <div className="space-y-3">
              {countryBreakdown?.map((c: any) => (
                <div key={c.country} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium truncate">{c.country}</span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {c.count} view{c.count === 1 ? "" : "s"} ({c.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950 border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      style={{ width: `${Math.max(c.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-2">
            Anonymously aggregated IP geolocation (zero PII storage)
          </div>
        </div>
      </div>

      {/* AI Lead Temperature & Score Matrix */}
      <LeadTemperatureMeter
        sessions={sessions || []}
        currentFilter={intentFilter}
        onFilterChange={setIntentFilter}
      />

      {/* 24x7 Reading Heatmap Matrix */}
      <HourlyMatrixHeatmap sessions={sessions || []} />

      {/* Dwell Scatter Plot: Dwell Time vs Completion Matrix */}
      <DwellScatterPlot sessions={sessions || []} totalPages={totalPages} />

      {/* In-Doc Slide Question Density Heatmap */}
      <QuestionDensityHeatmap questions={data?.questions || []} totalPages={totalPages} />

      {/* Dwell Time Distribution Buckets & Metric Correlation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DwellHistogram sessions={sessions || []} />
        <MetricCorrelationMatrix />
      </div>

      {/* Viewer Session Logs Table (Interactive with Intent Filter & Page Breakdown) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              <span>Viewer Sessions & Lead Intelligence</span>
            </h3>
            <p className="text-xs text-slate-400">
              Click any session to view that reader's specific per-page dwell time
            </p>
          </div>

          {/* Search and Intent Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                placeholder="Search email, country..."
                className="rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-[11px]">
              <button
                onClick={() => setIntentFilter("all")}
                className={`px-2.5 py-1 rounded-md transition ${intentFilter === "all" ? "bg-slate-800 text-white font-bold" : "text-slate-400"}`}
              >
                All
              </button>
              <button
                onClick={() => setIntentFilter("high")}
                className={`px-2.5 py-1 rounded-md transition ${intentFilter === "high" ? "bg-red-500/20 text-red-300 font-bold border border-red-500/30" : "text-slate-400"}`}
              >
                🔥 High
              </button>
              <button
                onClick={() => setIntentFilter("medium")}
                className={`px-2.5 py-1 rounded-md transition ${intentFilter === "medium" ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30" : "text-slate-400"}`}
              >
                ⚡ Engaged
              </button>
              <button
                onClick={() => setIntentFilter("low")}
                className={`px-2.5 py-1 rounded-md transition ${intentFilter === "low" ? "bg-slate-800 text-slate-300 font-bold" : "text-slate-400"}`}
              >
                ❄️ Skimmed
              </button>
            </div>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No viewer sessions match your filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3 pl-2">Status</th>
                  <th className="pb-3">Viewer</th>
                  <th className="pb-3">Reading Dwell</th>
                  <th className="pb-3">Pages Read</th>
                  <th className="pb-3">Intent Score</th>
                  <th className="pb-3">Device / Geo</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 pr-2 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSessions.map((s: any) => {
                  const isExpanded = expandedSessionId === s.id;
                  const DeviceIcon =
                    s.uaDevice === "mobile" ? Smartphone : s.uaDevice === "tablet" ? Tablet : Monitor;
                  return (
                    <React.Fragment key={s.id}>
                      <tr
                        onClick={() => setExpandedSessionId(isExpanded ? null : s.id)}
                        className="hover:bg-slate-800/30 transition cursor-pointer"
                      >
                        <td className="py-3 pl-2">
                          {s.isLive ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                              Live
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">Ended</span>
                          )}
                        </td>

                        <td className="py-3 font-medium text-white">
                          {s.viewerEmail ? (
                            <span className="text-amber-400 font-semibold">{s.viewerEmail}</span>
                          ) : (
                            <span className="text-slate-400">Anonymous</span>
                          )}
                        </td>

                        <td className="py-3 font-mono text-slate-300">
                          {s.formattedDwell}
                        </td>

                        <td className="py-3">
                          <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-slate-300">
                            {s.maxPageReached} / {totalPages} ({s.completionRate}%)
                          </span>
                        </td>

                        <td className="py-3">
                          {s.intentScore !== undefined ? (
                            <div className="flex flex-col items-start gap-0.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                  s.intentScore >= 75
                                    ? "bg-red-500/20 text-red-300 border-red-500/30"
                                    : s.intentScore >= 45
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                    : "bg-slate-800 text-slate-400 border-slate-700"
                                }`}
                              >
                                {s.intentScore >= 75 ? (
                                  <Flame className="h-3 w-3 text-red-400" />
                                ) : s.intentScore >= 45 ? (
                                  <Zap className="h-3 w-3 text-amber-400" />
                                ) : (
                                  <Snowflake className="h-3 w-3 text-slate-500" />
                                )}
                                <span>{s.intentScore}% Score</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                                {s.intentScore >= 75 ? "🔥 Hot Deal" : s.intentScore >= 45 ? "⚡ Engaged" : "👀 Skimmed"}
                              </span>
                            </div>
                          ) : s.intent === "high" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
                              <Flame className="h-3 w-3 text-red-400" />
                              High Intent
                            </span>
                          ) : s.intent === "medium" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                              <Zap className="h-3 w-3 text-amber-400" />
                              Engaged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] text-slate-400 border border-slate-700">
                              <Snowflake className="h-3 w-3 text-slate-500" />
                              Skimmed
                            </span>
                          )}
                        </td>

                        <td className="py-3 text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <DeviceIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                              {s.uaOs} • {s.country}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 text-slate-400 font-mono text-[11px]">
                          {new Date(s.startedAt).toLocaleString()}
                        </td>

                        <td className="py-3 pr-2 text-right">
                          <button className="text-slate-400 hover:text-white p-1">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Page-by-Page breakdown & AI Key Insights */}
                      {isExpanded && (
                        <tr className="bg-slate-950/80">
                          <td colSpan={8} className="p-4 border-y border-slate-800/80">
                            <div className="space-y-3">
                              {/* AI Lead Summary & Signals */}
                              {s.intentInsights && s.intentInsights.length > 0 && (
                                <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3 space-y-1.5">
                                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                                    <span>AI Intent Intelligence & Signals</span>
                                    {s.intentScore !== undefined && (
                                      <span className="rounded-full bg-amber-500/20 px-2 py-0.2 text-[10px] font-mono font-bold text-amber-300">
                                        {s.intentScore}/100 Conviction
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {s.intentInsights.map((insight: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300"
                                      >
                                        💡 {insight}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                                <span>Reader Dwell Per Page Breakdown ({s.viewerEmail || "Anonymous"})</span>
                                <span className="text-[11px] text-slate-500 font-normal">
                                  Session ID: {s.id.substring(0, 16)}...
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                                  const pageDwell = s.pageBreakdown?.[pg] || 0;
                                  return (
                                    <div
                                      key={pg}
                                      className={`rounded-lg border p-2 text-center text-xs ${
                                        pageDwell > 0
                                          ? "border-amber-500/30 bg-amber-950/20 text-amber-200"
                                          : "border-slate-800 bg-slate-900 text-slate-500"
                                      }`}
                                    >
                                      <div className="text-[10px] text-slate-400">Page {pg}</div>
                                      <div className="font-mono font-bold mt-0.5">
                                        {formatDuration(pageDwell)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
