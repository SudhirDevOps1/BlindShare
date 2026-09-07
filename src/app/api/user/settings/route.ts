import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";
import { z } from "zod";

export interface UserSecuritySettings {
  kdfAlgo: "pbkdf2" | "argon2id";
  idleLockMinutes: string;
  cursorFxEnabled: boolean;
  strictMemoryIsolation: boolean;
  weeklyDigestEnabled: boolean;
  language?: "en" | "hi";
  theme?: string;
  linkPresets: {
    watermarkEnabled: boolean;
    requiresEmail: boolean;
    requiresNda: boolean;
    burnAfterReading: boolean;
    antiLeakBlurEnabled: boolean;
    defaultExpiryDays: string;
  };
  securityAlerts: {
    newDevice: boolean;
    bruteForce: boolean;
    linkBurned: boolean;
    printAttempt: boolean;
  };
  [key: string]: any;
}

export const defaultUserSettings: UserSecuritySettings = {
  kdfAlgo: "pbkdf2",
  idleLockMinutes: "30",
  cursorFxEnabled: false,
  strictMemoryIsolation: false,
  weeklyDigestEnabled: true,
  language: "en",
  linkPresets: {
    watermarkEnabled: true,
    requiresEmail: false,
    requiresNda: false,
    burnAfterReading: false,
    antiLeakBlurEnabled: true,
    defaultExpiryDays: "7",
  },
  securityAlerts: {
    newDevice: true,
    bruteForce: true,
    linkBurned: true,
    printAttempt: true,
  },
};

const settingsSchema = z
  .object({
    kdfAlgo: z.enum(["pbkdf2", "argon2id"]).optional(),
    idleLockMinutes: z.string().optional(),
    cursorFxEnabled: z.boolean().optional(),
    strictMemoryIsolation: z.boolean().optional(),
    weeklyDigestEnabled: z.boolean().optional(),
    language: z.enum(["en", "hi"]).optional(),
    theme: z.string().optional(),
    linkPresets: z
      .object({
        watermarkEnabled: z.boolean().optional(),
        requiresEmail: z.boolean().optional(),
        requiresNda: z.boolean().optional(),
        burnAfterReading: z.boolean().optional(),
        antiLeakBlurEnabled: z.boolean().optional(),
        defaultExpiryDays: z.string().optional(),
      })
      .optional(),
    securityAlerts: z
      .object({
        newDevice: z.boolean().optional(),
        bruteForce: z.boolean().optional(),
        linkBurned: z.boolean().optional(),
        printAttempt: z.boolean().optional(),
      })
      .optional(),
  })
  .passthrough();

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settingKey = `user_settings:${session.id}`;
    const [record] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, settingKey))
      .limit(1);

    if (!record) {
      return NextResponse.json({ settings: defaultUserSettings });
    }

    try {
      const parsed = JSON.parse(record.value);
      const merged: UserSecuritySettings = {
        ...defaultUserSettings,
        ...parsed,
        linkPresets: {
          ...defaultUserSettings.linkPresets,
          ...(parsed.linkPresets || {}),
        },
        securityAlerts: {
          ...defaultUserSettings.securityAlerts,
          ...(parsed.securityAlerts || {}),
        },
      };
      return NextResponse.json({ settings: merged });
    } catch {
      return NextResponse.json({ settings: defaultUserSettings });
    }
  } catch (err: any) {
    logger.error("user.settings_get_failed", { error: err?.message });
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || "Invalid settings payload";
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const settingKey = `user_settings:${session.id}`;

    // Read existing settings to merge safely
    let currentSettings = { ...defaultUserSettings };
    const [existing] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, settingKey))
      .limit(1);

    if (existing) {
      try {
        const prev = JSON.parse(existing.value);
        currentSettings = {
          ...currentSettings,
          ...prev,
          linkPresets: {
            ...currentSettings.linkPresets,
            ...(prev.linkPresets || {}),
          },
          securityAlerts: {
            ...currentSettings.securityAlerts,
            ...(prev.securityAlerts || {}),
          },
        };
      } catch {}
    }

    const updatedSettings: UserSecuritySettings = {
      ...currentSettings,
      ...parsed.data,
      linkPresets: {
        ...currentSettings.linkPresets,
        ...(parsed.data.linkPresets || {}),
      },
      securityAlerts: {
        ...currentSettings.securityAlerts,
        ...(parsed.data.securityAlerts || {}),
      },
    };

    const serialized = JSON.stringify(updatedSettings);

    if (existing) {
      await db
        .update(systemSettings)
        .set({
          value: serialized,
          updatedAt: new Date(),
        })
        .where(eq(systemSettings.key, settingKey));
    } else {
      await db.insert(systemSettings).values({
        key: settingKey,
        value: serialized,
        updatedAt: new Date(),
      });
    }

    // Record audit event
    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: session.id,
      actorType: "user",
      action: "user.settings_updated",
      resourceType: "user_settings",
      resourceId: session.id,
      detailsJson: JSON.stringify({
        kdfAlgo: updatedSettings.kdfAlgo,
        idleLockMinutes: updatedSettings.idleLockMinutes,
        strictMemoryIsolation: updatedSettings.strictMemoryIsolation,
      }),
    });

    logger.info("user.settings_updated", { userId: session.id });

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully to account database",
      settings: updatedSettings,
    });
  } catch (err: any) {
    logger.error("user.settings_update_failed", { error: err?.message });
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
