"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import { fragmentToDocKey, decryptBytes, hexToBuffer, bufferToHex } from "@/lib/crypto-core";
import { applyMicroDotWatermark } from "@/lib/watermark/forensic-stego";
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
  RotateCw,
  FileText,
  Music4,
  Video,
  Table2,
  ImageIcon,
  Package,
  Code2,
  Copy,
  Check,
  Search,
  ArrowUpDown,
  Maximize2,
  Minimize2,
  WrapText,
  Eye,
  Sliders,
  Sparkles,
  Layers,
  Sun,
  Moon,
  Play,
  Pause,
  Presentation,
} from "lucide-react";
import { PresenterModeView } from "@/components/viewer/presenter-mode-view";

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
    burnAfterReading?: boolean;
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

/** Escape HTML so untrusted text never executes as raw script */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Lightweight fast syntax highlighter for 15+ code languages */
function highlightCode(code: string, language?: string): string {
  const lang = (language || "javascript").toLowerCase();
  const escaped = escapeHtml(code);

  if (lang === "json") {
    return escaped
      .replace(/"([^"]+)":/g, '<span class="text-amber-400 font-semibold">"$1":</span>')
      .replace(/:\s*"([^"]*)"/g, ': <span class="text-emerald-400">"$1"</span>')
      .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-purple-400 font-mono">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span class="text-blue-400 font-bold">$1</span>');
  }

  if (lang === "html" || lang === "xml") {
    return escaped
      .replace(/(&lt;\/?[a-zA-Z0-9\-]+)([\s\S]*?)(&gt;)/g, (_m, p1, p2, p3) => {
        const attrs = p2.replace(/([a-zA-Z\-:]+)=(&quot;[^&]*&quot;|&#039;[^&]*&#039;)/g, '<span class="text-amber-300">$1</span>=<span class="text-emerald-400">$2</span>');
        return `<span class="text-blue-400 font-semibold">${p1}</span>${attrs}<span class="text-blue-400 font-semibold">${p3}</span>`;
      })
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-slate-500 italic">$1</span>');
  }

  // General C-style / Python / Shell syntax regex highlighter
  let hl = escaped
    // Comments
    .replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span class="text-slate-500 italic">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-slate-500 italic">$1</span>')
    // Strings
    .replace(/(&quot;[^&]*&quot;|&#039;[^&]*&#039;|`[^`]*`)/g, '<span class="text-emerald-400">$1</span>')
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-purple-400 font-mono">$1</span>')
    // Keywords
    .replace(
      /\b(const|let|var|function|return|if|else|for|while|import|export|from|default|class|extends|new|this|async|await|try|catch|throw|finally|typeof|instanceof|interface|type|public|private|protected|readonly|static|def|self|None|True|False|elif|lambda|struct|impl|pub|fn|mut|match|enum|SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|JOIN|GROUP|ORDER|BY|LIMIT|CREATE|TABLE|DATABASE)\b/g,
      '<span class="text-amber-400 font-semibold">$1</span>'
    )
    // Types & Booleans
    .replace(
      /\b(string|number|boolean|any|void|unknown|never|Promise|Array|Record|null|undefined|true|false|int|float|bool|str|list|dict|Option|Result|Vec|i32|i64|u32|u64|usize|f64)\b/g,
      '<span class="text-blue-400 font-medium">$1</span>'
    );

  return hl;
}

/** Render a simple mermaid-like flowchart diagram safely in SVG */
function renderMermaidSvg(source: string): string {
  const lines = source.trim().split("\n");
  const nodes: { id: string; label: string }[] = [];
  const edges: { from: string; to: string; label?: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("graph") || trimmed.startsWith("flowchart")) continue;

    // Pattern: A[Label] -->|text| B[Label] or A --> B
    const arrowMatch = trimmed.match(/([A-Za-z0-9_-]+)(?:\[(.*?)\])?\s*-->\|?(.*?)\|?\s*([A-Za-z0-9_-]+)(?:\[(.*?)\])?/);
    if (arrowMatch) {
      const fromId = arrowMatch[1];
      const fromLabel = arrowMatch[2] || fromId;
      const edgeLabel = arrowMatch[3] ? arrowMatch[3].replace(/\|/g, "").trim() : "";
      const toId = arrowMatch[4];
      const toLabel = arrowMatch[5] || toId;

      if (!nodes.some((n) => n.id === fromId)) nodes.push({ id: fromId, label: fromLabel });
      if (!nodes.some((n) => n.id === toId)) nodes.push({ id: toId, label: toLabel });
      edges.push({ from: fromId, to: toId, label: edgeLabel });
    }
  }

  if (nodes.length === 0) {
    return `<div class="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400"><pre>${escapeHtml(source)}</pre></div>`;
  }

  const nodeWidth = 140;
  const nodeHeight = 44;
  const gapY = 80;
  const totalHeight = Math.max(nodes.length * gapY + 40, 200);
  const totalWidth = 500;
  const startX = totalWidth / 2 - nodeWidth / 2;

  let svgContent = `<svg width="100%" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="overflow-visible">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
      </marker>
    </defs>`;

  // Draw Edges
  edges.forEach((edge) => {
    const fromIdx = nodes.findIndex((n) => n.id === edge.from);
    const toIdx = nodes.findIndex((n) => n.id === edge.to);
    if (fromIdx !== -1 && toIdx !== -1) {
      const y1 = fromIdx * gapY + 40 + nodeHeight;
      const y2 = toIdx * gapY + 40;
      const x = totalWidth / 2;
      svgContent += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#f59e0b" stroke-width="2" marker-end="url(#arrow)" />`;
      if (edge.label) {
        svgContent += `<rect x="${x - 40}" y="${(y1 + y2) / 2 - 10}" width="80" height="20" rx="4" fill="#0f172a" stroke="#334155" />
          <text x="${x}" y="${(y1 + y2) / 2 + 4}" fill="#94a3b8" font-size="10" font-family="sans-serif" text-anchor="middle">${escapeHtml(edge.label)}</text>`;
      }
    }
  });

  // Draw Nodes
  nodes.forEach((node, idx) => {
    const y = idx * gapY + 40;
    svgContent += `
      <g transform="translate(${startX}, ${y})">
        <rect width="${nodeWidth}" height="${nodeHeight}" rx="10" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))" />
        <text x="${nodeWidth / 2}" y="${nodeHeight / 2 + 5}" fill="#ffffff" font-size="12" font-weight="600" font-family="sans-serif" text-anchor="middle">${escapeHtml(node.label)}</text>
      </g>`;
  });

  svgContent += `</svg>`;
  return `<div class="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center my-4 overflow-x-auto">${svgContent}</div>`;
}

/** Rich Markdown with Syntax Highlighting, Alerts, Tables, and Mermaid */
function renderMarkdownRich(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inCode = false;
  let codeLang = "";
  let codeBuffer: string[] = [];
  let inList = false;
  let inTable = false;
  let tableHeaderParsed = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // Code block toggle
    if (line.startsWith("```")) {
      if (inCode) {
        const fullCode = codeBuffer.join("\n");
        if (codeLang === "mermaid") {
          out.push(renderMermaidSvg(fullCode));
        } else {
          out.push(`<div class="relative my-4 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs shadow-lg">
            <div class="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/80 text-[11px] text-slate-400 font-sans">
              <span class="font-semibold text-amber-400 uppercase tracking-wider">${escapeHtml(codeLang || "code")}</span>
            </div>
            <pre class="p-4 overflow-x-auto leading-relaxed"><code>${highlightCode(fullCode, codeLang)}</code></pre>
          </div>`);
        }
        inCode = false;
        codeBuffer = [];
        codeLang = "";
      } else {
        inCode = true;
        codeLang = line.replace("```", "").trim();
        codeBuffer = [];
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(raw);
      continue;
    }

    // Callout alert quotes [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
    const alertMatch = line.match(/^\s*>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i);
    if (alertMatch) {
      const type = alertMatch[1].toUpperCase();
      const text = alertMatch[2];
      const colors: Record<string, string> = {
        NOTE: "border-blue-500/40 bg-blue-950/20 text-blue-300",
        TIP: "border-emerald-500/40 bg-emerald-950/20 text-emerald-300",
        IMPORTANT: "border-purple-500/40 bg-purple-950/20 text-purple-300",
        WARNING: "border-amber-500/40 bg-amber-950/20 text-amber-300",
        CAUTION: "border-red-500/40 bg-red-950/20 text-red-300",
      };
      out.push(`<div class="my-4 rounded-xl border-l-4 p-4 ${colors[type] || colors.NOTE}">
        <div class="font-bold text-xs uppercase tracking-wider mb-1">${type}</div>
        <div class="text-xs text-slate-200">${inlineMd(text)}</div>
      </div>`);
      continue;
    }

    // Standard blockquote
    if (/^\s*>\s?/.test(line)) {
      out.push(`<blockquote class="border-l-2 border-amber-500/60 pl-4 py-1 my-3 text-slate-300 italic text-sm">${inlineMd(line.replace(/^\s*>\s?/, ""))}</blockquote>`);
      continue;
    }

    // Markdown Table
    if (line.includes("|") && line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (line.includes("---")) {
        tableHeaderParsed = true;
        continue;
      }
      if (!inTable) {
        out.push('<div class="overflow-x-auto my-4 rounded-xl border border-slate-800"><table class="w-full text-left text-xs">');
        out.push('<thead class="border-b border-slate-800 bg-slate-900 text-slate-300 font-semibold"><tr>');
        cells.forEach((c) => out.push(`<th class="p-3">${inlineMd(c)}</th>`));
        out.push('</tr></thead><tbody class="divide-y divide-slate-800/60 bg-slate-950">');
        inTable = true;
        continue;
      } else {
        out.push('<tr class="hover:bg-slate-900/40 transition">');
        cells.forEach((c) => out.push(`<td class="p-3 text-slate-300">${inlineMd(c)}</td>`));
        out.push('</tr>');
        continue;
      }
    } else if (inTable) {
      out.push('</tbody></table></div>');
      inTable = false;
      tableHeaderParsed = false;
    }

    // Unordered & Task Lists
    const taskMatch = line.match(/^\s*[-*+]\s+\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      if (!inList) {
        out.push('<ul class="space-y-1.5 my-3">');
        inList = true;
      }
      const checked = taskMatch[1].toLowerCase() === "x";
      out.push(`<li class="flex items-center gap-2 text-xs text-slate-200">
        <input type="checkbox" disabled ${checked ? "checked" : ""} class="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-amber-500 accent-amber-500" />
        <span>${inlineMd(taskMatch[2])}</span>
      </li>`);
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      if (!inList) {
        out.push('<ul class="list-disc list-inside space-y-1 my-3 text-xs text-slate-200">');
        inList = true;
      }
      out.push(`<li>${inlineMd(line.replace(/^\s*[-*+]\s+/, ""))}</li>`);
      continue;
    }
    if (inList) {
      out.push("</ul>");
      inList = false;
    }

    // Headings (H1 to H6)
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const sizeClasses = [
        "text-2xl font-bold text-white pb-2 border-b border-slate-800 mt-6 mb-3",
        "text-xl font-bold text-white pb-1.5 border-b border-slate-800/80 mt-5 mb-2.5",
        "text-lg font-bold text-amber-400 mt-4 mb-2",
        "text-base font-semibold text-white mt-3 mb-1.5",
        "text-sm font-semibold text-slate-300 mt-2 mb-1",
        "text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2 mb-1",
      ];
      out.push(`<h${level} class="${sizeClasses[level - 1]}">${inlineMd(heading[2])}</h${level}>`);
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      out.push('<hr class="my-6 border-slate-800" />');
      continue;
    }

    if (line.trim() === "") {
      out.push("");
      continue;
    }

    out.push(`<p class="my-2 text-xs leading-relaxed text-slate-300">${inlineMd(line)}</p>`);
  }

  if (inList) out.push("</ul>");
  if (inTable) out.push("</tbody></table></div>");
  if (inCode) out.push("</code></pre></div>");
  return out.join("\n");
}

function inlineMd(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="italic text-slate-200">$1</em>')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|#)[^\s"'<>]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-amber-400 hover:underline inline-flex items-center gap-0.5">$1</a>');
}

