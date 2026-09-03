/**
 * Owner-login brute-force lockout (mirrors the share-link password-gate
 * lockout policy: LOGIN_LOCKOUT_TRIES attempts, then LOGIN_LOCKOUT_MINUTES cool-down).
 *
 * Honest limitation (documented in THREAT-MODEL.md): this counter is
 * per-process memory. On a single long-lived server (Vercel/Render/Deno
 * instance, or CF Worker + Durable Object in production) this is effective;
 * on ephemeral multi-instance edge deployments it is a first line of defence
 * only — the durable version belongs in KV/DO for BACKEND_TARGET=cf.
 */

interface Attempt {
  count: number;
  lockedUntil: number | null;
  firstAttemptAt: number;
}

const attempts = new Map<string, Attempt>();

const MAX_TRIES = () => Number(process.env.LOGIN_LOCKOUT_TRIES || "5");
const LOCK_MINUTES = () => Number(process.env.LOGIN_LOCKOUT_MINUTES || "15");
const WINDOW_MS = 30 * 60 * 1000; // rolling 30-minute attempt window

function keyFor(identifier: string, ip: string) {
  return `${identifier.toLowerCase()}::${ip}`;
}

function sweep() {
  if (attempts.size < 10000) return;
  const now = Date.now();
  for (const [k, v] of attempts) {
    if ((v.lockedUntil === null || v.lockedUntil < now) && now - v.firstAttemptAt > WINDOW_MS) {
      attempts.delete(k);
    }
  }
}

/** Returns remaining lockout seconds (0 = not locked). */
export function checkLockout(identifier: string, ip: string): number {
  sweep();
  const rec = attempts.get(keyFor(identifier, ip));
  if (!rec || !rec.lockedUntil) return 0;
  const remaining = rec.lockedUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/** Returns current number of failed attempts within the window */
export function getFailureCount(identifier: string, ip: string): number {
  sweep();
  const rec = attempts.get(keyFor(identifier, ip));
  if (!rec) return 0;
  if (Date.now() - rec.firstAttemptAt > WINDOW_MS) return 0;
  return rec.count || 0;
}

export function recordFailure(identifier: string, ip: string): { locked: boolean; remainingTries: number } {
  const k = keyFor(identifier, ip);
  const now = Date.now();
  const rec = attempts.get(k) || { count: 0, lockedUntil: null, firstAttemptAt: now };

  if (now - rec.firstAttemptAt > WINDOW_MS) {
    rec.count = 0;
    rec.firstAttemptAt = now;
    rec.lockedUntil = null;
  }

  rec.count += 1;
  const maxTries = MAX_TRIES();

  if (rec.count >= maxTries) {
    rec.lockedUntil = now + LOCK_MINUTES() * 60 * 1000;
  }

  attempts.set(k, rec);
  return { locked: !!rec.lockedUntil, remainingTries: Math.max(0, maxTries - rec.count) };
}

export function recordSuccess(identifier: string, ip: string) {
  attempts.delete(keyFor(identifier, ip));
}
