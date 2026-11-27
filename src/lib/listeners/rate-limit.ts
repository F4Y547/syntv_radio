import { withRedis, type RedisClient } from "../redis/client";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export type RateLimiter = (key: string, limit: number, windowMs: number) => Promise<RateLimitResult>;

interface MemoryRateStore {
  timestamps: Map<string, number[]>;
}

export interface RateLimiterOptions {
  /** Explicit client for tests. Omit to use the shared REDIS_URL client. */
  client?: RedisClient | null;
  now?: () => number;
  memoryStore?: MemoryRateStore;
}

const RATE_LIMIT_PREFIX = "syntv:ratelimit:v1:";

const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowMs)
local count = redis.call('ZCARD', key)
if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local resetAt = now + windowMs
  if oldest[2] then resetAt = tonumber(oldest[2]) + windowMs end
  redis.call('PEXPIRE', key, windowMs)
  return {0, 0, resetAt}
end
redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, windowMs)
return {1, limit - count - 1, now + windowMs}
`;

function globalMemoryStore(): MemoryRateStore {
  const g = globalThis as typeof globalThis & { __syntvRateLimitV2?: MemoryRateStore };
  if (!g.__syntvRateLimitV2) g.__syntvRateLimitV2 = { timestamps: new Map() };
  return g.__syntvRateLimitV2;
}

function uniqueMember(now: number): string {
  const crypto = globalThis.crypto as Crypto | undefined;
  const suffix = typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${now}:${suffix}`;
}

function checkMemoryRateLimit(
  store: MemoryRateStore,
  key: string,
  limit: number,
  windowMs: number,
  now: number,
): RateLimitResult {
  const cutoff = now - windowMs;
  const timestamps = (store.timestamps.get(key) ?? []).filter((timestamp) => timestamp > cutoff);

  if (timestamps.length >= limit) {
    store.timestamps.set(key, timestamps);
    return { allowed: false, remaining: 0, resetAt: timestamps[0] + windowMs };
  }

  timestamps.push(now);
  store.timestamps.set(key, timestamps);
  if (store.timestamps.size > 10_000) {
    for (const [entryKey, values] of store.timestamps) {
      if (!values.some((timestamp) => timestamp > cutoff)) store.timestamps.delete(entryKey);
    }
  }
  return { allowed: true, remaining: Math.max(0, limit - timestamps.length), resetAt: now + windowMs };
}

/** Synchronous in-memory limiter kept for call sites that cannot await. */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  return checkMemoryRateLimit(globalMemoryStore(), key, limit, windowMs, Date.now());
}

/**
 * Shared Redis limiter with an in-memory outage fallback.
 * The Lua script performs prune/count/add atomically across instances.
 */
export function createRateLimiter(options: RateLimiterOptions = {}): RateLimiter {
  const now = options.now ?? Date.now;
  const store = options.memoryStore ?? globalMemoryStore();

  return async (key, limit, windowMs) => {
    const current = now();
    return withRedis(
      async (redis) => {
        const result = await redis.eval(
          SLIDING_WINDOW_SCRIPT,
          1,
          `${RATE_LIMIT_PREFIX}${key}`,
          String(current),
          String(windowMs),
          String(limit),
          uniqueMember(current),
        );
        const values = Array.isArray(result) ? result : [];
        const allowed = Number(values[0]) === 1;
        const remaining = Number(values[1]);
        const resetAt = Number(values[2]);
        if (!allowed) {
          return {
            allowed: false,
            remaining: 0,
            resetAt: Number.isFinite(resetAt) ? resetAt : current + windowMs,
          };
        }
        return {
          allowed: true,
          remaining: Number.isFinite(remaining) ? Math.max(0, remaining) : Math.max(0, limit - 1),
          resetAt: Number.isFinite(resetAt) ? resetAt : current + windowMs,
        };
      },
      () => checkMemoryRateLimit(store, key, limit, windowMs, current),
      { client: options.client },
    );
  };
}

export const checkRateLimitAsync: RateLimiter = createRateLimiter();

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
