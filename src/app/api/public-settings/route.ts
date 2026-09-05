import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await db.select().from(systemSettings);
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;

    let devProfile = null;
    if (map.developer_profile) {
      try {
        devProfile = JSON.parse(map.developer_profile);
      } catch {}
    }

    return NextResponse.json(
      {
        maintenance_mode: map.maintenance_mode === "true",
        broadcast_banner: map.broadcast_banner || "",
        developer_profile: devProfile,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60",
        },
      }
    );
  } catch (err: any) {
    logger.warn("public_settings_fallback", { message: err?.message });
    return NextResponse.json({
      maintenance_mode: false,
      broadcast_banner: "",
      developer_profile: null,
    });
  }
}
