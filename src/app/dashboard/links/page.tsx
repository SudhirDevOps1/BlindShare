import { BrandIcon } from "@/components/brand-icon";
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { CreateLinkModal } from "@/components/link-studio/create-link-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { TopLinksLeaderboard } from "@/components/analytics/charts/top-links-leaderboard";
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
import { hexToBuffer, bufferToHex, docKeyToFragment, fragmentToDocKey, unwrapDocKeyForOwner } from "@/lib/crypto-core";
import { syncVaultDocumentKeys, isVaultUnlocked, unlockOwnerVault, getOwnerMasterKey } from "@/lib/vault/master-vault";

export default function LinksPage() {
  const { t } = useI18n();

  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState(false);
  const [qrModal, setQrModal] = useState<{ url: string; name: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // In-App Link Delete Confirmation Dialog State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Key Recovery Dialog State (when browser storage was cleared)
  const [keyRecoveryTarget, setKeyRecoveryTarget] = useState<any | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const [resLinks, resDocs] = await Promise.all([
        fetch("/api/links"),
        fetch("/api/docs"),
      ]);

      if (resLinks.status === 401) {
        window.location.href = "/login";
        return;
      }

      const jsonLinks = await resLinks.json();
      const jsonDocs = await resDocs.json().catch(() => ({}));

      if (jsonLinks.links) setLinks(jsonLinks.links);

      if (jsonLinks.links || jsonDocs.documents) {
        await syncVaultDocumentKeys(jsonDocs.documents || [], jsonLinks.links || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const getStoredKeyHex = (link: any): string | null => {
    if (typeof window === "undefined") return null;
    return (
      (link.docId && sessionStorage.getItem(`blindshare_key_${link.docId}`)) ||
      (link.docId && localStorage.getItem(`blindshare_key_${link.docId}`)) ||
      sessionStorage.getItem(`blindshare_link_key_${link.slug}`) ||
      localStorage.getItem(`blindshare_link_key_${link.slug}`) ||
      sessionStorage.getItem(`blindshare_key_${link.slug}`) ||
      localStorage.getItem(`blindshare_key_${link.slug}`) ||
      null
    );
  };

  const buildFullUrl = (link: any) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    let url = `${origin}/v/${link.slug}`;

    if (link.docId) {
      const storedHex = getStoredKeyHex(link);
      if (storedHex) {
        const docKey = hexToBuffer(storedHex);
        url += `#k=${docKeyToFragment(docKey)}`;
      }
    }
    return url;
  };

  const handleCopy = async (link: any) => {
    let storedHex = getStoredKeyHex(link);

    // If key is missing in localStorage, attempt immediate auto-unwrap via active session vault
    if (!storedHex && (link.ownerEncryptedKeyHex || link.docId)) {
      await syncVaultDocumentKeys([], [link]);
      storedHex = getStoredKeyHex(link);
    }

    // If it's an E2EE doc without password and key is missing in local storage, open recovery helper
    if (link.docId && !link.hasPassword && !storedHex) {
      setKeyRecoveryTarget(link);
      setKeyInput("");
      setKeyError(null);
      return;
    }

    const url = buildFullUrl(link);
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSaveRecoveredKey = async () => {
    if (!keyRecoveryTarget || !keyInput.trim()) return;

    try {
      let docKey: Uint8Array | null = null;
      const trimmed = keyInput.trim();

      // 1. Check if user typed account password to unlock Master Vault
      try {
        const meRes = await fetch("/api/auth/me");
        const meJson = await meRes.json().catch(() => ({}));
        if (meJson.user?.masterKeySaltHex) {
          const masterKey = await unlockOwnerVault(trimmed, meJson.user.masterKeySaltHex);
          const docsRes = await fetch("/api/docs");
          const docsJson = await docsRes.json().catch(() => ({}));
          if (docsJson.documents) {
            const targetDoc = docsJson.documents.find((d: any) => d.id === keyRecoveryTarget.docId);
            if (targetDoc?.ownerEncryptedKeyHex && targetDoc?.ownerEncryptedKeyIvHex) {
              docKey = await unwrapDocKeyForOwner(
                targetDoc.ownerEncryptedKeyHex,
                targetDoc.ownerEncryptedKeyIvHex,
                masterKey
              );
            }
            await syncVaultDocumentKeys(docsJson.documents);
          }
        }
      } catch {}

      // 2. If not a master password or vault unwrap, parse as fragment / direct key
      if (!docKey) {
        if (trimmed.includes("#k=")) {
          docKey = fragmentToDocKey(trimmed.substring(trimmed.indexOf("#k=")));
        } else if (trimmed.includes("/v/")) {
          const hashIdx = trimmed.indexOf("#");
          if (hashIdx !== -1) {
            docKey = fragmentToDocKey(trimmed.substring(hashIdx));
          }
        } else if (trimmed.startsWith("k=")) {
          docKey = fragmentToDocKey(`#${trimmed}`);
        } else {
          docKey = fragmentToDocKey(`#k=${trimmed}`);
        }
      }

      if (!docKey || docKey.length < 16) {
        setKeyError("Invalid key or account password. Please enter your account password, full link, or #k=... fragment.");
        return;
      }

      const hex = bufferToHex(docKey);
      if (keyRecoveryTarget.docId) {
        localStorage.setItem(`blindshare_key_${keyRecoveryTarget.docId}`, hex);
        sessionStorage.setItem(`blindshare_key_${keyRecoveryTarget.docId}`, hex);
      }
      localStorage.setItem(`blindshare_link_key_${keyRecoveryTarget.slug}`, hex);
      sessionStorage.setItem(`blindshare_link_key_${keyRecoveryTarget.slug}`, hex);

      const url = buildFullUrl(keyRecoveryTarget);
      navigator.clipboard.writeText(url);
      setCopiedId(keyRecoveryTarget.id);
      setTimeout(() => setCopiedId(null), 2500);
      setKeyRecoveryTarget(null);
    } catch {
      setKeyError("Failed to parse decryption key or verify account password.");
    }
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

  const promptDeleteLink = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleConfirmDeleteLink = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/links/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setLinks((prev) => prev.filter((l) => l.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch {
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col text-slate-100">

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <BrandIcon size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Share Links</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate tracked, zero-knowledge links with email capture and dynamic watermarks.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(true)}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/10"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Link</span>
          </button>
        </div>

        {/* Visual Link Performance: Top Leaderboard & Traffic Source UTM Donut (32) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8">
            <TopLinksLeaderboard links={links} />
          </div>
          <div className="xl:col-span-4 rounded-3xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Traffic Source & UTM Breakdown (32)</span>
              </span>
              <span className="text-[10px] font-mono text-amber-400">Campaigns</span>
            </div>
            <div className="flex items-center justify-center min-h-[200px] my-auto">
              <object
                data="/brand/graphs/32-source-donut-animated.svg"
                type="image/svg+xml"
                className="w-full h-auto max-h-[220px] object-contain pointer-events-none"
                aria-label="Traffic Source Donut"
              >
                <img
                  src="/brand/graphs/32-source-donut-animated.svg"
                  alt="Traffic Source Donut"
                  className="w-full h-auto max-h-[220px] object-contain"
                />
              </object>
            </div>
            <p className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-800/60">
              Direct Pitch (48%) • LinkedIn (26%) • Syndicate (18%) • Email (8%)
            </p>
          </div>
        </div>

        {/* Links Table */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800/80">
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
            <div className="py-16 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg">
                <LinkIcon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No share links yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Create your first tracked zero-knowledge share link to share your documents securely.
                </p>
              </div>
              <button
                onClick={() => setActiveModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                <span>Create Your First Link</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="pb-3.5 pl-3">Nickname / Recipient</th>
                    <th className="pb-3.5">Target Document</th>
                    <th className="pb-3.5">Gates & Security</th>
                    <th className="pb-3.5">Views</th>
                    <th className="pb-3.5">Status</th>
                    <th className="pb-3.5">Created</th>
                    <th className="pb-3.5 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {links.map((link) => (
                    <tr key={link.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-4 pl-3 font-medium text-white">
                        <div className="font-bold text-white group-hover:text-amber-300 transition-colors">{link.name}</div>
                        <div className="font-mono text-[11px] text-amber-400/80 mt-0.5">/v/{link.slug}</div>
                      </td>

                      <td className="py-4 text-slate-300">
                        <div className="max-w-[170px] truncate font-medium">
                          {link.docTitle || link.dataroomName || "Document"}
                        </div>
                      </td>

                      <td className="py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {link.allowDownload && (
                            <span
                              title="Download Permitted"
                              className="rounded-lg bg-purple-500/15 p-1.5 text-purple-300 border border-purple-500/30 shadow-sm"
                            >
                              <Download className="h-3 w-3" />
                            </span>
                          )}
                          {link.hasPassword && (
                            <span
                              title="Password Protected"
                              className="rounded-lg bg-amber-500/15 p-1.5 text-amber-300 border border-amber-500/30 shadow-sm"
                            >
                              <Lock className="h-3 w-3" />
                            </span>
                          )}
                          {link.requiresEmail && (
                            <span
                              title="Email Gate"
                              className="rounded-lg bg-blue-500/15 p-1.5 text-blue-300 border border-blue-500/30 shadow-sm"
                            >
                              <Mail className="h-3 w-3" />
                            </span>
                          )}
                          {link.watermarkEnabled && (
                            <span
                              title="Live Watermark"
                              className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-300 border border-emerald-500/30 shadow-sm"
                            >
                              <Shield className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 font-mono font-semibold text-slate-200">
                        {link.viewCount}
                        {link.maxViews ? <span className="text-slate-500 font-normal"> / {link.maxViews}</span> : ""}
                      </td>

                      <td className="py-4">
                        {link.isRevoked ? (
                          <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30 shadow-sm">
                            Revoked
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 shadow-sm">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-4 text-slate-400 text-[11px] font-medium">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 pr-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleCopy(link)}
                          className="rounded-xl bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60 shadow-sm transition-all hover:scale-105"
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
                          className="rounded-xl bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-amber-300 border border-slate-700/60 shadow-sm transition-all hover:scale-105"
                          title="Show QR Code"
                        >
                          <QrCode className="h-4 w-4 text-amber-400" />
                        </button>

                        <Link
                          href={`/dashboard/analytics/${link.id}`}
                          className="inline-flex rounded-xl bg-amber-500/15 p-2 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 shadow-sm shadow-amber-500/10 transition-all hover:scale-105"
                          title="View Analytics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Link>

                        <button
                          onClick={() => handleToggleRevoke(link.id, link.isRevoked)}
                          className={`rounded-xl p-2 border transition-all hover:scale-105 shadow-sm ${
                            link.isRevoked
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                          }`}
                          title={link.isRevoked ? "Activate Link" : "Revoke Link"}
                        >
                          <Ban className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => promptDeleteLink(link.id, link.name)}
                          className="rounded-xl p-2 text-slate-400 hover:text-red-300 hover:bg-red-950/40 hover:border-red-500/30 border border-transparent transition-all hover:scale-105"
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

      {/* In-App Link Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Share Link?"
        message={`Are you sure you want to permanently delete the share link "${deleteTarget?.name || ""}"? Anyone holding this link will instantly lose access.`}
        confirmLabel="Yes, Delete Link"
        cancelLabel="Keep Link"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDeleteLink}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />

      {/* Key Recovery / Restore Dialog */}
      {keyRecoveryTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Restore Decryption Key</h3>
                <p className="text-xs text-slate-400">
                  Link: <span className="text-slate-300 font-semibold">{keyRecoveryTarget.name}</span>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400 space-y-1.5">
              <p className="text-slate-300 font-medium">Zero-Knowledge Vault Recovery</p>
              <p className="leading-relaxed">
                Enter your <span className="text-amber-400 font-semibold">Account Password</span> to automatically unlock and restore all document keys from your Zero-Knowledge Master Vault, or paste the share link / <code className="text-amber-400">#k=...</code> fragment.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Account Password, Decryption Key, or Link
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setKeyError(null);
                }}
                placeholder="Enter account password or #k=... fragment"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                autoFocus
              />
              {keyError && <p className="text-xs text-red-400">{keyError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setKeyRecoveryTarget(null)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRecoveredKey}
                disabled={!keyInput.trim()}
                className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 shadow-md shadow-amber-500/10"
              >
                Save & Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
