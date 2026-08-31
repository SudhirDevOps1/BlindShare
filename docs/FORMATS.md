# Supported formats

Every format is **decrypted first in the browser**; the server never parses content.

| Format | Client renderer | Analytics | Honest note |
|---|---|---|---|
| PDF | pdf.js, page-wise canvas | per-page dwell | primary format |
| JPG/PNG/WebP/GIF/AVIF/ICO/BMP | `<img>`/canvas + zoom | scroll dwell | EXIF stripped client-side pre-encrypt |
| SVG | sanitizer → `<img>` | scroll dwell | `<script>`, `on*` handlers and `javascript:` stripped |
| Markdown | escape-first subset renderer | reading time | no raw HTML passthrough |
| TXT/LOG/JSON | monospace `<pre>` | reading time | — |
| CSV/TSV | paginated table (≤5 000 rows) | table-page dwell | long cells truncated at 80 chars |
| DOCX/PPTX/XLSX/ODP | bundle-view | session only | **no fidelity claims** — export to PDF for pitch-grade analytics |
| MP3/WAV/OGG/M4A | `<audio>` | segment listened | aggregate/blind only |
| MP4/WebM | `<video>` | segment watched | egress-heavy → separate `MAX_VIDEO_MB` ledger line |
| ZIP / unknown | bundle-view | session only | graceful fallback, never a blank error |

Slides: export PPTX/ODP to PDF, or upload a slide-image set for album mode.
