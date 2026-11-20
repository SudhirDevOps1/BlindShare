import { NextResponse } from "next/server";
import { getVersionPayload } from "@/lib/version";

/**
 * Public, non-sensitive build/version info for status pages (Gatus/Upptime) and
 * support requests — never includes secrets, internal ids, or stack traces.
 */
export async function GET() {
  return NextResponse.json(getVersionPayload());
}
