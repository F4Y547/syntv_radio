import { withRedis, type RedisClient } from "../redis/client";

/** Public, unauthenticated directory data only. Never add admin/session data here. */

export interface SeoCacheOptions {
  /** Explicit client for tests. Omit to use the shared REDIS_URL client. */
  client?: RedisClient | null;
  now?: () => number;
}

export const SEO_TTL_HOUR_MS = 60 * 60_000;
export const SEO_TTL_MINUTE_MS = 5 * 60_000;

const KEY_PREFIX = "syntv:seo:v1";
const GENERATION_KEY = `${KEY_PREFIX}:generation`;
const GENERATION_TTL_SECONDS = 60 * 60 * 24 * 365;

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

interface SeoCacheState {
  localGeneration: number;
  entries: Map<string, CacheEntry>;
}

function state(): SeoCacheState {
  const g = globalThis as typeof globalThis & { __syntvSeoCacheV1?: SeoCacheState };
  if (!g.__syntvSeoCacheV1) g.__syntvSeoCacheV1 = { localGeneration: 0, entries: new Map() };
  return g.__syntvSeoCacheV1;
}

function readMemory<T>(key: string, now: number): T | undefined {
  const s = state();
  const entry = s.entries.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= now) {
    s.entries.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function writeMemory(key: string, value: unknown, ttlMs: number, now: number): void {
  const s = state();
  s.entries.set(key, { value, expiresAt: now + ttlMs });
  if (s.entries.size > 500) {
    for (const [entryKey, entry] of s.entries) {
      if (entry.expiresAt <= now) s.entries.delete(entryKey);
    }
  }
}

async function getGeneration(options: SeoCacheOptions): Promise<string> {
  const redisGeneration = await withRedis(
    async (redis) => {
      const raw = await redis.get(GENERATION_KEY);
      const parsed = Number(raw ?? 0);
      return Number.isFinite(parsed) ? parsed : 0;
    },
    () => 0,
    { client: options.client },
  );
  return `${redisGeneration}:${state().localGeneration}`;
}

function cacheKey(generation: string, name: string, args: readonly unknown[]): string {
  return `${KEY_PREFIX}:${generation}:${name}:${encodeURIComponent(JSON.stringify(args))}`;
}

/**
 * Redis-backed cache for public SEO data. A generation key provides cheap
 * global invalidation; local memory keeps reads working during Redis outages.
 */
export async function getCachedSeoData<T>(
  name: string,
  args: readonly unknown[],
  ttlMs: number,
  loader: () => Promise<T>,
  options: SeoCacheOptions = {},
): Promise<T> {
  const now = options.now?.() ?? Date.now();
  const key = cacheKey(await getGeneration(options), name, args);

  const cached = await withRedis<T | undefined>(
    async (redis) => {
      const raw = await redis.get(key);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as T;
      writeMemory(key, parsed, ttlMs, now);
      return parsed;
    },
    () => readMemory<T>(key, now),
    { client: options.client },
  );
  if (cached !== undefined) return cached;

  const value = await loader();
  await withRedis(
    async (redis) => {
      await redis.set(key, JSON.stringify(value), "PX", ttlMs);
    },
    () => writeMemory(key, value, ttlMs, now),
    { client: options.client },
  );
  return value;
}

/** Bumps both the shared and local generations. Safe to call during outages. */
export async function bumpSeoGeneration(options: SeoCacheOptions = {}): Promise<void> {
  const s = state();
  s.localGeneration += 1;
  s.entries.clear();
  await withRedis(
    async (redis) => {
      await redis.incr(GENERATION_KEY);
      await redis.expire(GENERATION_KEY, GENERATION_TTL_SECONDS);
    },
    () => undefined,
    { client: options.client },
  );
}

/** Test helper: clears in-process cache state without touching Redis. */
export function resetSeoCacheForTests(): void {
  const s = state();
  s.localGeneration = 0;
  s.entries.clear();
}
