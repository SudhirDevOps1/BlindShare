import { NextResponse } from "next/server";
import { createAltchaChallenge } from "@/lib/security/altcha";
import { rateLimitDistributed } from "@/lib/security/distributed-rate-limiter";

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rl = await rateLimitDistributed(`altcha:${ip}`, 60, 60_000); // 60 challenges per minute per IP
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many challenge requests. Please wait a moment." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const challenge = createAltchaChallenge(50000, 5 * 60 * 1000);
    return NextResponse.json(challenge, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate security challenge" },
      { status: 500 }
    );
  }
}
