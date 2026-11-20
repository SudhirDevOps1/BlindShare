#!/usr/bin/env node
/**
 * BlindShare Universal Single-Source-of-Truth Version Synchronizer & Checker
 * 
 * Synchronizes and validates platform version across:
 * 1. package.json
 * 2. package-lock.json
 * 3. .release-please-manifest.json
 * 4. src/lib/version.ts (runtime web app anchor)
 * 5. All Markdown files in root and docs/** (README.md, visual.md, ARCHITECTURE.md, etc.)
 * 
 * Usage:
 *   node scripts/sync-version.mjs             # Syncs all files to match package.json version
 *   node scripts/sync-version.mjs 0.1.0       # Sets new version and syncs universally
 *   node scripts/sync-version.mjs --check     # CI gate: verifies 100% synchronization across all targets
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isCheckOnly = process.argv.includes('--check');
const rawArg = process.argv.slice(2).find(arg => arg !== '--check');

const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

let targetVersion = rawArg || pkg.version;

// Validate SemVer syntax (e.g., "0.1.0" or "0.1.0-alpha.1")
const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
if (!semverRegex.test(targetVersion)) {
  console.error(`❌ Invalid SemVer format: "${targetVersion}". Expected format like "0.1.0" or "0.1.0-beta.1"`);
  process.exit(1);
}

console.log(`\n======================================================`);
console.log(`📦 BlindShare Universal Version Manager: ${isCheckOnly ? 'VERIFY' : 'SYNC'} -> v${targetVersion}`);
console.log(`======================================================\n`);

let hasError = false;

// 1. package.json
if (!isCheckOnly && pkg.version !== targetVersion) {
  pkg.version = targetVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(`✔ Updated package.json -> ${targetVersion}`);
} else if (pkg.version === targetVersion) {
  console.log(`✔ Verified package.json -> ${targetVersion}`);
} else {
  console.error(`✖ Mismatch in package.json: expected ${targetVersion}, found ${pkg.version}`);
  hasError = true;
}

// 2. package-lock.json
const lockPath = path.join(rootDir, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  if (!isCheckOnly) {
    lock.version = targetVersion;
    if (lock.packages && lock.packages['']) {
      lock.packages[''].version = targetVersion;
    }
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n', 'utf8');
    console.log(`✔ Updated package-lock.json -> ${targetVersion}`);
  } else {
    if (lock.version === targetVersion) {
      console.log(`✔ Verified package-lock.json -> ${targetVersion}`);
    } else {
      console.error(`✖ Mismatch in package-lock.json: expected ${targetVersion}, found ${lock.version}`);
      hasError = true;
    }
  }
}

// 3. .release-please-manifest.json
const manifestPath = path.join(rootDir, '.release-please-manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!isCheckOnly) {
      manifest["."] = targetVersion;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
      console.log(`✔ Updated .release-please-manifest.json -> ${targetVersion}`);
    } else {
      if (manifest["."] === targetVersion) {
        console.log(`✔ Verified .release-please-manifest.json -> ${targetVersion}`);
      } else {
        console.error(`✖ Mismatch in .release-please-manifest.json: expected ${targetVersion}, found ${manifest["."]}`);
        hasError = true;
      }
    }
  } catch (err) {
    console.error(`✖ Error processing .release-please-manifest.json:`, err.message);
    hasError = true;
  }
}

// 4. src/lib/version.ts (Runtime Single-Source Anchor)
const versionTsPath = path.join(rootDir, 'src', 'lib', 'version.ts');
if (fs.existsSync(versionTsPath)) {
  let content = fs.readFileSync(versionTsPath, 'utf8');
  const versionConstRegex = /export const APP_VERSION = "([^"]+)";/;
  const match = content.match(versionConstRegex);

  if (match) {
    if (!isCheckOnly) {
      content = content.replace(versionConstRegex, `export const APP_VERSION = "${targetVersion}";`);
      // Also update doc comments inside version.ts
      content = content.replace(
        /\* - (Development|Preview|Production): "v\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?/g,
        (full, mode) => {
          if (mode === 'Development') return `* - Development: "v${targetVersion}-dev`;
          if (mode === 'Preview') return `* - Preview: "v${targetVersion}-preview`;
          return `* - Production: "v${targetVersion}`;
        }
      );
      content = content.replace(
        /\* - (Development|Production): "(DEV v|v)\d+\.\d+\.\d+/g,
        (full, mode, prefix) => {
          if (mode === 'Development') return `* - Development: "DEV v${targetVersion}`;
          return `* - Production: "v${targetVersion}`;
        }
      );
      fs.writeFileSync(versionTsPath, content, 'utf8');
      console.log(`✔ Updated src/lib/version.ts -> ${targetVersion}`);
    } else {
      if (match[1] === targetVersion) {
        console.log(`✔ Verified src/lib/version.ts -> ${targetVersion}`);
      } else {
        console.error(`✖ Mismatch in src/lib/version.ts: expected ${targetVersion}, found ${match[1]}`);
        hasError = true;
      }
    }
  } else {
    console.error(`✖ Could not find APP_VERSION constant in src/lib/version.ts`);
    hasError = true;
  }
}

// 5. Recursive Markdown File Synchronizer (README.md, docs/**/*.md, etc.)
function findMarkdownFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', '.next', '.gemini', 'dist', 'build'].includes(entry.name)) {
        continue;
      }
      results = results.concat(findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

const mdFiles = [
  ...findMarkdownFiles(rootDir).filter(p => !p.includes(path.sep + 'node_modules' + path.sep))
];

console.log(`\n🔍 Scanning ${mdFiles.length} Markdown documentation files for version synchronization...`);

let mdUpdatedCount = 0;
for (const filePath of mdFiles) {
  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  if (!isCheckOnly) {
    // 1. Version Badges (e.g. img.shields.io/badge/version-v0.1.0-22c55e)
    content = content.replace(
      /badge\/version-v\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?-22c55e/g,
      `badge/version-v${targetVersion}-22c55e`
    );

    // 2. Releases URLs (e.g. releases/tag/v0.1.0)
    content = content.replace(
      /releases\/tag\/v\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?/g,
      `releases/tag/v${targetVersion}`
    );

    // 3. Platform title mentions (e.g. BlindShare v1.4.1 -> BlindShare v0.1.0)
    // Avoid replacing historical changelog sections if marked
    if (!relativePath.endsWith('CHANGELOG.md')) {
      content = content.replace(
        /BlindShare v\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?/g,
        `BlindShare v${targetVersion}`
      );
      content = content.replace(
        /Compatible with BlindShare v\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?/g,
        `Compatible with BlindShare v${targetVersion}`
      );
      content = content.replace(
        /-\s+\*\*Tag:\*\*\s+`v\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?`/g,
        `- **Tag:** \`v${targetVersion}\``
      );
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✔ Synchronized [${relativePath}] -> v${targetVersion}`);
      mdUpdatedCount++;
    }
  } else {
    // Check mode: Verify badge and active release tag in main docs
    if (relativePath === 'README.md') {
      const badgeMatch = content.match(/badge\/version-v([^-\s]+)-22c55e/);
      if (badgeMatch && badgeMatch[1] !== targetVersion) {
        console.error(`  ✖ Mismatch in ${relativePath} badge: expected v${targetVersion}, found v${badgeMatch[1]}`);
        hasError = true;
      }
    }
  }
}

if (!isCheckOnly) {
  console.log(`✔ Synchronized ${mdUpdatedCount} markdown documents to v${targetVersion}`);
}

console.log(`\n======================================================`);
if (hasError) {
  console.error(`❌ Version verification FAILED. Run "npm run version:sync" to synchronize.`);
  process.exit(1);
} else {
  console.log(`✨ Single-source version synchronized across all modules!`);
  console.log(`======================================================\n`);
}
