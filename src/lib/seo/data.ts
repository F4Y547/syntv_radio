import { cacheLife, cacheTag } from "next/cache";
import { getCountries, getTags, searchStations } from "@/lib/api/radio-browser";
import {
  getCachedSeoData,
  SEO_TTL_HOUR_MS,
  SEO_TTL_MINUTE_MS,
} from "./cache";
import { countrySlug, genreSlug } from "./slugs";
import { PUBLIC_CACHE_TAGS } from "./tags";
import {
  normalizeCountries,
  normalizeCountryName,
  normalizeTagCounts,
  normalizeTags,
} from "@/lib/normalize";
import type { Station } from "@/types/station";

export { PUBLIC_CACHE_TAGS };

export const FALLBACK_COUNTRIES = [
  { name: "United States", code: "US", stationCount: 0 },
  { name: "Germany", code: "DE", stationCount: 0 },
  { name: "United Kingdom", code: "GB", stationCount: 0 },
  { name: "France", code: "FR", stationCount: 0 },
  { name: "Canada", code: "CA", stationCount: 0 },
  { name: "India", code: "IN", stationCount: 0 },
  { name: "Brazil", code: "BR", stationCount: 0 },
  { name: "Australia", code: "AU", stationCount: 0 },
  { name: "Japan", code: "JP", stationCount: 0 },
  { name: "Netherlands", code: "NL", stationCount: 0 },
] as const;

export const FALLBACK_TAGS = [
  { name: "Pop", stationCount: 0 },
  { name: "Rock", stationCount: 0 },
  { name: "Jazz", stationCount: 0 },
  { name: "News", stationCount: 0 },
  { name: "Talk", stationCount: 0 },
  { name: "Classical", stationCount: 0 },
  { name: "Electronic", stationCount: 0 },
  { name: "Country", stationCount: 0 },
  { name: "Hip Hop", stationCount: 0 },
  { name: "Indie", stationCount: 0 },
] as const;

function withFallback<T>(items: T[], fallback: readonly T[]): T[] {
  return items.length ? items : [...fallback];
}

/** Applies display-name normalization even to cached/fallback snapshots. */
function cleanCountries(countries: { name: string; code: string; stationCount: number }[]) {
  return normalizeCountries(countries).sort((a, b) => b.stationCount - a.stationCount);
}

function cleanTags(tags: { name: string; stationCount: number }[]) {
  return normalizeTagCounts(tags).sort((a, b) => b.stationCount - a.stationCount);
}

/** Station snapshots can outlive a code change in the shared cache. */
function cleanStations(stations: Station[]): Station[] {
  return stations.map((station) => ({
    ...station,
    country: normalizeCountryName(station.country, station.countryCode),
    countryCode: String(station.countryCode ?? "").toUpperCase(),
    tags: normalizeTags(station.tags),
  }));
}

export async function getCountryBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(PUBLIC_CACHE_TAGS.countries);
  const countries = cleanCountries(await getCachedSeoData(
    "countries",
    [],
    SEO_TTL_HOUR_MS,
    async () => withFallback(await getCountries(), FALLBACK_COUNTRIES),
  ));
  const normalized = slug.toLowerCase();
  return (
    countries.find((c) => countrySlug(c.name, c.code) === normalized) ??
    countries.find((c) => c.code.toLowerCase() === normalized) ??
    null
  );
}

export async function getGenreBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(PUBLIC_CACHE_TAGS.genres);
  const tags = cleanTags(await getCachedSeoData(
    "tags",
    [],
    SEO_TTL_HOUR_MS,
    async () => withFallback(await getTags(), FALLBACK_TAGS),
  ));
  const normalized = slug.toLowerCase();
  return tags.find((t) => genreSlug(t.name) === normalized) ?? tags.find((t) => t.name.toLowerCase() === normalized) ?? null;
}

export async function getCountryStations(countryCode: string, limit = 24) {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_CACHE_TAGS.stations);
  return cleanStations(await getCachedSeoData(
    "country-stations",
    [countryCode, limit],
    SEO_TTL_MINUTE_MS,
    () => searchStations({ country: countryCode, limit, order: "clickcount", reverse: true }),
  ));
}

export async function getGenreStations(tag: string, limit = 24) {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_CACHE_TAGS.stations);
  return cleanStations(await getCachedSeoData(
    "genre-stations",
    [tag, limit],
    SEO_TTL_MINUTE_MS,
    () => searchStations({ tag, limit, order: "clickcount", reverse: true }),
  ));
}

export async function getCachedCountries() {
  "use cache";
  cacheLife("hours");
  cacheTag(PUBLIC_CACHE_TAGS.countries);
  return cleanCountries(await getCachedSeoData(
    "countries",
    [],
    SEO_TTL_HOUR_MS,
    async () => withFallback(await getCountries(), FALLBACK_COUNTRIES),
  ));
}

export async function getCachedTags() {
  "use cache";
  cacheLife("hours");
  cacheTag(PUBLIC_CACHE_TAGS.genres);
  return cleanTags(await getCachedSeoData(
    "tags",
    [],
    SEO_TTL_HOUR_MS,
    async () => withFallback(await getTags(), FALLBACK_TAGS),
  ));
}

export async function getCachedTopStations(limit = 12) {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_CACHE_TAGS.stations);
  return cleanStations(await getCachedSeoData(
    "top-stations",
    [limit],
    SEO_TTL_MINUTE_MS,
    () => searchStations({ limit, order: "clickcount", reverse: true }),
  ));
}
