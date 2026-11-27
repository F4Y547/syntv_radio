import Link from "next/link";
import { ArrowRight, Globe2, Radio, Search } from "lucide-react";
import { getCachedCountries } from "@/lib/seo/data";
import { countrySlug } from "@/lib/seo/slugs";
import { infoPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, siteName, siteUrl } from "@/lib/seo/site";

export const metadata = infoPageMetadata({
  title: "Radio Stations by Country",
  description:
    "Browse live online radio stations by country. Explore station directories for countries worldwide and listen through SYNTV RADIO.",
  path: "/countries",
});

export default async function CountriesPage() {
  const countries = await getCachedCountries().catch(() => []);
  const sorted = [...countries].sort((a, b) => b.stationCount - a.stationCount);
  const alphabetical = [...countries].sort((a, b) => a.name.localeCompare(b.name, "en"));
  const top = sorted.slice(0, 12);
  const totalStations = countries.reduce((sum, country) => sum + country.stationCount, 0);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Live Radio Stations by Country",
    description: "Browse live online radio stations by country on SYNTV RADIO.",
    url: absoluteUrl("/countries"),
    isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl },
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Countries with live radio stations",
    numberOfItems: top.length,
    itemListElement: top.map((country, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: country.name,
      url: absoluteUrl(`/country/${countrySlug(country.name, country.code)}`),
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Countries", item: absoluteUrl("/countries") },
    ],
  };

  return (
    <div className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-foreground">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">Countries</li>
        </ol>
      </nav>

      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-surface/30 p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_75%_25%,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent_55%)]" aria-hidden="true" />
        <div className="relative space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            <Globe2 size={14} aria-hidden="true" /> Country directory
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Radio stations by country
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-foreground-muted sm:text-lg">
            Explore live online radio from countries around the world. Each country page lists a sample of stations
            with real directory metadata, links to related genres, and a direct path back to the player.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1 text-sm text-foreground-muted">
            <span className="rounded-full border border-border/70 bg-background/35 px-3 py-1.5">
              <strong className="text-foreground">{countries.length.toLocaleString()}</strong> countries listed
            </span>
            <span className="rounded-full border border-border/70 bg-background/35 px-3 py-1.5">
              <strong className="text-foreground">{totalStations.toLocaleString()}</strong> directory stations
            </span>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/stations" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
              <Radio size={16} aria-hidden="true" /> Browse all stations
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-5 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/[0.06]">
              <Search size={16} aria-hidden="true" /> Search the directory
            </Link>
          </div>
        </div>
      </section>

      {top.length > 0 ? (
        <section aria-labelledby="top-countries" className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Most populated</p>
            <h2 id="top-countries" className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Countries with the most listed stations
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {top.map((country) => (
              <Link
                key={country.code}
                href={`/country/${countrySlug(country.name, country.code)}`}
                className="group rounded-2xl border border-border/70 bg-surface/30 p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary">{country.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {country.stationCount.toLocaleString()} stations in the directory
                    </p>
                  </div>
                  <ArrowRight size={17} className="text-muted-foreground group-hover:text-primary" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <p className="rounded-xl border border-border bg-surface/40 p-6 text-muted-foreground">
          The country directory is temporarily unavailable. Please try again later or use the station search.
        </p>
      )}

      {alphabetical.length > 0 && (
        <section aria-labelledby="all-countries" className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">A–Z</p>
            <h2 id="all-countries" className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              All countries
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
              Country coverage and station counts come from the Radio Browser directory and can change as stations are
              added, updated, or removed.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {alphabetical.map((country) => (
              <Link
                key={country.code}
                href={`/country/${countrySlug(country.name, country.code)}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/25 px-3.5 py-2.5 text-sm transition hover:border-primary/30 hover:text-primary"
              >
                <span className="text-foreground">{country.name}</span>
                <span className="text-xs text-muted-foreground">{country.stationCount.toLocaleString()}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border/70 bg-surface/30 p-5 text-sm leading-relaxed text-foreground-muted">
        <p>
          Looking for a music style instead? Browse <Link href="/genres" className="text-primary hover:underline">radio genres</Link>{" "}
          or the <Link href="/trending" className="text-primary hover:underline">trending station list</Link>. Station
          data is provided through the Radio Browser community directory; availability and metadata can change.
        </p>
      </section>
    </div>
  );
}
