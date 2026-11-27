import { expect, test } from "@playwright/test";
import { createRedisContactDedupeStore } from "../../src/lib/contact/dedupe";
import { MemoryListenerStore } from "../../src/lib/listeners/memory-store";
import { createRateLimiter } from "../../src/lib/listeners/rate-limit";
import { ResilientListenerStore } from "../../src/lib/listeners/resilient-store";
import type { ListenerStore } from "../../src/lib/listeners/types";
import type { RedisClient } from "../../src/lib/redis/client";
import { bumpSeoGeneration, getCachedSeoData, resetSeoCacheForTests } from "../../src/lib/seo/cache";

interface FakeString {
  value: string;
  expiresAt: number | null;
}

class FakeRedis {
  private currentTime = 1_700_000_000_000;
  private readonly strings = new Map<string, FakeString>();
  private readonly sortedSets = new Map<string, Map<string, number>>();
  evalCalls = 0;

  constructor(private readonly options: { failEval?: boolean } = {}) {}

  get time() {
    return this.currentTime;
  }

  advance(ms: number) {
    this.currentTime += ms;
  }

  client(): RedisClient {
    return this as unknown as RedisClient;
  }

  private liveString(key: string): FakeString | undefined {
    const entry = this.strings.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && entry.expiresAt <= this.currentTime) {
      this.strings.delete(key);
      return undefined;
    }
    return entry;
  }

  async get(key: string): Promise<string | null> {
    return this.liveString(key)?.value ?? null;
  }

  async set(key: string, value: string, ...args: unknown[]): Promise<"OK" | null> {
    let expiresAt: number | null = null;
    let onlyIfAbsent = false;
    for (let i = 0; i < args.length; i += 1) {
      const option = String(args[i]);
      if (option === "PX") expiresAt = this.currentTime + Number(args[++i]);
      else if (option === "EX") expiresAt = this.currentTime + Number(args[++i]) * 1000;
      else if (option === "NX") onlyIfAbsent = true;
    }
    if (onlyIfAbsent && this.liveString(key)) return null;
    this.strings.set(key, { value, expiresAt });
    return "OK";
  }

  async incr(key: string): Promise<number> {
    const next = Number(this.liveString(key)?.value ?? 0) + 1;
    this.strings.set(key, { value: String(next), expiresAt: this.strings.get(key)?.expiresAt ?? null });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.strings.get(key);
    if (!entry) return 0;
    entry.expiresAt = this.currentTime + seconds * 1000;
    return 1;
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.liveString(key)) {
        this.strings.delete(key);
        deleted += 1;
      }
    }
    return deleted;
  }

  async eval(script: string, _numKeys: number, ...args: unknown[]): Promise<unknown> {
    this.evalCalls += 1;
    if (this.options.failEval) throw new Error("shared store unavailable");
    if (script.includes("ZREMRANGEBYSCORE") && script.includes("ZCARD")) return this.evalSlidingWindow(args);
    if (script.includes("current == ARGV[1]")) return this.evalCompareDelete(args);
    throw new Error("unsupported Lua script");
  }

  private evalSlidingWindow(args: unknown[]): [number, number, number] {
    const key = String(args[0]);
    const now = Number(args[1]);
    const windowMs = Number(args[2]);
    const limit = Number(args[3]);
    const member = String(args[4]);
    const entries = this.sortedSets.get(key) ?? new Map<string, number>();

    for (const [entry, score] of entries) {
      if (score <= now - windowMs) entries.delete(entry);
    }

    if (entries.size >= limit) {
      const oldest = entries.size ? Math.min(...entries.values()) : now;
      return [0, 0, oldest + windowMs];
    }

    entries.set(member, now);
    this.sortedSets.set(key, entries);
    return [1, Math.max(0, limit - entries.size), now + windowMs];
  }

  private evalCompareDelete(args: unknown[]): number {
    const key = String(args[0]);
    const token = String(args[1]);
    const entry = this.liveString(key);
    if (entry?.value === token) {
      this.strings.delete(key);
      return 1;
    }
    return 0;
  }
}

function throwingPrimary(calls: { count: number }): ListenerStore {
  const fail = async (): Promise<never> => {
    calls.count += 1;
    throw new Error("primary unavailable");
  };
  return {
    startSession: fail,
    heartbeatSession: fail,
    stopSession: fail,
    getLiveCounts: fail,
    getStationCount: fail,
    getActiveSession: fail,
    getAnalytics: fail,
  };
}

