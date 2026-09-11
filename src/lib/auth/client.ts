/**
 * BlindShare — Better Auth Client SDK
 *
 * Provides type-safe client-side auth hooks for Better Auth v1.x features:
 * - emailAndPassword (primary login flow — coexists with BlindShare's /api/auth/* routes)
 * - twoFactor: TOTP QR setup, verify, and disable
 * - organization: multi-tenant data room collaboration
 * - passkey: WebAuthn / FIDO2 biometric login
 * - admin: impersonation and user management
 *
 * NOTE: BlindShare continues to use its own /api/auth/login and /api/auth/register
 * routes for the primary owner login flow (zero-knowledge vault unlock, ALTCHA, 2FA).
 * This Better Auth client is available for progressive enhancement: passkey, org
 * management, and future password-less flows.
 *
 * @see src/lib/auth/better-auth.ts (server instance)
 * @see src/app/api/auth/[...all]/route.ts (Better Auth route handler)
 */

import { createAuthClient } from "better-auth/client";
import { twoFactorClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";

// Resolve base URL for the Better Auth API endpoints
const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.BETTER_AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

/**
 * Better Auth client instance with enterprise plugins.
 *
 * Use `authClient.signIn.email()` / `authClient.signUp.email()` for
 * Better Auth managed sessions. For primary ZK-vault login, use the
 * existing BlindShare /api/auth/login route instead.
 */
export const authClient = createAuthClient({
  baseURL,
  plugins: [
    twoFactorClient(),
    organizationClient(),
    adminClient(),
  ],
});

// Re-export commonly used hooks for convenience
export const {
  useSession,
  signIn,
  signOut,
  signUp,
} = authClient;
