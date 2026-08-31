"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { CreateLinkModal } from "@/components/link-studio/create-link-modal";
import { useI18n } from "@/lib/i18n/context";
import {
  Link as LinkIcon,
  BarChart3,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Lock,
  Mail,
  Shield,
  Download,
  Trash2,
  Plus,
  Ban,
  CheckCircle,
  FileText,
} from "lucide-react";
import QRCodeLib from "qrcode";
import { hexToBuffer, docKeyToFragment } from "@/lib/crypto-core";

export default function LinksPage() {
  const { t } = useI18n();

  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState(false);
  const [qrModal, setQrModal] = useState<{ url: string; name: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/links");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const json = await res.json();
      if (json.links) setLinks(json.links);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const buildFullUrl = (link: any) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    let url = `${origin}/v/${link.slug}`;

    if (link.docId) {
      const storedHex = sessionStorage.getItem(`blindshare_key_${link.docId}`);
      if (storedHex) {
        const docKey = hexToBuffer(storedHex);
        url += `#k=${docKeyToFragment(docKey)}`;
      }
    }
    return url;
  };

  const handleCopy = (link: any) => {
    const url = buildFullUrl(link);
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenQr = async (link: any) => {
    const url = buildFullUrl(link);
    const dataUrl = await QRCodeLib.toDataURL(url, { width: 260, margin: 2 });
    setQrDataUrl(dataUrl);
    setQrModal({ url, name: link.name });
  };

  const handleToggleRevoke = async (id: string, currentRevoked: boolean) => {
    const res = await fetch(`/api/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRevoked: !currentRevoked }),
    });
    if (res.ok) fetchLinks();
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm("Are you sure you want to delete this share link?")) return;
    const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
    if (res.ok) fetchLinks();
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <BrandHeader />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Share Links</h1>
            <p className="text-xs text-slate-400 mt-1">
              Generate tracked, zero-knowledge links with email capture and dynamic watermarks.
            </p>
          </div>

          <button
            onClick={() => setActiveModal(true)}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/10"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Link</span>
          </button>
        </div>

        {/* Links Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          {loading && links.length === 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="pb-3 pl-2">Nickname / Recipient</th>
                    <th className="pb-3">Target Document</th>
                    <th className="pb-3">Gates & Security</th>
                    <th className="pb-3">Views</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Created</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 pl-2">
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-36 bg-slate-800 rounded" />
                          <div className="h-2.5 w-24 bg-slate-800/60 rounded" />
                        </div>
                      </td>
                      <td className="py-4"><div className="h-3.5 w-28 bg-slate-800 rounded" /></td>
                      <td className="py-4"><div className="h-3.5 w-16 bg-slate-800 rounded" /></td>
                      <td className="py-4"><div className="h-3.5 w-8 bg-slate-800 rounded" /></td>
                      <td className="py-4"><div className="h-3.5 w-14 bg-slate-800 rounded" /></td>
                      <td className="py-4"><div className="h-3.5 w-16 bg-slate-800 rounded" /></td>
                      <td className="py-4 text-right pr-2"><div className="h-6 w-24 bg-slate-800 rounded ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : links.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                <LinkIcon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No share links yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Generate your first share link with watermarks, email capture, or password protection.
              </p>
              <button
                onClick={() => setActiveModal(true)}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Create Link
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="pb-3 pl-2">Nickname / Recipient</th>
                    <th className="pb-3">Target Document</th>
                    <th className="pb-3">Gates & Security</th>
                    <th className="pb-3">Views</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Created</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {links.map((link) => (
                    <tr key={link.id} className="hover:bg-slate-800/30">
                      <td className="py-3.5 pl-2 font-medium text-white">
                        <div className="font-semibold text-white">{link.name}</div>
                        <div className="font-mono text-[11px] text-amber-400">/v/{link.slug}</div>
                      </td>

                      <td className="py-3.5 text-slate-300">
                        <div className="max-w-[160px] truncate">
                          {link.docTitle || link.dataroomName || "Document"}
                        </div>
                      </td>

                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {link.allowDownload && (
                            <span
                              title="Download Permitted"
                              className="rounded bg-purple-500/20 p-1 text-purple-400 border border-purple-500/30"
                            >
                              <Download className="h-3 w-3" />
                            </span>
                          )}
                          {link.hasPassword && (
                            <span
                              title="Password Protected"
                              className="rounded bg-amber-500/20 p-1 text-amber-400 border border-amber-500/30"
                            >
                              <Lock className="h-3 w-3" />
                            </span>
                          )}
                          {link.requiresEmail && (
                            <span
                              title="Email Gate"
                              className="rounded bg-blue-500/20 p-1 text-blue-400 border border-blue-500/30"
                            >
                              <Mail className="h-3 w-3" />
                            </span>
                          )}
                          {link.watermarkEnabled && (
                            <span
                              title="Live Watermark"
                              className="rounded bg-emerald-500/20 p-1 text-emerald-400 border border-emerald-500/30"
                            >
                              <Shield className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 font-mono text-slate-300">
                        {link.viewCount}
                        {link.maxViews ? ` / ${link.maxViews}` : ""}
                      </td>

                      <td className="py-3.5">
                        {link.isRevoked ? (
                          <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
                            Revoked
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 text-slate-400 text-[11px]">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 pr-2 text-right space-x-1.5">
                        <button
                          onClick={() => handleCopy(link)}
                          className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
                          title="Copy Link"
                        >
                          {copiedId === link.id ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenQr(link)}
                          className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
                          title="Show QR Code"
                        >
                          <QrCode className="h-4 w-4 text-amber-400" />
                        </button>

                        <Link
                          href={`/dashboard/analytics/${link.id}`}
                          className="inline-flex rounded-lg bg-amber-500/20 p-1.5 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                          title="View Analytics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Link>

                        <button
                          onClick={() => handleToggleRevoke(link.id, link.isRevoked)}
                          className={`rounded-lg p-1.5 ${
                            link.isRevoked
                              ? "text-emerald-400 hover:bg-emerald-950/40"
                              : "text-amber-400 hover:bg-amber-950/40"
                          }`}
                          title={link.isRevoked ? "Activate Link" : "Revoke Link"}
                        >
                          <Ban className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40"
                          title="Delete Link"
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
      {activeModal && (
        <CreateLinkModal
          onClose={() => setActiveModal(false)}
          onCreated={() => {
            fetchLinks();
          }}
        />
      )}

      {/* QR Code Modal */}
      {qrModal && qrDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">{qrModal.name}</h3>
            <div className="p-3 bg-white rounded-xl inline-block shadow-lg">
              <img src={qrDataUrl} alt="QR Code" className="mx-auto" />
            </div>
            <p className="text-[11px] text-slate-400 break-all">{qrModal.url}</p>
            <button
              onClick={() => setQrModal(null)}
              className="w-full rounded-xl bg-slate-800 py-2 text-xs font-semibold text-white hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <BrandFooter />
    </div>
  );
}
