import { cacheLife } from "next/cache";
import { getCountries, getTags, searchStations } from "@/lib/api/radio-browser";
import { countrySlug, genreSlug } from "./slugs";

export async function getCountryBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  const countries = await getCountries();
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
  const tags = await getTags();
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
  return getCountries();
}

export async function getCachedTags() {
  "use cache";
  cacheLife("hours");
  return getTags();
}

export async function getCachedTopStations(limit = 12) {
  "use cache";
  cacheLife("minutes");
  return searchStations({ limit, order: "clickcount", reverse: true });
}
