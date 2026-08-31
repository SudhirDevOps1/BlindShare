import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const auth = await requireAdmin();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const logs = await db
      .select()
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(100);

    return NextResponse.json({ logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch audit logs" }, { status: 500 });
  }
}
