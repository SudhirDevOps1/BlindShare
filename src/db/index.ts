import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { validateEnvOnce } from "@/lib/env";
import { ensureDatabaseSchema } from "./auto-migrate";

// Strict, fail-fast environment validation runs once per process, right where
// every server-side code path already imports from (`@/db`).
validateEnvOnce();

const databaseUrl = process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy_build";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function isCloudPostgresUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const sslMode = parsed.searchParams.get("sslmode");
    if (sslMode === "require" || sslMode === "verify-ca" || sslMode === "verify-full") {
      return true;
    }
    return (
      host === "neon.tech" ||
      host.endsWith(".neon.tech") ||
      host === "supabase.co" ||
      host.endsWith(".supabase.co") ||
      host === "pooler.supabase.com" ||
      host.endsWith(".pooler.supabase.com") ||
      host.endsWith(".amazonaws.com") ||
      host.endsWith(".azure.com") ||
      host.endsWith(".render.com")
    );
  } catch {
    return false;
  }
}

const isCloudPostgres = isCloudPostgresUrl(databaseUrl);

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: isCloudPostgres ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

// Auto-create database tables on Neon on first access if not present
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy_build")) {
  ensureDatabaseSchema(pool).catch(() => {});
}

export const db = drizzle(pool);

