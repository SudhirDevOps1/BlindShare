import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, ne, and } from "drizzle-orm";
import { ensureGenesisAdmin, GENESIS_PLACEHOLDER_EMAIL } from "@/lib/auth/session";

/**
 * Tells the login screen what setup state this deployment is in, so the UI can
 * stop asking for an invite code that the operator does not have yet.
 *
 * SECURITY: never returns the value of ADMIN_BOOTSTRAP_INVITE — only whether one
 * is needed. The seeded placeholder credentials are only revealed while the
 * deployment is still un-claimed (no real owner exists yet).
 */
export async function GET() {
  try {
    await ensureGenesisAdmin();

    const realOwners = await db
      .select({ id: users.id })
      .from(users)
      .where(ne(users.email, GENESIS_PLACEHOLDER_EMAIL))
      .limit(1);

    const placeholder = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, GENESIS_PLACEHOLDER_EMAIL))
      .limit(1);

    const claimed = realOwners.length > 0;

    return NextResponse.json({
      mode: claimed ? "normal" : "setup",
      inviteRequired: claimed,
      placeholderAccountExists: false,
      placeholderEmail: null,
      placeholderPassword: null,
      hint: claimed
        ? "Ask an administrator for an invite code, or use your ADMIN_BOOTSTRAP_INVITE."
        : "First-run setup: Create your personal Super Admin account below with your secret invite code.",
    });
  } catch {
    // Fail closed: if we cannot tell, ask for an invite.
    return NextResponse.json({
      mode: "normal",
      inviteRequired: true,
      placeholderAccountExists: false,
      placeholderEmail: null,
      placeholderPassword: null,
      hint: "Ask an administrator for an invite code.",
    });
  }
}
