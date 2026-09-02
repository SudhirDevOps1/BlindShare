"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import {
  BarChart3,
  Users,
  Clock,
  CheckCircle2,
  RefreshCw,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
  Flame,
  Zap,
  Snowflake,
  Radio,
  FileText,
  Eye,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function GlobalAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchOverview = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      const res = await fetch("/api/analytics/overview");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load overview");
      setData(json);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.message || "Failed to load overview");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Live Auto-Refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchOverview(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchOverview]);

  if (loading && !data) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
        <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            <p className="text-xs text-slate-400">Loading Live Document Intelligence...</p>
          </div>
        </main>
      </div>
    );
  }

  const { metrics, topDocuments, recentSessions, deviceBreakdown, countryBreakdown } = data || {
    metrics: { totalViews: 0, uniqueViewers: 0, totalDwellSeconds: 0, avgDwellSeconds: 0, activeNow: 0, totalLinks: 0, totalDocuments: 0 },
    topDocuments: [],
    recentSessions: [],
    deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
    countryBreakdown: [],
  };

  const totalDevices = (deviceBreakdown.desktop || 0) + (deviceBreakdown.mobile || 0) + (deviceBreakdown.tablet || 0) || 1;
  const desktopPct = Math.round(((deviceBreakdown.desktop || 0) / totalDevices) * 100);
  const mobilePct = Math.round(((deviceBreakdown.mobile || 0) / totalDevices) * 100);
  const tabletPct = Math.round(((deviceBreakdown.tablet || 0) / totalDevices) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 space-y-6">
        {/* Top Header & Live Pulse Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Analytics & Live Tracking</h1>
              {metrics.activeNow > 0 ? (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  {metrics.activeNow} Live {metrics.activeNow === 1 ? "Reader" : "Readers"}
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-slate-800/80 px-2.5 py-0.5 text-xs text-slate-400 border border-slate-700">
                  <Radio className="h-3 w-3 text-slate-500" />
                  Ready
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time Papermark-grade viewer dwell, lead scoring & document heatmaps
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Auto-Refresh Switch */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                autoRefresh
                  ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                  : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
              title="Toggle 10s auto-refresh"
            >
              <span className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-emerald-400" : "bg-slate-600"}`} />
              <span>{autoRefresh ? "Live Auto-Update (10s)" : "Auto-Update Off"}</span>
            </button>

            <button
              onClick={() => fetchOverview(false)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 4 Main KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Total Document Views</span>
              <Eye className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">{metrics.totalViews}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Across {metrics.totalLinks} active links</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Unique Readers</span>
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">{metrics.uniqueViewers}</div>
            <div className="text-[11px] text-slate-400 mt-1">Salted & anonymized client hashes</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Avg. Reading Dwell</span>
              <Clock className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">
              {Math.floor(metrics.avgDwellSeconds / 60)}m {metrics.avgDwellSeconds % 60}s
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Total: {Math.floor(metrics.totalDwellSeconds / 60)} mins read
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Active Right Now</span>
              <Radio className={`h-4 w-4 ${metrics.activeNow > 0 ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
            </div>
            <div className={`text-3xl font-bold tracking-tight ${metrics.activeNow > 0 ? "text-emerald-400" : "text-white"}`}>
              {metrics.activeNow}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Reading within last 60 seconds</div>
          </div>
        </div>

        {/* 2-Column Middle Grid: Top Documents & Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Performing Documents (2 Cols) */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-400" />
                  <span>Top Performing Documents</span>
                </h3>
                <p className="text-xs text-slate-400">Ranked by view count and reader dwell time</p>
              </div>
              <Link
                href="/dashboard/docs"
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
              >
                <span>View all docs</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {topDocuments.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No documents uploaded yet. Upload a document to start tracking!
              </div>
            ) : (
              <div className="space-y-3">
                {topDocuments.map((doc: any, idx: number) => (
                  <div
                    key={doc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-bold text-amber-400 border border-amber-500/20">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-semibold text-white truncate max-w-[280px]">
                          {doc.title}
                        </h4>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{doc.pageCount} pages</span>
                          <span>•</span>
                          <span>{doc.linkCount} share links</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="text-white font-bold">{doc.viewCount} views</div>
                        <div className="text-[10px] text-slate-400">{doc.formattedDwell}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Platform & Geographic Distribution (1 Col) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-400" />
                <span>Audience Demographics</span>
              </h3>
              <p className="text-xs text-slate-400">Device types & top reader locations</p>
            </div>

            {/* Device breakdown bars */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-300">Device Breakdown</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Monitor className="h-3.5 w-3.5 text-blue-400" /> Desktop
                  </span>
                  <span className="font-mono text-slate-400">{desktopPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-blue-500" style={{ width: `${desktopPct}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Smartphone className="h-3.5 w-3.5 text-emerald-400" /> Mobile
                  </span>
                  <span className="font-mono text-slate-400">{mobilePct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-emerald-500" style={{ width: `${mobilePct}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Tablet className="h-3.5 w-3.5 text-purple-400" /> Tablet
                  </span>
                  <span className="font-mono text-slate-400">{tabletPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-purple-500" style={{ width: `${tabletPct}%` }} />
                </div>
              </div>
            </div>

            {/* Country breakdown */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-300">Top Locations</div>
              {countryBreakdown.length === 0 ? (
                <div className="text-[11px] text-slate-500">No geo data yet</div>
              ) : (
                <div className="space-y-1.5">
                  {countryBreakdown.map((c: any) => (
                    <div key={c.country} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 truncate max-w-[140px]">{c.country}</span>
                      <span className="font-mono text-slate-400">{c.count} views</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Real-time Activity Feed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Live Activity Stream</span>
              </h3>
              <p className="text-xs text-slate-400">
                Real-time sessions with Papermark-grade intent scoring (High, Medium, Skimmed)
              </p>
            </div>
          </div>

          {recentSessions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No view sessions recorded yet. Share a document link to see live views!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="pb-3 pl-2">Status</th>
                    <th className="pb-3">Viewer</th>
                    <th className="pb-3">Document / Link</th>
                    <th className="pb-3">Reading Dwell</th>
                    <th className="pb-3">Progress</th>
                    <th className="pb-3">Intent Score</th>
                    <th className="pb-3">Device / Geo</th>
                    <th className="pb-3 pr-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentSessions.map((s: any) => {
                    const DeviceIcon =
                      s.device === "mobile" ? Smartphone : s.device === "tablet" ? Tablet : Monitor;
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 pl-2">
                          {s.isLive ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                              Reading Now
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">Completed</span>
                          )}
                        </td>

                        <td className="py-3.5 font-medium text-white">
                          {s.viewerEmail ? (
                            <span className="text-amber-400 font-semibold">{s.viewerEmail}</span>
                          ) : (
                            <span className="text-slate-400">Anonymous</span>
                          )}
                        </td>

                        <td className="py-3.5">
                          <div className="text-white font-medium truncate max-w-[180px]">{s.docTitle}</div>
                          <div className="text-[10px] text-slate-500 font-mono">/v/{s.linkSlug}</div>
                        </td>

                        <td className="py-3.5 font-mono text-slate-300">{s.formattedDwell}</td>

                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full bg-amber-500"
                                style={{ width: `${s.completionRate}%` }}
                              />
                            </div>
                            <span className="font-mono text-slate-400 text-[11px]">
                              {s.maxPageReached}/{s.docPages} ({s.completionRate}%)
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5">
                          {s.intent === "high" ? (
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

                        <td className="py-3.5 text-slate-300">
                          <div className="flex items-center gap-1 text-[11px]">
                            <DeviceIcon className="h-3 w-3 text-slate-400" />
                            <span>{s.country}</span>
                          </div>
                        </td>

                        <td className="py-3.5 pr-2 text-right">
                          <Link
                            href={`/dashboard/analytics/${s.linkId}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-amber-500/40 hover:text-amber-400 transition"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
