import { NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/storage";
import { requireAuth } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = (searchParams.get("key") || "").trim();
    if (!key || !/^[a-zA-Z0-9_\-\.\/]+$/.test(key) || key.includes("..")) {
      return NextResponse.json({ error: "Invalid or illegal storage key" }, { status: 400 });
    }

    const expires = Number(searchParams.get("expires") || "0");
    const sig = searchParams.get("sig");

    let isAuthorized = false;
    if (sig && expires > Date.now()) {
      const secret = process.env.SESSION_SECRET || "blindshare_local_secret";
      const expectedSig = crypto.createHmac("sha256", secret).update(`get:${key}:${expires}`).digest("hex");
      if (sig.length === expectedSig.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      const auth = await requireAuth();
      if ("errorResponse" in auth) return auth.errorResponse;
    }

    const storage = getStorageAdapter();
    const obj = await storage.getObject(key);

    if (!obj) {
      return NextResponse.json({ error: "Object not found" }, { status: 404 });
    }

    return new NextResponse(obj.data as any, {
      headers: {
        "Content-Type": obj.contentType,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    logger.error("storage.local_download.failed", { message: err?.message, stack: err?.stack });
    return NextResponse.json({ error: "Request failed. Please retry." }, { status: 500 });
  }
}
