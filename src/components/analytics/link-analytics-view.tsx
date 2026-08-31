"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";

interface LinkAnalyticsViewProps {
  linkId: string;
}

export function LinkAnalyticsView({ linkId }: LinkAnalyticsViewProps) {
  const { t, appName } = useI18n();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [linkId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
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
            onClick={fetchAnalytics}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { link, document: docInfo, metrics, pageStats, sessions } = data;
  const maxDwell = Math.max(...pageStats.map((p: any) => p.dwellSeconds), 1);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard/links"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Links</span>
            </Link>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{link.name}</span>
            {link.isRevoked && (
              <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
                Revoked
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400">
            Slug: <code className="text-amber-400 font-mono">/v/{link.slug}</code> • Target:{" "}
            {docInfo?.title || "Document"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>

          <a
            href={`/api/links/${linkId}/analytics?format=csv`}
            download
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/10"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t.analytics.exportCsv}</span>
          </a>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.analytics.totalViews}</span>
            <BarChart3 className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.totalSessions}</div>
          <div className="text-[10px] text-slate-500 mt-1">Recorded reading sessions</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.analytics.uniqueViewers}</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.uniqueViewers}</div>
          <div className="text-[10px] text-slate-500 mt-1">Anonymously hashed IPs</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Avg. Reading Time</span>
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
            <span className="text-xs font-medium">{t.analytics.avgCompletion}</span>
            <CheckCircle className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.avgCompletionPercent}%</div>
          <div className="text-[10px] text-slate-500 mt-1">Through {docInfo?.pageCount || 1} pages</div>
        </div>
      </div>

      {/* Per-Page Reading Dwell Time Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">{t.analytics.dwellTimeByPage}</h3>
            <p className="text-xs text-slate-400">
              Granular time spent reading each page across all viewers
            </p>
          </div>
        </div>

        {pageStats.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No page views recorded yet.</div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pageStats.map((p: any) => {
                const percentage = Math.round((p.dwellSeconds / maxDwell) * 100);
                return (
                  <div
                    key={p.pageNumber}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">
                        {t.analytics.pageNumber.replace("{num}", String(p.pageNumber))}
                      </span>
                      <span className="font-mono text-amber-400 font-bold">
                        {formatDuration(p.dwellSeconds)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
                        style={{ width: `${Math.max(percentage, 3)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{p.viewCount} view events</span>
                      <span>{percentage}% of peak</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Viewer Session Logs Table (Minimal-PII) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">{t.analytics.viewerLogs}</h3>
            <p className="text-xs text-slate-400">
              Zero-knowledge minimal PII telemetry (IPs are salted-hashed daily)
            </p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No viewer sessions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3 pl-2">{t.analytics.viewerCol}</th>
                  <th className="pb-3">{t.analytics.durationCol}</th>
                  <th className="pb-3">{t.analytics.pagesCol}</th>
                  <th className="pb-3">{t.analytics.deviceCol}</th>
                  <th className="pb-3">{t.analytics.countryCol}</th>
                  <th className="pb-3 pr-2">{t.analytics.dateCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sessions.map((s: any) => {
                  const DeviceIcon =
                    s.uaDevice === "mobile" ? Smartphone : s.uaDevice === "tablet" ? Tablet : Monitor;
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30">
                      <td className="py-3 pl-2 font-medium text-white">
                        {s.viewerEmail ? (
                          <span className="text-amber-400">{s.viewerEmail}</span>
                        ) : (
                          <span className="text-slate-400">Anonymous</span>
                        )}
                      </td>
                      <td className="py-3 font-mono text-slate-300">
                        {formatDuration(s.totalDwellSeconds)}
                      </td>
                      <td className="py-3">
                        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-slate-300">
                          {s.maxPageReached} / {docInfo?.pageCount || 1}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <DeviceIcon className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {s.uaOs} • {s.uaBrowser}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-300">
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-slate-400" />
                          <span>{s.country}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-slate-400 font-mono text-[11px]">
                        {new Date(s.startedAt).toLocaleString()}
                      </td>
                    </tr>
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
