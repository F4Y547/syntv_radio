import type { ListenerCounts, ListenerSession, ListenerStore, StationListenerCount } from "./types";

interface ResilientListenerStoreOptions {
  cooldownMs?: number;
  now?: () => number;
  onFallback?: () => void;
}

/**
 * Uses Redis listener state when available and degrades to a local store during
 * outages. The fallback is temporary: primary operations are retried after the
 * cooldown window so multi-instance counts recover automatically.
 */
export class ResilientListenerStore implements ListenerStore {
  private fallbackUntil = 0;
  private warned = false;

  constructor(
    private readonly primary: ListenerStore,
    private readonly fallback: ListenerStore,
    private readonly options: ResilientListenerStoreOptions = {},
  ) {}

  private now(): number {
    return this.options.now?.() ?? Date.now();
  }

  private useFallback(): void {
    if (!this.warned) {
      this.warned = true;
      console.warn("[listeners] shared store unavailable; using local listener fallback");
    }
    this.fallbackUntil = this.now() + (this.options.cooldownMs ?? 15_000);
    this.options.onFallback?.();
  }

  private async run<T>(operation: (store: ListenerStore) => Promise<T>): Promise<T> {
    if (this.now() < this.fallbackUntil) return operation(this.fallback);

    try {
      const result = await operation(this.primary);
      this.fallbackUntil = 0;
      return result;
    } catch {
      this.useFallback();
      return operation(this.fallback);
    }
  }

  startSession(input: { sessionId: string; stationId: string; now: number; ttlMs: number }) {
    return this.run((store) => store.startSession(input));
  }

  heartbeatSession(input: { sessionId: string; stationId: string; now: number; ttlMs: number }) {
    return this.run((store) => store.heartbeatSession(input));
  }

  stopSession(input: { sessionId: string; now: number; reason?: string }) {
    return this.run((store) => store.stopSession(input));
  }

  getLiveCounts(now: number): Promise<ListenerCounts> {
    return this.run((store) => store.getLiveCounts(now));
  }

  getStationCount(stationId: string, now: number): Promise<StationListenerCount> {
    return this.run((store) => store.getStationCount(stationId, now));
  }

  getActiveSession(sessionId: string, now: number): Promise<ListenerSession | null> {
    return this.run((store) => store.getActiveSession(sessionId, now));
  }

  getAnalytics(now: number) {
    return this.run((store) => store.getAnalytics(now));
  }

  async close(): Promise<void> {
    await Promise.allSettled([this.primary.close?.(), this.fallback.close?.()]);
  }
}
