export const LISTENER_SCOPE = "syntv_radio" as const;

export interface ListenerSession {
  sessionId: string;
  stationId: string;
  startedAt: number;
  lastHeartbeatAt: number;
  expiresAt: number;
}

export interface ListenerCounts {
  scope: typeof LISTENER_SCOPE;
  totalListeners: number;
  stationCounts: Record<string, number>;
  updatedAt: string;
}

export interface StationListenerCount {
  stationId: string;
  listeners: number;
  updatedAt: string;
}

export interface ListenerStore {
  startSession(input: { sessionId: string; stationId: string; now: number; ttlMs: number }): Promise<{ totalListeners: number; stationListeners: number }>;
  heartbeatSession(input: { sessionId: string; stationId: string; now: number; ttlMs: number }): Promise<{ totalListeners: number; stationListeners: number; active: boolean }>;
  stopSession(input: { sessionId: string; now: number; reason?: string }): Promise<{ totalListeners: number; stationListeners: number; stationId: string | null }>;
  getLiveCounts(now: number): Promise<ListenerCounts>;
  getStationCount(stationId: string, now: number): Promise<StationListenerCount>;
  getActiveSession(sessionId: string, now: number): Promise<ListenerSession | null>;
  getAnalytics(now: number): Promise<ListenerAnalytics>;
  close?(): Promise<void>;
}

export interface ListenerEvent {
  type: "start" | "heartbeat" | "stop" | "expire" | "error";
  sessionId: string;
  stationId?: string | null;
  at: string;
  meta?: Record<string, unknown>;
}

export interface ListenerAnalyticsSnapshot {
  at: string;
  totalListeners: number;
  stationCounts: Record<string, number>;
}

export interface ListenerAnalytics {
  scope: typeof LISTENER_SCOPE;
  generatedAt: string;
  activeNow: number;
  peakConcurrent: number;
  peakConcurrentAt: string | null;
  stationCounts: Record<string, number>;
  topStations: Array<{ stationId: string; listeners: number }>;
  dailyTrends: Array<{ date: string; peakConcurrent: number; sessionStarts: number; totalListeningSeconds: number }>;
  averageListeningSeconds: number;
  totalSessionStarts: number;
  totalSessionStops: number;
  totalErrors: number;
  recentSnapshots: ListenerAnalyticsSnapshot[];
}
