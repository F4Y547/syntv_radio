import type { MetadataRoute } from "next";
import { getCachedCountries, getCachedTags, getCachedTopStations } from "@/lib/seo/data";
import { countrySlug, genreSlug } from "@/lib/seo/slugs";
import { siteUrl } from "@/lib/seo/site";

const lastModified = new Date();

const staticPages: MetadataRoute.Sitemap = [
  { url: siteUrl, lastModified, changeFrequency: "daily", priority: 1 },
  { url: `${siteUrl}/stations`, lastModified, changeFrequency: "daily", priority: 0.9 },
  { url: `${siteUrl}/explore`, lastModified, changeFrequency: "weekly", priority: 0.8 },
  { url: `${siteUrl}/countries`, lastModified, changeFrequency: "weekly", priority: 0.8 },
  { url: `${siteUrl}/genres`, lastModified, changeFrequency: "weekly", priority: 0.8 },
  { url: `${siteUrl}/trending`, lastModified, changeFrequency: "daily", priority: 0.8 },
  { url: `${siteUrl}/about`, lastModified, changeFrequency: "monthly", priority: 0.6 },
  { url: `${siteUrl}/faq`, lastModified, changeFrequency: "monthly", priority: 0.6 },
  { url: `${siteUrl}/contact`, lastModified, changeFrequency: "monthly", priority: 0.6 },
  { url: `${siteUrl}/privacy-policy`, lastModified, changeFrequency: "yearly", priority: 0.4 },
  { url: `${siteUrl}/terms`, lastModified, changeFrequency: "yearly", priority: 0.4 },
  { url: `${siteUrl}/disclaimer`, lastModified, changeFrequency: "yearly", priority: 0.4 },
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
        lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const t of tags.slice(0, 60)) {
      entries.push({
        url: `${siteUrl}/genre/${genreSlug(t.name)}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const s of stations) {
      entries.push({
        url: `${siteUrl}/station/${s.id}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error("Sitemap generation error", error);
  }

  return entries;
}
