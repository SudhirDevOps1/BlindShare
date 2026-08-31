# Contributing to BlindShare

First off — **thank you for taking the time to contribute!** 🎉

BlindShare is an open-source, privacy-first document sharing platform. Every contribution — big or small — makes a meaningful difference. Whether you're fixing a typo, adding a feature, improving documentation, or reporting a bug, you're helping make secure document sharing better for everyone.

---

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How Can I Contribute?](#-how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Setup](#-development-setup)
- [Commit Guidelines](#-commit-guidelines)
- [Coding Standards](#-coding-standards)
- [Security Vulnerabilities](#-security-vulnerabilities)

---

## 🤝 Code of Conduct

This project follows our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it. Please report unacceptable behavior to the maintainers.

---

## 💡 How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:
1. **Check existing issues** — [search open issues](https://github.com/SudhirDevOps1/BlindShare/issues) to avoid duplicates.
2. **Update to the latest version** — the bug may already be fixed.

When filing a bug report, include:
- **Clear title** — short and descriptive
- **Steps to reproduce** — what you clicked, what you typed
- **Expected behavior** — what should have happened
- **Actual behavior** — what actually happened
- **Screenshots** — if applicable
- **Environment** — OS, browser, Node.js version

➡️ [Open a Bug Report](https://github.com/SudhirDevOps1/BlindShare/issues/new?template=bug_report.md)

---

### Suggesting Features

Feature requests are welcome! Please check that:
1. The feature doesn't already exist in the [Roadmap](./README.md#-roadmap)
2. There isn't already an open [Discussion](https://github.com/SudhirDevOps1/BlindShare/discussions) about it

When suggesting a feature:
- Describe **the problem** it solves (not just what to build)
- Explain **who benefits** from it
- Describe the **proposed solution** if you have one
- List any **alternatives** you considered

➡️ [Open a Feature Request](https://github.com/SudhirDevOps1/BlindShare/discussions/new)

---

### Submitting Pull Requests

#### 1. Fork & clone

```bash
git clone https://github.com/<your-username>/BlindShare.git
cd BlindShare
npm install
cp .env.example .env
# Fill in your local Neon + B2 credentials
```

#### 2. Create a branch

Follow the naming convention:
```bash
# Features
git checkout -b feat/your-feature-name

# Bug fixes
git checkout -b fix/short-description

# Documentation
git checkout -b docs/what-you-documented

# Chores (tooling, deps, etc.)
git checkout -b chore/what-you-changed
```

#### 3. Make your changes

- Write clean, typed TypeScript
- Add or update tests if applicable
- Keep changes focused — one PR, one concern

#### 4. Run checks locally

```bash
npm run typecheck   # Must pass with zero errors
npm run lint        # Must pass with zero warnings
npm run build       # Must build successfully
```

#### 5. Commit using Conventional Commits

```bash
git add .
git commit -m "feat(links): add geo-based access restriction"
git commit -m "fix(auth): resolve session cookie expiry on Safari"
git commit -m "docs(readme): improve deployment guide"
```

| Prefix | Use for |
|--------|---------|
| `feat` | New features |
| `fix` | Bug fixes |
| `docs` | Documentation only |
| `refactor` | Code changes without behavior change |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Tooling, deps, CI changes |
| `ci` | CI/CD workflow changes |

#### 6. Push and open a PR

```bash
git push origin feat/your-feature-name
```

Then open a Pull Request on GitHub. In your PR description:
- Reference the related issue: `Closes #123`
- Describe **what** you changed and **why**
- Include screenshots for UI changes
- Note any **breaking changes**

---

## 🛠️ Development Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| npm | 10+ | Bundled with Node |
| Git | 2.x+ | [git-scm.com](https://git-scm.com) |

### Local services needed

| Service | Free Plan | Purpose |
|---------|-----------|---------|
| [Neon](https://neon.tech) | ✅ | PostgreSQL database |
| [Backblaze B2](https://backblaze.com/b2) | ✅ | Encrypted file storage |

### Environment setup

```bash
# Copy example env file
cp .env.example .env

# Required minimum for local dev:
# DATABASE_URL    — your Neon pooled connection string
# SESSION_SECRET  — any 64+ char random string
# STORE_TARGET    — "b2" or "local" (local = disk storage)
# B2_*            — if using B2 storage
```

### Running locally

```bash
npm run dev
# → http://localhost:3000
```

---

## 🧹 Coding Standards

- **TypeScript strict mode** — all files must pass `tsc --noEmit`
- **No `any` types** — use proper types or `unknown`
- **Zod for all API inputs** — every route handler must validate its request body
- **No plain-text secrets** — never log or store sensitive values
- **Server Components by default** — only use `"use client"` when necessary
- **Tailwind CSS for styling** — no inline styles, no extra CSS files
- **Conventional Commits** — enforced by commitlint + husky

### File naming

```
src/app/          → kebab-case directories, page.tsx / route.ts
src/components/   → PascalCase component files
src/lib/          → camelCase utility files
```

---

## 🔒 Security Vulnerabilities

**Please do NOT report security vulnerabilities in public GitHub issues.**

See [SECURITY.md](./SECURITY.md) for responsible disclosure instructions.

Security issues should be reported privately so they can be patched before public disclosure.

---

## 🙏 Recognition

All contributors are acknowledged in the [GitHub contributors graph](https://github.com/SudhirDevOps1/BlindShare/graphs/contributors).

**Thank you for making BlindShare better!** 🚀
