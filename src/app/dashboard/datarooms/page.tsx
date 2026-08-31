"use client";

import React, { useEffect, useState } from "react";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { CreateLinkModal } from "@/components/link-studio/create-link-modal";
import { useI18n } from "@/lib/i18n/context";
import { FolderLock, Plus, Trash2, Share2, FileText } from "lucide-react";

export default function DataroomsPage() {
  const { t } = useI18n();

  const [datarooms, setDatarooms] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [linkModalRoom, setLinkModalRoom] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    const [drRes, docRes] = await Promise.all([fetch("/api/datarooms"), fetch("/api/docs")]);
    const drJson = await drRes.json();
    const docJson = await docRes.json();
    if (drJson.datarooms) setDatarooms(drJson.datarooms);
    if (docJson.documents) setDocs(docJson.documents);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/datarooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, docIds: selectedDocs }),
    });
    if (res.ok) {
      setName("");
      setDescription("");
      setSelectedDocs([]);
      setShowCreate(false);
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this dataroom? Documents themselves are not deleted.")) return;
    const res = await fetch(`/api/datarooms/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <BrandHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Secure Datarooms</h1>
            <p className="mt-1 text-xs text-slate-400">
              Bundle multiple encrypted documents behind a single gated link with clickwrap NDA support.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/10 hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            <span>New Dataroom</span>
          </button>
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
                placeholder="Dataroom name e.g. Series-A Due Diligence"
                className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Intro blurb shown to viewers (optional)"
                className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold text-slate-300">Include documents</div>
              <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {docs.map((d) => (
                  <label
                    key={d.id}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(d.id)}
                      onChange={(e) =>
                        setSelectedDocs((prev) =>
                          e.target.checked ? [...prev, d.id] : prev.filter((x) => x !== d.id)
                        )
                      }
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500"
                    />
                    <span className="truncate">{d.title}</span>
                  </label>
                ))}
                {docs.length === 0 && (
                  <div className="text-xs text-slate-500">Upload documents first to add them here.</div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              Create Dataroom
            </button>
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
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {datarooms.map((dr) => (
                <div key={dr.id} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                      <FolderLock className="h-4 w-4" />
                    </div>
                    <button
                      onClick={() => handleDelete(dr.id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-red-950/40 hover:text-red-400"
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
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30"
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

      {linkModalRoom && (
        <CreateLinkModal
          dataroomId={linkModalRoom.id}
          docTitle={linkModalRoom.name}
          onClose={() => setLinkModalRoom(null)}
          onCreated={() => load()}
        />
      )}

      <BrandFooter />
    </div>
  );
}
