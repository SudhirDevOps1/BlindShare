"use client";

import React, { useState, useEffect } from "react";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { DocUploader } from "@/components/upload/doc-uploader";
import { CreateLinkModal } from "@/components/link-studio/create-link-modal";
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

export default function DocsPage() {
  const { t } = useI18n();

  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeModalDoc, setActiveModalDoc] = useState<any | null>(null);
  const [versionDoc, setVersionDoc] = useState<any | null>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/docs");
      const json = await res.json();
      if (json.documents) setDocs(json.documents);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to crypto-shred and permanently delete "${title}"?`)) {
      return;
    }
    const res = await fetch(`/api/docs/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchDocs();
    }
  };

  const handleOpenVersions = async (doc: any) => {
    setVersionDoc(doc);
    const res = await fetch(`/api/docs/${doc.id}/versions`);
    const json = await res.json();
    if (json.versions) setVersionHistory(json.versions);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <BrandHeader />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Encrypted Documents</h1>
            <p className="text-xs text-slate-400 mt-1">
              Zero-Knowledge ciphertext stored at rest. Server cannot inspect file bytes.
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(!showUploadModal)}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/10"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
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
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          {loading && docs.length === 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 font-semibold">
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
            <div className="py-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No documents uploaded yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload your first pitch deck, whitepaper, or confidential document.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Upload PDF
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 font-semibold">
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
                  {docs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/30">
                      <td className="py-3.5 pl-2 font-medium text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white max-w-[200px] sm:max-w-xs truncate">
                              {doc.title}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                              {doc.originalFilename}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 text-slate-300 font-mono">{doc.pageCount}</td>

                      <td className="py-3.5 text-slate-300 font-mono">
                        {(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                      </td>

                      <td className="py-3.5">
                        <button
                          onClick={() => handleOpenVersions(doc)}
                          className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-amber-400 hover:bg-slate-700"
                        >
                          <Layers className="h-3 w-3" />
                          <span>v{doc.currentVersion}</span>
                        </button>
                      </td>

                      <td className="py-3.5">
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                          {doc.encryptionMode}
                        </span>
                      </td>

                      <td className="py-3.5 text-slate-400 text-[11px]">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 pr-2 text-right space-x-2">
                        <button
                          onClick={() => setActiveModalDoc(doc)}
                          className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                        >
                          Create Link
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id, doc.title)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40"
                          title="Crypto-shred document"
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

      <BrandFooter />
    </div>
  );
}
