import type { MetadataRoute } from "next";
import { getCachedCountries, getCachedTags, getCachedTopStations } from "@/lib/seo/data";
import { isIndexableGenre } from "@/lib/seo/genre-editorial";
import { countrySlug, genreSlug } from "@/lib/seo/slugs";
import { siteUrl } from "@/lib/seo/site";

const staticPages: MetadataRoute.Sitemap = [
  { url: siteUrl, changeFrequency: "daily", priority: 1 },
  { url: `${siteUrl}/stations`, changeFrequency: "daily", priority: 0.9 },
  { url: `${siteUrl}/explore`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${siteUrl}/countries`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${siteUrl}/genres`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${siteUrl}/trending`, changeFrequency: "daily", priority: 0.8 },
  { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${siteUrl}/faq`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${siteUrl}/privacy-policy`, changeFrequency: "yearly", priority: 0.4 },
  { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.4 },
  { url: `${siteUrl}/disclaimer`, changeFrequency: "yearly", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [...staticPages];

  try {
    const [countries, tags, stations] = await Promise.all([
      getCachedCountries(),
      getCachedTags(),
      getCachedTopStations(500),
    ]);

    for (const c of countries.slice(0, 120)) {
      entries.push({
        url: `${siteUrl}/country/${countrySlug(c.name, c.code)}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const t of tags.filter((tag) => isIndexableGenre(tag.name)).slice(0, 60)) {
      entries.push({
        url: `${siteUrl}/genre/${genreSlug(t.name)}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const s of stations) {
      entries.push({
        url: `${siteUrl}/station/${s.id}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error("Sitemap generation error", error);
  }

  return entries;
}
