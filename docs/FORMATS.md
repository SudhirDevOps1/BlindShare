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
---

## 📚 Related Documentation & Knowledge Base

- 🏠 **[Project Readme](../README.md)** — Core mission, feature list, and deployment presets.
- 🎨 **[Visual Architecture Blueprint](./visual.md)** — Architectural diagrams, dataflow, and crypto courier pipeline.
- 🏗️ **[Architecture Core](./ARCHITECTURE.md)** — Multi-cloud adapter specs, WebCrypto encryption flow, and data models.
- 🛡️ **[Security Policy](./SECURITY.md)** — Vulnerability disclosure, cryptographic invariants, and security headers.
- 🎯 **[Threat Model & Attack Surface](./THREAT-MODEL.md)** — Attack surface and honest residual risks.
- 📄 **[Supported File Formats](./FORMATS.md)** — File format handling, client-side renderers, and size caps.
- 📖 **[Operations Runbook](./RUNBOOK.md)** — Production migrations, health checks, and debugging procedures.
- 🔑 **[Secrets Reference](./SECRETS.md)** — Comprehensive list of required and optional environment keys.
- 🧹 **[Data Retention Policy](./DATA-RETENTION.md)** — Free-tier retention policies and cleanup sweeps.
- 🚨 **[Incident Response Plan](./INCIDENT-RESPONSE.md)** — Compromise triage, key rotation, and containment runbooks.
- 🌊 **[Litestream Self-Hosting](./LITESTREAM-SELFHOSTING.md)** — Zero-cost SQLite continuous WAL streaming to B2.
- 📋 **[Changelog & Patch Logs](./CHANGELOG.md)** — Chronological release history and version tracking.
- 📦 **[Release Process](./RELEASES.md)** — SemVer versioning and tagging protocol.
- 🔒 **[Privacy Policy](./PRIVACY-POLICY.md)** & ⚖️ **[Terms of Service](./TERMS.md)** — Privacy commitments and legal terms.
- 🤝 **[Contributing Guide](./CONTRIBUTING.md)** & 👥 **[Code of Conduct](./CODE_OF_CONDUCT.md)** — Community development pledge.
- 🧠 **[Architecture Skill](./skills/blindshare-architecture/SKILL.md)** — Definitive agent standards and verification checklist.
