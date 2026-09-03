import { BrandIcon } from "@/components/brand-icon";
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { DocUploader } from "@/components/upload/doc-uploader";
import { CreateLinkModal } from "@/components/link-studio/create-link-modal";
import { DashboardActivityChart } from "@/components/dashboard/dashboard-activity-chart";
import {
  WeeklyKpiDigest,
  HourlyMatrixHeatmap,
  TopLinksLeaderboard,
} from "@/components/analytics/charts";
import { useI18n } from "@/lib/i18n/context";
import {
  FileText,
  Link as LinkIcon,
  BarChart3,
  HardDrive,
  Plus,
  ArrowRight,
  Clock,
  Eye,
  Shield,
  ExternalLink,
  Lock,
} from "lucide-react";

export default function DashboardPage() {
  const { t } = useI18n();

  const [docs, setDocs] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeModalDoc, setActiveModalDoc] = useState<any | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [docsRes, linksRes, analyticsRes] = await Promise.all([
        fetch("/api/docs"),
        fetch("/api/links"),
        fetch("/api/analytics/overview"),
      ]);
      const docsJson = await docsRes.json();
      const linksJson = await linksRes.json();
      const analyticsJson = await analyticsRes.json();

      if (docsJson.documents) setDocs(docsJson.documents);
      if (linksJson.links) setLinks(linksJson.links);
      if (analyticsJson && !analyticsJson.error) setAnalyticsData(analyticsJson);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalStorageBytes = docs.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
  const totalStorageMb = (totalStorageBytes / (1024 * 1024)).toFixed(1);
  const totalViews = links.reduce((acc, l) => acc + (l.viewCount || 0), 0);

  return (
    <div className="flex flex-col text-slate-100">

      <main className="flex-1 mx-auto max-w-7xl w-full px-3.5 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8 relative">
        {/* Ambient Top Glow Effect */}
        <div className="absolute top-4 right-1/4 -z-10 h-72 w-96 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <BrandIcon size="lg" />
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{t.dashboard.welcome}</h1>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Zero-Knowledge Client-Side Encrypted Workspace</span>
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/docs"
            className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-200 w-full sm:w-auto shrink-0"
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>Upload New Document</span>
          </Link>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Docs */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 sm:p-5 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 group cursor-default">
            <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/25 transition-all duration-500 pointer-events-none" />
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-300">{t.dashboard.totalDocs}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-sm group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{docs.length}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Client-side encrypted</span>
            </div>
          </div>

          {/* Card 2: Active Links */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 sm:p-5 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 group cursor-default">
            <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/25 transition-all duration-500 pointer-events-none" />
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-300">{t.dashboard.activeLinks}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-sm group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                <LinkIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {links.filter((l) => l.isActive && !l.isRevoked).length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span>{links.length} total links generated</span>
            </div>
          </div>

          {/* Card 3: Total Page Views */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 sm:p-5 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 group cursor-default">
            <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/25 transition-all duration-500 pointer-events-none" />
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-300">{t.dashboard.totalViews}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                <BarChart3 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{totalViews}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Across all share links</span>
            </div>
          </div>

          {/* Card 4: Encrypted Storage */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 sm:p-5 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 group cursor-default">
            <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl group-hover:bg-purple-500/25 transition-all duration-500 pointer-events-none" />
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-300">{t.dashboard.storageUsage}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-sm group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
                <HardDrive className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{totalStorageMb} MB</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span>₹0 Free Tier Budget</span>
            </div>
          </div>
        </div>

        {/* Executive Weekly KPI Digest: Real metrics from DuckDB/PostgreSQL viewSessions */}
        <WeeklyKpiDigest
          metrics={
            analyticsData?.metrics || {
              totalViews,
              activeNow: 0,
              avgDwellSeconds: 0,
            }
          }
        />

        {/* 7-Day Velocity Chart & Infrastructure Gauges with Real Daily Views */}
        <DashboardActivityChart
          docs={docs}
          links={links}
          totalStorageBytes={totalStorageBytes}
          dailyViews={analyticsData?.dailyViews}
          dbSizeBytes={analyticsData?.metrics?.dbSizeBytes}
        />

        {/* Real-time Pitch Deck Send Time Matrix & Top Decks Velocity Leaderboard */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <HourlyMatrixHeatmap sessions={analyticsData?.recentSessions || []} />
          <TopLinksLeaderboard links={links} linkPerformance={analyticsData?.linkPerformance || []} />
        </div>

        {/* Quick Upload Box */}
        <div>
          <h3 className="text-sm font-bold text-white mb-3">Quick Document Upload</h3>
          <DocUploader
            onUploadSuccess={(doc) => {
              fetchDashboardData();
            }}
          />
        </div>

        {/* 2-Column Split: Recent Documents & Recent Links */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Docs */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{t.dashboard.recentDocs}</h3>
              <Link
                href="/dashboard/docs"
                className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 group"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {docs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">{t.dashboard.noDocs}</div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {docs.slice(0, 4).map((doc) => (
                  <div key={doc.id} className="py-3 px-3 -mx-3 rounded-xl flex items-center justify-between hover:bg-slate-800/40 transition-colors duration-200 group">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white max-w-[180px] sm:max-w-xs truncate group-hover:text-amber-300 transition-colors">
                          {doc.title}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {doc.pageCount} pages • v{doc.currentVersion} • {(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveModalDoc(doc)}
                      className="rounded-xl bg-slate-800/90 border border-slate-700/60 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-400 active:scale-95 transition-all shadow-sm"
                    >
                      Create Link
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Links */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{t.dashboard.recentLinks}</h3>
              <Link
                href="/dashboard/links"
                className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 group"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {links.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">{t.dashboard.noLinks}</div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {links.slice(0, 4).map((link) => (
                  <div key={link.id} className="py-3 px-3 -mx-3 rounded-xl flex items-center justify-between hover:bg-slate-800/40 transition-colors duration-200 group">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                        <LinkIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white max-w-[180px] sm:max-w-xs truncate group-hover:text-blue-300 transition-colors">
                          {link.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          /v/{link.slug} • {link.viewCount} views
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/analytics/${link.id}`}
                      className="rounded-xl bg-slate-800/90 border border-slate-700/60 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white active:scale-95 transition-all shadow-sm"
                    >
                      Analytics
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Link Modal */}
      {activeModalDoc && (
        <CreateLinkModal
          docId={activeModalDoc.id}
          docTitle={activeModalDoc.title}
          onClose={() => setActiveModalDoc(null)}
          onCreated={() => {
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
