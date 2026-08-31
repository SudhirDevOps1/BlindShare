/**
 * BLINDSHARE — Supported formats capability map.
 *
 * INVARIANT: every format is decrypted FIRST in the browser (WebCrypto),
 * then rendered client-side. The server never parses document content.
 */

export type FormatKindName =
  | "pdf"
  | "image"
  | "svg"
  | "markdown"
  | "text"
  | "table"
  | "office"
  | "audio"
  | "video"
  | "bundle"
  | "unknown";

export interface FormatKind {
  kind: FormatKindName;
  label: string;
  mime: string;
  renderer: string;
  /** Analytics unit reported for this format. */
  analyticsUnit: "page" | "scroll" | "segment" | "none";
}

const MAP: Record<string, FormatKind> = {
  pdf: { kind: "pdf", label: "PDF Document", mime: "application/pdf", renderer: "pdf.js (page-wise)", analyticsUnit: "page" },

  jpg: { kind: "image", label: "JPEG Image", mime: "image/jpeg", renderer: "canvas/img", analyticsUnit: "scroll" },
  jpeg: { kind: "image", label: "JPEG Image", mime: "image/jpeg", renderer: "canvas/img", analyticsUnit: "scroll" },
  png: { kind: "image", label: "PNG Image", mime: "image/png", renderer: "canvas/img", analyticsUnit: "scroll" },
  webp: { kind: "image", label: "WebP Image", mime: "image/webp", renderer: "canvas/img", analyticsUnit: "scroll" },
  gif: { kind: "image", label: "GIF Image", mime: "image/gif", renderer: "canvas/img", analyticsUnit: "scroll" },
  avif: { kind: "image", label: "AVIF Image", mime: "image/avif", renderer: "canvas/img", analyticsUnit: "scroll" },
  ico: { kind: "image", label: "Icon", mime: "image/x-icon", renderer: "canvas/img", analyticsUnit: "scroll" },
  bmp: { kind: "image", label: "Bitmap Image", mime: "image/bmp", renderer: "canvas/img", analyticsUnit: "scroll" },

  svg: { kind: "svg", label: "SVG Vector (sanitized)", mime: "image/svg+xml", renderer: "sanitizer → img", analyticsUnit: "scroll" },

  md: { kind: "markdown", label: "Markdown Article", mime: "text/markdown", renderer: "escape-first markdown", analyticsUnit: "scroll" },
  markdown: { kind: "markdown", label: "Markdown Article", mime: "text/markdown", renderer: "escape-first markdown", analyticsUnit: "scroll" },

  txt: { kind: "text", label: "Plain Text", mime: "text/plain", renderer: "pre/monospace", analyticsUnit: "scroll" },
  log: { kind: "text", label: "Log File", mime: "text/plain", renderer: "pre/monospace", analyticsUnit: "scroll" },
  json: { kind: "text", label: "JSON Text", mime: "application/json", renderer: "pre/monospace", analyticsUnit: "scroll" },

  csv: { kind: "table", label: "CSV Table", mime: "text/csv", renderer: "paginated table (≤5k rows)", analyticsUnit: "page" },
  tsv: { kind: "table", label: "TSV Table", mime: "text/tab-separated-values", renderer: "paginated table (≤5k rows)", analyticsUnit: "page" },

  docx: { kind: "office", label: "Word Document", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", renderer: "bundle-view (export-to-PDF advised)", analyticsUnit: "none" },
  doc: { kind: "office", label: "Word Document (legacy)", mime: "application/msword", renderer: "bundle-view", analyticsUnit: "none" },
  pptx: { kind: "office", label: "PowerPoint Deck", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", renderer: "bundle-view (export-to-PDF advised)", analyticsUnit: "none" },
  odp: { kind: "office", label: "OpenDocument Deck", mime: "application/vnd.oasis.opendocument.presentation", renderer: "bundle-view", analyticsUnit: "none" },
  xlsx: { kind: "office", label: "Excel Workbook", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", renderer: "bundle-view (CSV advised)", analyticsUnit: "none" },

  mp3: { kind: "audio", label: "MP3 Audio", mime: "audio/mpeg", renderer: "<audio> element", analyticsUnit: "segment" },
  wav: { kind: "audio", label: "WAV Audio", mime: "audio/wav", renderer: "<audio> element", analyticsUnit: "segment" },
  ogg: { kind: "audio", label: "OGG Audio", mime: "audio/ogg", renderer: "<audio> element", analyticsUnit: "segment" },
  m4a: { kind: "audio", label: "M4A Audio", mime: "audio/mp4", renderer: "<audio> element", analyticsUnit: "segment" },

  mp4: { kind: "video", label: "MP4 Video", mime: "video/mp4", renderer: "<video> element", analyticsUnit: "segment" },
  webm: { kind: "video", label: "WebM Video", mime: "video/webm", renderer: "<video> element", analyticsUnit: "segment" },

  zip: { kind: "bundle", label: "ZIP Archive", mime: "application/zip", renderer: "bundle-view", analyticsUnit: "none" },
};

export function detectFormat(filename: string): FormatKind {
  const ext = (filename.split(".").pop() || "").toLowerCase().trim();
  return (
    MAP[ext] || {
      kind: "unknown",
      label: "Unknown Format",
      mime: "application/octet-stream",
      renderer: "bundle-view",
      analyticsUnit: "none",
    }
  );
}

export function isPdf(filename: string): boolean {
  return detectFormat(filename).kind === "pdf";
}

export function formatCapabilityNote(kind: FormatKindName): string {
  switch (kind) {
    case "office":
      return "Honest note: Office formats (DOCX/PPTX/XLSX) are not deep-rendered — layout fidelity would not match the original. Export to PDF for pitch-grade page-by-page analytics, or upload a slide-image set for album mode.";
    case "bundle":
      return "Honest note: archives are shown as a bundle. There is no deep in-archive preview; the decrypted file can be downloaded if the owner allowed downloads.";
    case "video":
      return "Video streaming is egress-heavy and is tracked on its own budget-ledger line (MAX_VIDEO_MB).";
    default:
      return "This format has no deep preview yet. It stays fully encrypted at rest and is only decrypted in your browser.";
  }
}

/** Human-readable capability table used by /formats docs page and FORMATS.md. */
export const FORMAT_TABLE = [
  { format: "PDF", renderer: "pdf.js (page-wise)", analytics: "Per-page dwell", note: "Primary format" },
  { format: "JPG/PNG/WebP/GIF/AVIF/ICO", renderer: "canvas / <img>", analytics: "Scroll dwell", note: "EXIF stripped client-side pre-encrypt" },
  { format: "SVG", renderer: "sanitizer → <img>", analytics: "Scroll dwell", note: "Scripts + event handlers stripped (mandatory)" },
  { format: "Markdown / TXT", renderer: "escape-first renderer", analytics: "Reading time", note: "No raw HTML passthrough" },
  { format: "CSV / TSV", renderer: "paginated table", analytics: "Table page dwell", note: "≤5k rows, long cells truncated" },
  { format: "DOCX / PPTX / XLSX", renderer: "bundle-view", analytics: "Session only", note: "Export-to-PDF advised — no fidelity claims" },
  { format: "MP3/WAV/OGG/M4A", renderer: "<audio>", analytics: "Segment listened", note: "Aggregate only, blind" },
  { format: "MP4 / WebM", renderer: "<video>", analytics: "Segment watched", note: "Separate MAX_VIDEO_MB egress cap" },
  { format: "ZIP / unknown", renderer: "bundle-view", analytics: "Session only", note: "Never a blank error page" },
];
