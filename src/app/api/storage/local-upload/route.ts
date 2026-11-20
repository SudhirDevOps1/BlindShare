import { NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/storage";
import { requireAuth } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = (searchParams.get("key") || "").trim();
    if (!key || key.length > 256 || !/^[a-zA-Z0-9_\-\.\/]+$/.test(key) || key.includes("..")) {
      return NextResponse.json({ error: "Invalid or illegal storage key" }, { status: 400 });
    }

    const expires = Number(searchParams.get("expires") || "0");
    const sig = searchParams.get("sig");

    let isAuthorized = false;
    if (sig && expires > Date.now()) {
      const secret = process.env.SESSION_SECRET || "blindshare_local_secret";
      const expectedSig = crypto.createHmac("sha256", secret).update(`put:${key}:${expires}`).digest("hex");
      if (sig.length === expectedSig.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      const auth = await requireAuth();
      if ("errorResponse" in auth) return auth.errorResponse;
    }

    const arrayBuffer = await request.arrayBuffer();
    if (arrayBuffer.byteLength === 0 || arrayBuffer.byteLength > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Invalid payload size (max 50MB)" }, { status: 400 });
    }

    const storage = getStorageAdapter();
    const contentType = request.headers.get("content-type") || "application/octet-stream";

    await storage.putObject(key, Buffer.from(arrayBuffer), contentType);

    return NextResponse.json({ success: true, key, size: arrayBuffer.byteLength });
  } catch (err: any) {
    logger.error("storage.local_upload.failed", { message: err?.message, stack: err?.stack });
    return NextResponse.json({ error: "Request failed. Please retry." }, { status: 500 });
  }
}
