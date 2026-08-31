import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/db";
import { systemSettings, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseBody } from "@/lib/validation";
import { adminSettingsSchema } from "@/lib/validation/schemas";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const settings = await db.select().from(systemSettings);
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    return NextResponse.json({ settings: map });
  } catch (err: any) {
    logger.error("admin.settings_get_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("errorResponse" in auth) return auth.errorResponse;

  const parsed = await parseBody(request, adminSettingsSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const { maintenanceMode, broadcastBanner } = parsed.data;

  try {
    const upsertSetting = async (key: string, value: string) => {
      const [existing] = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
      if (existing) {
        await db.update(systemSettings).set({ value, updatedAt: new Date() }).where(eq(systemSettings.key, key));
      } else {
        await db.insert(systemSettings).values({ key, value });
      }
    };

    if (maintenanceMode !== undefined) {
      await upsertSetting("maintenance_mode", String(Boolean(maintenanceMode)));
    }
    if (broadcastBanner !== undefined) {
      await upsertSetting("broadcast_banner", String(broadcastBanner).trim());
    }

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: auth.user.id,
      actorType: "admin",
      action: "admin.settings_update",
      resourceType: "system",
      resourceId: "system_settings",
      detailsJson: JSON.stringify({ maintenanceMode, hasBanner: !!broadcastBanner }),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error("admin.settings_update_failed", { message: err?.message });
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
