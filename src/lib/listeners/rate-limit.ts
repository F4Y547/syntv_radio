interface RateBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

function getStore() {
  const g = globalThis as typeof globalThis & { __syntvRateLimit?: Map<string, RateBucket> };
  if (!g.__syntvRateLimit) g.__syntvRateLimit = new Map();
  return g.__syntvRateLimit;
}

function checkMemoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const store = getStore();
  const now = Date.now();
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  return checkMemoryRateLimit(key, limit, windowMs);
}

async function getRedis() {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  try {
    const g = globalThis as typeof globalThis & { __syntvRateRedis?: import("ioredis").default; __syntvRateRedisUrl?: string };
    if (g.__syntvRateRedis && g.__syntvRateRedisUrl === url) return g.__syntvRateRedis;
    const Redis = (await import("ioredis")).default;
    g.__syntvRateRedis = new Redis(url, { maxRetriesPerRequest: 2, enableReadyCheck: true, lazyConnect: false, connectTimeout: 5000 });
    g.__syntvRateRedis.on("error", (err) => console.error("[rate-limit][redis]", err.message));
    g.__syntvRateRedisUrl = url;
    return g.__syntvRateRedis;
  } catch {
    return null;
  }
}

/**
 * Distributed rate limit using Redis when REDIS_URL is configured.
 * Falls back to in-memory limiting for dev/single-instance.
 */
export async function checkRateLimitAsync(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const redis = await getRedis();
  if (!redis) return checkMemoryRateLimit(key, limit, windowMs);
  try {
    const now = Date.now();
    const redisKey = `syntv:ratelimit:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.pexpire(redisKey, windowMs);
    }
    let ttl = await redis.pttl(redisKey);
    if (ttl < 0) ttl = windowMs;
    const resetAt = now + ttl;
    if (count > limit) {
      return { allowed: false, remaining: 0, resetAt };
    }
    return { allowed: true, remaining: Math.max(0, limit - count), resetAt };
  } catch (err) {
    console.error("[rate-limit] redis failed, falling back to memory", err);
    return checkMemoryRateLimit(key, limit, windowMs);
  }
}

export function rateLimitHeaders(result: { remaining: number; resetAt: number; limit?: number }) {
  return {
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
