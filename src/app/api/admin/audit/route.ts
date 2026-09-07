import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { desc } from "drizzle-orm";
import { decryptEmail, decryptField } from "@/lib/crypto/db-vault";
import { logger } from "@/lib/logger";

export async function GET() {
  const auth = await requireAdmin();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const rawLogs = await db
      .select()
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(100);

    const logs = rawLogs.map((log) => {
      if (!log.detailsJson) return log;
      try {
        const parsed = JSON.parse(log.detailsJson);
        if (typeof parsed.email === "string") {
          parsed.email = decryptEmail(parsed.email);
        }
        if (typeof parsed.recipientEmail === "string") {
          parsed.recipientEmail = decryptEmail(parsed.recipientEmail);
        }
        if (typeof parsed.oldEmail === "string") {
          parsed.oldEmail = decryptEmail(parsed.oldEmail);
        }
        if (typeof parsed.newEmail === "string") {
          parsed.newEmail = decryptEmail(parsed.newEmail);
        }
        if (typeof parsed.name === "string") {
          parsed.name = decryptField(parsed.name);
        }
        if (typeof parsed.messageSnippet === "string") {
          parsed.messageSnippet = decryptField(parsed.messageSnippet);
        }
        return { ...log, detailsJson: JSON.stringify(parsed) };
      } catch {
        return log;
      }
    });

    return NextResponse.json({ logs });
  } catch (err: any) {
    logger.error("admin.audit.failed", { message: err?.message, stack: err?.stack });
    return NextResponse.json({ error: "Request failed. Please retry." }, { status: 500 });
  }
}
