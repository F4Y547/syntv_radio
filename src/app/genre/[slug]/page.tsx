import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Music2, Radio } from "lucide-react";
import { getCachedCountries, getCachedTags, getGenreBySlug, getGenreStations } from "@/lib/seo/data";
import { countrySlug, genreSlug } from "@/lib/seo/slugs";
import { absoluteUrl, siteName, siteUrl } from "@/lib/seo/site";
import { StationCard } from "@/components/station/station-card";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const tags = await getCachedTags();
  return tags.slice(0, 60).map((t) => ({ slug: genreSlug(t.name) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const genre = await getGenreBySlug(slug);
  if (!genre) return { title: "Genre not found", robots: { index: false, follow: false } };

  const title = `Live ${genre.name} Radio Stations Online — Listen Free`;
  const description = `Listen to ${genre.stationCount.toLocaleString()} live ${genre.name} radio stations online. Discover free ${genre.name} internet radio on ${siteName}.`;
  const path = `/genre/${genreSlug(genre.name)}`;

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

export default async function GenrePage({ params }: Props) {
  const { slug } = await params;
  const genre = await getGenreBySlug(slug);
  if (!genre) notFound();

  const [stations, countries, tags] = await Promise.all([
    getGenreStations(genre.name, 24),
    getCachedCountries(),
    getCachedTags(),
  ]);

  const path = `/genre/${genreSlug(genre.name)}`;
  const relatedGenres = tags.filter((t) => t.name !== genre.name).slice(0, 12);
  const topCountries = countries.slice(0, 12);

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
      { "@type": "ListItem", position: 2, name: "Stations", item: `${siteUrl}/stations` },
      { "@type": "ListItem", position: 3, name: genre.name, item: absoluteUrl(path) },
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
          <li><Link href="/stations" className="hover:text-foreground">Stations</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">{genre.name}</li>
        </ol>
      </nav>

      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-surface/30 p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_70%_30%,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent_55%)]" aria-hidden="true" />
        <div className="relative space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            <Music2 size={14} aria-hidden="true" /> Genre Directory
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Live {genre.name} Radio Stations
          </h1>
          <p className="max-w-3xl text-foreground-muted">
            Listen live to {genre.name} radio stations online. Explore {genre.stationCount.toLocaleString()} available streams on {siteName} and discover free internet radio by genre.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={`/?tag=${encodeURIComponent(genre.name)}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
              <Radio size={16} aria-hidden="true" /> Browse in player
            </Link>
            <Link href="/stations" className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-5 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/[0.06]">
              <ArrowLeft size={16} aria-hidden="true" /> All stations
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
        </div>
        {stations.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stations.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-border bg-surface/40 p-6 text-muted-foreground">No stations available right now. Please try again later.</p>
        )}
      </section>

      <section aria-labelledby="related-countries" className="space-y-4">
        <h2 id="related-countries" className="font-display text-xl font-semibold text-foreground">Browse by country</h2>
        <div className="flex flex-wrap gap-2">
          {topCountries.map((c) => (
            <Link key={c.code} href={`/country/${countrySlug(c.name, c.code)}`} className="rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5 text-sm text-foreground-muted hover:border-primary/30 hover:text-foreground">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="related-genres" className="space-y-4">
        <h2 id="related-genres" className="font-display text-xl font-semibold text-foreground">Related genres</h2>
        <div className="flex flex-wrap gap-2">
          {relatedGenres.map((g) => (
            <Link key={g.name} href={`/genre/${genreSlug(g.name)}`} className="rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5 text-sm text-foreground-muted hover:border-primary/30 hover:text-foreground">
              {g.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
