import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";
import { z } from "zod";

export interface UserPasskeyMetadata {
  credentialId: string;
  prfSupported: boolean;
  label?: string;
  registeredAt: string;
}

const registerPasskeySchema = z.object({
  credentialId: z.string().min(10, "Credential ID is invalid"),
  prfSupported: z.boolean(),
  label: z.string().max(100).optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const passkeyKey = `user_passkey:${session.id}`;
    const [record] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, passkeyKey))
      .limit(1);

    if (!record) {
      return NextResponse.json({ passkey: null });
    }

    try {
      const passkey: UserPasskeyMetadata = JSON.parse(record.value);
      return NextResponse.json({ passkey });
    } catch {
      return NextResponse.json({ passkey: null });
    }
  } catch (err: any) {
    logger.error("user.passkey_get_failed", { error: err?.message });
    return NextResponse.json({ error: "Failed to fetch passkey" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = registerPasskeySchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || "Invalid passkey payload";
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const passkeyKey = `user_passkey:${session.id}`;
    const metadata: UserPasskeyMetadata = {
      credentialId: parsed.data.credentialId,
      prfSupported: parsed.data.prfSupported,
      label: parsed.data.label || "Biometric / Hardware Enclave Passkey",
      registeredAt: new Date().toISOString(),
    };

    const serialized = JSON.stringify(metadata);

    const [existing] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, passkeyKey))
      .limit(1);

    if (existing) {
      await db
        .update(systemSettings)
        .set({
          value: serialized,
          updatedAt: new Date(),
        })
        .where(eq(systemSettings.key, passkeyKey));
    } else {
      await db.insert(systemSettings).values({
        key: passkeyKey,
        value: serialized,
        updatedAt: new Date(),
      });
    }

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: session.id,
      actorType: "user",
      action: "user.passkey_registered",
      resourceType: "user_passkey",
      resourceId: session.id,
      detailsJson: JSON.stringify({
        credentialIdPrefix: metadata.credentialId.slice(0, 12) + "...",
        prfSupported: metadata.prfSupported,
      }),
    });

    logger.info("user.passkey_registered", { userId: session.id });

    return NextResponse.json({
      success: true,
      message: "Passkey successfully registered and bound to account",
      passkey: metadata,
    });
  } catch (err: any) {
    logger.error("user.passkey_post_failed", { error: err?.message });
    return NextResponse.json({ error: "Failed to register passkey" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const passkeyKey = `user_passkey:${session.id}`;
    await db.delete(systemSettings).where(eq(systemSettings.key, passkeyKey));

    await db.insert(auditLog).values({
      id: genId("aud"),
      userId: session.id,
      actorType: "user",
      action: "user.passkey_removed",
      resourceType: "user_passkey",
      resourceId: session.id,
      detailsJson: JSON.stringify({ removedAt: new Date().toISOString() }),
    });

    logger.info("user.passkey_removed", { userId: session.id });

    return NextResponse.json({
      success: true,
      message: "Passkey unlinked and removed from account database",
    });
  } catch (err: any) {
    logger.error("user.passkey_delete_failed", { error: err?.message });
    return NextResponse.json({ error: "Failed to delete passkey" }, { status: 500 });
  }
}
