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

function normalizePostgresUrl(rawUrl: string): { url: string; isCloud: boolean } {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const sslMode = parsed.searchParams.get("sslmode");
    const isCloud =
      sslMode === "require" ||
      sslMode === "verify-ca" ||
      sslMode === "verify-full" ||
      host === "neon.tech" ||
      host.endsWith(".neon.tech") ||
      host === "supabase.co" ||
      host.endsWith(".supabase.co") ||
      host === "pooler.supabase.com" ||
      host.endsWith(".pooler.supabase.com") ||
      host.endsWith(".amazonaws.com") ||
      host.endsWith(".azure.com") ||
      host.endsWith(".render.com");

    if (isCloud && sslMode === "require") {
      // Opt into libpq compatibility as officially recommended by node-postgres
      // to eliminate the noisy console warning while maintaining 100% TLS encryption.
      parsed.searchParams.set("uselibpqcompat", "true");
    }

    return { url: parsed.toString(), isCloud };
  } catch {
    return { url: rawUrl, isCloud: false };
  }
}

const { url: connectionString, isCloud: isCloudPostgres } = normalizePostgresUrl(databaseUrl);

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString,
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

