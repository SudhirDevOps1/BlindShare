# Supported formats

Every format is **compressed client-side via GZIP (saving 50–80% storage space)** and then **encrypted with AES-GCM-256 in the browser**; the server never parses or sees raw content.

| Format | Client renderer | Analytics | Honest note |
|---|---|---|---|
| PDF | pdf.js 300+ DPI super-sampling, page-wise canvas + Presenter Mode | per-page dwell, Question Pins, Voice Notes | primary format with laser pointer & co-browsing |
| JPG/PNG/WebP/GIF/AVIF/ICO/BMP | `<img>`/canvas + high-res zoom + Presenter Mode | scroll dwell | EXIF stripped client-side pre-encrypt |
| SVG | sanitizer → `<img>` + Presenter Mode | scroll dwell | `<script>`, `on*` handlers and `javascript:` stripped |
| Markdown | escape-first subset renderer + Presenter Mode | reading time | no raw HTML passthrough |
| TXT/LOG/JSON | monospace `<pre>` | reading time | — |
| CSV/TSV | paginated table (≤5 000 rows) | table-page dwell | long cells truncated at 80 chars |
| DOCX/PPTX/XLSX/ODP | bundle-view | session only | **no fidelity claims** — export to PDF for pitch-grade analytics |
| MP3/WAV/OGG/M4A | `<audio>` | segment listened | aggregate/blind only |
| MP4/WebM | `<video>` | segment watched | egress-heavy → separate `MAX_VIDEO_MB` ledger line |
| ZIP / unknown | bundle-view | session only | graceful fallback, never a blank error |

Slides: export PPTX/ODP to PDF, or upload a slide-image set for album mode with Voice Pitch Walkthrough notes.
