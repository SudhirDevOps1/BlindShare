import { NextRequest, NextResponse } from "next/server";

/**
 * First-party telemetry endpoint.
 * Acts as a same-origin proxy to eliminate third-party adblocker net::ERR_BLOCKED_BY_CLIENT
 * errors when reporting privacy-first telemetry events.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const upstreamUrl =
      process.env.PRISM_ANALYTICS_URL ||
      process.env.NEXT_PUBLIC_PRISM_ANALYTICS_URL;

    if (upstreamUrl && upstreamUrl.startsWith("http")) {
      // Fire-and-forget backend forwarding; never blocks or errors the client
      fetch(upstreamUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
