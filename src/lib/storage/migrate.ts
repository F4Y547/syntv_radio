const LEGACY_PREFIX = "atlas-radio:";
const CURRENT_PREFIX = "syntv-radio:";

const KNOWN_KEYS = [
  "favorites",
  "recents",
  "volume",
  "collections",
  "listening-stats",
  "locale",
  "theme",
] as const;

let migrated = false;

export function ensureLocalStorageMigrated() {
  if (migrated) return;
  if (typeof window === "undefined") return;
  migrated = true;

  try {
    // Generic migration for any atlas-radio:* key.
    const legacyKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LEGACY_PREFIX)) legacyKeys.push(key);
    }
    for (const oldKey of legacyKeys) {
      const newKey = `${CURRENT_PREFIX}${oldKey.slice(LEGACY_PREFIX.length)}`;
      if (localStorage.getItem(newKey) === null) {
        const value = localStorage.getItem(oldKey);
        if (value !== null) localStorage.setItem(newKey, value);
      }
    }

    // Explicit known keys for safety.
    for (const suffix of KNOWN_KEYS) {
      const oldKey = `${LEGACY_PREFIX}${suffix}`;
      const newKey = `${CURRENT_PREFIX}${suffix}`;
      if (localStorage.getItem(newKey) === null) {
        const value = localStorage.getItem(oldKey);
        if (value !== null) localStorage.setItem(newKey, value);
      }
    }
  } catch {
    // Ignore storage access/migration errors; app should continue with defaults.
  }
}
