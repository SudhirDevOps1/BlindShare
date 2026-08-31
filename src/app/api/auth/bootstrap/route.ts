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
      // "setup"  → nobody has claimed this deployment: first sign-up needs NO invite
      // "normal" → at least one real owner exists: invite code required
      mode: claimed ? "normal" : "setup",
      inviteRequired: claimed,
      placeholderAccountExists: placeholder.length > 0,
      // Shown only while un-claimed, so a fresh operator can always get in.
      placeholderEmail: claimed ? null : GENESIS_PLACEHOLDER_EMAIL,
      placeholderPassword: claimed ? null : "AdminPassword2026!",
      hint: claimed
        ? "Ask an administrator for an invite code, or use the ADMIN_BOOTSTRAP_INVITE value from your .env file."
        : "This deployment has no owner yet — the first account you create becomes Super Admin. No invite code needed.",
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
