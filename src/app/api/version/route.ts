import { NextResponse } from "next/server";

/**
 * Public, non-sensitive build/version info for status pages (Gatus/Upptime) and
 * support requests — never includes secrets, internal ids, or stack traces.
 */
export async function GET() {
  return NextResponse.json({
    name: process.env.PUBLIC_APP_NAME || "BlindShare",
    version: "1.4.0",
    encryptionMode: process.env.DOCS_ENCRYPTION_MODE || "e2ee-fragment",
    backendTarget: process.env.BACKEND_TARGET || "vercel",
    buildHash: process.env.VERCEL_GIT_COMMIT_SHA || process.env.CF_PAGES_COMMIT_SHA || "dev",
    maintenanceMode: process.env.MAINTENANCE_MODE === "true",
  });
}
