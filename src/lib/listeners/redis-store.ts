import Redis from "ioredis";
import { LISTENER_SCOPE, type ListenerAnalytics, type ListenerAnalyticsSnapshot, type ListenerCounts, type ListenerSession, type ListenerStore, type StationListenerCount } from "./types";

const KEY_PREFIX = "syntv:listener";

const START_SCRIPT = `
local sessionKey = KEYS[1]
local stationKey = KEYS[2]
local globalKey = KEYS[3]
local stationsKey = KEYS[4]
local oldStationKey = KEYS[5]
local sessionId = ARGV[1]
local stationId = ARGV[2]
local now = tonumber(ARGV[3])
local ttlMs = tonumber(ARGV[4])
local expiresAt = now + ttlMs
local old = redis.call('GET', sessionKey)
if old then
  local ok, prev = pcall(cjson.decode, old)
  if ok and prev and prev.stationId and prev.stationId ~= stationId then
    redis.call('ZREM', '${KEY_PREFIX}:station:' .. prev.stationId, sessionId)
  end
end
if oldStationKey and oldStationKey ~= '' and oldStationKey ~= stationKey then
  redis.call('ZREM', oldStationKey, sessionId)
end
local startedAt = now
local isNew = 1
if old then
  local ok, prev = pcall(cjson.decode, old)
  if ok and prev and prev.startedAt then startedAt = prev.startedAt; isNew = 0 end
end
local payload = cjson.encode({sessionId=sessionId,stationId=stationId,startedAt=startedAt,lastHeartbeatAt=now,expiresAt=expiresAt})
redis.call('SET', sessionKey, payload, 'PX', ttlMs)
redis.call('ZADD', stationKey, expiresAt, sessionId)
redis.call('ZADD', globalKey, expiresAt, sessionId)
redis.call('SADD', stationsKey, stationId)
redis.call('PEXPIRE', stationKey, ttlMs + 60000)
redis.call('PEXPIRE', globalKey, ttlMs + 60000)
redis.call('ZREMRANGEBYSCORE', stationKey, '-inf', now)
redis.call('ZREMRANGEBYSCORE', globalKey, '-inf', now)
local stationCount = redis.call('ZCARD', stationKey)
local total = redis.call('ZCARD', globalKey)
return {total, stationCount, isNew}
`;

const HEARTBEAT_SCRIPT = `
local sessionKey = KEYS[1]
local stationKey = KEYS[2]
local globalKey = KEYS[3]
local stationsKey = KEYS[4]
local sessionId = ARGV[1]
local stationId = ARGV[2]
local now = tonumber(ARGV[3])
local ttlMs = tonumber(ARGV[4])
local expiresAt = now + ttlMs
local old = redis.call('GET', sessionKey)
if not old then
  redis.call('ZREMRANGEBYSCORE', stationKey, '-inf', now)
  redis.call('ZREMRANGEBYSCORE', globalKey, '-inf', now)
  return {0, redis.call('ZCARD', globalKey), redis.call('ZCARD', stationKey)}
end
local ok, prev = pcall(cjson.decode, old)
if not ok or not prev then
  redis.call('DEL', sessionKey)
  return {0, redis.call('ZCARD', globalKey), redis.call('ZCARD', stationKey)}
end
if prev.stationId and prev.stationId ~= stationId then
  redis.call('ZREM', '${KEY_PREFIX}:station:' .. prev.stationId, sessionId)
end
prev.stationId = stationId
prev.lastHeartbeatAt = now
prev.expiresAt = expiresAt
redis.call('SET', sessionKey, cjson.encode(prev), 'PX', ttlMs)
redis.call('ZADD', stationKey, expiresAt, sessionId)
redis.call('ZADD', globalKey, expiresAt, sessionId)
redis.call('SADD', stationsKey, stationId)
redis.call('PEXPIRE', stationKey, ttlMs + 60000)
redis.call('PEXPIRE', globalKey, ttlMs + 60000)
redis.call('ZREMRANGEBYSCORE', stationKey, '-inf', now)
redis.call('ZREMRANGEBYSCORE', globalKey, '-inf', now)
return {1, redis.call('ZCARD', globalKey), redis.call('ZCARD', stationKey)}
`;

