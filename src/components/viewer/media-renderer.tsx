"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { fragmentToDocKey, decryptBytes, hexToBuffer } from "@/lib/crypto-core";
import {
  detectFormat,
  FormatKind,
  formatCapabilityNote,
} from "@/lib/formats";
import {
  AlertCircle,
  Shield,
  Lock,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileText,
  Music4,
  Video,
  Table2,
  ImageIcon,
  Package,
} from "lucide-react";

interface MediaRendererProps {
  slug: string;
  linkData: {
    id: string;
    name: string;
    allowDownload: boolean;
    watermarkEnabled: boolean;
    watermarkText: string | null;
    brandLogoUrl?: string | null;
    brandAccentColor?: string | null;
    antiLeakBlurEnabled?: boolean;
  };
  docData: {
    id: string;
    title: string;
    originalFilename: string;
    pageCount: number;
    encryptionMode: string;
    ivHex: string | null;
  };
  sessionId: string;
  viewerIdentity: string;
  docKeyOverride?: Uint8Array | null;
}

/** Escape HTML so untrusted decrypted text can never inject markup. */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Minimal, escape-first Markdown subset renderer (no raw HTML passthrough). */
function renderMarkdown(md: string): string {
  const safe = escapeHtml(md);
  const lines = safe.split("\n");
  const out: string[] = [];
  let inCode = false;
  let inList = false;

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith("```")) {
      if (inCode) {
        out.push("</code></pre>");
        inCode = false;
      } else {
        out.push('<pre class="sp-md-pre"><code>');
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      out.push(line);
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      if (!inList) {
        out.push('<ul class="sp-md-ul">');
        inList = true;
      }
      out.push(`<li>${inlineMd(line.replace(/^\s*[-*+]\s+/, ""))}</li>`);
      continue;
    }
    if (inList) {
      out.push("</ul>");
      inList = false;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level} class="sp-md-h sp-md-h${level}">${inlineMd(heading[2])}</h${level}>`);
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      out.push(`<blockquote class="sp-md-quote">${inlineMd(line.replace(/^\s*>\s?/, ""))}</blockquote>`);
      continue;
    }

    if (line.trim() === "") {
      out.push("");
      continue;
    }

    out.push(`<p class="sp-md-p">${inlineMd(line)}</p>`);
  }

  if (inList) out.push("</ul>");
  if (inCode) out.push("</code></pre>");
  return out.join("\n");
}

function inlineMd(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code class="sp-md-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

/** Strip <script>, event handlers and javascript: URLs from SVG before rendering. */
function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "blocked:");
}

function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
    if (rows.length > 5000) break;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export function MediaRenderer({
  slug,
  linkData,
  docData,
  sessionId,
  viewerIdentity,
  docKeyOverride,
}: MediaRendererProps) {
  const { t, appName } = useI18n();

  const format: FormatKind = useMemo(
    () => detectFormat(docData.originalFilename),
    [docData.originalFilename]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState("Preparing decryption…");
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string>("");
  const [tableRows, setTableRows] = useState<string[][]>([]);
  const [zoom, setZoom] = useState(1);
  const [tablePage, setTablePage] = useState(1);
  const decryptedRef = useRef<ArrayBuffer | null>(null);

  const totalDwellRef = useRef(0);
  const rowsPerPage = 50;

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    async function run() {
      try {
        setLoading(true);
        setError(null);
        setStep("Extracting zero-knowledge key from URL fragment…");

        let docKey: Uint8Array | null = docKeyOverride ?? null;
        if (!docKey) {
          docKey = fragmentToDocKey(window.location.hash);
        }
        if (!docKey) {
          const stored = sessionStorage.getItem(`blindshare_key_${docData.id}`);
          if (stored) docKey = hexToBuffer(stored);
        }
        if (!docKey && docData.encryptionMode === "e2ee-fragment") {
          throw new Error(t.viewer.noKeyFragment);
        }

        setStep("Downloading ciphertext from blind storage…");
        const res = await fetch(`/api/v/${slug}/bytes`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || "Failed to download ciphertext");
        }
        const cipher = await res.arrayBuffer();

        setStep("Decrypting with WebCrypto AES-GCM-256 in your browser…");
        let plain: ArrayBuffer = cipher;
        if (docData.encryptionMode === "e2ee-fragment" && docKey) {
          const iv = docData.ivHex ? hexToBuffer(docData.ivHex) : new Uint8Array(12);
          plain = await decryptBytes(cipher, docKey, iv);
        }
        if (cancelled) return;
        decryptedRef.current = plain;

        setStep("Rendering…");

        if (format.kind === "image" || format.kind === "audio" || format.kind === "video") {
          const blob = new Blob([plain], { type: format.mime });
          createdUrl = URL.createObjectURL(blob);
          setObjectUrl(createdUrl);
        } else if (format.kind === "svg") {
          const svgText = sanitizeSvg(new TextDecoder().decode(plain));
          const blob = new Blob([svgText], { type: "image/svg+xml" });
          createdUrl = URL.createObjectURL(blob);
          setObjectUrl(createdUrl);
        } else if (format.kind === "markdown" || format.kind === "text") {
          setTextContent(new TextDecoder().decode(plain));
        } else if (format.kind === "table") {
          const decoded = new TextDecoder().decode(plain);
          const delimiter = docData.originalFilename.toLowerCase().endsWith(".tsv") ? "\t" : ",";
          setTableRows(parseDelimited(decoded, delimiter));
        }

        if (!cancelled) setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to decrypt document");
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [slug, docData, format, docKeyOverride, t.viewer.noKeyFragment]);

  // Dwell heartbeat (batched every 10s, minimal-PII)
  useEffect(() => {
    if (loading || error) return;
    const tick = setInterval(() => {
      totalDwellRef.current += 1;
    }, 1000);

    const beat = setInterval(() => {
      if (!sessionId) return;
      fetch(`/api/v/${slug}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          events: [{ pageNumber: tablePage, dwellSeconds: 10 }],
          maxPageReached: tablePage,
          completedPages: tablePage,
          totalDwellSeconds: totalDwellRef.current,
        }),
      }).catch(() => {});
    }, 10000);

    return () => {
      clearInterval(tick);
      clearInterval(beat);
    };
  }, [loading, error, sessionId, slug, tablePage]);

  const handleDownload = () => {
    if (!linkData.allowDownload || !decryptedRef.current) return;
    const blob = new Blob([decryptedRef.current], { type: format.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = docData.originalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const watermarkLabel = `${linkData.watermarkText ? `[${linkData.watermarkText}] ` : ""}${
    viewerIdentity || "CONFIDENTIAL"
  } • ${new Date().toISOString().substring(0, 16).replace("T", " ")} • ${slug.substring(0, 8)}`;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-amber-500/20 border-t-amber-500" />
          <Lock className="absolute inset-0 m-auto h-6 w-6 text-amber-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">{t.viewer.loadingDoc}</h3>
        <p className="max-w-md animate-pulse text-sm text-slate-400">{step}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <h3 className="mb-2 text-lg font-bold text-white">{t.viewer.notFoundTitle}</h3>
          <p className="text-sm text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  const FormatIcon =
    format.kind === "image" || format.kind === "svg"
      ? ImageIcon
      : format.kind === "audio"
      ? Music4
      : format.kind === "video"
      ? Video
      : format.kind === "table"
      ? Table2
      : format.kind === "bundle"
      ? Package
      : FileText;

  const totalTablePages = Math.max(1, Math.ceil(Math.max(tableRows.length - 1, 0) / rowsPerPage));

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* Toolbar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-950/90 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/20 text-amber-400">
            <FormatIcon className="h-4 w-4" />
          </div>
          <div>
            <h1 className="max-w-[220px] truncate text-sm font-semibold text-white sm:max-w-md">
              {docData.title}
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>
                {format.label} • AES-GCM decrypted in-browser
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {(format.kind === "image" || format.kind === "svg") && (
            <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-0.5">
              <button onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))} className="rounded p-1.5 text-slate-400 hover:text-white">
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-1 text-[11px] font-medium text-slate-300">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(4, z + 0.2))} className="rounded p-1.5 text-slate-400 hover:text-white">
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {linkData.allowDownload ? (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t.viewer.download}</span>
            </button>
          ) : (
            <div className="hidden items-center gap-1 rounded border border-slate-800/50 bg-slate-900/50 px-2 py-1 text-[11px] text-slate-500 lg:flex">
              <Lock className="h-3 w-3" />
              <span>Download Restricted</span>
            </div>
          )}
        </div>
      </div>

      {/* Content area with watermark overlay */}
      <div className="relative flex-1 overflow-auto p-4 sm:p-8">
        {linkData.watermarkEnabled && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden opacity-[0.16]"
            style={{
              backgroundImage: `repeating-linear-gradient(-28deg, transparent 0 120px, rgba(148,163,184,0.08) 120px 121px)`,
            }}
          >
            <div className="flex h-full w-full flex-wrap content-start gap-x-10 gap-y-14 p-6 -rotate-[28deg]">
              {Array.from({ length: 60 }).map((_, i) => (
                <span key={i} className="whitespace-nowrap text-[11px] font-semibold text-slate-300">
                  {watermarkLabel}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-5xl">
          {/* IMAGE / SVG */}
          {(format.kind === "image" || format.kind === "svg") && objectUrl && (
            <div className="flex justify-center overflow-auto rounded-2xl border border-slate-800 bg-slate-900 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={objectUrl}
                alt={docData.title}
                style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
                className="max-w-full rounded-lg transition-transform"
              />
            </div>
          )}

          {/* AUDIO */}
          {format.kind === "audio" && objectUrl && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
              <Music4 className="mx-auto mb-4 h-10 w-10 text-amber-400" />
              <audio controls src={objectUrl} className="w-full">
                Your browser does not support audio playback.
              </audio>
              <p className="mt-3 text-[11px] text-slate-400">
                Listening telemetry is aggregate-only and never captures audio content.
              </p>
            </div>
          )}

          {/* VIDEO */}
          {format.kind === "video" && objectUrl && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <video controls src={objectUrl} className="w-full rounded-lg" controlsList={linkData.allowDownload ? undefined : "nodownload"}>
                Your browser does not support video playback.
              </video>
              <p className="mt-3 text-[11px] text-slate-400">
                Egress note: video streams count against the separate MAX_VIDEO_MB budget ledger line.
              </p>
            </div>
          )}

          {/* MARKDOWN / TEXT */}
          {(format.kind === "markdown" || format.kind === "text") && (
            <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
              {format.kind === "markdown" ? (
                <div
                  className="sp-markdown space-y-3 text-sm leading-relaxed text-slate-200"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(textContent) }}
                />
              ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-200">
                  {textContent}
                </pre>
              )}
              <div className="mt-6 border-t border-slate-800 pt-3 text-[11px] text-slate-500">
                Estimated reading time: {Math.max(1, Math.round(textContent.split(/\s+/).length / 200))} min
              </div>
            </article>
          )}

          {/* CSV / TSV TABLE */}
          {format.kind === "table" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {Math.max(tableRows.length - 1, 0)} rows • page {tablePage} / {totalTablePages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                    disabled={tablePage <= 1}
                    className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setTablePage((p) => Math.min(totalTablePages, p + 1))}
                    disabled={tablePage >= totalTablePages}
                    className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 font-semibold text-amber-400">
                    <tr>
                      {(tableRows[0] || []).map((h, i) => (
                        <th key={i} className="whitespace-nowrap px-2 pb-2">
                          {h.length > 60 ? h.slice(0, 60) + "…" : h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tableRows
                      .slice(1 + (tablePage - 1) * rowsPerPage, 1 + tablePage * rowsPerPage)
                      .map((r, ri) => (
                        <tr key={ri} className="hover:bg-slate-800/30">
                          {r.map((c, ci) => (
                            <td key={ci} className="whitespace-nowrap px-2 py-1.5 text-slate-300">
                              {c.length > 80 ? c.slice(0, 80) + "…" : c}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BUNDLE / UNKNOWN */}
          {(format.kind === "bundle" || format.kind === "unknown" || format.kind === "office") && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
              <Package className="mx-auto mb-4 h-10 w-10 text-amber-400" />
              <h3 className="mb-2 text-base font-bold text-white">Bundle View</h3>
              <p className="mx-auto mb-5 max-w-md text-xs leading-relaxed text-slate-400">
                {formatCapabilityNote(format.kind)}
              </p>
              {linkData.allowDownload ? (
                <button
                  onClick={handleDownload}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  Download Decrypted File
                </button>
              ) : (
                <div className="text-[11px] text-slate-500">
                  Owner disabled downloads for this link, so no deep preview is available.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-900 bg-slate-950 px-4 py-2 text-center text-[11px] text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-amber-500" />
          <span>
            {appName} Protected View • Viewer:{" "}
            <strong className="text-slate-400">{viewerIdentity || "Anonymous"}</strong>
          </span>
        </div>
        <div className="text-[10px] text-slate-600">
          Honest note: watermark & download-off are deterrents, not DRM.
        </div>
      </div>
    </div>
  );
}
