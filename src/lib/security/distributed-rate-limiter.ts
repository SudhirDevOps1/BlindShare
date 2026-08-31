/**
 * Distributed Edge Rate Limiter with In-Memory Zero-Crash Fallback.
 * Supports Upstash Redis REST API (zero native binary dependencies) for globally
 * synchronized rate limiting across Vercel / Cloudflare edge compute instances.
 */

type MemoryBucket = { count: number; resetAt: number };
const memoryBuckets = new Map<string, MemoryBucket>();

// Opportunistic cleanup of stale in-memory buckets
function sweepMemory() {
  if (memoryBuckets.size < 5000) return;
  const now = Date.now();
  for (const [k, v] of memoryBuckets) {
    if (v.resetAt < now) memoryBuckets.delete(k);
  }
}

/**
 * In-memory fallback rate limiter.
 */
function rateLimitMemory(key: string, limit: number, windowMs: number): boolean {
  sweepMemory();
  const now = Date.now();
  const existing = memoryBuckets.get(key);

  if (!existing || existing.resetAt < now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  existing.count += 1;
  return existing.count <= limit;
}

/**
 * Distributed rate limiter.
 * If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in environment,
 * uses atomic Redis INCR/EXPIRE via HTTP REST. Otherwise falls back to memory.
 */
export async function rateLimitDistributed(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; current: number; remaining: number; resetMs: number }> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Fallback to memory if Redis credentials are not configured
  if (!redisUrl || !redisToken) {
    const allowed = rateLimitMemory(key, limit, windowMs);
    return {
      allowed,
      current: allowed ? 1 : limit + 1,
      remaining: allowed ? limit - 1 : 0,
      resetMs: windowMs,
    };
  }

  try {
    const ttlSeconds = Math.ceil(windowMs / 1000);
    const redisKey = `blindshare:ratelimit:${key}`;

    // Upstash multi-command pipeline: INCR then EXPIRE
    const pipelineUrl = `${redisUrl.replace(/\/$/, "")}/pipeline`;
    const response = await fetch(pipelineUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, ttlSeconds],
      ]),
      signal: AbortSignal.timeout(1500), // 1.5s timeout: never hang edge requests
    });

    if (!response.ok) {
      // Degrade gracefully to memory
      const allowed = rateLimitMemory(key, limit, windowMs);
      return { allowed, current: 1, remaining: limit - 1, resetMs: windowMs };
    }

    const data = await response.json();
    // data is [{ result: count }, { result: 1 }]
    const currentCount = Number(data?.[0]?.result || 1);

    const allowed = currentCount <= limit;
    return {
      allowed,
      current: currentCount,
      remaining: Math.max(0, limit - currentCount),
      resetMs: windowMs,
    };
  } catch {
    // Network or parse error: gracefully fall back to local memory without crashing
    const allowed = rateLimitMemory(key, limit, windowMs);
    return { allowed, current: 1, remaining: limit - 1, resetMs: windowMs };
  }
}
