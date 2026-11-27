import Redis from "ioredis";

export type RedisClient = Redis;

interface RedisGlobalState {
  client?: RedisClient;
  url?: string;
  cooldownUntil?: number;
  lastErrorLogAt?: number;
}

const COOLDOWN_MS = 15_000;
const ERROR_LOG_INTERVAL_MS = 60_000;

function state(): RedisGlobalState {
  const g = globalThis as typeof globalThis & { __syntvRedisShared?: RedisGlobalState };
  if (!g.__syntvRedisShared) g.__syntvRedisShared = {};
  return g.__syntvRedisShared;
}

export function getRedisUrl(): string {
  return process.env.REDIS_URL?.trim() || "";
}

/**
 * Returns one process-wide ioredis client for the configured REDIS_URL.
 * `rediss://` URLs enable TLS in ioredis; no credential value is ever logged.
 */
export function getSharedRedis(): RedisClient | null {
  const url = getRedisUrl();
  if (!url) return null;

  const s = state();
  if (s.client && s.url === url && s.client.status !== "end") return s.client;
  if (s.client) void s.client.quit().catch(() => undefined);

  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    enableReadyCheck: true,
    connectTimeout: 5_000,
    commandTimeout: 3_000,
    retryStrategy: (attempt) => Math.min(attempt * 250, 2_000),
  });

  client.on("error", () => {
    const now = Date.now();
    if (now - (s.lastErrorLogAt ?? 0) < ERROR_LOG_INTERVAL_MS) return;
    s.lastErrorLogAt = now;
    console.warn("[redis] connection unavailable; temporary state uses local fallback");
  });

  s.client = client;
  s.url = url;
  return client;
}

export function isRedisCoolingDown(now = Date.now()): boolean {
  return now < (state().cooldownUntil ?? 0);
}

export function markRedisUnavailable(now = Date.now()): void {
  state().cooldownUntil = now + COOLDOWN_MS;
}

export function markRedisAvailable(): void {
  state().cooldownUntil = 0;
}

function waitForReady(client: RedisClient, timeoutMs: number): Promise<boolean> {
  if (client.status === "ready") return Promise.resolve(true);
  if (client.status === "end") return Promise.resolve(false);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      client.off("ready", onReady);
      client.off("error", onError);
      client.off("end", onEnd);
      resolve(ok);
    };
    const onReady = () => finish(true);
    const onError = () => finish(false);
    const onEnd = () => finish(false);
    const timer = setTimeout(() => finish(client.status === "ready"), timeoutMs);

    client.once("ready", onReady);
    client.once("error", onError);
    client.once("end", onEnd);
  });
}

/**
 * Runs a Redis operation, falling back to local state on outage or timeout.
 * An explicit client override is used by tests and skips global cooldown state.
 */
export async function withRedis<T>(
  operation: (redis: RedisClient) => Promise<T>,
  fallback: () => T | Promise<T>,
  options: { client?: RedisClient | null; timeoutMs?: number } = {},
): Promise<T> {
  const tracked = options.client === undefined;
  const client = tracked ? (isRedisCoolingDown() ? null : getSharedRedis()) : options.client;
  if (!client) return fallback();

  try {
    if (tracked && !(await waitForReady(client, options.timeoutMs ?? 1_500))) {
      markRedisUnavailable();
      return fallback();
    }
    const result = await operation(client);
    if (tracked) markRedisAvailable();
    return result;
  } catch {
    if (tracked) markRedisUnavailable();
    return fallback();
  }
}
