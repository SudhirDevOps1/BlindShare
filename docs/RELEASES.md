# Branch & Release Model

## Branches
- **`main`**: Primary branch. Merges to `main` are automatically built and deployed.

## Tagged Releases (`vX.Y.Z`)
Releases are triggered automatically when a version tag (`v*`) is pushed to GitHub.

### Release Workflow
1. Update version across the project:
   - `package.json` (`"version": "1.x.y"`)
   - `src/app/api/version/route.ts`
   - `docs/CHANGELOG.md` (add entry under `## [1.x.y] - YYYY-MM-DD`)
2. Commit and push to `main`.
3. Create and push git tag:
   ```bash
   git tag -a v1.x.y -m "Release v1.x.y"
   git push origin v1.x.y
   ```
4. GitHub Actions (`.github/workflows/release.yml`) automatically extracts notes from `docs/CHANGELOG.md` and publishes the GitHub Release with changelog notes.

## Hotfix Flow
1. Branch from the tag (e.g. `git checkout -b hotfix-v1.1.1 v1.1.0`)
2. Commit fix, open PR to `main`.
3. After merging, create a new patch tag `v1.1.1` and push.
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
