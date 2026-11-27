export const CONTACT_DEDUPE_WINDOW_MS = 10 * 60_000;

export interface ContactDedupeStore {
  has(key: string, now: number): boolean;
  add(key: string, now: number): void;
}

function getGlobalStore(): Map<string, number> {
  const g = globalThis as typeof globalThis & { __syntvContactDedupe?: Map<string, number> };
  if (!g.__syntvContactDedupe) g.__syntvContactDedupe = new Map();
  return g.__syntvContactDedupe;
}

/** In-memory duplicate protection. Keys are content hashes, never message text. */
export function createContactDedupeStore(windowMs = CONTACT_DEDUPE_WINDOW_MS): ContactDedupeStore {
  const store = getGlobalStore();

  const prune = (now: number) => {
    for (const [key, expiresAt] of store) {
      if (expiresAt <= now) store.delete(key);
    }
  };

  return {
    has(key, now) {
      const expiresAt = store.get(key);
      return typeof expiresAt === "number" && expiresAt > now;
    },
    add(key, now) {
      prune(now);
      store.set(key, now + windowMs);
    },
  };
}

export function createTestDedupeStore(windowMs = CONTACT_DEDUPE_WINDOW_MS): ContactDedupeStore {
  const store = new Map<string, number>();
  return {
    has(key, now) {
      const expiresAt = store.get(key);
      return typeof expiresAt === "number" && expiresAt > now;
    },
    add(key, now) {
      for (const [existingKey, expiresAt] of store) {
        if (expiresAt <= now) store.delete(existingKey);
      }
      store.set(key, now + windowMs);
    },
  };
}
