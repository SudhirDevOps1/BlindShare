import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { validateEnvOnce } from "@/lib/env";

// Strict, fail-fast environment validation runs once per process, right where
// every server-side code path already imports from (`@/db`).
validateEnvOnce();

const databaseUrl = process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy_build";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
