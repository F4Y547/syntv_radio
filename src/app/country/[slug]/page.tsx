import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Globe2, Radio } from "lucide-react";
import { getCachedCountries, getCachedTags, getCountryBySlug, getCountryStations } from "@/lib/seo/data";
import { countrySlug, genreSlug } from "@/lib/seo/slugs";
import { absoluteUrl, siteName, siteUrl } from "@/lib/seo/site";
import { StationCard } from "@/components/station/station-card";
import type { Station } from "@/types/station";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const countries = await getCachedCountries().catch(() => []);
  return countries.slice(0, 120).map((c) => ({ slug: countrySlug(c.name, c.code) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country) return { title: "Country not found", robots: { index: false, follow: false } };

  const title = `Live Radio Stations in ${country.name} — Listen Online`;
  const description = `Listen to ${country.stationCount.toLocaleString()} live radio stations from ${country.name} online. Discover music, news, and talk stations on ${siteName}.`;
  const path = `/country/${countrySlug(country.name, country.code)}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: path,
      type: "website",
      siteName,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${country.name} radio stations on ${siteName}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: ["/opengraph-image"],
    },
  };
}

function topTags(stations: Station[], limit = 10) {
  const counts = new Map<string, number>();
  for (const station of stations) {
    for (const tag of station.tags) {
      const normalized = tag.trim().toLowerCase();
      if (!normalized) continue;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export default async function CountryPage({ params }: Props) {
  const { slug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country) notFound();

  const [stations, countries, tags] = await Promise.all([
    getCountryStations(country.code, 24).catch(() => []),
    getCachedCountries().catch(() => []),
    getCachedTags().catch(() => []),
  ]);

  const path = `/country/${countrySlug(country.name, country.code)}`;
  const relatedCountries = [...countries]
    .filter((c) => c.code !== country.code)
    .sort((a, b) => b.stationCount - a.stationCount)
    .slice(0, 12);
  const popularGenres = [...tags].sort((a, b) => b.stationCount - a.stationCount).slice(0, 12);
  const sampleLanguages = [...new Set(stations.map((station) => station.language).filter(Boolean))];
  const sampleTags = topTags(stations);
  const reportedOnline = stations.filter((station) => station.isOnline).length;
  const bitrates = stations.map((station) => station.bitrate).filter((bitrate) => bitrate > 0);
  const averageBitrate = bitrates.length
    ? Math.round(bitrates.reduce((sum, bitrate) => sum + bitrate, 0) / bitrates.length)
    : null;
  const reportHref = `/contact?topic=station-owner&station=${encodeURIComponent(country.name)}`;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Live Radio Stations in ${country.name}`,
    description: `Listen to live online radio stations from ${country.name} on ${siteName}.`,
    url: absoluteUrl(path),
    isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl },
    about: { "@type": "Country", name: country.name },
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${country.name} radio stations`,
    itemListElement: stations.slice(0, 20).map((station, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/station/${station.id}`),
      name: station.name,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Countries", item: absoluteUrl("/countries") },
      { "@type": "ListItem", position: 3, name: country.name, item: absoluteUrl(path) },
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
          <li><Link href="/countries" className="hover:text-foreground">Countries</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">{country.name}</li>
        </ol>
      </nav>

      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-surface/30 p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_70%_30%,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent_55%)]" aria-hidden="true" />
        <div className="relative space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            <Globe2 size={14} aria-hidden="true" /> Country directory
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Live Radio Stations in {country.name}
          </h1>
          <p className="max-w-3xl leading-relaxed text-foreground-muted">
            Explore online radio from {country.name}. The directory currently lists{" "}
            <strong className="text-foreground">{country.stationCount.toLocaleString()}</strong> stations for this
            country. This page shows a current sample of up to 24 stations, ordered by public directory click counts,
            with real metadata and a direct path back to the player.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={`/?country=${encodeURIComponent(country.code)}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
              <Radio size={16} aria-hidden="true" /> Browse in player
            </Link>
            <Link href="/countries" className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-5 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/[0.06]">
              <ArrowLeft size={16} aria-hidden="true" /> All countries
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="country-stations" className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Live stations</p>
          <h2 id="country-stations" className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Top stations in {country.name}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-foreground-muted">
            Ratings, audience figures, and global popularity are not shown because SYNTV RADIO does not measure them.
            The order reflects public directory click counts, not a paid placement or an editorial ranking.
          </p>
        </div>
        {stations.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stations.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-border bg-surface/40 p-6 text-muted-foreground">
            No stations are available for this country right now. The directory may be temporarily unavailable, or
            the country may have no listed stations. Please try again later or{" "}
            <Link href="/stations" className="text-primary hover:underline">browse all stations</Link>.
          </p>
        )}
      </section>

      {stations.length > 0 && (
        <section aria-labelledby="country-context" className="rounded-2xl border border-border/70 bg-surface/30 p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">About this sample</p>
          <h2 id="country-context" className="mt-2 font-display text-xl font-semibold text-foreground sm:text-2xl">
            What the {country.name} listing contains
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/60 bg-background/30 p-3.5">
              <p className="text-xs text-muted-foreground">Stations in sample</p>
              <p className="mt-1 font-display text-xl font-semibold text-foreground">{stations.length}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/30 p-3.5">
              <p className="text-xs text-muted-foreground">Languages represented</p>
              <p className="mt-1 font-display text-xl font-semibold text-foreground">{sampleLanguages.length || "Not specified"}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/30 p-3.5">
              <p className="text-xs text-muted-foreground">Reported online</p>
              <p className="mt-1 font-display text-xl font-semibold text-foreground">{reportedOnline} of {stations.length}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/30 p-3.5">
              <p className="text-xs text-muted-foreground">Average listed bitrate</p>
              <p className="mt-1 font-display text-xl font-semibold text-foreground">{averageBitrate ? `${averageBitrate} kbps` : "Not listed"}</p>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground-muted">
            <p>
              The sample covers {sampleLanguages.length > 0 ? `${sampleLanguages.length} language${sampleLanguages.length === 1 ? "" : "s"}` : "stations whose language is not always specified"}.
              Language, bitrate, codec, and online status are directory fields and can be incomplete or out of date.
              A station marked online may still fail to play in your browser because of geo-restrictions, stream
              changes, or an unsupported format.
            </p>
            {sampleTags.length > 0 && (
              <p>
                Common tags in this sample:{" "}
                {sampleTags.map(([tag], index) => (
                  <span key={tag}>
                    <Link href={`/genre/${genreSlug(tag)}`} className="text-primary hover:underline">{tag}</Link>
                    {index < sampleTags.length - 1 ? ", " : "."}
                  </span>
                ))}
              </p>
            )}
            <p>
              SYNTV RADIO is an independent directory. Station names, logos, programmes, music, and streams belong to
              their respective owners. If a listing is incorrect, duplicated, or no longer operating, you can{" "}
              <Link href={reportHref} className="text-primary hover:underline">report the listing</Link>.
            </p>
          </div>
        </section>
      )}

      <section aria-labelledby="related-genres" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="related-genres" className="font-display text-xl font-semibold text-foreground">Browse by genre</h2>
            <p className="mt-1 text-sm text-foreground-muted">Start with a style instead of a place.</p>
          </div>
          <Link href="/genres" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            All genres <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {popularGenres.map((g) => (
            <Link key={g.name} href={`/genre/${genreSlug(g.name)}`} className="rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5 text-sm capitalize text-foreground-muted hover:border-primary/30 hover:text-foreground">
              {g.name}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="related-countries" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="related-countries" className="font-display text-xl font-semibold text-foreground">Explore other countries</h2>
            <p className="mt-1 text-sm text-foreground-muted">Countries with the largest station counts in the directory.</p>
          </div>
          <Link href="/countries" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            All countries <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {relatedCountries.map((c) => (
            <Link key={c.code} href={`/country/${countrySlug(c.name, c.code)}`} className="rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5 text-sm text-foreground-muted hover:border-primary/30 hover:text-foreground">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-surface/30 p-5 text-sm leading-relaxed text-foreground-muted">
        <p>
          Station data is provided through the community-run{" "}
          <a href="https://www.radio-browser.info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Radio Browser
          </a>{" "}
          directory. Counts and availability can change. Looking for a current popularity sample instead? Visit{" "}
          <Link href="/trending" className="text-primary hover:underline">trending stations</Link>.
        </p>
      </section>
    </div>
  );
}
