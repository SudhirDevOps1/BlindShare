"use client";

import React, { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  wrapKeyWithPassword,
  hexToBuffer,
  docKeyToFragment,
} from "@/lib/crypto-core";
import {
  X,
  Lock,
  Mail,
  Shield,
  FileCheck,
  Download,
  Calendar,
  Eye,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Sparkles,
  FileText,
  Folder,
} from "lucide-react";
import QRCodeLib from "qrcode";

interface CreateLinkModalProps {
  docId?: string;
  dataroomId?: string;
  docTitle?: string;
  onClose: () => void;
  onCreated?: (link: any) => void;
}

export function CreateLinkModal({
  docId,
  dataroomId,
  docTitle,
  onClose,
  onCreated,
}: CreateLinkModalProps) {
  const { t, appName } = useI18n();

  const [selectedDocId, setSelectedDocId] = useState(docId || "");
  const [selectedDataroomId, setSelectedDataroomId] = useState(dataroomId || "");
  const [targetType, setTargetType] = useState<"doc" | "dataroom">(dataroomId ? "dataroom" : "doc");
  const [docsList, setDocsList] = useState<Array<{ id: string; title: string; originalFilename?: string }>>([]);
  const [dataroomsList, setDataroomsList] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [requiresEmail, setRequiresEmail] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState("");
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkText, setWatermarkText] = useState("");
  const [allowDownload, setAllowDownload] = useState(false);
  const [requiresNda, setRequiresNda] = useState(false);
  const [ndaText, setNdaText] = useState("");
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [signaturePrompt, setSignaturePrompt] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [brandAccentColor, setBrandAccentColor] = useState("");
  const [antiLeakBlurEnabled, setAntiLeakBlurEnabled] = useState(true);
  const [antiSpyShieldEnabled, setAntiSpyShieldEnabled] = useState(true);
  const [burnAfterReading, setBurnAfterReading] = useState(false);
  const [voicePitchEnabled, setVoicePitchEnabled] = useState(true);
  const [maxViews, setMaxViews] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  // Auto-fetch user's documents and datarooms if not launched from a specific document card
  React.useEffect(() => {
    if (!docId && !dataroomId) {
      setLoadingTargets(true);
      Promise.allSettled([
        fetch("/api/docs").then((r) => r.json()),
        fetch("/api/datarooms").then((r) => r.json()),
      ])
        .then(([docsRes, roomsRes]) => {
          if (docsRes.status === "fulfilled" && docsRes.value?.documents) {
            const docs = docsRes.value.documents;
            setDocsList(docs);
            if (docs.length > 0 && !selectedDocId) {
              setSelectedDocId(docs[0].id);
            }
          }
          if (roomsRes.status === "fulfilled" && roomsRes.value?.datarooms) {
            const rooms = roomsRes.value.datarooms;
            setDataroomsList(rooms);
            if (rooms.length > 0 && !selectedDataroomId) {
              setSelectedDataroomId(rooms[0].id);
            }
          }
        })
        .finally(() => setLoadingTargets(false));
    }
  }, [docId, dataroomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a link nickname or recipient.");
      return;
    }

    const activeDocId = docId || (targetType === "doc" ? selectedDocId : undefined);
    const activeDataroomId = dataroomId || (targetType === "dataroom" ? selectedDataroomId : undefined);

    if (!activeDocId && !activeDataroomId) {
      setError(
        targetType === "doc"
          ? "Please select a target document from your library (or upload one first)."
          : "Please select a target dataroom (or create one first)."
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let wrappedKeyHex = null;
      let passwordSaltHex = null;

      // If document is E2EE and password gate is enabled, wrap key client-side
      if (enablePassword && password.trim() && activeDocId) {
        const storedHex =
          typeof window !== "undefined"
            ? sessionStorage.getItem(`blindshare_key_${activeDocId}`) || localStorage.getItem(`blindshare_key_${activeDocId}`)
            : null;
        if (storedHex) {
          const docKey = hexToBuffer(storedHex);
          const wrapped = await wrapKeyWithPassword(docKey, password.trim());
          wrappedKeyHex = wrapped.wrappedKeyHex;
          passwordSaltHex = wrapped.saltHex;
        }
      }

      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId || undefined,
          dataroomId: activeDataroomId || undefined,
          name: name.trim(),
          slug: slug.trim() || undefined,
          password: enablePassword ? password.trim() : undefined,
          passwordSaltHex,
          wrappedKeyHex,
          requiresEmail,
          allowedDomains: allowedDomains.trim() || undefined,
          watermarkEnabled,
          watermarkText: watermarkText.trim() || undefined,
          allowDownload,
          requiresNda,
          ndaText: ndaText.trim() || undefined,
          requiresSignature,
          signaturePrompt: signaturePrompt.trim() || undefined,
          webhookUrl: webhookUrl.trim() || undefined,
          brandLogoUrl: brandLogoUrl.trim() || undefined,
          brandAccentColor: brandAccentColor.trim() || undefined,
          antiLeakBlurEnabled,
          antiSpyShieldEnabled,
          burnAfterReading,
          voicePitchEnabled,
          maxViews: maxViews ? parseInt(maxViews, 10) : undefined,
          expiresAt: expiresAt || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create link");
      }

      // Build full URL including #k=... fragment if available
      const baseUrl = window.location.origin;
      let fullUrl = `${baseUrl}/v/${data.slug}`;

      if (activeDocId) {
        const storedHex =
          typeof window !== "undefined"
            ? sessionStorage.getItem(`blindshare_key_${activeDocId}`) || localStorage.getItem(`blindshare_key_${activeDocId}`)
            : null;
        if (storedHex) {
          const docKey = hexToBuffer(storedHex);
          const fragment = docKeyToFragment(docKey);
          fullUrl = `${fullUrl}#k=${fragment}`;

          // Persist link-to-key mapping for persistent copy capability
          if (typeof window !== "undefined") {
            sessionStorage.setItem(`blindshare_link_key_${data.slug}`, storedHex);
            localStorage.setItem(`blindshare_link_key_${data.slug}`, storedHex);
          }
        }
      }

      setCreatedUrl(fullUrl);

      // Generate QR Code
      const qrUrl = await QRCodeLib.toDataURL(fullUrl, { width: 240, margin: 2 });
      setQrDataUrl(qrUrl);

      if (onCreated) {
        onCreated(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate secure link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdUrl) return;
    navigator.clipboard.writeText(createdUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {!createdUrl ? (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-1">{t.linkStudio.createTitle}</h3>
              <p className="text-xs text-slate-400">
                {docTitle
                  ? `Target: ${docTitle}`
                  : targetType === "doc" && selectedDocId && docsList.length > 0
                  ? `Target Document: ${docsList.find((d) => d.id === selectedDocId)?.title || "Selected Document"}`
                  : targetType === "dataroom" && selectedDataroomId && dataroomsList.length > 0
                  ? `Target Dataroom: ${dataroomsList.find((r) => r.id === selectedDataroomId)?.name || "Selected Dataroom"}`
                  : "Generate a Zero-Knowledge share link"}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Document / Dataroom Selector when opened without a predefined target */}
              {!docId && !dataroomId && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <FileCheck className="h-3.5 w-3.5 text-amber-400" />
                      <span>Target Document or Dataroom *</span>
                    </label>

                    {dataroomsList.length > 0 && (
                      <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setTargetType("doc")}
                          className={`px-2 py-0.5 rounded-md font-semibold transition ${
                            targetType === "doc" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Single Doc ({docsList.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setTargetType("dataroom")}
                          className={`px-2 py-0.5 rounded-md font-semibold transition ${
                            targetType === "dataroom" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Dataroom ({dataroomsList.length})
                        </button>
                      </div>
                    )}
                  </div>

                  {loadingTargets ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-xs text-slate-400 animate-pulse">
                      Loading your library documents...
                    </div>
                  ) : targetType === "doc" ? (
                    docsList.length === 0 ? (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-center justify-between">
                        <span>No documents found in your library.</span>
                        <a
                          href="/dashboard/docs"
                          className="text-amber-400 hover:text-white font-bold underline text-[11px]"
                        >
                          Upload Document First &rarr;
                        </a>
                      </div>
                    ) : (
                      <select
                        value={selectedDocId}
                        onChange={(e) => setSelectedDocId(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                        required
                      >
                        <option value="" disabled>-- Select a document to share --</option>
                        {docsList.map((d) => (
                          <option key={d.id} value={d.id}>
                            📄 {d.title || d.originalFilename || d.id}
                          </option>
                        ))}
                      </select>
                    )
                  ) : dataroomsList.length === 0 ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-center justify-between">
                      <span>No datarooms found.</span>
                      <a
                        href="/dashboard/datarooms"
                        className="text-amber-400 hover:text-white font-bold underline text-[11px]"
                      >
                        Create Dataroom First &rarr;
                      </a>
                    </div>
                  ) : (
                    <select
                      value={selectedDataroomId}
                      onChange={(e) => setSelectedDataroomId(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                      required
                    >
                      <option value="" disabled>-- Select a dataroom to share --</option>
                      {dataroomsList.map((r) => (
                        <option key={r.id} value={r.id}>
                          📁 {r.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.linkStudio.linkName} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.linkStudio.linkNamePlaceholder}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.linkStudio.customSlug}
                </label>
                <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-400">
                  <span>/v/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="custom-link-code"
                    className="w-full bg-transparent px-1 py-2 text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Security & Gates Accordion Section */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  {t.linkStudio.securityOptions}
                </h4>

                {/* Password Gate */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-400" />
                      <div>
                        <div className="text-xs font-medium text-white">{t.linkStudio.passwordGate}</div>
                        <div className="text-[10px] text-slate-400">{t.linkStudio.passwordGateDesc}</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enablePassword}
                      onChange={(e) => setEnablePassword(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  {enablePassword && (
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter link password..."
                      required={enablePassword}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                    />
                  )}
                </div>

                {/* Email Capture Gate */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-amber-400" />
                      <div>
                        <div className="text-xs font-medium text-white">{t.linkStudio.emailCapture}</div>
                        <div className="text-[10px] text-slate-400">{t.linkStudio.emailCaptureDesc}</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={requiresEmail}
                      onChange={(e) => setRequiresEmail(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  {requiresEmail && (
                    <input
                      type="text"
                      value={allowedDomains}
                      onChange={(e) => setAllowedDomains(e.target.value)}
                      placeholder={t.linkStudio.domainAllowlistPlaceholder}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                    />
                  )}
                </div>

                {/* Watermark Overlay */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-400" />
                      <div>
                        <div className="text-xs font-medium text-white">{t.linkStudio.watermark}</div>
                        <div className="text-[10px] text-slate-400">{t.linkStudio.watermarkDesc}</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={watermarkEnabled}
                      onChange={(e) => setWatermarkEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  {watermarkEnabled && (
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Custom label e.g., INTERNAL USE ONLY"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                    />
                  )}
                </div>

                {/* Allow Decrypted Download Toggle */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Download className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-white">{t.linkStudio.allowDownload || "Allow Document Download"}</div>
                      <div className="text-[10px] text-slate-400">Permits viewers to save the decrypted original file to their local machine</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowDownload}
                    onChange={(e) => setAllowDownload(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                  />
                </div>

                {/* NDA Clickwrap */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-amber-400" />
                      <div>
                        <div className="text-xs font-medium text-white">{t.linkStudio.ndaClickwrap}</div>
                        <div className="text-[10px] text-slate-400">{t.linkStudio.ndaClickwrapDesc}</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={requiresNda}
                      onChange={(e) => setRequiresNda(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  {requiresNda && (
                    <textarea
                      value={ndaText}
                      onChange={(e) => setNdaText(e.target.value)}
                      placeholder="Custom NDA Agreement text..."
                      rows={3}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500"
                    />
                  )}
                </div>

                {/* Digital E-Signature Gate */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-emerald-400" />
                      <div>
                        <div className="text-xs font-medium text-white">Require Digital E-Signature</div>
                        <div className="text-[10px] text-slate-400">Viewer must legally sign via canvas pad before accessing</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={requiresSignature}
                      onChange={(e) => setRequiresSignature(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  {requiresSignature && (
                    <input
                      type="text"
                      value={signaturePrompt}
                      onChange={(e) => setSignaturePrompt(e.target.value)}
                      placeholder="e.g. Please sign to acknowledge confidential partnership terms."
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                    />
                  )}
                </div>

                {/* Real-time Webhook Alerts */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-white mb-0.5">Real-time Webhook URL (Stoat / Slack / Discord)</label>
                    <p className="text-[10px] text-slate-400 mb-2">Get instant alerts in Stoat, Slack, or Discord when someone opens, signs, or reads this deck</p>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://stoat.chat/webhooks/... or Discord / Slack webhook"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Custom Branding / White-labeling */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-3">
                  <div className="text-xs font-medium text-white">Custom Branding (White-labeling)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Company Logo URL</label>
                      <input
                        type="url"
                        value={brandLogoUrl}
                        onChange={(e) => setBrandLogoUrl(e.target.value)}
                        placeholder="https://mycompany.com/logo.png"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Accent Hex Color</label>
                      <input
                        type="text"
                        value={brandAccentColor}
                        onChange={(e) => setBrandAccentColor(e.target.value)}
                        placeholder="#6366f1"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-600 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Anti-Leak Blur Deterrent */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-white">Anti-Capture Privacy Blur</div>
                    <div className="text-[10px] text-slate-400">Blurs document during screenshot attempts or window focus loss</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={antiLeakBlurEnabled}
                    onChange={(e) => setAntiLeakBlurEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                  />
                </div>

                {/* Tab-Switch Anti-Spy Shield */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-white flex items-center gap-1.5">
                      <span>👁️ Tab-Switch Anti-Spy Shield</span>
                      <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-400 border border-blue-500/20">NEW</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Instantly shields content with blur overlay when viewer leaves tab or switches windows</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={antiSpyShieldEnabled}
                    onChange={(e) => setAntiSpyShieldEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Burn After Reading (Self-Destruct Link) */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-white flex items-center gap-1.5">
                      <span>🔥 Burn After Reading (Single-Use Link)</span>
                      <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-400 border border-red-500/20">EPHEMERAL</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Automatically self-destructs and revokes link permanently after recipient finishes reading</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={burnAfterReading}
                    onChange={(e) => setBurnAfterReading(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-red-500 focus:ring-red-500"
                  />
                </div>

                {/* Voice Pitch Walkthrough Notes */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-white flex items-center gap-1.5">
                      <span>🎙️ Founder Voice Pitch Walkthrough</span>
                      <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-bold text-purple-400 border border-purple-500/20">INTERACTIVE</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Allow recipient to listen to embedded founder audio explanations per slide</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={voicePitchEnabled}
                    onChange={(e) => setVoicePitchEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500"
                  />
                </div>

                {/* Limits: Expiry & Max Views */}
                <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-white flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-amber-400" />
                        <span>Link Expiration Date & Time</span>
                      </label>
                      {expiresAt && (
                        <button
                          type="button"
                          onClick={() => setExpiresAt("")}
                          className="text-[10px] text-amber-400 hover:underline"
                        >
                          Clear (Never Expires)
                        </button>
                      )}
                    </div>

                    {/* Expiry Quick Presets */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(Date.now() + 1 * 3600 * 1000);
                          setExpiresAt(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                        }}
                        className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition"
                      >
                        ⚡ 1 Hour
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(Date.now() + 24 * 3600 * 1000);
                          setExpiresAt(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                        }}
                        className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition"
                      >
                        ⏱️ 24 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(Date.now() + 7 * 24 * 3600 * 1000);
                          setExpiresAt(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                        }}
                        className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition"
                      >
                        📅 7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(Date.now() + 30 * 24 * 3600 * 1000);
                          setExpiresAt(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                        }}
                        className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition"
                      >
                        🗓️ 30 Days
                      </button>
                    </div>

                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500"
                    />
                  </div>

                  <div className="border-t border-slate-800/80 pt-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-white flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-blue-400" />
                        <span>Maximum Allowed View Limit</span>
                      </label>
                      {maxViews && (
                        <button
                          type="button"
                          onClick={() => setMaxViews("")}
                          className="text-[10px] text-blue-400 hover:underline"
                        >
                          Clear (Unlimited)
                        </button>
                      )}
                    </div>

                    {/* View Limit Presets */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <button
                        type="button"
                        onClick={() => setMaxViews("1")}
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium transition ${
                          maxViews === "1"
                            ? "border-red-500/50 bg-red-950/40 text-red-300 font-bold"
                            : "border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
                        }`}
                      >
                        🔥 1 View (Burn)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaxViews("5")}
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium transition ${
                          maxViews === "5"
                            ? "border-blue-500/50 bg-blue-950/40 text-blue-300 font-bold"
                            : "border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
                        }`}
                      >
                        👀 5 Views
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaxViews("25")}
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium transition ${
                          maxViews === "25"
                            ? "border-blue-500/50 bg-blue-950/40 text-blue-300 font-bold"
                            : "border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
                        }`}
                      >
                        📊 25 Views
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaxViews("100")}
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium transition ${
                          maxViews === "100"
                            ? "border-blue-500/50 bg-blue-950/40 text-blue-300 font-bold"
                            : "border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
                        }`}
                      >
                        🚀 100 Views
                      </button>
                    </div>

                    <input
                      type="number"
                      min="1"
                      value={maxViews}
                      onChange={(e) => setMaxViews(e.target.value)}
                      placeholder="Custom view count limit (e.g. 10)"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-lg shadow-amber-500/20"
              >
                {loading ? "Generating Link..." : t.linkStudio.createBtn}
              </button>
            </form>
          </div>
        ) : (
          /* Link Generated Result Screen */
          <div className="text-center py-4 space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Check className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-1">Secure Link Ready!</h3>
              <p className="text-xs text-slate-400">
                DocKey embedded in URL fragment <code className="text-amber-400 font-mono">#k=...</code>
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-left">
              <div className="font-mono text-xs text-amber-300 break-all select-all mb-3 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                {createdUrl}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? "Copied!" : t.linkStudio.copyLink}</span>
                </button>

                <button
                  onClick={() => setShowQr(!showQr)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  <QrCode className="h-4 w-4 text-amber-400" />
                  <span>{t.linkStudio.qrCode}</span>
                </button>

                <a
                  href={createdUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{t.linkStudio.viewLink}</span>
                </a>
              </div>
            </div>

            {/* QR Code Modal Display */}
            {showQr && qrDataUrl && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 inline-block">
                <img src={qrDataUrl} alt="Link QR Code" className="mx-auto rounded-lg" />
                <p className="text-[11px] text-slate-400 mt-2">Scan with mobile camera</p>
              </div>
            )}

            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Done & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