const STOP_SCRIPT = `
local sessionKey = KEYS[1]
local globalKey = KEYS[2]
local sessionId = ARGV[1]
local now = tonumber(ARGV[2])
local old = redis.call('GET', sessionKey)
local stationId = ''
local startedAt = 0
if old then
  local ok, prev = pcall(cjson.decode, old)
  if ok and prev and prev.stationId then stationId = prev.stationId end
  if ok and prev and prev.startedAt then startedAt = prev.startedAt end
end
redis.call('DEL', sessionKey)
redis.call('ZREM', globalKey, sessionId)
if stationId ~= '' then
  redis.call('ZREM', '${KEY_PREFIX}:station:' .. stationId, sessionId)
  redis.call('ZREMRANGEBYSCORE', '${KEY_PREFIX}:station:' .. stationId, '-inf', now)
end
redis.call('ZREMRANGEBYSCORE', globalKey, '-inf', now)
local stationCount = 0
if stationId ~= '' then stationCount = redis.call('ZCARD', '${KEY_PREFIX}:station:' .. stationId) end
local total = redis.call('ZCARD', globalKey)
return {total, stationCount, stationId, startedAt}
`;

type RedisClient = Redis;

function getRedis(url: string): RedisClient {
  const g = globalThis as typeof globalThis & { __syntvRedis?: RedisClient; __syntvRedisUrl?: string };
  if (g.__syntvRedis && g.__syntvRedisUrl === url) return g.__syntvRedis;
  if (g.__syntvRedis) {
    void g.__syntvRedis.quit().catch(() => undefined);
  }
  g.__syntvRedis = new Redis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: false,
    connectTimeout: 5000,
  });
  g.__syntvRedis.on("error", (err) => {
    console.error("[listeners][redis]", err.message);
  });
  g.__syntvRedisUrl = url;
  return g.__syntvRedis;
}

function dayKey(now: number) {
  return new Date(now).toISOString().slice(0, 10);
}

export class RedisListenerStore implements ListenerStore {
  private redis: RedisClient;

  constructor(redisUrl: string) {
    this.redis = getRedis(redisUrl);
  }

  private sessionKey(sessionId: string) { return `${KEY_PREFIX}:session:${sessionId}`; }
  private stationKey(stationId: string) { return `${KEY_PREFIX}:station:${stationId}`; }
  private globalKey() { return `${KEY_PREFIX}:global`; }
  private stationsKey() { return `${KEY_PREFIX}:stations`; }
  private analyticsKey() { return `${KEY_PREFIX}:analytics`; }
  private dailyKey(date: string) { return `${KEY_PREFIX}:analytics:daily:${date}`; }
  private snapshotsKey() { return `${KEY_PREFIX}:analytics:snapshots`; }

  private async recordAnalytics(now: number, totalListeners: number, stationCounts: Record<string, number>, event?: { type: "start" | "stop" | "error"; durationSec?: number }) {
    const date = dayKey(now);
    const dailyKey = this.dailyKey(date);
    const pipe = this.redis.pipeline();
    pipe.hsetnx(this.analyticsKey(), "peakConcurrent", "0");
    pipe.hsetnx(this.analyticsKey(), "peakConcurrentAt", "");
    pipe.hsetnx(this.analyticsKey(), "totalSessionStarts", "0");
    pipe.hsetnx(this.analyticsKey(), "totalSessionStops", "0");
    pipe.hsetnx(this.analyticsKey(), "totalErrors", "0");
    pipe.hsetnx(this.analyticsKey(), "totalListeningSeconds", "0");
    pipe.hsetnx(this.analyticsKey(), "completedSessions", "0");
    pipe.hsetnx(dailyKey, "peakConcurrent", "0");
    pipe.hsetnx(dailyKey, "sessionStarts", "0");
    pipe.hsetnx(dailyKey, "totalListeningSeconds", "0");
    if (event?.type === "start") {
      pipe.hincrby(this.analyticsKey(), "totalSessionStarts", 1);
      pipe.hincrby(dailyKey, "sessionStarts", 1);
    }
    if (event?.type === "stop" || event?.type === "error") {
      pipe.hincrby(this.analyticsKey(), "totalSessionStops", 1);
      pipe.hincrby(this.analyticsKey(), "completedSessions", 1);
      pipe.hincrby(this.analyticsKey(), "totalListeningSeconds", Math.max(0, Math.round(event.durationSec ?? 0)));
      pipe.hincrby(dailyKey, "totalListeningSeconds", Math.max(0, Math.round(event.durationSec ?? 0)));
      if (event?.type === "error") pipe.hincrby(this.analyticsKey(), "totalErrors", 1);
    }
    // peak update (read-modify-write is acceptable for analytics)
    pipe.hget(this.analyticsKey(), "peakConcurrent");
    pipe.hget(dailyKey, "peakConcurrent");
    const results = await pipe.exec();

    const peakIdx = results ? results.length - 2 : -1;
    const dailyPeakIdx = results ? results.length - 1 : -1;
    const currentPeak = Number(results?.[peakIdx]?.[1] ?? 0);
    const currentDailyPeak = Number(results?.[dailyPeakIdx]?.[1] ?? 0);
    const updates = this.redis.pipeline();
    if (totalListeners > currentPeak) {
      updates.hset(this.analyticsKey(), "peakConcurrent", String(totalListeners), "peakConcurrentAt", new Date(now).toISOString());
    }
    if (totalListeners > currentDailyPeak) {
      updates.hset(dailyKey, "peakConcurrent", String(totalListeners));
    }
    // snapshot every 60s (total only; full station counts available via getAnalytics)
    const lastSnap = await this.redis.get(`${KEY_PREFIX}:analytics:lastSnapshotAt`);
    const lastSnapAt = Number(lastSnap ?? 0);
    if (now - lastSnapAt >= 60_000) {
      const snap: ListenerAnalyticsSnapshot = { at: new Date(now).toISOString(), totalListeners, stationCounts: {} };
      updates.set(`${KEY_PREFIX}:analytics:lastSnapshotAt`, String(now), "PX", 86_400_000);
      updates.lpush(this.snapshotsKey(), JSON.stringify(snap));
      updates.ltrim(this.snapshotsKey(), 0, 1439);
    }
    updates.expire(dailyKey, 60 * 60 * 24 * 45);
    updates.sadd(`${KEY_PREFIX}:analytics:days`, date);
    await updates.exec();
  }

