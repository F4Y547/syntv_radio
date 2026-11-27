import { LISTENER_SCOPE, type ListenerAnalytics, type ListenerAnalyticsSnapshot, type ListenerCounts, type ListenerSession, type ListenerStore, type StationListenerCount } from "./types";

interface MemorySession {
  sessionId: string;
  stationId: string;
  startedAt: number;
  lastHeartbeatAt: number;
  expiresAt: number;
}

interface DailyStats {
  date: string;
  peakConcurrent: number;
  sessionStarts: number;
  totalListeningSeconds: number;
}

interface MemoryState {
  sessions: Map<string, MemorySession>;
  cleanupTimer: ReturnType<typeof setInterval> | null;
  peakConcurrent: number;
  peakConcurrentAt: string | null;
  totalSessionStarts: number;
  totalSessionStops: number;
  totalErrors: number;
  totalListeningSeconds: number;
  completedSessions: number;
  daily: Map<string, DailyStats>;
  snapshots: ListenerAnalyticsSnapshot[];
  lastSnapshotAt: number;
}

function dayKey(now: number) {
  return new Date(now).toISOString().slice(0, 10);
}

function getState(): MemoryState {
  const g = globalThis as typeof globalThis & { __syntvListenerMemory?: MemoryState };
  if (!g.__syntvListenerMemory) {
    g.__syntvListenerMemory = {
      sessions: new Map(),
      cleanupTimer: null,
      peakConcurrent: 0,
      peakConcurrentAt: null,
      totalSessionStarts: 0,
      totalSessionStops: 0,
      totalErrors: 0,
      totalListeningSeconds: 0,
      completedSessions: 0,
      daily: new Map(),
      snapshots: [],
      lastSnapshotAt: 0,
    };
  }
  return g.__syntvListenerMemory;
}

function ensureDaily(state: MemoryState, now: number) {
  const key = dayKey(now);
  let d = state.daily.get(key);
  if (!d) {
    d = { date: key, peakConcurrent: 0, sessionStarts: 0, totalListeningSeconds: 0 };
    state.daily.set(key, d);
  }
  return d;
}

function pruneExpired(state: MemoryState, now: number) {
  for (const [id, session] of state.sessions) {
    if (session.expiresAt <= now) {
      // expired - count as stop with duration until last heartbeat/expires
      const durationSec = Math.max(0, Math.round((Math.min(session.expiresAt, now) - session.startedAt) / 1000));
      state.totalSessionStops += 1;
      state.totalListeningSeconds += durationSec;
      state.completedSessions += 1;
      ensureDaily(state, session.startedAt).totalListeningSeconds += durationSec;
      state.sessions.delete(id);
    }
  }
}

function ensureCleanup(state: MemoryState) {
  if (state.cleanupTimer) return;
  state.cleanupTimer = setInterval(() => {
    const now = Date.now();
    pruneExpired(state, now);
    recordSnapshot(state, now);
  }, 30_000);
  if (typeof state.cleanupTimer === "object" && "unref" in state.cleanupTimer) {
    (state.cleanupTimer as NodeJS.Timeout).unref();
  }
}

function countActive(state: MemoryState, now: number): { total: number; byStation: Record<string, number> } {
  pruneExpired(state, now);
  const byStation: Record<string, number> = {};
  for (const session of state.sessions.values()) {
    if (session.expiresAt <= now) continue;
    byStation[session.stationId] = (byStation[session.stationId] ?? 0) + 1;
  }
  const total = Object.values(byStation).reduce((a, b) => a + b, 0);
  if (total > state.peakConcurrent) {
    state.peakConcurrent = total;
    state.peakConcurrentAt = new Date(now).toISOString();
  }
  const daily = ensureDaily(state, now);
  if (total > daily.peakConcurrent) daily.peakConcurrent = total;
  recordSnapshot(state, now);
  return { total, byStation };
}

function recordSnapshot(state: MemoryState, now: number) {
  if (now - state.lastSnapshotAt < 60_000) return;
  state.lastSnapshotAt = now;
  const byStation: Record<string, number> = {};
  for (const session of state.sessions.values()) {
    if (session.expiresAt <= now) continue;
    byStation[session.stationId] = (byStation[session.stationId] ?? 0) + 1;
  }
  const total = Object.values(byStation).reduce((a, b) => a + b, 0);
  state.snapshots.push({ at: new Date(now).toISOString(), totalListeners: total, stationCounts: byStation });
  if (state.snapshots.length > 1440) state.snapshots = state.snapshots.slice(-1440);
}

