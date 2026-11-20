/**
 * Single Source of Truth for Platform Versioning & Environment Awareness.
 * 
 * Synchronized across the Web App, Edge Proxy, Status APIs, SIEM Forwarders,
 * and UI Components.
 */

export const APP_VERSION = "0.1.3"; // x-release-please-version

// Environment detection
export const IS_DEV = process.env.NODE_ENV !== "production";
export const IS_TEST = process.env.NODE_ENV === "test";
export const IS_PREVIEW = process.env.VERCEL_ENV === "preview";

// Environment mode string
export const APP_ENV = IS_DEV ? "development" : (IS_PREVIEW ? "preview" : "production");

/**
 * Display version shown across UI:
 * - Development: "DEV v0.1.2-dev"
 * - Preview: "v0.1.2-preview"
 * - Production: "v0.1.2"
 */
export const DISPLAY_VERSION = IS_DEV
  ? `v${APP_VERSION}-dev`
  : (IS_PREVIEW ? `v${APP_VERSION}-preview` : `v${APP_VERSION}`);

/**
 * Badge label text for headers, sidebars, and branding:
 * - Development: "DEV v0.1.2"
 * - Production: "v0.1.2 E2EE"
 */
export const VERSION_BADGE_TEXT = IS_DEV
  ? `DEV v${APP_VERSION}`
  : `v${APP_VERSION} E2EE`;

/**
 * Badge styling tokens for consistent cyber/glassmorphism UI
 */
export const VERSION_BADGE_STYLE = IS_DEV
  ? {
      bg: "bg-amber-500/20",
      border: "border-amber-400/50",
      text: "text-amber-300",
      glow: "shadow-sm shadow-amber-500/25",
      isDev: true,
    }
  : {
      bg: "bg-amber-500/15",
      border: "border-amber-500/30",
      text: "text-amber-300",
      glow: "shadow-none",
      isDev: false,
    };

/**
 * Public, non-sensitive build and version payload for `/api/version`
 */
export function getVersionPayload() {
  return {
    name: process.env.PUBLIC_APP_NAME || "BlindShare",
    version: APP_VERSION,
    displayVersion: DISPLAY_VERSION,
    environment: APP_ENV,
    isDevelopment: IS_DEV,
    encryptionMode: process.env.DOCS_ENCRYPTION_MODE || "e2ee-fragment",
    backendTarget: process.env.BACKEND_TARGET || "vercel",
    buildHash: process.env.VERCEL_GIT_COMMIT_SHA || process.env.CF_PAGES_COMMIT_SHA || "local-dev",
    maintenanceMode: process.env.MAINTENANCE_MODE === "true",
  };
}
