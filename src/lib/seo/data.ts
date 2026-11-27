import { cacheLife } from "next/cache";
import { getCountries, getTags, searchStations } from "@/lib/api/radio-browser";
import { countrySlug, genreSlug } from "./slugs";

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
  { name: "Music", stationCount: 0 },
] as const;

function withFallback<T>(items: T[], fallback: readonly T[]): T[] {
  return items.length ? items : [...fallback];
}

export async function getCountryBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  const countries = withFallback(await getCountries(), FALLBACK_COUNTRIES);
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
  const tags = withFallback(await getTags(), FALLBACK_TAGS);
  const normalized = slug.toLowerCase();
  return tags.find((t) => genreSlug(t.name) === normalized) ?? tags.find((t) => t.name.toLowerCase() === normalized) ?? null;
}

export async function getCountryStations(countryCode: string, limit = 24) {
  "use cache";
  cacheLife("minutes");
  return searchStations({ country: countryCode, limit, order: "clickcount", reverse: true });
}

export async function getGenreStations(tag: string, limit = 24) {
  "use cache";
  cacheLife("minutes");
  return searchStations({ tag, limit, order: "clickcount", reverse: true });
}

export async function getCachedCountries() {
  "use cache";
  cacheLife("hours");
  return withFallback(await getCountries(), FALLBACK_COUNTRIES);
}

export async function getCachedTags() {
  "use cache";
  cacheLife("hours");
  return withFallback(await getTags(), FALLBACK_TAGS);
}

export async function getCachedTopStations(limit = 12) {
  "use cache";
  cacheLife("minutes");
  return searchStations({ limit, order: "clickcount", reverse: true });
}
