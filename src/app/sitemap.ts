import type { MetadataRoute } from "next";
import { getCachedCountries, getCachedTags, getCachedTopStations } from "@/lib/seo/data";
import { countrySlug, genreSlug } from "@/lib/seo/slugs";
import { siteUrl } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl },
    { url: `${siteUrl}/stations` },
    { url: `${siteUrl}/explore` },
  ];

  try {
    const [countries, tags, stations] = await Promise.all([
      getCachedCountries(),
      getCachedTags(),
      getCachedTopStations(500),
    ]);

    for (const c of countries.slice(0, 120)) {
      entries.push({ url: `${siteUrl}/country/${countrySlug(c.name, c.code)}` });
    }
    for (const t of tags.slice(0, 60)) {
      entries.push({ url: `${siteUrl}/genre/${genreSlug(t.name)}` });
    }
    for (const s of stations) {
      entries.push({ url: `${siteUrl}/station/${s.id}` });
    }
  } catch (error) {
    console.error("Sitemap generation error", error);
  }

  return entries;
}
