import { NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/storage";
import { requireAuth } from "@/lib/auth/rbac";

export async function PUT(request: Request) {
  try {
    const auth = await requireAuth();
    if ("errorResponse" in auth) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const rawKey = searchParams.get("key") || "";
    const key = rawKey.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!key || key.length > 256) {
      return NextResponse.json({ error: "Invalid or illegal storage key" }, { status: 400 });
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
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
