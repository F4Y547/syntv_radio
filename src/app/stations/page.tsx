import type { Metadata } from "next";
import Link from "next/link";
import { Globe2, Music2, Radio, Search } from "lucide-react";
import { jsonLd } from "@/lib/seo/json-ld";
import { countrySlug, genreSlug } from "@/lib/seo/slugs";
import { displayTag } from "@/lib/normalize";
import { absoluteUrl, siteName, siteUrl } from "@/lib/seo/site";
import { getCachedCountries, getCachedTags, getCachedTopStations } from "@/lib/seo/data";
import { StationCard } from "@/components/station/station-card";

export const metadata: Metadata = {
  title: "Online Radio Stations Directory — Listen Live Worldwide",
  description:
    "Browse live online radio stations by country and genre. Discover free internet radio from around the world on SYNTV RADIO.",
  alternates: { canonical: "/stations" },
  openGraph: {
    title: `Online Radio Stations Directory | ${siteName}`,
    description:
      "Browse live online radio stations by country and genre. Discover free internet radio worldwide.",
    url: "/stations",
    type: "website",
    siteName,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${siteName} station directory` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Online Radio Stations Directory | ${siteName}`,
    description: "Browse live online radio stations by country and genre on SYNTV RADIO.",
    images: ["/opengraph-image"],
  },
};

export default async function StationsDirectoryPage() {
  const [countries, tags, stations] = await Promise.all([
    getCachedCountries(),
    getCachedTags(),
    getCachedTopStations(12),
  ]);

  const topCountries = countries.slice(0, 24);
  const topTags = tags.slice(0, 24);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Online Radio Stations Directory",
    description: "Browse live online radio stations by country and genre on SYNTV RADIO.",
    url: absoluteUrl("/stations"),
    isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Stations", item: `${siteUrl}/stations` },
    ],
  };

  return (
    <div className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }} />

      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-foreground">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">Stations</li>
        </ol>
      </nav>

      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-surface/30 p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_70%_30%,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent_55%)]" aria-hidden="true" />
        <div className="relative space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            <Radio size={14} aria-hidden="true" /> Station Directory
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Listen to Live Online Radio Stations Worldwide
          </h1>
          <p className="max-w-3xl text-foreground-muted">
            Explore free internet radio by country and genre. SYNTV RADIO helps you discover live music, news, and talk stations from around the world.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
              <Search size={16} aria-hidden="true" /> Search stations
            </Link>
            <Link href="/explore" className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-5 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/[0.06]">
              <Globe2 size={16} aria-hidden="true" /> Explore globe
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="top-stations" className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Popular now</p>
          <h2 id="top-stations" className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Top live radio stations</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stations.map((station) => (
            <StationCard key={station.id} station={station} />
          ))}
        </div>
      </section>

      <section aria-labelledby="browse-countries" className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe2 size={18} className="text-primary" aria-hidden="true" />
          <h2 id="browse-countries" className="font-display text-2xl font-bold tracking-tight text-foreground">Browse by country</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {topCountries.map((c) => (
            <Link key={c.code} href={`/country/${countrySlug(c.name, c.code)}`} className="rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5 text-sm text-foreground-muted hover:border-primary/30 hover:text-foreground">
              {c.name} <span className="text-muted-foreground">({c.stationCount.toLocaleString()})</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="browse-genres" className="space-y-4">
        <div className="flex items-center gap-2">
          <Music2 size={18} className="text-primary" aria-hidden="true" />
          <h2 id="browse-genres" className="font-display text-2xl font-bold tracking-tight text-foreground">Browse by genre</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {topTags.map((t) => (
            <Link key={t.name} href={`/genre/${genreSlug(t.name)}`} className="rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5 text-sm text-foreground-muted hover:border-primary/30 hover:text-foreground">
              {displayTag(t.name)}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