  async startSession(input: { sessionId: string; stationId: string; now: number; ttlMs: number }) {
    const { sessionId, stationId, now, ttlMs } = input;
    const result = (await this.redis.eval(
      START_SCRIPT,
      5,
      this.sessionKey(sessionId),
      this.stationKey(stationId),
      this.globalKey(),
      this.stationsKey(),
      "",
      sessionId,
      stationId,
      String(now),
      String(ttlMs),
    )) as [number, number, number];
    const totalListeners = Number(result[0] ?? 0);
    const stationListeners = Number(result[1] ?? 0);
    const isNew = Number(result[2] ?? 0) === 1;
    await this.recordAnalytics(now, totalListeners, { [stationId]: stationListeners }, isNew ? { type: "start" } : undefined);
    return { totalListeners, stationListeners };
  }

  async heartbeatSession(input: { sessionId: string; stationId: string; now: number; ttlMs: number }) {
    const { sessionId, stationId, now, ttlMs } = input;
    const result = (await this.redis.eval(
      HEARTBEAT_SCRIPT,
      4,
      this.sessionKey(sessionId),
      this.stationKey(stationId),
      this.globalKey(),
      this.stationsKey(),
      sessionId,
      stationId,
      String(now),
      String(ttlMs),
    )) as [number, number, number];
    const active = Number(result[0]) === 1;
    const totalListeners = Number(result[1] ?? 0);
    const stationListeners = Number(result[2] ?? 0);
    await this.recordAnalytics(now, totalListeners, { [stationId]: stationListeners });
    return { active, totalListeners, stationListeners };
  }

  async stopSession(input: { sessionId: string; now: number; reason?: string }) {
    const { sessionId, now } = input;
    const result = (await this.redis.eval(
      STOP_SCRIPT,
      2,
      this.sessionKey(sessionId),
      this.globalKey(),
      sessionId,
      String(now),
    )) as [number, number, string, number];
    const stationId = result[2] ? String(result[2]) : null;
    const startedAt = Number(result[3] ?? 0);
    const totalListeners = Number(result[0] ?? 0);
    const stationListeners = Number(result[1] ?? 0);
    if (stationId && startedAt > 0) {
      const durationSec = Math.max(0, Math.round((now - startedAt) / 1000));
      await this.recordAnalytics(now, totalListeners, stationId ? { [stationId]: stationListeners } : {}, { type: input.reason === "error" ? "error" : "stop", durationSec });
    } else {
      await this.recordAnalytics(now, totalListeners, stationId ? { [stationId]: stationListeners } : {}, input.reason === "error" ? { type: "error" } : undefined);
    }
    return { totalListeners, stationListeners, stationId };
  }

