import type { MetadataRoute } from "next";

const siteUrl = "https://syntv.online";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${siteUrl}/explore`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}
