"use client";

import React, { useState, useRef } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Clock,
  User,
  Link as LinkIcon,
  RefreshCw,
} from "lucide-react";
import { decodeForensicPayload, ForensicDetectionResult } from "@/lib/watermark/forensic-stego";
import { useI18n } from "@/lib/i18n/context";

interface ForensicLeakScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRevokeLink?: (slug: string) => void;
}

export function ForensicLeakScannerModal({
  isOpen,
  onClose,
  onRevokeLink,
}: ForensicLeakScannerModalProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ForensicDetectionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const st = (t as any).forensicScanner || {
    title: "Forensic Leak Scanner",
    versionBadge: "Steganography v1.4.0",
    subtitle: "Upload a leaked photo or screenshot to extract invisible micro-dot constellations and identify the source.",
    dropTitle: "Drop leaked screenshot or document photo here",
    dropSubtitle: "Supports PNG, JPG, WebP, smartphone screenshots & camera photos",
    browse: "Browse image file",
    scanning: "Analyzing pixel luminance micro-dots...",
    detectedTitle: "Forensic Signature Detected",
    viewerSignature: "Viewer Signature",
    linkOrigin: "Link Origin",
    capturedAt: "Captured At",
    copyReport: "Copy Evidence Report",
    copied: "Copied!",
    scanAnother: "Scan Another",
    revokeLink: "Revoke This Link",
    noWatermark: "No forensic micro-dots could be resolved from this image. Ensure the image contains the slide canvas area.",
    engineFooter: "Patented 64-bit Micro-Dot Constellation Engine",
    subtleCryptoTag: "Pure In-Browser WebCrypto",
  };

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file (PNG, JPG, WebP).");
      return;
    }
    setErrorMsg(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      scanImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const scanImage = (dataUrl: string) => {
    setAnalyzing(true);
    setErrorMsg(null);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const maxDimension = 1600;
        let w = img.width;
        let h = img.height;

        if (w > maxDimension || h > maxDimension) {
          const ratio = Math.min(maxDimension / w, maxDimension / h);
          w = Math.floor(w * ratio);
          h = Math.floor(h * ratio);
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          setErrorMsg("Could not initialize 2D canvas context.");
          setAnalyzing(false);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const detection = decodeForensicPayload(imgData);

        setTimeout(() => {
          setResult(detection);
          setAnalyzing(false);
        }, 600);
      } catch (err: any) {
        setErrorMsg("Failed to analyze image: " + (err?.message || "Unknown error"));
        setAnalyzing(false);
      }
    };
    img.onerror = () => {
      setErrorMsg("Could not load selected image.");
      setAnalyzing(false);
    };
    img.src = dataUrl;
  };

  const copyReport = () => {
    if (!result) return;
    const reportText = [
      "=== BLINDSHARE FORENSIC LEAK AUDIT REPORT ===",
      `Status: ${result.detected ? "POSITIVE IDENTIFICATION" : "UNCONFIRMED"}`,
      `Viewer Identity: ${result.viewerIdentity}`,
      `Origin Link Slug: ${result.slug}`,
      `Forensic Timestamp: ${result.timestampStr}`,
      `Constellation Confidence: ${result.confidence}%`,
      "Zero-Knowledge Cryptographic & Steganographic Watermark Layer (RFC 3986)",
    ].join("\n");

    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setImagePreview(null);
    setResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-amber-500/30 bg-slate-900/95 p-6 sm:p-8 shadow-2xl shadow-amber-500/10 backdrop-blur-xl flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{st.title}</span>
                <span className="text-[10px] uppercase font-mono tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {st.versionBadge}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {st.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Upload Zone / Preview */}
        {!imagePreview ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/40 p-10 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-center group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />
            <div className="h-14 w-14 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:scale-110 group-hover:border-amber-500/40 transition-all">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                {st.dropTitle}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {st.dropSubtitle}
              </p>
            </div>
            <span className="text-xs font-medium text-amber-400/90 underline underline-offset-4">
              {st.browse}
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Thumbnail preview with scan effect */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden flex items-center justify-center max-h-56">
              <img
                src={imagePreview}
                alt="Leaked specimen"
                className="max-h-56 w-auto object-contain opacity-70"
              />
              {analyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-xs">
                  <div className="w-full h-1 bg-amber-400/80 shadow-[0_0_12px_#f59e0b] animate-bounce" />
                  <div className="mt-3 flex items-center gap-2 text-xs font-mono text-amber-300">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>{st.scanning}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Detection Result Card */}
            {result && !analyzing && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-4 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-bold">{st.detectedTitle}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    {result.confidence}% Confidence
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                      <User className="h-3.5 w-3.5 text-amber-400" />
                      {st.viewerSignature}
                    </span>
                    <span className="font-mono font-bold text-slate-100 truncate block">
                      {result.viewerIdentity}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                      <LinkIcon className="h-3.5 w-3.5 text-blue-400" />
                      {st.linkOrigin}
                    </span>
                    <span className="font-mono font-bold text-slate-100 truncate block">
                      {result.slug}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                      <Clock className="h-3.5 w-3.5 text-purple-400" />
                      {st.capturedAt}
                    </span>
                    <span className="font-mono font-bold text-slate-100 truncate block">
                      {result.timestampStr}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyReport}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{st.copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>{st.copyReport}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-1 rounded-xl border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>{st.scanAnother}</span>
                    </button>
                  </div>

                  {onRevokeLink && (
                    <button
                      onClick={() => onRevokeLink(result.slug)}
                      className="flex items-center gap-1.5 rounded-xl bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/30 transition-colors"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                      <span>{st.revokeLink}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* No watermark detected or low confidence */}
            {!result && !analyzing && !errorMsg && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-center">
                <p className="text-xs text-slate-400">
                  {st.noWatermark}
                </p>
                <button
                  onClick={handleReset}
                  className="mt-2 text-xs text-amber-400 hover:underline"
                >
                  {st.scanAnother}
                </button>
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-3 text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer info note */}
        <div className="border-t border-slate-800/80 pt-3 text-[11px] text-slate-500 flex items-center justify-between">
          <span>{st.engineFooter}</span>
          <span className="font-mono text-slate-400">{st.subtleCryptoTag}</span>
        </div>
      </div>
    </div>
  );
}
