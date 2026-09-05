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
  | "code"
  | "html"
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
  /** Language tag for code syntax highlighting if applicable */
  language?: string;
  /** Analytics unit reported for this format. */
  analyticsUnit: "page" | "scroll" | "segment" | "none";
}

const MAP: Record<string, FormatKind> = {
  // PDF
  pdf: { kind: "pdf", label: "PDF Document", mime: "application/pdf", renderer: "pdf.js (page-wise)", analyticsUnit: "page" },

  // Images
  jpg: { kind: "image", label: "JPEG Image", mime: "image/jpeg", renderer: "Interactive Canvas/Img", analyticsUnit: "scroll" },
  jpeg: { kind: "image", label: "JPEG Image", mime: "image/jpeg", renderer: "Interactive Canvas/Img", analyticsUnit: "scroll" },
  png: { kind: "image", label: "PNG Image", mime: "image/png", renderer: "Interactive Canvas/Img", analyticsUnit: "scroll" },
  webp: { kind: "image", label: "WebP Image", mime: "image/webp", renderer: "Interactive Canvas/Img", analyticsUnit: "scroll" },
  gif: { kind: "image", label: "GIF Animation", mime: "image/gif", renderer: "Interactive Canvas/Img", analyticsUnit: "scroll" },
  avif: { kind: "image", label: "AVIF Image", mime: "image/avif", renderer: "Interactive Canvas/Img", analyticsUnit: "scroll" },
  ico: { kind: "image", label: "Icon", mime: "image/x-icon", renderer: "Interactive Canvas/Img", analyticsUnit: "scroll" },
  bmp: { kind: "image", label: "Bitmap Image", mime: "image/bmp", renderer: "Interactive Canvas/Img", analyticsUnit: "scroll" },

  // SVG
  svg: { kind: "svg", label: "SVG Vector (sanitized)", mime: "image/svg+xml", renderer: "Sanitizer → Interactive SVG", analyticsUnit: "scroll" },

  // Markdown & Mermaid
  md: { kind: "markdown", label: "Markdown & Mermaid Document", mime: "text/markdown", renderer: "Rich Markdown + Mermaid Renderer", analyticsUnit: "scroll" },
  markdown: { kind: "markdown", label: "Markdown & Mermaid Document", mime: "text/markdown", renderer: "Rich Markdown + Mermaid Renderer", analyticsUnit: "scroll" },

  // HTML
  html: { kind: "html", label: "HTML Document", mime: "text/html", renderer: "Sandboxed Preview / Code View", language: "html", analyticsUnit: "scroll" },
  htm: { kind: "html", label: "HTML Document", mime: "text/html", renderer: "Sandboxed Preview / Code View", language: "html", analyticsUnit: "scroll" },

  // Source Code & Syntax Highlighting
  js: { kind: "code", label: "JavaScript Source", mime: "application/javascript", renderer: "Syntax Highlighting Grid", language: "javascript", analyticsUnit: "scroll" },
  jsx: { kind: "code", label: "React JSX Source", mime: "text/jsx", renderer: "Syntax Highlighting Grid", language: "jsx", analyticsUnit: "scroll" },
  ts: { kind: "code", label: "TypeScript Source", mime: "application/typescript", renderer: "Syntax Highlighting Grid", language: "typescript", analyticsUnit: "scroll" },
  tsx: { kind: "code", label: "React TSX Source", mime: "text/tsx", renderer: "Syntax Highlighting Grid", language: "tsx", analyticsUnit: "scroll" },
  py: { kind: "code", label: "Python Source", mime: "text/x-python", renderer: "Syntax Highlighting Grid", language: "python", analyticsUnit: "scroll" },
  css: { kind: "code", label: "CSS Stylesheet", mime: "text/css", renderer: "Syntax Highlighting Grid", language: "css", analyticsUnit: "scroll" },
  scss: { kind: "code", label: "SCSS Stylesheet", mime: "text/x-scss", renderer: "Syntax Highlighting Grid", language: "scss", analyticsUnit: "scroll" },
  json: { kind: "code", label: "JSON Data", mime: "application/json", renderer: "Syntax Highlighting Grid", language: "json", analyticsUnit: "scroll" },
  sql: { kind: "code", label: "SQL Query / Schema", mime: "application/sql", renderer: "Syntax Highlighting Grid", language: "sql", analyticsUnit: "scroll" },
  rs: { kind: "code", label: "Rust Source", mime: "text/x-rust", renderer: "Syntax Highlighting Grid", language: "rust", analyticsUnit: "scroll" },
  go: { kind: "code", label: "Go Source", mime: "text/x-go", renderer: "Syntax Highlighting Grid", language: "go", analyticsUnit: "scroll" },
  sh: { kind: "code", label: "Shell Script", mime: "application/x-sh", renderer: "Syntax Highlighting Grid", language: "bash", analyticsUnit: "scroll" },
  bash: { kind: "code", label: "Bash Script", mime: "application/x-sh", renderer: "Syntax Highlighting Grid", language: "bash", analyticsUnit: "scroll" },
  yaml: { kind: "code", label: "YAML Config", mime: "text/yaml", renderer: "Syntax Highlighting Grid", language: "yaml", analyticsUnit: "scroll" },
  yml: { kind: "code", label: "YAML Config", mime: "text/yaml", renderer: "Syntax Highlighting Grid", language: "yaml", analyticsUnit: "scroll" },
  xml: { kind: "code", label: "XML Document", mime: "application/xml", renderer: "Syntax Highlighting Grid", language: "xml", analyticsUnit: "scroll" },
  c: { kind: "code", label: "C Source", mime: "text/x-c", renderer: "Syntax Highlighting Grid", language: "c", analyticsUnit: "scroll" },
  cpp: { kind: "code", label: "C++ Source", mime: "text/x-c++", renderer: "Syntax Highlighting Grid", language: "cpp", analyticsUnit: "scroll" },
  h: { kind: "code", label: "C Header", mime: "text/x-c", renderer: "Syntax Highlighting Grid", language: "c", analyticsUnit: "scroll" },
  java: { kind: "code", label: "Java Source", mime: "text/x-java-source", renderer: "Syntax Highlighting Grid", language: "java", analyticsUnit: "scroll" },
  php: { kind: "code", label: "PHP Source", mime: "application/x-php", renderer: "Syntax Highlighting Grid", language: "php", analyticsUnit: "scroll" },
  rb: { kind: "code", label: "Ruby Source", mime: "text/x-ruby", renderer: "Syntax Highlighting Grid", language: "ruby", analyticsUnit: "scroll" },
  swift: { kind: "code", label: "Swift Source", mime: "text/x-swift", renderer: "Syntax Highlighting Grid", language: "swift", analyticsUnit: "scroll" },
  kt: { kind: "code", label: "Kotlin Source", mime: "text/x-kotlin", renderer: "Syntax Highlighting Grid", language: "kotlin", analyticsUnit: "scroll" },

  // Plain Text
  txt: { kind: "text", label: "Plain Text Document", mime: "text/plain", renderer: "Interactive Text Reader", analyticsUnit: "scroll" },
  log: { kind: "text", label: "Log File", mime: "text/plain", renderer: "Interactive Text Reader", analyticsUnit: "scroll" },

  // Tables / Excel
  csv: { kind: "table", label: "CSV Spreadsheet", mime: "text/csv", renderer: "Interactive Searchable Data Grid", analyticsUnit: "page" },
  tsv: { kind: "table", label: "TSV Spreadsheet", mime: "text/tab-separated-values", renderer: "Interactive Searchable Data Grid", analyticsUnit: "page" },

  // Office Decks & Docs
  docx: { kind: "office", label: "Word Document", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", renderer: "Office Bundle Deck", analyticsUnit: "none" },
  doc: { kind: "office", label: "Word Document (legacy)", mime: "application/msword", renderer: "Office Bundle Deck", analyticsUnit: "none" },
  odt: { kind: "office", label: "OpenDocument Text", mime: "application/vnd.oasis.opendocument.text", renderer: "Office Bundle Deck", analyticsUnit: "none" },
  pptx: { kind: "office", label: "PowerPoint Deck", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", renderer: "Office Presentation Deck", analyticsUnit: "none" },
  ppt: { kind: "office", label: "PowerPoint Deck (legacy)", mime: "application/vnd.ms-powerpoint", renderer: "Office Presentation Deck", analyticsUnit: "none" },
  odp: { kind: "office", label: "OpenDocument Deck", mime: "application/vnd.oasis.opendocument.presentation", renderer: "Office Presentation Deck", analyticsUnit: "none" },
  xlsx: { kind: "office", label: "Excel Workbook", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", renderer: "Office Spreadsheet Deck", analyticsUnit: "none" },
  xls: { kind: "office", label: "Excel Workbook (legacy)", mime: "application/vnd.ms-excel", renderer: "Office Spreadsheet Deck", analyticsUnit: "none" },
  ods: { kind: "office", label: "OpenDocument Spreadsheet", mime: "application/vnd.oasis.opendocument.spreadsheet", renderer: "Office Spreadsheet Deck", analyticsUnit: "none" },

  // Audio
  mp3: { kind: "audio", label: "MP3 Audio", mime: "audio/mpeg", renderer: "High-Fidelity Audio Player", analyticsUnit: "segment" },
  wav: { kind: "audio", label: "WAV Audio", mime: "audio/wav", renderer: "High-Fidelity Audio Player", analyticsUnit: "segment" },
  ogg: { kind: "audio", label: "OGG Audio", mime: "audio/ogg", renderer: "High-Fidelity Audio Player", analyticsUnit: "segment" },
  m4a: { kind: "audio", label: "M4A Audio", mime: "audio/mp4", renderer: "High-Fidelity Audio Player", analyticsUnit: "segment" },

  // Video
  mp4: { kind: "video", label: "MP4 Video", mime: "video/mp4", renderer: "High-Fidelity Video Player", analyticsUnit: "segment" },
  webm: { kind: "video", label: "WebM Video", mime: "video/webm", renderer: "High-Fidelity Video Player", analyticsUnit: "segment" },

  // ZIP
  zip: { kind: "bundle", label: "ZIP Archive", mime: "application/zip", renderer: "Secure Archive Bundle", analyticsUnit: "none" },
};

export function detectFormat(filename: string): FormatKind {
  const ext = (filename.split(".").pop() || "").toLowerCase().trim();
  return (
    MAP[ext] || {
      kind: "unknown",
      label: "Encrypted Blob",
      mime: "application/octet-stream",
      renderer: "Secure Archive Bundle",
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
      return "Office documents (DOCX/PPTX/XLSX) are fully secured with E2EE. For pitch-grade page-by-page dwell sparklines, converting to PDF gives individual slide breakdown.";
    case "bundle":
      return "Encrypted archive bundles stay 100% encrypted in zero-knowledge storage and are unpacked directly in your browser.";
    case "video":
      return "High-definition encrypted video playback with live dwell tracking.";
    default:
      return "Zero-knowledge decrypted in client memory.";
  }
}

/** Human-readable capability table used by /privacy and /formats docs pages. */
export const FORMAT_TABLE = [
  { format: "PDF", renderer: "pdf.js (page-wise)", analytics: "Per-page dwell", note: "Primary format" },
  { format: "JPG/PNG/WebP/GIF/AVIF/ICO", renderer: "Interactive Canvas/Img", analytics: "Scroll dwell", note: "EXIF stripped client-side pre-encrypt" },
  { format: "SVG", renderer: "Sanitizer → Interactive SVG", analytics: "Scroll dwell", note: "Scripts + event handlers stripped (mandatory)" },
  { format: "Markdown & Mermaid", renderer: "Rich Markdown + Mermaid Renderer", analytics: "Reading time", note: "Flowcharts & diagrams client-rendered" },
  { format: "Source Code (15+ langs)", renderer: "Syntax Highlighting Grid", analytics: "Reading time", note: "JS/TS/Py/SQL/Rust/Go/HTML/CSS" },
  { format: "CSV / TSV / Excel", renderer: "Interactive Searchable Data Grid", analytics: "Table page dwell", note: "Search, column sorting & pagination" },
  { format: "DOCX / PPTX / XLSX", renderer: "Office Presentation Deck", analytics: "Session only", note: "Export-to-PDF advised for slide dwell" },
  { format: "MP3/WAV/OGG/M4A", renderer: "High-Fidelity Audio Player", analytics: "Segment listened", note: "Aggregate only, blind" },
  { format: "MP4 / WebM", renderer: "High-Fidelity Video Player", analytics: "Segment watched", note: "Zero-drop beacon telemetry" },
  { format: "ZIP / Unknown", renderer: "Secure Archive Bundle", analytics: "Session only", note: "Never a blank error page" },
];
