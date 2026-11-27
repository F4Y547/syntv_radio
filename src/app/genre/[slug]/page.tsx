import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Music2, Radio } from "lucide-react";
import { FALLBACK_COUNTRIES, FALLBACK_TAGS, getCachedCountries, getCachedTags, getGenreBySlug, getGenreStations } from "@/lib/seo/data";
import { getGenreEditorial } from "@/lib/seo/genre-editorial";
import { jsonLd } from "@/lib/seo/json-ld";
import { countrySlug, genreSlug } from "@/lib/seo/slugs";
import { absoluteUrl, siteName, siteUrl } from "@/lib/seo/site";
import { StationCard } from "@/components/station/station-card";
import type { Station } from "@/types/station";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const tags = await getCachedTags().catch(() => FALLBACK_TAGS);
  return tags.slice(0, 60).map((t) => ({ slug: genreSlug(t.name) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const genre = await getGenreBySlug(slug);
  if (!genre) return { title: "Genre not found", robots: { index: false, follow: false } };

  const title = `Live ${genre.name} Radio Stations Online — Listen Free`;
  const editorial = getGenreEditorial(genre.name);
  const description = editorial
    ? editorial.summary
    : `Listen to ${genre.stationCount.toLocaleString()} live ${genre.name} radio stations online. Discover free ${genre.name} internet radio on ${siteName}.`;
  const path = `/genre/${genreSlug(genre.name)}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    ...(editorial?.indexable === false ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: path,
      type: "website",
      siteName,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${genre.name} radio stations on ${siteName}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: ["/opengraph-image"],
    },
  };
}

function countryCounts(stations: Station[]) {
  const counts = new Map<string, { name: string; code: string; count: number }>();
  for (const station of stations) {
    if (!station.countryCode && !station.country) continue;
    const key = station.countryCode || station.country;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        name: station.country || station.countryCode,
        code: station.countryCode,
        count: 1,
      });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

export default async function GenrePage({ params }: Props) {
  const { slug } = await params;
  const genre = await getGenreBySlug(slug);
  if (!genre) notFound();

  const [stations, countries, tags] = await Promise.all([
    getGenreStations(genre.name, 24).catch(() => []),
    getCachedCountries().catch(() => FALLBACK_COUNTRIES),
    getCachedTags().catch(() => FALLBACK_TAGS),
  ]);

  const path = `/genre/${genreSlug(genre.name)}`;
  const editorial = getGenreEditorial(genre.name);
  const sampleCountries = countryCounts(stations);
  const fallbackCountries = [...countries].sort((a, b) => b.stationCount - a.stationCount).slice(0, 12);
  const popularGenres = [...tags]
    .filter((t) => t.name !== genre.name)
    .sort((a, b) => b.stationCount - a.stationCount)
    .slice(0, 12);
  const sampleLanguages = [...new Set(stations.map((station) => station.language).filter(Boolean))];
  const reportedOnline = stations.filter((station) => station.isOnline).length;
  const reportHref = `/contact?topic=station-owner&station=${encodeURIComponent(genre.name)}`;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Live ${genre.name} Radio Stations`,
    description: `Listen to live ${genre.name} radio stations online on ${siteName}.`,
    url: absoluteUrl(path),
    isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl },
    about: { "@type": "Thing", name: `${genre.name} radio` },
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${genre.name} radio stations`,
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
      { "@type": "ListItem", position: 2, name: "Genres", item: absoluteUrl("/genres") },
      { "@type": "ListItem", position: 3, name: genre.name, item: absoluteUrl(path) },
    ],
  };

  return (
    <div className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }} />

      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-foreground">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/genres" className="hover:text-foreground">Genres</Link></li>
          <li aria-hidden="true">/</li>
          <li className="capitalize text-foreground">{genre.name}</li>
        </ol>
      </nav>

      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-surface/30 p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_70%_30%,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent_55%)]" aria-hidden="true" />
        <div className="relative space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            <Music2 size={14} aria-hidden="true" /> Genre directory
          </p>
          <h1 className="font-display text-4xl font-bold capitalize tracking-tight text-foreground sm:text-5xl">
            Live {genre.name} Radio Stations
          </h1>
          <p className="max-w-3xl leading-relaxed text-foreground-muted">
            Explore live {genre.name} radio online. The directory currently lists{" "}
            <strong className="text-foreground">{genre.stationCount.toLocaleString()}</strong> stations with this tag
            or genre. This page shows a current sample of up to 24 stations in directory click-count order. Tags are
            community-maintained, so a station can appear under more than one style.
          </p>
          {editorial ? (
            <p className="max-w-3xl text-sm leading-relaxed text-foreground-muted">{editorial.summary}</p>
          ) : null}
          {editorial?.indexable === false ? (
            <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
              This source label is kept for browsing but is excluded from the sitemap because it is a broad or
              non-genre tag. Use the country or format directories for a more precise search.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={`/?tag=${encodeURIComponent(genre.name)}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
              <Radio size={16} aria-hidden="true" /> Browse in player
            </Link>
            <Link href="/genres" className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-5 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/[0.06]">
              <ArrowLeft size={16} aria-hidden="true" /> All genres
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="genre-stations" className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Live stations</p>
          <h2 id="genre-stations" className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Top {genre.name} stations
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-foreground-muted">
            These stations carry the {genre.name} tag in the directory. A listing is not an endorsement of the
            station&rsquo;s views, schedule, or advertisers. If a stream does not play, it may be offline or using a
            format your browser does not support.
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
            No stations are available for this genre right now. The directory may be temporarily unavailable, or the
            tag may have no current stations. Please try again later or{" "}
            <Link href="/genres" className="text-primary hover:underline">browse other genres</Link>.
          </p>
        )}
      </section>

      {stations.length > 0 && (
        <section aria-labelledby="genre-context" className="rounded-2xl border border-border/70 bg-surface/30 p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">About this sample</p>
          <h2 id="genre-context" className="mt-2 font-display text-xl font-semibold text-foreground sm:text-2xl">
            What the {genre.name} listing contains
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-background/30 p-3.5">
              <p className="text-xs text-muted-foreground">Stations in sample</p>
              <p className="mt-1 font-display text-xl font-semibold text-foreground">{stations.length}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/30 p-3.5">
              <p className="text-xs text-muted-foreground">Countries represented</p>
              <p className="mt-1 font-display text-xl font-semibold text-foreground">{sampleCountries.length || "Not specified"}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/30 p-3.5">
              <p className="text-xs text-muted-foreground">Reported online</p>
              <p className="mt-1 font-display text-xl font-semibold text-foreground">{reportedOnline} of {stations.length}</p>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground-muted">
            <p>
              The sample includes{" "}
              {sampleLanguages.length > 0
                ? `${sampleLanguages.length} language${sampleLanguages.length === 1 ? "" : "s"}`
                : "stations whose language is not always specified"}
              {sampleCountries.length > 0
                ? ` and stations from ${sampleCountries.length} countr${sampleCountries.length === 1 ? "y" : "ies"}.`
                : "."}{" "}
              Tag coverage is not a scientific chart of the genre. A station&rsquo;s format can change, and the
              directory may not reflect a recent change immediately.
            </p>
            <p>
              SYNTV RADIO indexes public station metadata and links to the station&rsquo;s own stream. We do not host
              the audio or own the station&rsquo;s branding. To correct or remove a listing,{" "}
              <Link href={reportHref} className="text-primary hover:underline">send a station-owner report</Link>.
            </p>
          </div>
        </section>
      )}

      <section aria-labelledby="related-countries" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="related-countries" className="font-display text-xl font-semibold text-foreground">
              {sampleCountries.length > 0 ? `Countries in this ${genre.name} sample` : "Browse by country"}
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">
              {sampleCountries.length > 0
                ? "The countries represented by the stations shown above."
                : "Countries with the largest station counts in the directory."}
            </p>
          </div>
          <Link href="/countries" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            All countries <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {(sampleCountries.length > 0 ? sampleCountries : fallbackCountries).map((c) => (
            <Link
              key={c.code || c.name}
              href={`/country/${countrySlug(c.name, c.code)}`}
              className="rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5 text-sm text-foreground-muted hover:border-primary/30 hover:text-foreground"
            >
              {c.name}
              {"count" in c && <span className="ml-1.5 text-xs text-muted-foreground">{c.count}</span>}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="related-genres" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="related-genres" className="font-display text-xl font-semibold text-foreground">Related genres</h2>
            <p className="mt-1 text-sm text-foreground-muted">Other styles with a large number of directory stations.</p>
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

      <section className="rounded-2xl border border-border/70 bg-surface/30 p-5 text-sm leading-relaxed text-foreground-muted">
        <p>
          Genre names and station tags come from the community-run{" "}
          <a href="https://www.radio-browser.info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Radio Browser
          </a>{" "}
          directory. Tags can be broad, duplicated, or applied inconsistently. For a current popularity sample, visit{" "}
          <Link href="/trending" className="text-primary hover:underline">trending stations</Link>.
        </p>
      </section>
    </div>
  );
}
