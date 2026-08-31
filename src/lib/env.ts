import { z } from "zod";
import { logger } from "./logger";

/**
 * Strict environment validation, run once per server process.
 *
 * Design: fail fast (throw) only for variables that would make the app
 * insecure or non-functional (DATABASE_URL, SESSION_SECRET strength). Every
 * optional adapter variable (B2/R2/Neon/Turso/Supabase/VAPID/etc.) is only
 * warned about — this project intentionally supports partial configuration
 * per BACKEND_TARGET/DB_TARGET/STORE_TARGET so we never hard-fail on envs
 * that a given deployment target does not need.
 */

const coreSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters (use: openssl rand -hex 32)")
    .optional(),
  DOCS_ENCRYPTION_MODE: z.enum(["e2ee-fragment", "plain-cipher-at-rest"]).optional(),
});

let validated = false;

export function validateEnvOnce() {
  if (validated) return;
  validated = true;

  const result = coreSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    logger.error("env.validation_failed", { issues });
    // DATABASE_URL missing is fatal everywhere; a weak/absent SESSION_SECRET is
    // fatal only in production (dev has a documented insecure fallback).
    const fatal = result.error.issues.some(
      (i) => i.path[0] === "DATABASE_URL" || (process.env.NODE_ENV === "production" && i.path[0] === "SESSION_SECRET")
    );
    if (fatal) {
      throw new Error(`Environment misconfiguration: ${issues.join("; ")}`);
    }
  }

  if (process.env.NODE_ENV === "production") {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      throw new Error(
        "SESSION_SECRET is required in production and must be >= 32 chars (openssl rand -hex 32)"
      );
    }
    if (process.env.STORE_TARGET === "local") {
      logger.warn("env.insecure_store_target", {
        message: "STORE_TARGET=local writes ciphertext to local disk — use b2 or r2 in production",
      });
    }
  }

  logger.info("env.validated", {
    backendTarget: process.env.BACKEND_TARGET || "vercel",
    dbTarget: process.env.DB_TARGET || "neon",
    storeTarget: process.env.STORE_TARGET || "local",
    encryptionMode: process.env.DOCS_ENCRYPTION_MODE || "e2ee-fragment",
    nodeEnv: process.env.NODE_ENV || "development",
  });
}
