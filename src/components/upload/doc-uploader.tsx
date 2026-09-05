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
import { autoWrapDocKeyForOwner } from "@/lib/vault/master-vault";
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
  targetDoc?: {
    id: string;
    title: string;
    currentVersion: number;
  } | null;
}

export function DocUploader({ onUploadSuccess, targetDoc }: DocUploaderProps) {
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
      if (typeof window !== "undefined" && (window as any).pdfjsLib) {
        try {
          const pdf = await (window as any).pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)) }).promise;
          if (pdf && pdf.numPages > 0) return pdf.numPages;
        } catch {}
      }
      const text = new TextDecoder("latin1").decode(buffer);
      const countMatch =
        text.match(/\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/) ||
        text.match(/\/Count\s+(\d+)[^>]*\/Type\s*\/Pages/);
      if (countMatch && parseInt(countMatch[1], 10) > 0) {
        return parseInt(countMatch[1], 10);
      }
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

      setStatusMessage("Wrapping key for Owner Master Vault...");
      const vaultWrapped = await autoWrapDocKeyForOwner(docKey);

      if (targetDoc) {
        setStatusMessage(`Saving Version v${targetDoc.currentVersion + 1}...`);
        const res = await fetch(`/api/docs/${targetDoc.id}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sizeBytes: file.size,
            pageCount,
            ivHex: bufferToHex(encrypted.iv),
            changelog: `Uploaded v${targetDoc.currentVersion + 1} (${file.name})`,
            directCiphertextBase64,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Version upload failed");
        }

        setUploadProgress(100);
        setStatusMessage("Version Updated!");

        if (typeof window !== "undefined") {
          const hexKey = bufferToHex(docKey);
          sessionStorage.setItem(`blindshare_key_${targetDoc.id}`, hexKey);
          localStorage.setItem(`blindshare_key_${targetDoc.id}`, hexKey);
        }

        setSuccessData({
          docId: targetDoc.id,
          keyFragment,
          title: `v${targetDoc.currentVersion + 1}: ${targetDoc.title}`,
        });

        if (onUploadSuccess) {
          onUploadSuccess({ documentId: targetDoc.id, ...data }, keyFragment);
        }
        return;
      }

      setStatusMessage("Saving metadata and ciphertext...");
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
          ownerEncryptedKeyHex: vaultWrapped?.ownerEncryptedKeyHex,
          ownerEncryptedKeyIvHex: vaultWrapped?.ownerEncryptedKeyIvHex,
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
    <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl backdrop-blur-xl border border-slate-800/80">
      {/* Zero-Knowledge Badge */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-3.5 sm:p-4 shadow-sm shadow-amber-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-48 bg-radial from-amber-500/10 to-transparent pointer-events-none blur-xl" />
        <div className="flex items-start sm:items-center gap-3 relative z-10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-inner">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-300">{t.upload.e2eeBadge}</div>
            <div className="text-[11px] text-slate-300 max-w-xl leading-relaxed">{t.upload.e2eeDesc}</div>
          </div>
        </div>
        <div className="self-start sm:self-auto flex items-center gap-1.5 rounded-full bg-slate-950/90 px-3 py-1 text-[10px] font-mono text-amber-300 border border-amber-500/30 shadow-sm relative z-10 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>AES-GCM-256</span>
        </div>
      </div>

      {/* Target Document Versioning Alert */}
      {targetDoc && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-purple-500/40 bg-purple-950/30 p-3.5 text-xs text-purple-200">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-white">Updating Document: </span>
              <span className="text-purple-300">{targetDoc.title}</span>
              <div className="text-[10px] text-slate-400">
                Current: <strong className="text-white">v{targetDoc.currentVersion}</strong> → Next: <strong className="text-amber-400">v{targetDoc.currentVersion + 1}</strong>
              </div>
            </div>
          </div>
          <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
            v{targetDoc.currentVersion + 1}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300 shadow-lg">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-5">
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
            className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-dashed p-6 sm:p-10 text-center transition-all duration-300 ${
              dragActive
                ? "border-amber-400 bg-amber-500/15 scale-[0.99] shadow-2xl shadow-amber-500/20 ring-4 ring-amber-500/20"
                : "border-slate-700/80 bg-slate-950/70 hover:border-amber-500/50 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-amber-500/5 shadow-inner"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,.ico,.svg,.md,.markdown,.txt,.log,.json,.csv,.tsv,.docx,.doc,.odt,.pptx,.ppt,.odp,.xlsx,.xls,.ods,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.zip,.js,.jsx,.ts,.tsx,.py,.css,.scss,.sql,.rs,.go,.sh,.bash,.yaml,.yml,.xml,.c,.cpp,.h,.java,.php,.rb,.swift,.kt,.html,.htm"
              onChange={(e) => e.target.files?.[0] && handleFiles(e.target.files[0])}
              className="hidden"
            />
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 group-hover:-translate-y-1 group-hover:bg-amber-500/20 group-hover:border-amber-400/40 transition-all duration-300 shadow-md">
              <UploadCloud className="h-7 w-7" />
            </div>
            <h4 className="text-base font-bold text-white mb-1.5">{t.upload.dragDropTitle}</h4>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{t.upload.dragDropDesc}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-700/80 bg-slate-950/80 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-sm">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{file.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {detected?.label || "File"} •{" "}
                    {detected?.renderer || "client renderer"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs font-semibold text-red-400 hover:text-red-300 hover:underline px-3 py-1 rounded-lg hover:bg-red-950/40 transition-colors"
              >
                Change File
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.upload.docTitle}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document Title"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all shadow-inner"
              />
            </div>
          </div>
        )}

        {/* Upload Progress Indicator */}
        {encrypting && (
          <div className="rounded-2xl border border-amber-500/30 bg-slate-950/90 p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-400 animate-pulse flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 animate-spin" />
                <span>{statusMessage}</span>
              </span>
              <span className="font-mono font-bold text-amber-300">{uploadProgress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-300 shadow-md shadow-amber-500/40"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {file && !encrypting && (
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 py-3.5 text-sm font-bold text-slate-950 hover:from-amber-400 hover:to-amber-300 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Lock className="h-4 w-4 stroke-[2.5]" />
            <span>{t.upload.startUpload}</span>
          </button>
        )}
      </form>
    </div>
  );
}
