import type { NextConfig } from "next";

/**
 * Brand tokens are read from the server-side PUBLIC_* variables (exact names from
 * .env.example) and re-exported as NEXT_PUBLIC_* so the browser bundle can rebrand
 * without any code change. Zero brand lock.
 */
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.PUBLIC_APP_NAME || "BlindShare",
    NEXT_PUBLIC_BRAND_LOGO_URL: process.env.PUBLIC_BRAND_LOGO_URL || "/brand/logo.svg",
    NEXT_PUBLIC_BRAND_ACCENT: process.env.PUBLIC_BRAND_ACCENT || "#f59e0b",
    NEXT_PUBLIC_APP_URL: process.env.PUBLIC_APP_URL || "",
    NEXT_PUBLIC_UI_LANG_DEFAULT: process.env.PUBLIC_UI_LANG_DEFAULT || "en",
    NEXT_PUBLIC_DOCS_ENCRYPTION_MODE: process.env.DOCS_ENCRYPTION_MODE || "e2ee-fragment",
    NEXT_PUBLIC_MAX_FILE_MB: process.env.MAX_FILE_MB || "25",
    NEXT_PUBLIC_MAX_VIDEO_MB: process.env.MAX_VIDEO_MB || "50",
    NEXT_PUBLIC_VIEW_HEARTBEAT_SEC: process.env.VIEW_HEARTBEAT_SEC || "10",
    NEXT_PUBLIC_PASSWORD_MIN_LENGTH: process.env.PASSWORD_MIN_LENGTH || "10",
  },
};

export default nextConfig;
