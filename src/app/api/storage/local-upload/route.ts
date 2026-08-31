import { NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/storage";

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
    }

    const arrayBuffer = await request.arrayBuffer();
    const storage = getStorageAdapter();
    const contentType = request.headers.get("content-type") || "application/octet-stream";

    await storage.putObject(key, Buffer.from(arrayBuffer), contentType);

    return NextResponse.json({ success: true, key, size: arrayBuffer.byteLength });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
