"use client";

import { BrandIcon } from "@/components/brand-icon";
import React, { useState, useEffect } from "react";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { DocUploader } from "@/components/upload/doc-uploader";
import { CreateLinkModal } from "@/components/link-studio/create-link-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useI18n } from "@/lib/i18n/context";
import {
  FileText,
  Plus,
  Trash2,
  Share2,
  Layers,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
  Upload,
} from "lucide-react";

import { syncVaultDocumentKeys, isVaultUnlocked } from "@/lib/vault/master-vault";

export default function DocsPage() {
  const { t } = useI18n();

  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeModalDoc, setActiveModalDoc] = useState<any | null>(null);
  const [versionDoc, setVersionDoc] = useState<any | null>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);

  // In-app Delete Confirmation Dialog State
  const [deleteDocTarget, setDeleteDocTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/docs");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const json = await res.json();
      if (json.documents) {
        setDocs(json.documents);
        if (isVaultUnlocked()) {
          syncVaultDocumentKeys(json.documents).catch(() => {});
        }
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const promptDelete = (id: string, title: string) => {
    setDeleteDocTarget({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDocTarget) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/docs/${deleteDocTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setDocs((prev) => prev.filter((d) => d.id !== deleteDocTarget.id));
        setDeleteDocTarget(null);
      }
    } catch {
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenVersions = async (doc: any) => {
    setVersionDoc(doc);
    const res = await fetch(`/api/docs/${doc.id}/versions`);
    const json = await res.json();
    if (json.versions) setVersionHistory(json.versions);
  };

  return (
    <div className="flex flex-col text-slate-100">

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <BrandIcon size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Encrypted Documents</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero-Knowledge ciphertext stored at rest. Server cannot inspect file bytes.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowUploadModal(!showUploadModal)}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/10"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Visual Storage Allocation & Cost Forecast Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                <span>Encrypted Storage by Type (33)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Backblaze B2 + Neon</span>
            </div>
            <div className="flex items-center justify-center min-h-[220px]">
              <object
                data="/brand/graphs/33-storage-by-type-animated.svg"
                type="image/svg+xml"
                className="w-full h-auto max-h-[240px] object-contain pointer-events-none"
                aria-label="Storage Allocation Donut"
              >
                <img
                  src="/brand/graphs/33-storage-by-type-animated.svg"
                  alt="Storage Allocation Donut"
                  className="w-full h-auto max-h-[240px] object-contain"
                />
              </object>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Zero-Dollar Infrastructure Budget & Quota (38)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Always $0 Free Tier</span>
            </div>
            <div className="flex items-center justify-center min-h-[220px]">
              <object
                data="/brand/graphs/38-cost-forecast-animated.svg"
                type="image/svg+xml"
                className="w-full h-auto max-h-[240px] object-contain pointer-events-none"
                aria-label="Cost & Quota Gauge"
              >
                <img
                  src="/brand/graphs/38-cost-forecast-animated.svg"
                  alt="Cost & Quota Gauge"
                  className="w-full h-auto max-h-[240px] object-contain"
                />
              </object>
            </div>
          </div>
        </div>

        {/* Upload Modal / Collapsible Section */}
        {showUploadModal && (
          <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Upload New PDF</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <DocUploader
              onUploadSuccess={() => {
                fetchDocs();
                setShowUploadModal(false);
              }}
            />
          </div>
        )}

        {/* Docs Table */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800/80">
          {loading && docs.length === 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="pb-3 pl-2">Title</th>
                    <th className="pb-3">Pages</th>
                    <th className="pb-3">Size</th>
                    <th className="pb-3">Version</th>
                    <th className="pb-3">Security Mode</th>
                    <th className="pb-3">Uploaded</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-slate-800" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-44 bg-slate-800 rounded" />
                            <div className="h-2.5 w-28 bg-slate-800/60 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4"><div className="h-3.5 w-8 bg-slate-800 rounded" /></td>
                      <td className="py-4"><div className="h-3.5 w-12 bg-slate-800 rounded" /></td>
                      <td className="py-4"><div className="h-3.5 w-10 bg-slate-800 rounded" /></td>
                      <td className="py-4"><div className="h-3.5 w-20 bg-slate-800 rounded" /></td>
                      <td className="py-4"><div className="h-3.5 w-20 bg-slate-800 rounded" /></td>
                      <td className="py-4 text-right pr-2"><div className="h-6 w-20 bg-slate-800 rounded ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : docs.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No documents uploaded yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Upload your first pitch deck, whitepaper, or confidential file to start sharing with zero-knowledge encryption.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                <span>Upload First Document</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="pb-3.5 pl-3">Title</th>
                    <th className="pb-3.5">Pages</th>
                    <th className="pb-3.5">Size</th>
                    <th className="pb-3.5">Version</th>
                    <th className="pb-3.5">Security Mode</th>
                    <th className="pb-3.5">Uploaded</th>
                    <th className="pb-3.5 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {docs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-4 pl-3 font-medium text-white">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-amber-300 transition-colors max-w-[200px] sm:max-w-xs truncate">
                              {doc.title}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5">
                              {doc.originalFilename}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 text-slate-300 font-mono font-medium">{doc.pageCount}</td>

                      <td className="py-4 text-slate-300 font-mono font-medium">
                        {(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                      </td>

                      <td className="py-4">
                        <button
                          onClick={() => handleOpenVersions(doc)}
                          className="flex items-center gap-1 rounded-lg bg-slate-800/80 px-2.5 py-1 font-mono text-[11px] text-amber-300 hover:bg-slate-700 border border-slate-700/60 shadow-sm transition-all"
                        >
                          <Layers className="h-3 w-3" />
                          <span>v{doc.currentVersion || 1}</span>
                        </button>
                      </td>

                      <td className="py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 shadow-sm">
                          <Lock className="h-2.5 w-2.5" />
                          <span>AES-GCM E2EE</span>
                        </span>
                      </td>

                      <td className="py-4 text-slate-400 text-[11px] font-medium">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 pr-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setActiveModalDoc(doc)}
                          className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm shadow-amber-500/20 transition-all hover:scale-105"
                        >
                          Share
                        </button>

                        <button
                          onClick={() => promptDelete(doc.id, doc.title)}
                          className="rounded-xl p-2 text-slate-400 hover:text-red-300 hover:bg-red-950/40 hover:border-red-500/30 border border-transparent transition-all hover:scale-105"
                          title="Delete Document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create Link Modal */}
      {activeModalDoc && (
        <CreateLinkModal
          docId={activeModalDoc.id}
          docTitle={activeModalDoc.title}
          onClose={() => setActiveModalDoc(null)}
          onCreated={() => {
            fetchDocs();
          }}
        />
      )}

      {/* Version History Modal */}
      {versionDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-400" />
                <span>Version History: {versionDoc.title}</span>
              </h3>
              <button
                onClick={() => setVersionDoc(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="divide-y divide-slate-800 text-xs">
              {versionHistory.map((v) => (
                <div key={v.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Version {v.versionNum}</div>
                    <div className="text-[10px] text-slate-400">{v.changelog || "Upload"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-300 font-mono">
                      {(v.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* In-App Document Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteDocTarget)}
        title="Crypto-Shred Document?"
        message={`Are you sure you want to permanently delete and crypto-shred "${deleteDocTarget?.title || ""}"? All active share links pointing to this document will be instantly destroyed.`}
        confirmLabel="Yes, Crypto-Shred"
        cancelLabel="Keep Document"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) setDeleteDocTarget(null);
        }}
      />
    </div>
  );
}
