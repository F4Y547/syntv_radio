import { listenerConfig } from "./config";
import { MemoryListenerStore } from "./memory-store";
import { RedisListenerStore } from "./redis-store";
import { ResilientListenerStore } from "./resilient-store";
import type { ListenerStore } from "./types";

let warnedMemory = false;

function createStore(): ListenerStore {
  const redisUrl = listenerConfig.redisUrl;
  if (redisUrl) {
    try {
      return new ResilientListenerStore(new RedisListenerStore(), new MemoryListenerStore());
    } catch {
      // Do not expose connection details; the local store keeps the site usable.
      console.warn("[listeners] shared store unavailable; using local listener fallback");
    }
  }
  if (!warnedMemory && process.env.NODE_ENV === "production") {
    warnedMemory = true;
    console.warn(
      "[listeners] REDIS_URL is not configured. Using in-memory listener store. " +
        "This is not suitable for multi-instance production deployments.",
    );
  }
  return new MemoryListenerStore();
}

export function getListenerStore(): ListenerStore {
  const g = globalThis as typeof globalThis & { __syntvListenerStore?: ListenerStore; __syntvListenerStoreKey?: string };
  const key = listenerConfig.redisUrl || "memory";
  if (g.__syntvListenerStore && g.__syntvListenerStoreKey === key) return g.__syntvListenerStore;
  g.__syntvListenerStore = createStore();
  g.__syntvListenerStoreKey = key;
  return g.__syntvListenerStore;
}

export * from "./types";
export * from "./config";
export * from "./validation";
export * from "./rate-limit";
