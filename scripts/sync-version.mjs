#!/usr/bin/env node
/**
 * BlindShare Single-Source-of-Truth Version Synchronizer
 * 
 * Usage:
 *   node scripts/sync-version.mjs             # Syncs all files to match package.json version
 *   node scripts/sync-version.mjs 1.4.3       # Sets new version and syncs across the entire project
 *   node scripts/sync-version.mjs --check     # CI gate: verifies all files match package.json (exit 1 if mismatch)
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

// Validate SemVer syntax
const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
if (!semverRegex.test(targetVersion)) {
  console.error(`❌ Invalid SemVer format: "${targetVersion}". Expected format like "1.4.2" or "1.4.2-beta.1"`);
  process.exit(1);
}

console.log(`\n======================================================`);
console.log(`📦 BlindShare Version Manager: ${isCheckOnly ? 'VERIFY' : 'SYNC'} -> v${targetVersion}`);
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

// 3. src/lib/version.ts (Single source of truth for runtime web app)
const versionTsPath = path.join(rootDir, 'src', 'lib', 'version.ts');
if (fs.existsSync(versionTsPath)) {
  let content = fs.readFileSync(versionTsPath, 'utf8');
  const versionConstRegex = /export const APP_VERSION = "([^"]+)";/;
  const match = content.match(versionConstRegex);

  if (match) {
    if (!isCheckOnly) {
      content = content.replace(versionConstRegex, `export const APP_VERSION = "${targetVersion}";`);
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

// 4. README.md
const readmePath = path.join(rootDir, 'README.md');
if (fs.existsSync(readmePath)) {
  let content = fs.readFileSync(readmePath, 'utf8');
  if (!isCheckOnly) {
    content = content.replace(
      /badge\/version-v\d+\.\d+\.\d+-22c55e/g,
      `badge/version-v${targetVersion}-22c55e`
    );
    content = content.replace(
      /releases\/tag\/v\d+\.\d+\.\d+/g,
      `releases/tag/v${targetVersion}`
    );
    content = content.replace(
      /BlindShare v\d+\.\d+\.\d+/g,
      `BlindShare v${targetVersion}`
    );
    fs.writeFileSync(readmePath, content, 'utf8');
    console.log(`✔ Updated README.md badges & links -> v${targetVersion}`);
  } else {
    console.log(`✔ Verified README.md present`);
  }
}

// 5. docs/RELEASES.md
const releasesDocPath = path.join(rootDir, 'docs', 'RELEASES.md');
if (fs.existsSync(releasesDocPath)) {
  let content = fs.readFileSync(releasesDocPath, 'utf8');
  if (!isCheckOnly) {
    content = content.replace(
      /-\s+\*\*Tag:\*\*\s+`v\d+\.\d+\.\d+`/g,
      `- **Tag:** \`v${targetVersion}\``
    );
    fs.writeFileSync(releasesDocPath, content, 'utf8');
    console.log(`✔ Updated docs/RELEASES.md stable tag -> v${targetVersion}`);
  } else {
    console.log(`✔ Verified docs/RELEASES.md present`);
  }
}

console.log(`\n======================================================`);
if (hasError) {
  console.error(`❌ Version verification FAILED. Run "npm run version:sync" to synchronize.`);
  process.exit(1);
} else {
  console.log(`✨ Single-source version synchronized across all modules!`);
  console.log(`======================================================\n`);
}
