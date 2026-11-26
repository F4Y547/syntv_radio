import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe2, Radio } from "lucide-react";
import { getCachedCountries, getCachedTags, getCountryBySlug, getCountryStations } from "@/lib/seo/data";
import { countrySlug, genreSlug } from "@/lib/seo/slugs";
import { absoluteUrl, siteName, siteUrl } from "@/lib/seo/site";
import { StationCard } from "@/components/station/station-card";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const countries = await getCachedCountries();
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

export default async function CountryPage({ params }: Props) {
  const { slug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country) notFound();

  const [stations, countries, tags] = await Promise.all([
    getCountryStations(country.code, 24),
    getCachedCountries(),
    getCachedTags(),
  ]);

  const path = `/country/${countrySlug(country.name, country.code)}`;
  const relatedCountries = countries.filter((c) => c.code !== country.code).slice(0, 12);
  const topGenres = tags.slice(0, 12);

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
      { "@type": "ListItem", position: 2, name: "Stations", item: `${siteUrl}/stations` },
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
          <li><Link href="/stations" className="hover:text-foreground">Stations</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">{country.name}</li>
        </ol>
      </nav>

      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-surface/30 p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_70%_30%,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent_55%)]" aria-hidden="true" />
        <div className="relative space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            <Globe2 size={14} aria-hidden="true" /> Country Directory
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Live Radio Stations in {country.name}
          </h1>
          <p className="max-w-3xl text-foreground-muted">
            Listen live to online radio from {country.name}. Explore {country.stationCount.toLocaleString()} available stations on {siteName}, including music, news, talk, and local broadcasters.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={`/?country=${encodeURIComponent(country.code)}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
              <Radio size={16} aria-hidden="true" /> Browse in player
            </Link>
            <Link href="/stations" className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-5 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/[0.06]">
              <ArrowLeft size={16} aria-hidden="true" /> All stations
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

      <section aria-labelledby="related-genres" className="space-y-4">
        <h2 id="related-genres" className="font-display text-xl font-semibold text-foreground">Popular genres</h2>
        <div className="flex flex-wrap gap-2">
          {topGenres.map((g) => (
            <Link key={g.name} href={`/genre/${genreSlug(g.name)}`} className="rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5 text-sm text-foreground-muted hover:border-primary/30 hover:text-foreground">
              {g.name}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="related-countries" className="space-y-4">
        <h2 id="related-countries" className="font-display text-xl font-semibold text-foreground">Explore other countries</h2>
        <div className="flex flex-wrap gap-2">
          {relatedCountries.map((c) => (
            <Link key={c.code} href={`/country/${countrySlug(c.name, c.code)}`} className="rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5 text-sm text-foreground-muted hover:border-primary/30 hover:text-foreground">
              {c.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