function isSafeSvgUrl(urlStr: string): boolean {
  const trimmed = String(urlStr || "").trim();
  if (trimmed.startsWith("#") || trimmed.startsWith("/") || trimmed.startsWith("./")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:";
  } catch {
    return false;
  }
}

/** Sanitize SVG safely using DOMParser */
function sanitizeSvg(svg: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return svg;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    // Strip scripts and foreignObjects
    const dangerousNodes = doc.querySelectorAll("script, foreignObject");
    dangerousNodes.forEach((node) => node.remove());

    // Strip inline event listeners (on*) and non-allowlisted URL schemes
    const elements = doc.querySelectorAll("*");
    elements.forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) {
          el.removeAttribute(attr.name);
          continue;
        }
        if (name === "href" || name === "xlink:href" || name === "src") {
          if (!isSafeSvgUrl(attr.value)) {
            el.removeAttribute(attr.name);
          }
        }
      }
    });

    return new XMLSerializer().serializeToString(doc.documentElement);
  } catch {
    return svg;
  }
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
  const { t } = useI18n();

  const format: FormatKind = useMemo(
    () => detectFormat(docData.originalFilename),
    [docData.originalFilename]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState("Preparing decryption…");
  // Missing / Lost Key Recovery UI State (resilience against cache clear)
  const [keyRecoveryInput, setKeyRecoveryInput] = useState("");
  const [keyRecoveryError, setKeyRecoveryError] = useState<string | null>(null);
  const [recoveringKey, setRecoveringKey] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string>("");
  const [tableRows, setTableRows] = useState<string[][]>([]);
  const [decryptedBytes, setDecryptedBytes] = useState<ArrayBuffer | null>(null);

  // Controls & Viewing modes
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageBgDark, setImageBgDark] = useState(true);
  const [htmlTab, setHtmlTab] = useState<"preview" | "code">("preview");
  const [codeCopied, setCodeCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [tableSearch, setTableSearch] = useState("");
  const [tableSortCol, setTableSortCol] = useState<number | null>(null);
  const [tableSortAsc, setTableSortAsc] = useState(true);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(25);
  const [fullscreen, setFullscreen] = useState(false);
  const [presenterMode, setPresenterMode] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const totalDwellRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
          if (docKey && typeof window !== "undefined") {
            if (linkData.burnAfterReading) {
              // Idea 6: Forward Secrecy Ratchet - Strip hash from address bar so history cannot reopen it
              if (window.location.hash.includes("k=")) {
                window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
              }
            } else {
              try {
                const hex = bufferToHex(docKey);
                sessionStorage.setItem(`blindshare_key_${docData.id}`, hex);
                sessionStorage.setItem(`blindshare_key_${slug}`, hex);
                localStorage.setItem(`blindshare_key_${docData.id}`, hex);
                localStorage.setItem(`blindshare_link_key_${slug}`, hex);
              } catch {}
            }
          }
        }
        if (!docKey && typeof window !== "undefined") {
          const stored =
            sessionStorage.getItem(`blindshare_key_${docData.id}`) ||
            sessionStorage.getItem(`blindshare_key_${slug}`) ||
            localStorage.getItem(`blindshare_link_key_${slug}`) ||
            localStorage.getItem(`blindshare_key_${docData.id}`);
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
        setDecryptedBytes(plain);

        // Format-specific decoding
        if (
          format.kind === "text" ||
          format.kind === "markdown" ||
          format.kind === "code" ||
          format.kind === "html"
        ) {
          const txt = new TextDecoder("utf-8").decode(plain);
          setTextContent(txt);
        } else if (format.kind === "table") {
          const txt = new TextDecoder("utf-8").decode(plain);
          const delimiter = docData.originalFilename.toLowerCase().endsWith(".tsv") ? "\t" : ",";
          const rows = parseDelimited(txt, delimiter);
          setTableRows(rows);
        } else if (format.kind === "svg") {
          const raw = new TextDecoder("utf-8").decode(plain);
          const clean = sanitizeSvg(raw);
          const blob = new Blob([clean], { type: "image/svg+xml" });
          createdUrl = URL.createObjectURL(blob);
          setObjectUrl(createdUrl);
        } else {
          const blob = new Blob([plain], { type: format.mime });
          createdUrl = URL.createObjectURL(blob);
          setObjectUrl(createdUrl);
        }

        setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          console.error("Media Decryption Error:", err);
          setError(err.message || "Failed to decrypt and render document");
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [docData, docKeyOverride, format, slug, t.viewer.noKeyFragment, reloadTrigger]);

  // Zero-Drop Dwell telemetry with sendBeacon
  useEffect(() => {
    if (loading || error) return;

    const tick = setInterval(() => {
      totalDwellRef.current += 1;
    }, 1000);

    const flushMediaDwell = () => {
      if (!sessionId) return;
      const payload = JSON.stringify({
        sessionId,
        events: [{ pageNumber: tablePage, dwellSeconds: 10 }],
        maxPageReached: tablePage,
        completedPages: tablePage,
        totalDwellSeconds: totalDwellRef.current,
      });

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(`/api/v/${slug}/session`, blob);
      } else {
        fetch(`/api/v/${slug}/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    // Batch telemetry flush (steady 25-second interval saving Neon CU-hours & serverless invocations)
    const beat = setInterval(flushMediaDwell, 25000);

    const handleVis = () => {
      if (document.visibilityState === "hidden") flushMediaDwell();
    };

    window.addEventListener("pagehide", flushMediaDwell);
    document.addEventListener("visibilitychange", handleVis);

    return () => {
      clearInterval(tick);
      clearInterval(beat);
      window.removeEventListener("pagehide", flushMediaDwell);
      document.removeEventListener("visibilitychange", handleVis);
      flushMediaDwell();
    };
  }, [loading, error, sessionId, slug, tablePage]);

  // Idea 6: Forward Secrecy & Burn-After-Reading Ratchet for Media Viewer
  useEffect(() => {
    if (!linkData.burnAfterReading) return;

    const handleRatchetBurn = () => {
      try {
        sessionStorage.removeItem(`blindshare_key_${slug}`);
        sessionStorage.removeItem(`blindshare_key_${docData.id}`);
        localStorage.removeItem(`blindshare_key_${docData.id}`);
        localStorage.removeItem(`blindshare_link_key_${slug}`);
      } catch {}

      const payload = JSON.stringify({ sessionId });
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(`/api/v/${slug}/ratchet-burn`, blob);
      } else {
        fetch(`/api/v/${slug}/ratchet-burn`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener("pagehide", handleRatchetBurn);
    window.addEventListener("beforeunload", handleRatchetBurn);

    return () => {
      window.removeEventListener("pagehide", handleRatchetBurn);
      window.removeEventListener("beforeunload", handleRatchetBurn);
    };
  }, [linkData.burnAfterReading, docData.id, slug, sessionId]);

  const handleDownload = () => {
    if (!linkData.allowDownload || !decryptedBytes) return;
    const blob = new Blob([decryptedBytes], { type: format.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = docData.originalFilename;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Defer revoke by 60s so browser download managers have plenty of time
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(textContent);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const watermarkLabel = `${linkData.watermarkText ? `[${linkData.watermarkText}] ` : ""}${
    viewerIdentity || "CONFIDENTIAL"
  } • ${new Date().toISOString().substring(0, 16).replace("T", " ")} • ${slug.substring(0, 8)}`;

  const stegoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Invisible Forensic Steganography for Media Renderer
  useEffect(() => {
    if (!linkData.watermarkEnabled || !stegoCanvasRef.current) return;
    const canvas = stegoCanvasRef.current;
    const width = 1200;
    const height = 900;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    applyMicroDotWatermark(ctx, width, height, {
      viewerIdentity: viewerIdentity || "CONFIDENTIAL",
      slug,
      sessionId,
      timestamp: Date.now(),
    });
  }, [linkData.watermarkEnabled, viewerIdentity, slug, sessionId]);

  // Table filtering & sorting
  const filteredRows = useMemo(() => {
    if (tableRows.length <= 1) return tableRows;
    const header = tableRows[0];
    let body = tableRows.slice(1);

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      body = body.filter((row) => row.some((cell) => cell.toLowerCase().includes(q)));
    }

    if (tableSortCol !== null) {
      body = [...body].sort((a, b) => {
        const valA = a[tableSortCol] || "";
        const valB = b[tableSortCol] || "";
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return tableSortAsc ? numA - numB : numB - numA;
        }
        return tableSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }

    return [header, ...body];
  }, [tableRows, tableSearch, tableSortCol, tableSortAsc]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-amber-500/20 border-t-amber-500" />
          <Lock className="absolute inset-0 m-auto h-6 w-6 text-amber-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">{t.viewer.loadingDoc}</h3>
        <p className="max-w-md animate-pulse text-xs text-slate-400">{step}</p>
      </div>
    );
  }

  if (error) {
    const isMissingKey = error.toLowerCase().includes("missing decryption key") || error.toLowerCase().includes("#k=") || error === t.viewer.noKeyFragment;

    const handleApplyRecoveryKey = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!keyRecoveryInput.trim()) return;
      setKeyRecoveryError(null);
      setRecoveringKey(true);

      try {
        const raw = keyRecoveryInput.trim();
        let derivedKey: Uint8Array | null = null;

        if (raw.includes("#k=")) {
          derivedKey = fragmentToDocKey(raw.substring(raw.indexOf("#k=")));
        } else if (raw.includes("/v/")) {
          const hashPos = raw.indexOf("#");
          if (hashPos !== -1) derivedKey = fragmentToDocKey(raw.substring(hashPos));
        } else if (raw.startsWith("k=")) {
          derivedKey = fragmentToDocKey("#" + raw);
        } else if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
          derivedKey = hexToBuffer(raw);
        } else {
          try {
            const meRes = await fetch("/api/auth/me");
            const meJson = await meRes.json().catch(() => ({}));
            if (meJson.user?.masterKeySaltHex) {
              const { unlockOwnerVault } = await import("@/lib/vault/master-vault");
              const master = await unlockOwnerVault(raw, meJson.user.masterKeySaltHex);
              const docsRes = await fetch("/api/docs");
              const docsJson = await docsRes.json().catch(() => ({}));
              const myDoc = docsJson?.documents?.find((d: any) => d.id === docData.id);
              if (myDoc?.ownerEncryptedKeyHex && myDoc?.ownerEncryptedKeyIvHex) {
                const { unwrapDocKeyForOwner } = await import("@/lib/crypto-core");
                derivedKey = await unwrapDocKeyForOwner(myDoc.ownerEncryptedKeyHex, myDoc.ownerEncryptedKeyIvHex, master);
              }
            }
          } catch {}
          if (!derivedKey) {
            derivedKey = fragmentToDocKey("#k=" + raw);
          }
        }

        if (!derivedKey || derivedKey.length < 16) {
          setKeyRecoveryError("Invalid decryption key or password. Please provide the complete link or #k= fragment.");
          return;
        }

        const hex = bufferToHex(derivedKey);
        sessionStorage.setItem("blindshare_key_" + slug, hex);
        sessionStorage.setItem("blindshare_key_" + docData.id, hex);
        localStorage.setItem("blindshare_key_" + docData.id, hex);
        localStorage.setItem("blindshare_link_key_" + slug, hex);

        const { docKeyToFragment } = await import("@/lib/crypto-core");
        const frag = docKeyToFragment(derivedKey);
        window.history.replaceState(null, "", window.location.pathname + window.location.search + "#k=" + frag);

        setError(null);
        setReloadTrigger((v) => v + 1);
      } catch (err: any) {
        setKeyRecoveryError(err.message || "Failed to parse key");
      } finally {
        setRecoveringKey(false);
      }
    };

    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center space-y-4">
          <AlertCircle className="mx-auto mb-1 h-8 w-8 text-red-400" />
          <h3 className="text-lg font-bold text-white mb-1">{t.viewer.notFoundTitle}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{error}</p>

          {isMissingKey && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 text-left space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Lock className="h-4 w-4" />
                <span>Recover Document Access</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                If your browser cache was cleared or the link was opened without the <code className="text-amber-300">#k=...</code> fragment, enter your key or full link below:
              </p>

              {keyRecoveryError && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/50 p-2.5 text-[11px] text-red-300">
                  {keyRecoveryError}
                </div>
              )}

              <form onSubmit={handleApplyRecoveryKey} className="space-y-3">
                <input
                  type="text"
                  value={keyRecoveryInput}
                  onChange={(e) => setKeyRecoveryInput(e.target.value)}
                  placeholder="Paste #k=... fragment, full share URL, or owner password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={recoveringKey || !keyRecoveryInput.trim()}
                  className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition disabled:opacity-50"
                >
                  {recoveringKey ? "Decrypting..." : "Decrypt & Unlock Document"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl overflow-hidden ${fullscreen ? "fixed inset-0 z-50 rounded-none bg-slate-950" : ""}`}>
      {/* Top Floating Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/90 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {format.kind === "image" || format.kind === "svg" ? (
              <ImageIcon className="h-4 w-4" />
            ) : format.kind === "markdown" ? (
              <Sparkles className="h-4 w-4" />
            ) : format.kind === "code" || format.kind === "html" ? (
              <Code2 className="h-4 w-4" />
            ) : format.kind === "table" ? (
              <Table2 className="h-4 w-4" />
            ) : format.kind === "audio" ? (
              <Music4 className="h-4 w-4" />
            ) : format.kind === "video" ? (
              <Video className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-white truncate max-w-[220px] sm:max-w-md">
              {docData.originalFilename}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
              <span>{format.label}</span>
              <span>•</span>
              <span className="text-emerald-400">Zero-Knowledge Decrypted</span>
            </div>
          </div>
        </div>

        {/* Custom Toolbar Tools per Format */}
        <div className="flex items-center gap-2">
          {/* Code View Tools */}
          {(format.kind === "code" || format.kind === "text") && (
            <>
              <button
                onClick={() => setWordWrap(!wordWrap)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                  wordWrap ? "border-amber-500/40 bg-amber-950/30 text-amber-300" : "border-slate-800 text-slate-400"
                }`}
                title="Toggle Word Wrap"
              >
                <WrapText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Wrap</span>
              </button>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition"
              >
                {codeCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{codeCopied ? "Copied!" : "Copy"}</span>
              </button>
            </>
          )}

          {/* HTML Dual Mode */}
          {format.kind === "html" && (
            <div className="flex rounded-lg border border-slate-800 p-0.5 bg-slate-950 text-xs">
              <button
                onClick={() => setHtmlTab("preview")}
                className={`px-2.5 py-1 rounded-md transition ${htmlTab === "preview" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400"}`}
              >
                Preview
              </button>
              <button
                onClick={() => setHtmlTab("code")}
                className={`px-2.5 py-1 rounded-md transition ${htmlTab === "code" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400"}`}
              >
                Source
              </button>
            </div>
          )}

          {/* Image & SVG Controls */}
          {(format.kind === "image" || format.kind === "svg") && (
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                className="p-1 text-slate-400 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-1 font-mono text-[10px] text-slate-300">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                className="p-1 text-slate-400 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1 text-slate-400 hover:text-white border-l border-slate-800 pl-1.5"
                title="Rotate 90°"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setImageBgDark(!imageBgDark)}
                className="p-1 text-slate-400 hover:text-white border-l border-slate-800 pl-1.5"
                title="Toggle Background Contrast"
              >
                {imageBgDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}

          {/* Presenter / Pitch Deck Slideshow Mode */}
          <button
            onClick={() => setPresenterMode(true)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 shadow-sm"
            title="Start Fullscreen Presenter Mode"
          >
            <Presentation className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Presenter Mode</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition"
            title="Toggle Fullscreen"
          >
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {/* Download button if enabled */}
          {linkData.allowDownload && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/10 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative min-h-[60vh] max-h-[85vh] overflow-auto p-4 sm:p-6 bg-slate-950/60">
        {/* Dynamic Watermark Overlay (Clean Staggered Forensic Matrix + Stego Micro-Dots) */}
        {linkData.watermarkEnabled && (
          <>
            <canvas
              ref={stegoCanvasRef}
              className="pointer-events-none absolute inset-0 z-20 w-full h-full select-none"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden select-none"
              aria-hidden="true"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-32 gap-y-20 opacity-15 rotate-[-25deg] text-center font-mono text-xs font-bold text-slate-300 whitespace-nowrap">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className={i % 2 === 1 ? "translate-x-12" : ""}>
                    {watermarkLabel}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 1. Markdown with Mermaid */}
        {format.kind === "markdown" && (
          <div className="mx-auto max-w-4xl prose prose-invert prose-slate">
            <div
              className="rich-markdown leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdownRich(textContent) }}
            />
          </div>
        )}

        {/* 2. Source Code & Text View */}
        {(format.kind === "code" || format.kind === "text") && (
          <div className="mx-auto max-w-5xl rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs shadow-xl overflow-hidden">
            <div className="overflow-x-auto p-4 leading-relaxed">
              <pre className={`${wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"}`}>
                <code dangerouslySetInnerHTML={{ __html: highlightCode(textContent, format.language) }} />
              </pre>
            </div>
          </div>
        )}

        {/* 3. HTML Document (Preview & Code) */}
        {format.kind === "html" && (
          <div className="mx-auto max-w-5xl">
            {htmlTab === "preview" ? (
              <div className="rounded-xl border border-slate-800 bg-white overflow-hidden shadow-2xl h-[70vh]">
                <iframe
                  srcDoc={textContent}
                  title="HTML Preview"
                  sandbox="allow-same-origin"
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs p-4 overflow-x-auto shadow-xl">
                <pre className="whitespace-pre-wrap">
                  <code dangerouslySetInnerHTML={{ __html: highlightCode(textContent, "html") }} />
                </pre>
              </div>
            )}
          </div>
        )}

        {/* 4. Interactive Excel / CSV / TSV Grid */}
        {format.kind === "table" && (
          <div className="space-y-4">
            {/* Table Search & Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setTablePage(1);
                  }}
                  placeholder="Search spreadsheet rows..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Rows per page:</span>
                <select
                  value={tablePageSize}
                  onChange={(e) => {
                    setTablePageSize(Number(e.target.value));
                    setTablePage(1);
                  }}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-white focus:outline-none"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="font-mono text-slate-300">
                  Total: {filteredRows.length > 0 ? filteredRows.length - 1 : 0} rows
                </span>
              </div>
            </div>

            {/* Interactive Data Table */}
            {filteredRows.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">No rows match your search.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-xl">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead className="border-b border-slate-800 bg-slate-900 text-slate-300 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="p-3 w-12 text-center text-slate-500">#</th>
                      {filteredRows[0]?.map((col, idx) => (
                        <th
                          key={idx}
                          onClick={() => {
                            if (tableSortCol === idx) {
                              setTableSortAsc(!tableSortAsc);
                            } else {
                              setTableSortCol(idx);
                              setTableSortAsc(true);
                            }
                          }}
                          className="p-3 cursor-pointer hover:bg-slate-800 transition select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[200px]">{col || `Col ${idx + 1}`}</span>
                            <ArrowUpDown className="h-3 w-3 text-slate-500 shrink-0" />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                    {filteredRows
                      .slice(1)
                      .slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize)
                      .map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-900/50 transition">
                          <td className="p-3 text-center text-slate-500 text-[10px]">
                            {(tablePage - 1) * tablePageSize + rIdx + 1}
                          </td>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-3 text-slate-300 truncate max-w-[260px]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredRows.length > tablePageSize + 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={tablePage === 1}
                  onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>

                <span className="text-xs font-mono text-slate-400">
                  Page {tablePage} of {Math.ceil((filteredRows.length - 1) / tablePageSize)}
                </span>

                <button
                  disabled={tablePage >= Math.ceil((filteredRows.length - 1) / tablePageSize)}
                  onClick={() => setTablePage((p) => p + 1)}
                  className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 5. Images (JPEG, PNG, WebP, GIF, AVIF, BMP) */}
        {format.kind === "image" && objectUrl && (
          <div className={`flex min-h-[50vh] sm:min-h-[60vh] items-center justify-center p-2 sm:p-6 rounded-xl transition ${imageBgDark ? "bg-slate-950" : "bg-slate-100"}`}>
            <img
              src={objectUrl}
              alt={docData.originalFilename}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
                imageRendering: "auto",
                transition: "transform 0.2s ease-out",
              }}
              className="max-h-[82vh] max-w-full rounded-lg object-contain shadow-2xl select-none"
            />
          </div>
        )}

        {/* 6. Sanitized Vector SVG */}
        {format.kind === "svg" && objectUrl && (
          <div className={`flex min-h-[50vh] sm:min-h-[60vh] items-center justify-center p-2 sm:p-6 rounded-xl transition ${imageBgDark ? "bg-slate-950" : "bg-slate-100"}`}>
            <img
              src={objectUrl}
              alt={docData.originalFilename}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
                transition: "transform 0.2s ease-out",
              }}
              className="max-h-[82vh] max-w-full object-contain select-none"
            />
          </div>
        )}

        {/* 7. Audio Player (MP3, WAV, OGG, M4A) */}
        {format.kind === "audio" && objectUrl && (
          <div className="mx-auto max-w-lg p-8 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl text-center space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Music4 className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{docData.originalFilename}</h3>
              <p className="text-xs text-slate-400 mt-1">Decrypted Audio Stream</p>
            </div>
            <audio ref={audioRef} controls src={objectUrl} className="w-full" />
          </div>
        )}

        {/* 8. Video Player (MP4, WebM) */}
        {format.kind === "video" && objectUrl && (
          <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-black overflow-hidden shadow-2xl">
            <video
              ref={videoRef}
              controls
              src={objectUrl}
              className="w-full max-h-[75vh] aspect-video object-contain"
            />
          </div>
        )}

        {/* 9. Office Deck & ZIP Bundle fallback */}
        {(format.kind === "office" || format.kind === "bundle" || format.kind === "unknown") && (
          <div className="mx-auto max-w-md p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Package className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-white">{docData.originalFilename}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{formatCapabilityNote(format.kind)}</p>
            {linkData.allowDownload && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/10 transition"
              >
                <Download className="h-4 w-4" />
                <span>Download Decrypted Document</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Presenter Mode Modal for Images, Markdown, Code, HTML, and SVGs */}
      {presenterMode && (
        <PresenterModeView
          currentPage={1}
          totalPages={1}
          onPageChange={() => {}}
          onClose={() => setPresenterMode(false)}
          brandLogoUrl={linkData.brandLogoUrl}
          brandAccentColor={linkData.brandAccentColor}
          watermarkText={linkData.watermarkEnabled ? (linkData.watermarkText || viewerIdentity || "CONFIDENTIAL") : null}
        >
          <div className="flex items-center justify-center p-4 max-h-[85vh] max-w-[90vw] overflow-auto">
            {format.kind === "image" || format.kind === "svg" ? (
              <img
                src={objectUrl || ""}
                alt={docData.originalFilename}
                className="max-h-[82vh] max-w-[88vw] object-contain rounded-lg shadow-2xl"
              />
            ) : format.kind === "markdown" ? (
              <div
                className="prose prose-invert max-w-4xl text-sm leading-relaxed p-6 bg-slate-950 rounded-xl"
                dangerouslySetInnerHTML={{ __html: renderMarkdownRich(textContent) }}
              />
            ) : format.kind === "code" || format.kind === "text" ? (
              <pre className="p-6 rounded-xl bg-slate-950 text-xs font-mono max-w-4xl overflow-auto text-slate-200">
                <code dangerouslySetInnerHTML={{ __html: highlightCode(textContent, docData.originalFilename.split(".").pop()) }} />
              </pre>
            ) : format.kind === "html" ? (
              <iframe
                srcDoc={textContent}
                sandbox="allow-same-origin"
                className="w-[85vw] h-[80vh] rounded-lg bg-white"
                title="HTML Presentation"
              />
            ) : (
              <div className="text-center p-8">
                <FileText className="h-12 w-12 text-amber-400 mx-auto mb-2" />
                <h3 className="text-white font-bold text-base">{docData.originalFilename}</h3>
              </div>
            )}
          </div>
        </PresenterModeView>
      )}
    </div>
  );
}
