interface RateBucket {
  count: number;
  resetAt: number;
}

function getStore() {
  const g = globalThis as typeof globalThis & { __syntvRateLimit?: Map<string, RateBucket> };
  if (!g.__syntvRateLimit) g.__syntvRateLimit = new Map();
  return g.__syntvRateLimit;
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const store = getStore();
  const now = Date.now();
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

export function rateLimitHeaders(result: { remaining: number; resetAt: number; limit?: number }) {
  return {
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
