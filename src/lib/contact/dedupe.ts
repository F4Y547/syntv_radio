import { withRedis, type RedisClient } from "../redis/client";

export const CONTACT_DEDUPE_WINDOW_MS = 10 * 60_000;
const KEY_PREFIX = "syntv:contact:dedupe";

const RELEASE_SCRIPT = `
local current = redis.call('GET', KEYS[1])
if current and current == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

export function newDedupeToken(): string {
  const crypto = globalThis.crypto as Crypto | undefined;
  return typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}:${Math.random()}`;
}

export interface ContactDedupeStore {
  has(key: string, now: number): boolean | Promise<boolean>;
  add(key: string, now: number, token?: string): void | Promise<void>;
  /** Atomically claims a content hash. Returns false when a claim is already active. */
  reserve(key: string, now: number, token: string): boolean | Promise<boolean>;
  /** Releases only this request's claim, so a failed delivery can be retried. */
  release(key: string, now: number, token: string): void | Promise<void>;
  claim?(key: string, now: number): Promise<boolean>;
}

interface MemoryEntry {
  token: string;
  expiresAt: number;
}

function globalMemoryStore(): Map<string, MemoryEntry> {
  const g = globalThis as typeof globalThis & { __syntvContactDedupe?: Map<string, MemoryEntry> };
  if (!g.__syntvContactDedupe) g.__syntvContactDedupe = new Map();
  return g.__syntvContactDedupe;
}

function createMemoryDedupeStore(windowMs: number, store: Map<string, MemoryEntry>): ContactDedupeStore {
  const prune = (now: number) => {
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) store.delete(key);
    }
  };
  const has = (key: string, now: number) => Boolean(store.get(key)?.expiresAt && store.get(key)!.expiresAt > now);
  const add = (key: string, now: number, token = "legacy") => {
    prune(now);
    store.set(key, { token, expiresAt: now + windowMs });
  };
  const reserve = (key: string, now: number, token: string) => {
    prune(now);
    if (has(key, now)) return false;
    store.set(key, { token, expiresAt: now + windowMs });
    return true;
  };
  const release = (key: string, now: number, token: string) => {
    const entry = store.get(key);
    if (entry && entry.expiresAt > now && entry.token === token) store.delete(key);
  };

  return {
    has,
    add,
    reserve,
    release,
    async claim(key, now) {
      return reserve(key, now, newDedupeToken());
    },
  };
}

/**
 * Distributed duplicate protection with Redis atomic SET NX PX and compare-and-delete
 * release. Local memory is a temporary outage fallback, never the source of truth.
 */
export function createRedisContactDedupeStore(
  windowMs = CONTACT_DEDUPE_WINDOW_MS,
  client?: RedisClient | null,
): ContactDedupeStore {
  const memory = createMemoryDedupeStore(windowMs, globalMemoryStore());

  return {
    has(key, now) {
      return withRedis(
        async (redis) => Boolean(await redis.get(`${KEY_PREFIX}:${key}`)),
        () => memory.has(key, now),
        { client },
      );
    },
    add(key, now) {
      const token = newDedupeToken();
      return withRedis(
        async (redis) => {
          await redis.set(`${KEY_PREFIX}:${key}`, token, "PX", windowMs);
        },
        () => memory.add(key, now),
        { client },
      );
    },
    reserve(key, now, token) {
      return withRedis(
        async (redis) => {
          const result = await redis.set(`${KEY_PREFIX}:${key}`, token, "PX", windowMs, "NX");
          return result === "OK";
        },
        () => memory.reserve(key, now, token),
        { client },
      );
    },
    release(key, now, token) {
      return withRedis(
        async (redis) => {
          await redis.eval(RELEASE_SCRIPT, 1, `${KEY_PREFIX}:${key}`, token);
        },
        () => memory.release(key, now, token),
        { client },
      );
    },
    async claim(key, now) {
      return this.reserve(key, now, newDedupeToken());
    },
  };
}

export function createContactDedupeStore(windowMs = CONTACT_DEDUPE_WINDOW_MS): ContactDedupeStore {
  return createRedisContactDedupeStore(windowMs);
}

/** Deterministic isolated store for tests. */
export function createTestDedupeStore(windowMs = CONTACT_DEDUPE_WINDOW_MS): ContactDedupeStore {
  return createMemoryDedupeStore(windowMs, new Map());
}
