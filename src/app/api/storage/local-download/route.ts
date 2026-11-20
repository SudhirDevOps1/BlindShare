import { NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { verifyStorageSignature } from "@/lib/storage/signature";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = (searchParams.get("key") || "").trim();
    const sig = searchParams.get("sig");
    const expires = searchParams.get("expires");

    // Unconditional cryptographic signature verification — no bypass branches
    if (!verifyStorageSignature("get", key, expires, sig)) {
      return NextResponse.json({ error: "Invalid or expired signature" }, { status: 403 });
    }

    if (!key || key.length > 256 || !/^[a-zA-Z0-9_\-\.\/]+$/.test(key) || key.includes("..")) {
      return NextResponse.json({ error: "Invalid storage key format" }, { status: 400 });
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