test.describe("Redis-backed infrastructure primitives", () => {
  test("rate limiter is atomic, expires, and falls back on Redis failure", async () => {
    const redis = new FakeRedis();
    const limiter = createRateLimiter({ client: redis.client(), now: () => redis.time });

    const concurrent = await Promise.all([
      limiter("contact:203.0.113.1", 2, 1_000),
      limiter("contact:203.0.113.1", 2, 1_000),
      limiter("contact:203.0.113.1", 2, 1_000),
    ]);
    expect(concurrent.filter((result) => result.allowed)).toHaveLength(2);
    expect(concurrent.filter((result) => !result.allowed)).toHaveLength(1);
    expect(redis.evalCalls).toBe(3);

    redis.advance(1_001);
    expect((await limiter("contact:203.0.113.1", 2, 1_000)).allowed).toBe(true);

    const failingRedis = new FakeRedis({ failEval: true });
    const fallbackLimiter = createRateLimiter({
      client: failingRedis.client(),
      now: () => failingRedis.time,
      memoryStore: { timestamps: new Map() },
    });
    expect((await fallbackLimiter("fallback", 1, 1_000)).allowed).toBe(true);
    expect((await fallbackLimiter("fallback", 1, 1_000)).allowed).toBe(false);
    failingRedis.advance(1_001);
    expect((await fallbackLimiter("fallback", 1, 1_000)).allowed).toBe(true);
  });

  test("contact dedupe reserves atomically, releases only its own token, and expires", async () => {
    const redis = new FakeRedis();
    const store = createRedisContactDedupeStore(1_000, redis.client());
    const now = redis.time;

    const [first, second] = await Promise.all([
      store.reserve("content-hash", now, "token-a"),
      store.reserve("content-hash", now, "token-b"),
    ]);
    expect([first, second].filter((value) => value === true)).toHaveLength(1);

    expect(await store.has("content-hash", now)).toBe(true);
    await store.release("content-hash", now, "wrong-token");
    expect(await store.has("content-hash", now)).toBe(true);

    const winner = first ? "token-a" : "token-b";
    await store.release("content-hash", now, winner);
    expect(await store.has("content-hash", now)).toBe(false);

    expect(await store.reserve("content-hash", now, "token-c")).toBe(true);
    redis.advance(1_001);
    expect(await store.has("content-hash", redis.time)).toBe(false);
    expect(await store.reserve("content-hash", redis.time, "token-d")).toBe(true);
  });

  test("public SEO cache uses TTLs and generation invalidation", async () => {
    resetSeoCacheForTests();
    const redis = new FakeRedis();
    const options = { client: redis.client(), now: () => redis.time };
    let loads = 0;
    const loader = async () => {
      loads += 1;
      return { load: loads };
    };

    const first = await getCachedSeoData("directories", ["countries"], 1_000, loader, options);
    const cached = await getCachedSeoData("directories", ["countries"], 1_000, loader, options);
    expect(cached).toEqual(first);
    expect(loads).toBe(1);

    await bumpSeoGeneration(options);
    const invalidated = await getCachedSeoData("directories", ["countries"], 1_000, loader, options);
    expect(invalidated).toEqual({ load: 2 });
    expect(loads).toBe(2);

    redis.advance(1_001);
    await getCachedSeoData("directories", ["countries"], 1_000, loader, options);
    expect(loads).toBe(3);
    resetSeoCacheForTests();
  });

  test("listener store falls back locally and retries the shared store after cooldown", async () => {
    let clock = 1_700_000_000_000;
    const primaryCalls = { count: 0 };
    let fallbackEvents = 0;
    const store = new ResilientListenerStore(throwingPrimary(primaryCalls), new MemoryListenerStore(), {
      cooldownMs: 1_000,
      now: () => clock,
      onFallback: () => {
        fallbackEvents += 1;
      },
    });

    const started = await store.startSession({
      sessionId: "resilient-session-00000000000000000001",
      stationId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      now: clock,
      ttlMs: 10_000,
    });
    expect(started.stationListeners).toBe(1);
    expect(primaryCalls.count).toBe(1);
    expect(fallbackEvents).toBe(1);

    clock += 100;
    await store.getLiveCounts(clock);
    expect(primaryCalls.count).toBe(1);

    clock += 1_100;
    await store.getLiveCounts(clock);
    expect(primaryCalls.count).toBe(2);
  });
});
