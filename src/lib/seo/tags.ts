export const PUBLIC_CACHE_TAGS = {
  stations: "public-stations",
  countries: "public-countries",
  genres: "public-genres",
} as const;

export type PublicCacheTagKey = keyof typeof PUBLIC_CACHE_TAGS;
