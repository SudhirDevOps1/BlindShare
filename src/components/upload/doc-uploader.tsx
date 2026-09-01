"use client";

import React, { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  generateDocKey,
  docKeyToFragment,
  encryptBytes,
  bufferToHex,
  bufferToBase64Url,
} from "@/lib/crypto-core";
import { detectFormat, FormatKind } from "@/lib/formats";
import {
  UploadCloud,
  Lock,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  Copy,
  ExternalLink,
} from "lucide-react";

interface DocUploaderProps {
  onUploadSuccess?: (doc: any, keyFragment: string) => void;
}

export function DocUploader({ onUploadSuccess }: DocUploaderProps) {
  const { t, appName } = useI18n();

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [detected, setDetected] = useState<FormatKind | null>(null);
  const [title, setTitle] = useState("");
  const [encrypting, setEncrypting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    docId: string;
    keyFragment: string;
    title: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (selectedFile: File) => {
    const fmt = detectFormat(selectedFile.name);

    // Video has its own egress-heavy budget line (MAX_VIDEO_MB); everything else uses MAX_FILE_MB.
    const capMb =
      fmt.kind === "video"
        ? Number(process.env.NEXT_PUBLIC_MAX_VIDEO_MB || "50")
        : Number(process.env.NEXT_PUBLIC_MAX_FILE_MB || "25");

    if (selectedFile.size > capMb * 1024 * 1024) {
      setError(
        `${fmt.label} exceeds the ${capMb}MB limit for this category (free-tier egress budget rule).`
      );
      return;
    }

    setFile(selectedFile);
    setDetected(fmt);
    setTitle(selectedFile.name.replace(/\.[^.]+$/, ""));
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const estimatePageCount = async (buffer: ArrayBuffer, filename: string): Promise<number> => {
    // Page counting is a CLIENT-side concern only — the server never parses content.
    const fmt = detectFormat(filename);
    if (fmt.kind !== "pdf") return 1;
    try {
      const text = new TextDecoder("latin1").decode(buffer.slice(0, Math.min(buffer.byteLength, 1000000)));
      const matches = text.match(/\/Type\s*\/Page[^s]/g);
      return matches && matches.length > 0 ? matches.length : 1;
    } catch {
      return 1;
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setError(null);
      setEncrypting(true);
      setUploadProgress(10);
      setStatusMessage("Reading file into browser memory...");

      const arrayBuffer = await file.arrayBuffer();
      const pageCount = await estimatePageCount(arrayBuffer, file.name);

      setUploadProgress(30);
      setStatusMessage("Generating 256-bit cryptographic DocKey (CSPRNG)...");
      const docKey = generateDocKey();
      const keyFragment = docKeyToFragment(docKey);

      setUploadProgress(50);
      setStatusMessage("Encrypting PDF with WebCrypto AES-GCM-256 in browser...");
      const encrypted = await encryptBytes(arrayBuffer, docKey);

      setUploadProgress(75);
      setStatusMessage("Transferring encrypted ciphertext to blind storage...");

      // Convert ciphertext to base64 for direct transport
      const cipherBytes = new Uint8Array(encrypted.ciphertext);
      let binary = "";
      for (let i = 0; i < cipherBytes.byteLength; i++) {
        binary += String.fromCharCode(cipherBytes[i]);
      }
      const directCiphertextBase64 = btoa(binary);

      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || file.name,
          originalFilename: file.name,
          sizeBytes: file.size,
          pageCount,
          encryptionMode: "e2ee-fragment",
          ivHex: bufferToHex(encrypted.iv),
          directCiphertextBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadProgress(100);
      setStatusMessage("Complete!");

      // Save key in local and session storage for persistent local owner access
      if (typeof window !== "undefined") {
        const hexKey = bufferToHex(docKey);
        sessionStorage.setItem(`blindshare_key_${data.documentId}`, hexKey);
        localStorage.setItem(`blindshare_key_${data.documentId}`, hexKey);
      }

      setSuccessData({
        docId: data.documentId,
        keyFragment,
        title: title.trim() || file.name,
      });

      if (onUploadSuccess) {
        onUploadSuccess(data, keyFragment);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to encrypt and upload document");
    } finally {
      setEncrypting(false);
    }
  };

  if (successData) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center backdrop-blur-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">{t.upload.success}</h3>
        <p className="text-xs text-slate-300 mb-6">{successData.title}</p>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-left space-y-3 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Lock className="h-4 w-4" />
            <span>Zero-Knowledge Fragment Key</span>
          </div>
          <div className="rounded-lg bg-slate-900 p-2.5 font-mono text-xs text-slate-300 break-all border border-slate-800">
            #k={successData.keyFragment}
          </div>
          <p className="text-[11px] text-slate-400">
            When you create share links for this document, this fragment key will automatically be attached to the link URL.
          </p>
        </div>

        <button
          onClick={() => {
            setSuccessData(null);
            setFile(null);
            setTitle("");
          }}
          className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
        >
          Upload Another Document
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
      {/* Zero-Knowledge Badge */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-400">{t.upload.e2eeBadge}</div>
            <div className="text-[11px] text-slate-400 max-w-xl">{t.upload.e2eeDesc}</div>
          </div>
        </div>
        <div className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-mono text-amber-300 border border-slate-800">
          AES-GCM-256
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        {/* Dropzone */}
        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              dragActive
                ? "border-amber-500 bg-amber-500/10 scale-[0.99]"
                : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,.ico,.svg,.md,.markdown,.txt,.log,.json,.csv,.tsv,.docx,.doc,.pptx,.odp,.xlsx,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.zip"
              onChange={(e) => e.target.files?.[0] && handleFiles(e.target.files[0])}
              className="hidden"
            />
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-amber-400">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">{t.upload.dragDropTitle}</h4>
            <p className="text-xs text-slate-400 max-w-sm">{t.upload.dragDropDesc}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{file.name}</div>
                  <div className="text-xs text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {detected?.label || "File"} •{" "}
                    {detected?.renderer || "client renderer"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-red-400 hover:underline"
              >
                Change File
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.upload.docTitle}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document Title"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        )}

        {/* Upload Progress Indicator */}
        {encrypting && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-amber-400 animate-pulse">{statusMessage}</span>
              <span className="font-mono text-slate-400">{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {file && !encrypting && (
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Lock className="h-4 w-4" />
            <span>{t.upload.startUpload}</span>
          </button>
        )}
      </form>
    </div>
  );
}
