"use client";

import { BrandIcon } from "@/components/brand-icon";
import React, { useEffect, useState } from "react";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { CreateLinkModal } from "@/components/link-studio/create-link-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useI18n } from "@/lib/i18n/context";
import { FolderLock, Plus, Trash2, Share2, FileText, Loader2 } from "lucide-react";

export default function DataroomsPage() {
  const { t } = useI18n();

  const [datarooms, setDatarooms] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [linkModalRoom, setLinkModalRoom] = useState<any | null>(null);

  // In-app Delete Confirmation Dialog State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetDataroom, setTargetDataroom] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [drRes, docRes] = await Promise.all([fetch("/api/datarooms"), fetch("/api/docs")]);
      if (drRes.status === 401 || docRes.status === 401) {
        window.location.href = "/login";
        return;
      }
      const drJson = await drRes.json();
      const docJson = await docRes.json();
      if (drJson.datarooms) setDatarooms(drJson.datarooms);
      if (docJson.documents) setDocs(docJson.documents);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !name.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/datarooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), docIds: selectedDocs }),
      });
      if (res.ok) {
        setName("");
        setDescription("");
        setSelectedDocs([]);
        setShowCreate(false);
        await load();
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const promptDelete = (id: string, roomName: string) => {
    setTargetDataroom({ id, name: roomName });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetDataroom) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/datarooms/${targetDataroom.id}`, { method: "DELETE" });
      if (res.ok) {
        setDatarooms((prev) => prev.filter((d) => d.id !== targetDataroom.id));
        setDeleteModalOpen(false);
        setTargetDataroom(null);
      }
    } catch {
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col text-slate-100">

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <BrandIcon size="lg" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Secure Datarooms</h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Bundle multiple encrypted documents behind a single gated link with clickwrap NDA support.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/10 hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            <span>New Dataroom</span>
          </button>
        </div>

        {/* Visual Due Diligence Pipeline / Reader Journey (37) */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Investor Diligence & Journey Pipeline (37)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Conversion flow across dataroom entry, NDA execution, financial models, and full term sheet review.
              </p>
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              Sankey Flow
            </span>
          </div>
          <div className="flex items-center justify-center min-h-[260px] py-2">
            <object
              data="/brand/graphs/37-journey-sankey-animated.svg"
              type="image/svg+xml"
              className="w-full h-auto max-h-[300px] object-contain pointer-events-none"
              aria-label="Investor Journey Sankey Funnel"
            >
              <img
                src="/brand/graphs/37-journey-sankey-animated.svg"
                alt="Investor Journey Sankey Funnel"
                className="w-full h-auto max-h-[300px] object-contain"
              />
            </object>
          </div>
        </div>

        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="space-y-4 rounded-2xl border border-amber-500/30 bg-slate-900/80 p-6"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={submitting}
                placeholder="Dataroom name e.g. Series-A Due Diligence"
                className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none disabled:opacity-50"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                placeholder="Intro blurb shown to viewers (optional)"
                className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-300">
                  Include documents ({selectedDocs.length}/{docs.length})
                </div>
                {docs.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedDocs(docs.map((d) => d.id))}
                      className="text-amber-400 hover:text-amber-300 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDocs([])}
                      className="text-slate-400 hover:text-white hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {docs.map((d) => (
                  <label
                    key={d.id}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 hover:border-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(d.id)}
                      disabled={submitting}
                      onChange={(e) =>
                        setSelectedDocs((prev) =>
                          e.target.checked ? [...prev, d.id] : prev.filter((x) => x !== d.id)
                        )
                      }
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="truncate">{d.title}</span>
                  </label>
                ))}
                {docs.length === 0 && (
                  <div className="text-xs text-slate-500">Upload documents first to add them here.</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition shadow-md shadow-amber-500/10"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{submitting ? "Creating Dataroom..." : "Create Dataroom"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={submitting}
                className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          {loading && datarooms.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <div className="h-9 w-9 rounded-lg bg-slate-800" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-36 bg-slate-800 rounded" />
                    <div className="h-3 w-48 bg-slate-800/60 rounded" />
                  </div>
                  <div className="h-8 w-full rounded-xl bg-slate-800/80" />
                </div>
              ))}
            </div>
          ) : datarooms.length === 0 ? (
            <div className="space-y-3 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                <FolderLock className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No datarooms yet</h3>
              <p className="mx-auto max-w-sm text-xs text-slate-400">
                Group your pitch deck, financials and cap table into one gated collection.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Create Dataroom
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {datarooms.map((dr) => (
                <div key={dr.id} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 hover:border-slate-700 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                      <FolderLock className="h-4 w-4" />
                    </div>
                    <button
                      onClick={() => promptDelete(dr.id, dr.name)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-red-950/40 hover:text-red-400 transition"
                      title="Delete Dataroom"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{dr.name}</div>
                    <div className="mt-1 line-clamp-2 text-[11px] text-slate-400">
                      {dr.description || "No intro blurb"}
                    </div>
                  </div>
                  <button
                    onClick={() => setLinkModalRoom(dr)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition shadow-sm"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Create Dataroom Link</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Dataroom Share Link Modal */}
      {linkModalRoom && (
        <CreateLinkModal
          dataroomId={linkModalRoom.id}
          docTitle={linkModalRoom.name}
          onClose={() => setLinkModalRoom(null)}
          onCreated={() => {
            setLinkModalRoom(null);
            load();
          }}
        />
      )}

      {/* In-App Delete Confirmation Modal (Replaces browser confirm popup) */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Dataroom?"
        message={`Are you sure you want to remove the dataroom "${targetDataroom?.name || ""}"? Documents inside will remain safe in your library.`}
        confirmLabel="Yes, Delete Dataroom"
        cancelLabel="Keep Dataroom"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setTargetDataroom(null);
          }
        }}
      />
    </div>
  );
}
