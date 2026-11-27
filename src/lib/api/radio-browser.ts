import type { Station, StationSearchParams } from "@/types/station";

interface RadioBrowserStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  votes: number;
  codec: string;
  bitrate: number;
  clickcount: number;
  clicktrend: number;
  lastcheckok: number | boolean;
}

const RADIO_BROWSER_BASE = "https://de1.api.radio-browser.info/json";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;

function normalizeStation(station: RadioBrowserStation): Station {
  return {
    id: station.stationuuid,
    name: station.name?.trim() || "Unknown station",
    url: station.url || "",
    urlResolved: station.url_resolved || station.url || "",
    homepage: station.homepage || "",
    favicon: station.favicon || "",
    tags: station.tags
      ? station.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 8)
      : [],
    country: station.country || "",
    countryCode: station.countrycode || "",
    state: station.state || "",
    language: station.language || "",
    votes: Number(station.votes) || 0,
    codec: station.codec || "",
    bitrate: Number(station.bitrate) || 0,
    clickCount: Number(station.clickcount) || 0,
    clickTrend: Number(station.clicktrend) || 0,
    isOnline: station.lastcheckok === 1 || station.lastcheckok === true,
  };
}

async function fetchJson<T>(path: string, revalidate: number): Promise<T | null> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`${RADIO_BROWSER_BASE}${path}`, {
        headers: {
          "User-Agent": "SyntvRadio/1.0",
          Accept: "application/json",
        },
        next: { revalidate },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.ok) return (await response.json()) as T;

      lastError = new Error(`Radio Browser request failed: ${response.status}`);
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      lastError = error;
    }

    if (attempt < MAX_ATTEMPTS - 1) {
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }

  console.warn("Radio Browser request failed after retries", lastError);
  return null;
}

export async function searchStations(
  params: StationSearchParams = {},
): Promise<Station[]> {
  const search = params.search?.trim();
  const hasFilters = Boolean(search || params.country || params.tag);
  const endpoint = hasFilters ? "/stations/search" : "/stations/topclick";
  const query = new URLSearchParams();

  if (search) query.set("name", search);
  if (params.country) query.set("countrycode", params.country);
  if (params.tag) query.set("tag", params.tag);
  query.set("limit", String(params.limit ?? 24));
  query.set("offset", String(params.offset ?? 0));
  query.set("order", params.order ?? (search ? "votes" : "clickcount"));
  query.set("reverse", String(params.reverse ?? true));
  query.set("hidebroken", "true");

  const data = await fetchJson<RadioBrowserStation[]>(`${endpoint}?${query.toString()}`, 300);
  return data?.map(normalizeStation) ?? [];
}

export async function getCountries(): Promise<{ name: string; code: string; stationCount: number }[]> {
  const data = await fetchJson<Array<{ name: string; iso_3166_1: string; stationcount: number }>>("/countries", 3600);
  if (!data) return [];
  return data
    .filter((c) => c.iso_3166_1 && c.name)
    .map((c) => ({ name: c.name, code: c.iso_3166_1, stationCount: c.stationcount }))
    .sort((a, b) => b.stationCount - a.stationCount);
}

export async function getTags(): Promise<{ name: string; stationCount: number }[]> {
  const data = await fetchJson<Array<{ name: string; stationcount: number }>>("/tags?limit=60&order=stationcount&reverse=true", 3600);
  if (!data) return [];
  return data
    .filter((t) => t.name && t.stationcount > 10)
    .map((t) => ({ name: t.name, stationCount: t.stationcount }));
}

export async function getStationById(id: string): Promise<Station | null> {
  const data = await fetchJson<RadioBrowserStation[]>(`/stations/byuuid/${encodeURIComponent(id)}`, 300);
  if (!data?.length) return null;
  return normalizeStation(data[0]);
}
