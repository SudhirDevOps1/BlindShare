/**
 * Owner-login brute-force lockout with exponential backoff tiers.
 *
 * Tier 1 (5 attempts):   15-minute lockout → triggers ALTCHA requirement
 * Tier 2 (10 attempts):  1-hour lockout
 * Tier 3 (20 attempts):  24-hour lockout (account-level ban signal)
 *
 * Honest limitation (documented in THREAT-MODEL.md): counters are per-process
 * in-memory. On a single long-lived server (Vercel / Render / Deno instance) this
 * is effective; on ephemeral multi-instance edge deployments it is a first-line
 * defence only — the durable version belongs in KV / Durable Object for CF Workers.
 */

interface Attempt {
  count: number;
  lockedUntil: number | null;
  firstAttemptAt: number;
  tier: 1 | 2 | 3;
}

const attempts = new Map<string, Attempt>();

// ── Lockout tier thresholds ────────────────────────────────────────────────
const TIER1_TRIES = () => Number(process.env.LOGIN_LOCKOUT_TRIES || "5");
const TIER2_TRIES = () => TIER1_TRIES() * 2;   // 10 by default
const TIER3_TRIES = () => TIER1_TRIES() * 4;   // 20 by default

const TIER1_MS = () => Number(process.env.LOGIN_LOCKOUT_MINUTES || "15") * 60 * 1000;
const TIER2_MS = () => 60 * 60 * 1000;         // 1 hour
const TIER3_MS = () => 24 * 60 * 60 * 1000;    // 24 hours

/** Rolling window for attempt counting. */
const WINDOW_MS = 30 * 60 * 1000; // 30 minutes

function keyFor(identifier: string, ip: string) {
  return `${identifier.toLowerCase()}::${ip}`;
}

function lockDurationFor(count: number): number {
  const t3 = TIER3_TRIES();
  const t2 = TIER2_TRIES();
  const t1 = TIER1_TRIES();
  if (count >= t3) return TIER3_MS();
  if (count >= t2) return TIER2_MS();
  if (count >= t1) return TIER1_MS();
  return 0;
}

function tierFor(count: number): 1 | 2 | 3 {
  if (count >= TIER3_TRIES()) return 3;
  if (count >= TIER2_TRIES()) return 2;
  return 1;
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

/** Returns current number of failed attempts within the rolling window. */
export function getFailureCount(identifier: string, ip: string): number {
  sweep();
  const rec = attempts.get(keyFor(identifier, ip));
  if (!rec) return 0;
  if (Date.now() - rec.firstAttemptAt > WINDOW_MS) return 0;
  return rec.count || 0;
}

/**
 * Returns the current lockout tier for the given identifier+IP.
 * Tier 0 means no lockout has been applied yet.
 */
export function getLockoutTier(identifier: string, ip: string): 0 | 1 | 2 | 3 {
  sweep();
  const rec = attempts.get(keyFor(identifier, ip));
  if (!rec) return 0;
  if (Date.now() - rec.firstAttemptAt > WINDOW_MS) return 0;
  if (!rec.lockedUntil) return 0;
  return rec.tier;
}

export function recordFailure(
  identifier: string,
  ip: string
): { locked: boolean; remainingTries: number; tier: 0 | 1 | 2 | 3; lockDurationMs: number } {
  const k = keyFor(identifier, ip);
  const now = Date.now();
  const rec = attempts.get(k) || { count: 0, lockedUntil: null, firstAttemptAt: now, tier: 1 as const };

  // Reset window if expired
  if (now - rec.firstAttemptAt > WINDOW_MS) {
    rec.count = 0;
    rec.firstAttemptAt = now;
    rec.lockedUntil = null;
  }

  rec.count += 1;
  const lockMs = lockDurationFor(rec.count);

  if (lockMs > 0) {
    // Always extend lockout to the new (higher) tier duration
    rec.lockedUntil = now + lockMs;
    rec.tier = tierFor(rec.count);
  }

  attempts.set(k, rec);

  const remainingTries = Math.max(0, TIER1_TRIES() - rec.count);
  return {
    locked: lockMs > 0,
    remainingTries,
    tier: lockMs > 0 ? rec.tier : 0,
    lockDurationMs: lockMs,
  };
}

export function recordSuccess(identifier: string, ip: string) {
  attempts.delete(keyFor(identifier, ip));
}