  async getLiveCounts(now: number): Promise<ListenerCounts> {
    await this.redis.zremrangebyscore(this.globalKey(), "-inf", now);
    const totalListeners = await this.redis.zcard(this.globalKey());
    const stationIds = await this.redis.smembers(this.stationsKey());
    const stationCounts: Record<string, number> = {};
    if (stationIds.length > 0) {
      const pipeline = this.redis.pipeline();
      for (const id of stationIds) {
        pipeline.zremrangebyscore(this.stationKey(id), "-inf", now);
        pipeline.zcard(this.stationKey(id));
      }
      const results = await pipeline.exec();
      const cleanup = this.redis.pipeline();
      let hasCleanup = false;
      for (let i = 0; i < stationIds.length; i += 1) {
        const count = Number(results?.[i * 2 + 1]?.[1] ?? 0);
        if (count > 0) stationCounts[stationIds[i]] = count;
        else { cleanup.srem(this.stationsKey(), stationIds[i]); hasCleanup = true; }
      }
      if (hasCleanup) await cleanup.exec();
    }
    return { scope: LISTENER_SCOPE, totalListeners, stationCounts, updatedAt: new Date(now).toISOString() };
  }

  async getStationCount(stationId: string, now: number): Promise<StationListenerCount> {
    await this.redis.zremrangebyscore(this.stationKey(stationId), "-inf", now);
    const listeners = await this.redis.zcard(this.stationKey(stationId));
    return { stationId, listeners, updatedAt: new Date(now).toISOString() };
  }

  async getActiveSession(sessionId: string, now: number): Promise<ListenerSession | null> {
    const raw = await this.redis.get(this.sessionKey(sessionId));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as ListenerSession;
      if (!parsed || parsed.expiresAt <= now) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  async getAnalytics(now: number): Promise<ListenerAnalytics> {
    const live = await this.getLiveCounts(now);
    const [analyticsHash, days, snapshotsRaw] = await Promise.all([
      this.redis.hgetall(this.analyticsKey()),
      this.redis.smembers(`${KEY_PREFIX}:analytics:days`),
      this.redis.lrange(this.snapshotsKey(), 0, 119),
    ]);
    const topStations = Object.entries(live.stationCounts)
      .map(([stationId, listeners]) => ({ stationId, listeners }))
      .sort((a, b) => b.listeners - a.listeners)
      .slice(0, 10);

    const dayKeys = days.sort().slice(-30);
    const dailyPipeline = this.redis.pipeline();
    for (const d of dayKeys) dailyPipeline.hgetall(this.dailyKey(d));
    const dailyResults = dayKeys.length ? await dailyPipeline.exec() : [];
    const dailyTrends = dayKeys.map((date, i) => {
      const h = (dailyResults?.[i]?.[1] ?? {}) as Record<string, string>;
      return {
        date,
        peakConcurrent: Number(h.peakConcurrent ?? 0),
        sessionStarts: Number(h.sessionStarts ?? 0),
        totalListeningSeconds: Number(h.totalListeningSeconds ?? 0),
      };
    });

    const completedSessions = Number(analyticsHash.completedSessions ?? 0);
    const totalListeningSeconds = Number(analyticsHash.totalListeningSeconds ?? 0);
    const recentSnapshots: ListenerAnalyticsSnapshot[] = snapshotsRaw
      .map((s) => { try { return JSON.parse(s) as ListenerAnalyticsSnapshot; } catch { return null; } })
      .filter((s): s is ListenerAnalyticsSnapshot => Boolean(s))
      .reverse();

    return {
      scope: LISTENER_SCOPE,
      generatedAt: new Date(now).toISOString(),
      activeNow: live.totalListeners,
      peakConcurrent: Math.max(Number(analyticsHash.peakConcurrent ?? 0), live.totalListeners),
      peakConcurrentAt: analyticsHash.peakConcurrentAt || null,
      stationCounts: live.stationCounts,
      topStations,
      dailyTrends,
      averageListeningSeconds: completedSessions > 0 ? Math.round(totalListeningSeconds / completedSessions) : 0,
      totalSessionStarts: Number(analyticsHash.totalSessionStarts ?? 0),
      totalSessionStops: Number(analyticsHash.totalSessionStops ?? 0),
      totalErrors: Number(analyticsHash.totalErrors ?? 0),
      recentSnapshots,
    };
  }

  async close() {
    await this.redis.quit();
  }
}
