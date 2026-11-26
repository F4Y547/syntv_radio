import type { Collection, Station } from "@/types/station";
import { ensureLocalStorageMigrated } from "./migrate";

const FAVORITES_KEY = "syntv-radio:favorites";
const RECENTS_KEY = "syntv-radio:recents";
const VOLUME_KEY = "syntv-radio:volume";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getFavorites(): Station[] {
  if (typeof window === "undefined") return [];
  ensureLocalStorageMigrated();
  return safeParse<Station[]>(localStorage.getItem(FAVORITES_KEY), []);
}

export function setFavorites(stations: Station[]) {
  ensureLocalStorageMigrated();
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(stations.slice(0, 100)));
}

export function toggleFavorite(station: Station): Station[] {
  const favorites = getFavorites();
  const exists = favorites.some((item) => item.id === station.id);
  const next = exists
    ? favorites.filter((item) => item.id !== station.id)
    : [station, ...favorites];
  setFavorites(next);
  return next;
}

export function getRecents(): Station[] {
  if (typeof window === "undefined") return [];
  ensureLocalStorageMigrated();
  return safeParse<Station[]>(localStorage.getItem(RECENTS_KEY), []);
}

export function addRecent(station: Station): Station[] {
  ensureLocalStorageMigrated();
  const recents = getRecents().filter((item) => item.id !== station.id);
  const next = [station, ...recents].slice(0, 20);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  return next;
}

export function getVolume(): number {
  if (typeof window === "undefined") return 0.8;
  ensureLocalStorageMigrated();
  const value = Number(localStorage.getItem(VOLUME_KEY));
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.8;
}

export function setVolume(volume: number) {
  ensureLocalStorageMigrated();
  localStorage.setItem(VOLUME_KEY, String(Math.min(1, Math.max(0, volume))));
}

const COLLECTIONS_KEY = "syntv-radio:collections";

export function getCollections(): Collection[] {
  if (typeof window === "undefined") return [];
  ensureLocalStorageMigrated();
  return safeParse<Collection[]>(localStorage.getItem(COLLECTIONS_KEY), []);
}

export function saveCollections(collections: Collection[]) {
  ensureLocalStorageMigrated();
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections.slice(0, 20)));
}

export function createCollection(name: string): Collection[] {
  const collections = getCollections();
  const next: Collection[] = [
    { id: crypto.randomUUID(), name: name.trim() || "New collection", stations: [], createdAt: Date.now() },
    ...collections,
  ];
  saveCollections(next);
  return next;
}

export function removeCollection(id: string): Collection[] {
  const next = getCollections().filter((c) => c.id !== id);
  saveCollections(next);
  return next;
}

export function addStationToCollection(collectionId: string, station: Station): Collection[] {
  const next = getCollections().map((c) => {
    if (c.id !== collectionId) return c;
    if (c.stations.some((s) => s.id === station.id)) return c;
    return { ...c, stations: [station, ...c.stations].slice(0, 50) };
  });
  saveCollections(next);
  return next;
}

export function removeStationFromCollection(collectionId: string, stationId: string): Collection[] {
  const next = getCollections().map((c) =>
    c.id === collectionId ? { ...c, stations: c.stations.filter((s) => s.id !== stationId) } : c,
  );
  saveCollections(next);
  return next;
}

const STATS_KEY = "syntv-radio:listening-stats";

export interface ListeningStats {
  totalSeconds: number;
  sessions: number;
  lastPlayedAt?: number;
}

export function getListeningStats(): ListeningStats {
  if (typeof window === "undefined") return { totalSeconds: 0, sessions: 0 };
  ensureLocalStorageMigrated();
  return safeParse<ListeningStats>(localStorage.getItem(STATS_KEY), { totalSeconds: 0, sessions: 0 });
}

export function saveListeningStats(stats: ListeningStats) {
  ensureLocalStorageMigrated();
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}
