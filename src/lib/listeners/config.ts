function readInt(name: string, fallback: number, min: number, max: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export const listenerConfig = {
  get sessionTtlSeconds() {
    return readInt("LISTENER_SESSION_TTL", 90, 30, 300);
  },
  get heartbeatIntervalSeconds() {
    return readInt("LISTENER_HEARTBEAT_INTERVAL", 25, 10, 60);
  },
  get updateIntervalSeconds() {
    return readInt("LISTENER_UPDATE_INTERVAL", 5, 2, 30);
  },
  get redisUrl() {
    return process.env.REDIS_URL?.trim() || "";
  },
  get adminToken() {
    return process.env.LISTENER_ADMIN_TOKEN?.trim() || "";
  },
};

export function getListenerConfigPublic() {
  return {
    sessionTtlSeconds: listenerConfig.sessionTtlSeconds,
    heartbeatIntervalSeconds: listenerConfig.heartbeatIntervalSeconds,
    updateIntervalSeconds: listenerConfig.updateIntervalSeconds,
  };
}
