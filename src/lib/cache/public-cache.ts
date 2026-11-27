import "server-only";
import { withRedis } from "@/lib/redis/client";

const KEY_PREFIX = "syntv:public-cache";
const DEFAULT_TTL_SECONDS = 300;
const MIN_TTL_SECONDS = 30;
const MAX_TTL_SECONDS = 3600;

export const PUBLIC_CACHE_TAGS = ["stations", "countries", "genres"] as const;
export type PublicCacheTag = (typeof PUBLIC_CACHE_TAGS)[number];

export function publicCacheTtlSeconds(): number {
  const raw = process.env.PUBLIC_CACHE_TTL_SECONDS?.trim();
  if (!raw) return DEFAULT_TTL_SECONDS;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_TTL_SECONDS;
  return Math.min(MAX_TTL_SECONDS, Math.max(MIN_TTL_SECONDS, Math.floor(n)));
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  return withRedis<T | null>(
    async (redis) => {
      const raw = await redis.get(`${KEY_PREFIX}:${key}`);
      return raw ? (JSON.parse(raw) as T) : null;
    },
    () => null,
  );
}

export async function setCachedJson<T>(
  key: string,
  value: T,
  ttlSeconds = publicCacheTtlSeconds(),
): Promise<void> {
  await withRedis(
    async (redis) => {
      await redis.set(`${KEY_PREFIX}:${key}`, JSON.stringify(value), "EX", ttlSeconds);
    },
    () => undefined,
  );
}

/** Removes legacy direct keys; generation invalidation handles all current keys. */
export async function invalidatePublicCache(tags: PublicCacheTag[]): Promise<void> {
  await withRedis(
    async (redis) => {
      const direct = tags.map((tag) => `${KEY_PREFIX}:${tag}`);
      if (direct.length) await redis.del(...direct);
      for (const tag of tags) {
        let cursor = "0";
        do {
          const [next, found] = await redis.scan(cursor, "MATCH", `${KEY_PREFIX}:${tag}:*`, "COUNT", 100);
          cursor = next;
          if (found.length) await redis.del(...found);
        } while (cursor !== "0");
      }
    },
    () => undefined,
  );
}
