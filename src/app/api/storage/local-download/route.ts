import { NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/storage";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
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
    return NextResponse.json({ error: err.message || "Download failed" }, { status: 500 });
  }
}
