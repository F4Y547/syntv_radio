"use client";

type PlaybackEvent = "start" | "heartbeat" | "stop";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 32);
  }
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function getSessionId(): string {
  const key = "syntv-radio:listener-session-id";
  try {
    const existing = sessionStorage.getItem(key);
    if (existing && /^[A-Za-z0-9_-]{16,128}$/.test(existing)) return existing;
    const created = randomId();
    sessionStorage.setItem(key, created);
    return created;
  } catch {
    return randomId();
  }
}

async function postEvent(event: PlaybackEvent, sessionId: string, stationId?: string, reason?: string) {
  const url = `/api/listeners/${event}`;
  const body = JSON.stringify({ sessionId, stationId, reason });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
      keepalive: event === "stop",
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function sendStopBeacon(sessionId: string, reason?: string) {
  const body = JSON.stringify({ sessionId, reason });
  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/listeners/stop", blob);
      return;
    }
  } catch {
    // fallback below
  }
  void postEvent("stop", sessionId, undefined, reason);
}

class PlaybackTracker {
  private sessionId: string;
  private activeStationId: string | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatMs = 25_000;
  private started = false;
  private disposed = false;
  private inflightStart: Promise<void> | null = null;

  constructor() {
    this.sessionId = typeof window !== "undefined" ? getSessionId() : randomId();
    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", this.handlePageHide);
      window.addEventListener("beforeunload", this.handlePageHide);
      document.addEventListener("visibilitychange", this.handleVisibility);
    }
  }

  setHeartbeatInterval(seconds: number) {
    if (Number.isFinite(seconds) && seconds >= 10) {
      this.heartbeatMs = seconds * 1000;
      if (this.heartbeatTimer && this.activeStationId) {
        this.stopHeartbeatLoop();
        this.startHeartbeatLoop();
      }
    }
  }

  private handlePageHide = () => {
    if (this.activeStationId) {
      sendStopBeacon(this.sessionId, "stop");
      this.activeStationId = null;
      this.started = false;
      this.stopHeartbeatLoop();
    }
  };

  private handleVisibility = () => {
    // When tab becomes visible, send a heartbeat soon if active - handled by normal loop.
    // If hidden, we keep heartbeat; expiry/stop handles real stops.
  };

  private startHeartbeatLoop() {
    this.stopHeartbeatLoop();
    this.heartbeatTimer = setInterval(() => {
      void this.heartbeat();
    }, this.heartbeatMs);
  }

  private stopHeartbeatLoop() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  async start(stationId: string) {
    if (this.disposed) return;
    if (this.activeStationId === stationId && this.started) return;
    if (this.inflightStart) await this.inflightStart;

    const run = async () => {
      if (this.activeStationId && this.activeStationId !== stationId) {
        await postEvent("stop", this.sessionId, this.activeStationId);
      }
      const result = await postEvent("start", this.sessionId, stationId);
      if (result?.success) {
        this.activeStationId = stationId;
        this.started = true;
        this.startHeartbeatLoop();
      }
    };

    this.inflightStart = run().finally(() => { this.inflightStart = null; });
    await this.inflightStart;
  }

  async heartbeat() {
    if (this.disposed || !this.activeStationId || !this.started) return;
    const stationId = this.activeStationId;
    const result = await postEvent("heartbeat", this.sessionId, stationId);
    if (result && result.active === false) {
      // Session expired on server - re-register if still actively playing.
      if (this.activeStationId === stationId && this.started) {
        await postEvent("start", this.sessionId, stationId);
      }
    }
  }

  async stop(reason?: string) {
    if (!this.activeStationId) return;
    const stationId = this.activeStationId;
    this.activeStationId = null;
    this.started = false;
    this.stopHeartbeatLoop();
    await postEvent("stop", this.sessionId, stationId, reason);
  }

  getActiveStationId() {
    return this.activeStationId;
  }

  dispose() {
    this.disposed = true;
    this.stopHeartbeatLoop();
    if (typeof window !== "undefined") {
      window.removeEventListener("pagehide", this.handlePageHide);
      window.removeEventListener("beforeunload", this.handlePageHide);
      document.removeEventListener("visibilitychange", this.handleVisibility);
    }
  }
}

let tracker: PlaybackTracker | null = null;

export function getPlaybackTracker(): PlaybackTracker {
  if (!tracker) tracker = new PlaybackTracker();
  return tracker;
}
