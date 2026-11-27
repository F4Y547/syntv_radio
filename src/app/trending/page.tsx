import Link from "next/link";
import { Flame, Radio, Search, TrendingUp } from "lucide-react";
import { getCachedTopStations } from "@/lib/seo/data";
import { jsonLd } from "@/lib/seo/json-ld";
import { StationCard } from "@/components/station/station-card";
import { infoPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, siteUrl } from "@/lib/seo/site";

export const metadata = infoPageMetadata({
  title: "Trending Radio Stations",
  description:
    "Discover popular live radio stations on SYNTV RADIO, ranked by directory click counts. Browse a current sample of trending stations and start listening.",
  path: "/trending",
});

export default async function TrendingPage() {
  const stations = await getCachedTopStations(24).catch(() => []);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Trending", item: absoluteUrl("/trending") },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Trending radio stations on SYNTV RADIO",
    numberOfItems: stations.length,
    itemListElement: stations.map((station, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: station.name,
      url: absoluteUrl(`/station/${station.id}`),
    })),
  };

  return (
    <div className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(itemListJsonLd) }} />

      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-foreground">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">Trending</li>
        </ol>
      </nav>

      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-surface/30 p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_75%_25%,color-mix(in_srgb,var(--color-live)_14%,transparent),transparent_55%)]" aria-hidden="true" />
        <div className="relative space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-live/25 bg-live/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-live">
            <Flame size={14} aria-hidden="true" /> Trending now
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Trending radio stations
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-foreground-muted sm:text-lg">
            A current sample of stations that listeners are opening through the directory. Ranking uses public
            directory click counts, not SYNTV RADIO listener numbers, and it can change as the directory updates.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1 text-sm text-foreground-muted">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/35 px-3 py-1.5">
              <TrendingUp size={14} aria-hidden="true" />
              <strong className="text-foreground">{stations.length}</strong> stations in this sample
            </span>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/stations" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
              <Radio size={16} aria-hidden="true" /> All stations
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-5 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/[0.06]">
              <Search size={16} aria-hidden="true" /> Search stations
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="trending-list" className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Directory sample</p>
          <h2 id="trending-list" className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Popular stations right now
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-foreground-muted">
            Each card shows the station&rsquo;s own metadata. Press Play to connect directly to the station&rsquo;s
            stream. If a station does not play, it may be offline, geo-restricted, or using an unsupported format.
          </p>
        </div>
        {stations.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stations.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-border bg-surface/40 p-6 text-muted-foreground">
            The trending list is temporarily unavailable. Please try again later or{" "}
            <Link href="/stations" className="text-primary hover:underline">browse all stations</Link>.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border/70 bg-surface/30 p-5 text-sm leading-relaxed text-foreground-muted">
        <p>
          Looking for something specific? Browse by{" "}
          <Link href="/countries" className="text-primary hover:underline">country</Link> or{" "}
          <Link href="/genres" className="text-primary hover:underline">genre</Link>. Trending rankings are provided by
          the Radio Browser directory and are not an official audience measurement or a paid placement.
        </p>
      </section>
    </div>
  );
}
