"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { DocUploader } from "@/components/upload/doc-uploader";
import { CreateLinkModal } from "@/components/link-studio/create-link-modal";
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
  const [loading, setLoading] = useState(true);
  const [activeModalDoc, setActiveModalDoc] = useState<any | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [docsRes, linksRes] = await Promise.all([
        fetch("/api/docs"),
        fetch("/api/links"),
      ]);
      const docsJson = await docsRes.json();
      const linksJson = await linksRes.json();

      if (docsJson.documents) setDocs(docsJson.documents);
      if (linksJson.links) setLinks(linksJson.links);
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

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t.dashboard.welcome}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Zero-Knowledge Client-Side Encrypted Workspace
            </p>
          </div>
          <Link
            href="/dashboard/docs"
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/10 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Upload New Document</span>
          </Link>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">{t.dashboard.totalDocs}</span>
              <FileText className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{docs.length}</div>
            <div className="text-[10px] text-slate-500 mt-1">Client-side encrypted</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">{t.dashboard.activeLinks}</span>
              <LinkIcon className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {links.filter((l) => l.isActive && !l.isRevoked).length}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">{links.length} total links generated</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">{t.dashboard.totalViews}</span>
              <BarChart3 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalViews}</div>
            <div className="text-[10px] text-slate-500 mt-1">Across all share links</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">{t.dashboard.storageUsage}</span>
              <HardDrive className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalStorageMb} MB</div>
            <div className="text-[10px] text-slate-500 mt-1">₹0 Free Tier Budget</div>
          </div>
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
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{t.dashboard.recentDocs}</h3>
              <Link
                href="/dashboard/docs"
                className="text-xs text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {docs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">{t.dashboard.noDocs}</div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {docs.slice(0, 4).map((doc) => (
                  <div key={doc.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white max-w-[180px] sm:max-w-xs truncate">
                          {doc.title}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {doc.pageCount} pages • v{doc.currentVersion} • {(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveModalDoc(doc)}
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-amber-400 hover:bg-slate-700"
                    >
                      Create Link
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Links */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{t.dashboard.recentLinks}</h3>
              <Link
                href="/dashboard/links"
                className="text-xs text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {links.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">{t.dashboard.noLinks}</div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {links.slice(0, 4).map((link) => (
                  <div key={link.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                        <LinkIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white max-w-[180px] sm:max-w-xs truncate">
                          {link.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          /v/{link.slug} • {link.viewCount} views
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/analytics/${link.id}`}
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700"
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
