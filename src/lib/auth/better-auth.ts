import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, twoFactor, organization, anonymous } from "better-auth/plugins";
import { db } from "@/db";
import * as betterAuthSchema from "@/db/better-auth-schema";

const secret =
  process.env.BETTER_AUTH_SECRET ||
  process.env.SESSION_SECRET ||
  "dev_better_auth_secret_key_32b_padding_2026";

const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: betterAuthSchema,
  }),
  secret,
  baseURL,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin(),
    twoFactor(),
    organization(),
    anonymous(),
  ],
});

export type Session = typeof auth.$Infer.Session;
