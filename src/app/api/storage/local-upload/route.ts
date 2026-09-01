import { NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/storage";
import { getSession } from "@/lib/auth/session";

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (!key || !/^[a-zA-Z0-9_\-\.\/]+$/.test(key) || key.includes("..")) {
      return NextResponse.json({ error: "Invalid or illegal storage key" }, { status: 400 });
    }

    const arrayBuffer = await request.arrayBuffer();
    // 50MB safe boundary for local storage write
    if (arrayBuffer.byteLength > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Payload exceeds 50MB limit" }, { status: 413 });
    }

    const storage = getStorageAdapter();
    const contentType = request.headers.get("content-type") || "application/octet-stream";

    await storage.putObject(key, Buffer.from(arrayBuffer), contentType);

    return NextResponse.json({ success: true, key, size: arrayBuffer.byteLength });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