export class MemoryListenerStore implements ListenerStore {
  async startSession(input: { sessionId: string; stationId: string; now: number; ttlMs: number }) {
    const state = getState();
    ensureCleanup(state);
    pruneExpired(state, input.now);
    const existing = state.sessions.get(input.sessionId);
    if (!existing) {
      state.totalSessionStarts += 1;
      ensureDaily(state, input.now).sessionStarts += 1;
    } else if (existing.stationId !== input.stationId) {
      // switching stations counts as continuity of session; no new start
    }
    const session: MemorySession = {
      sessionId: input.sessionId,
      stationId: input.stationId,
      startedAt: existing?.startedAt ?? input.now,
      lastHeartbeatAt: input.now,
      expiresAt: input.now + input.ttlMs,
    };
    state.sessions.set(input.sessionId, session);
    const counts = countActive(state, input.now);
    return { totalListeners: counts.total, stationListeners: counts.byStation[input.stationId] ?? 0 };
  }

  async heartbeatSession(input: { sessionId: string; stationId: string; now: number; ttlMs: number }) {
    const state = getState();
    ensureCleanup(state);
    pruneExpired(state, input.now);
    const existing = state.sessions.get(input.sessionId);
    if (!existing || existing.expiresAt <= input.now) {
      const counts = countActive(state, input.now);
      return { totalListeners: counts.total, stationListeners: counts.byStation[input.stationId] ?? 0, active: false };
    }
    existing.stationId = input.stationId;
    existing.lastHeartbeatAt = input.now;
    existing.expiresAt = input.now + input.ttlMs;
    state.sessions.set(input.sessionId, existing);
    const counts = countActive(state, input.now);
    return { totalListeners: counts.total, stationListeners: counts.byStation[input.stationId] ?? 0, active: true };
  }

  async stopSession(input: { sessionId: string; now: number; reason?: string }) {
    const state = getState();
    pruneExpired(state, input.now);
    const existing = state.sessions.get(input.sessionId);
    const stationId = existing?.stationId ?? null;
    if (existing) {
      const durationSec = Math.max(0, Math.round((Math.min(input.now, existing.expiresAt) - existing.startedAt) / 1000));
      state.totalSessionStops += 1;
      if (input.reason === "error") state.totalErrors += 1;
      state.totalListeningSeconds += durationSec;
      state.completedSessions += 1;
      ensureDaily(state, existing.startedAt).totalListeningSeconds += durationSec;
      state.sessions.delete(input.sessionId);
    }
    const counts = countActive(state, input.now);
    return {
      totalListeners: counts.total,
      stationListeners: stationId ? (counts.byStation[stationId] ?? 0) : 0,
      stationId,
    };
  }

  async getLiveCounts(now: number): Promise<ListenerCounts> {
    const state = getState();
    const counts = countActive(state, now);
    return {
      scope: LISTENER_SCOPE,
      totalListeners: counts.total,
      stationCounts: counts.byStation,
      updatedAt: new Date(now).toISOString(),
    };
  }

  async getStationCount(stationId: string, now: number): Promise<StationListenerCount> {
    const state = getState();
    const counts = countActive(state, now);
    return {
      stationId,
      listeners: counts.byStation[stationId] ?? 0,
      updatedAt: new Date(now).toISOString(),
    };
  }

  async getActiveSession(sessionId: string, now: number): Promise<ListenerSession | null> {
    const state = getState();
    pruneExpired(state, now);
    const session = state.sessions.get(sessionId);
    if (!session || session.expiresAt <= now) return null;
    return { ...session };
  }

  async getAnalytics(now: number): Promise<ListenerAnalytics> {
    const state = getState();
    const counts = countActive(state, now);
    const topStations = Object.entries(counts.byStation)
      .map(([stationId, listeners]) => ({ stationId, listeners }))
      .sort((a, b) => b.listeners - a.listeners)
      .slice(0, 10);
    const dailyTrends = Array.from(state.daily.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
    const averageListeningSeconds = state.completedSessions > 0
      ? Math.round(state.totalListeningSeconds / state.completedSessions)
      : 0;
    return {
      scope: LISTENER_SCOPE,
      generatedAt: new Date(now).toISOString(),
      activeNow: counts.total,
      peakConcurrent: state.peakConcurrent,
      peakConcurrentAt: state.peakConcurrentAt,
      stationCounts: counts.byStation,
      topStations,
      dailyTrends,
      averageListeningSeconds,
      totalSessionStarts: state.totalSessionStarts,
      totalSessionStops: state.totalSessionStops,
      totalErrors: state.totalErrors,
      recentSnapshots: state.snapshots.slice(-120),
    };
  }
}
