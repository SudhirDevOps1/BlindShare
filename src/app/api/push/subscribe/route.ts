import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseBody } from "@/lib/validation";
import { pushSubscribeSchema } from "@/lib/validation/schemas";
import { genId } from "@/lib/ids";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const parsed = await parseBody(request, pushSubscribeSchema);
  if ("errorResponse" in parsed) return parsed.errorResponse;
  const { endpoint, keys } = parsed.data;

  try {
    const [existing] = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .limit(1);

    if (existing) {
      await db
        .update(pushSubscriptions)
        .set({ userId: auth.user.id, p256dh: keys.p256dh, auth: keys.auth })
        .where(eq(pushSubscriptions.id, existing.id));
    } else {
      await db.insert(pushSubscriptions).values({
        id: genId("push"),
        userId: auth.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error("push.subscribe_failed", { message: err?.message });
    return NextResponse.json({ error: "Push registration failed" }, { status: 500 });
  }
}
