import { NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/storage";
import { requireAuth } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";
import { verifyStorageSignature } from "@/lib/storage/signature";

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = (searchParams.get("key") || "").trim();
    if (!key || key.length > 256 || !/^[a-zA-Z0-9_\-\.\/]+$/.test(key) || key.includes("..")) {
      return NextResponse.json({ error: "Invalid or illegal storage key" }, { status: 400 });
    }

    const sig = searchParams.get("sig");
    const expires = searchParams.get("expires");

    // Strict discriminated authorization paths (No mutable bypass flag)
    if (sig) {
      const isSignatureValid = verifyStorageSignature("put", key, expires, sig);
      if (!isSignatureValid) {
        return NextResponse.json({ error: "Invalid or expired signature" }, { status: 403 });
      }
    } else {
      const auth = await requireAuth();
      if ("errorResponse" in auth) {
        return auth.errorResponse;
      }
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
