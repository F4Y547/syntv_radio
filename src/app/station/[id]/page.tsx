import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Signal, Languages, Heart } from "lucide-react";
import { getStationById } from "@/lib/api/radio-browser";
import { StationDetailActions } from "@/components/station/station-detail-actions";
import { StationFavicon } from "@/components/station/station-favicon";
import { StationListenerStats } from "@/components/listeners/station-listener-stats";
import { countrySlug, genreSlug } from "@/lib/seo/slugs";

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const station = await getStationById(id);
  if (!station) {
    return {
      title: "Station not found",
      robots: { index: false, follow: false },
    };
  }

  const title = `${station.name} — Listen Live Online`;
  const description = `Listen to ${station.name} live${station.country ? ` from ${station.country}` : ""} on SYNTV RADIO. Stream free online radio${station.tags.length ? ` with ${station.tags.slice(0, 3).join(", ")} music` : ""}.`;
  const url = `/station/${station.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${station.name} | SYNTV RADIO`,
      description,
      url,
      type: "music.radio_station",
      siteName: "SYNTV RADIO",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${station.name} on SYNTV RADIO` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${station.name} | SYNTV RADIO`,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function StationPage({ params }: Props) {
  const { id } = await params;
  const station = await getStationById(id);
  if (!station) notFound();

  const siteUrl = "https://syntv.online";
  const stationUrl = `${siteUrl}/station/${station.id}`;
  const radioJsonLd = {
    "@context": "https://schema.org",
    "@type": "RadioStation",
    name: station.name,
    url: stationUrl,
    description: `Listen to ${station.name} live${station.country ? ` from ${station.country}` : ""} on SYNTV RADIO.`,
    ...(station.homepage ? { sameAs: [station.homepage] } : {}),
    ...(station.country ? { areaServed: station.country } : {}),
    ...(station.language ? { inLanguage: station.language } : {}),
    ...(station.tags.length ? { genre: station.tags } : {}),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Stations", item: `${siteUrl}/stations` },
      { "@type": "ListItem", position: 3, name: station.name, item: stationUrl },
    ],
  };

  const meta = [
    { icon: MapPin, label: "Country", value: station.country || "Unknown" },
    { icon: Languages, label: "Language", value: station.language || "Unknown" },
    { icon: Signal, label: "Quality", value: [station.codec, station.bitrate ? `${station.bitrate} kbps` : null].filter(Boolean).join(" · ") || "Unknown" },
    { icon: Heart, label: "Votes", value: String(station.votes) },
  ];

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(radioJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-foreground">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/stations" className="hover:text-foreground">Stations</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground truncate max-w-[240px]">{station.name}</li>
        </ol>
      </nav>

      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-surface/30 p-6 shadow-[var(--shadow-lg)] backdrop-blur-sm sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_70%_30%,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent_55%),radial-gradient(ellipse_45%_45%_at_20%_80%,color-mix(in_srgb,var(--color-live)_7%,transparent),transparent_55%)]" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-soft text-primary shadow-[var(--shadow-glow)] sm:h-32 sm:w-32">
            <StationFavicon src={station.favicon} alt={`${station.name} logo`} size={40} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-live" aria-hidden="true" /> Live station
            </p>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">{station.name}</h1>
            <p className="mt-3 max-w-2xl text-foreground-muted">
              {[station.country, station.state].filter(Boolean).join(", ") || "Global"}{station.tags.length ? ` · ${station.tags.slice(0, 4).join(", ")}` : ""}
            </p>
            <div className="mt-6">
              <StationDetailActions station={station} />
            </div>
          </div>
        </div>
      </section>

      <StationListenerStats stationId={station.id} stationName={station.name} stationLogo={station.favicon} />

      <section aria-labelledby="station-details" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <h2 id="station-details" className="sr-only">Station details</h2>
        {meta.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-surface/50 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon size={16} aria-hidden="true" /> {label}
            </div>
            <p className="mt-2 font-display text-lg font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border/70 bg-surface/40 p-5 backdrop-blur-sm shadow-[var(--shadow-sm)]">
        <h2 className="font-display text-lg font-semibold text-foreground">Stream information</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Stream URL</dt><dd className="mt-1 break-all text-foreground">{station.urlResolved || station.url}</dd></div>
          <div>
            <dt className="text-muted-foreground">Tags</dt>
            <dd className="mt-1 text-foreground">
              {station.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {station.tags.map((tag) => (
                    <Link key={tag} href={`/genre/${genreSlug(tag)}`} className="rounded-full border border-border bg-foreground/[0.03] px-2 py-0.5 text-xs text-foreground-muted hover:border-primary/30 hover:text-foreground">
                      {tag}
                    </Link>
                  ))}
                </div>
              ) : "No tags"}
            </dd>
          </div>
          <div><dt className="text-muted-foreground">Status</dt><dd className="mt-1 text-foreground">{station.isOnline ? "Reported online" : "Status unknown"}</dd></div>
          <div><dt className="text-muted-foreground">Clicks</dt><dd className="mt-1 text-foreground">{station.clickCount.toLocaleString()}</dd></div>
        </dl>
        {(station.country || station.countryCode) && (
          <div className="mt-4 border-t border-border/60 pt-4 text-sm">
            <span className="text-muted-foreground">Browse more: </span>
            {station.countryCode && (
              <Link href={`/country/${countrySlug(station.country || station.countryCode, station.countryCode)}`} className="text-primary hover:underline">
                Radio stations in {station.country || station.countryCode}
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
