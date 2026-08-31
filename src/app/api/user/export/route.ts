import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { db } from "@/db";
import { users, documents, links, viewSessions, datarooms } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const auth = await requireAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const [userProfile] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, auth.user.id))
      .limit(1);

    const userDocs = await db.select().from(documents).where(eq(documents.ownerId, auth.user.id));
    const userLinks = await db.select().from(links).where(eq(links.ownerId, auth.user.id));
    const userDatarooms = await db.select().from(datarooms).where(eq(datarooms.ownerId, auth.user.id));

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      user: userProfile,
      documents: userDocs,
      links: userLinks,
      datarooms: userDatarooms,
      notice: "Zero-Knowledge Note: Document ciphertext blobs remain encrypted with your client-side keys.",
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="blindshare-data-export-${auth.user.id}.json"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Export failed" }, { status: 500 });
  }
}
