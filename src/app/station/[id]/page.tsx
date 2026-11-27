import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, Signal, Languages, Heart, Info, ShieldCheck } from "lucide-react";
import { getStationById } from "@/lib/api/radio-browser";
import { getCountryStations, getCachedTopStations } from "@/lib/seo/data";
import { StationDetailActions } from "@/components/station/station-detail-actions";
import { StationFavicon } from "@/components/station/station-favicon";
import { StationListenerStats } from "@/components/listeners/station-listener-stats";
import { StationCard } from "@/components/station/station-card";
import { jsonLd } from "@/lib/seo/json-ld";
import { countrySlug, genreSlug } from "@/lib/seo/slugs";
import { absoluteUrl, siteName, siteUrl } from "@/lib/seo/site";

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

  const relatedStations = (
    station.countryCode
      ? await getCountryStations(station.countryCode, 12).catch(() => [])
      : await getCachedTopStations(12).catch(() => [])
  )
    .filter((item) => item.id !== station.id)
    .slice(0, 4);

  const stationUrl = absoluteUrl(`/station/${station.id}`);
  const reportHref = `/contact?topic=station-owner&station=${encodeURIComponent(station.name)}`;
  const countryHref = station.countryCode
    ? `/country/${countrySlug(station.country || station.countryCode, station.countryCode)}`
    : null;

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

  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Stations", item: `${siteUrl}/stations` },
    ...(countryHref && station.country
      ? [{ "@type": "ListItem", position: 3, name: station.country, item: absoluteUrl(countryHref) }]
      : []),
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      ...breadcrumbItems,
      {
        "@type": "ListItem",
        position: breadcrumbItems.length + 1,
        name: station.name,
        item: stationUrl,
      },
    ],
  };

  const meta = [
    { icon: MapPin, label: "Country", value: station.country || "Unknown" },
    { icon: Languages, label: "Language", value: station.language || "Unknown" },
    { icon: Signal, label: "Quality", value: [station.codec, station.bitrate ? `${station.bitrate} kbps` : null].filter(Boolean).join(" · ") || "Unknown" },
    { icon: Heart, label: "Directory votes", value: String(station.votes) },
  ];

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(radioJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-foreground">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/stations" className="hover:text-foreground">Stations</Link></li>
          {countryHref && station.country && (
            <>
              <li aria-hidden="true">/</li>
              <li><Link href={countryHref} className="hover:text-foreground">{station.country}</Link></li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li className="max-w-[240px] truncate text-foreground">{station.name}</li>
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
              <span className={`h-1.5 w-1.5 rounded-full ${station.isOnline ? "bg-live" : "bg-muted-foreground"}`} aria-hidden="true" />
              {station.isOnline ? "Reported online" : "Directory listing"}
            </p>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">{station.name}</h1>
            <p className="mt-3 max-w-2xl text-foreground-muted">
              {[station.country, station.state].filter(Boolean).join(", ") || "Global"}
              {station.tags.length ? ` · ${station.tags.slice(0, 4).join(", ")}` : ""}
            </p>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Directory listing. The station operates its own stream and remains responsible for its content,
              schedule, and availability.
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
          <div><dt className="text-muted-foreground">Stream address</dt><dd className="mt-1 break-all text-foreground">{station.urlResolved || station.url}</dd></div>
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
          <div><dt className="text-muted-foreground">Directory status</dt><dd className="mt-1 text-foreground">{station.isOnline ? "Reported online" : "Status unknown"}</dd></div>
          <div><dt className="text-muted-foreground">Directory clicks</dt><dd className="mt-1 text-foreground">{station.clickCount.toLocaleString()}</dd></div>
        </dl>
        {(station.country || station.countryCode) && countryHref && (
          <div className="mt-4 border-t border-border/60 pt-4 text-sm">
            <span className="text-muted-foreground">Browse more: </span>
            <Link href={countryHref} className="text-primary hover:underline">
              Radio stations in {station.country || station.countryCode}
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="listing-context" className="rounded-2xl border border-border/70 bg-surface/30 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary-soft text-primary">
            <Info size={17} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="listing-context" className="font-display text-lg font-semibold text-foreground">
              About this listing
            </h2>
            <div className="mt-2 space-y-3 text-sm leading-relaxed text-foreground-muted">
              <p>
                SYNTV RADIO is a discovery directory, not the broadcaster. This page indexes metadata supplied through
                the community-run{" "}
                <a href="https://www.radio-browser.info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Radio Browser
                </a>{" "}
                service. The station name, logo, programmes, music, and stream belong to their respective owners.
              </p>
              <p>
                When you press Play, your browser connects directly to the station&rsquo;s stream server. We do not
                host, re-broadcast, or control the audio. A &ldquo;reported online&rdquo; label is a directory field,
                not a guarantee that playback will work in your browser or region.
              </p>
              <p>
                Listener figures on this page count active SYNTV RADIO playback sessions only. They are not the
                station&rsquo;s global audience, official ratings, or a count of listeners on other platforms.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link href={reportHref} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-foreground/[0.03] px-3.5 py-2 font-medium text-foreground hover:bg-foreground/[0.06]">
                <ShieldCheck size={15} aria-hidden="true" /> Report or correct this listing
              </Link>
              <Link href="/disclaimer" className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 font-medium text-primary hover:underline">
                Read the disclaimer <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {relatedStations.length > 0 && (
        <section aria-labelledby="related-stations" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="related-stations" className="font-display text-xl font-semibold text-foreground">
                {station.country ? `More stations from ${station.country}` : "More stations to explore"}
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                Other directory listings{countryHref ? " from the same country" : " from the current trending sample"}.
              </p>
            </div>
            {countryHref && (
              <Link href={countryHref} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View country page <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {relatedStations.map((item) => (
              <StationCard key={item.id} station={item} />
            ))}
          </div>
        </section>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Listing information can change without notice. If you are the station owner or an authorized representative,
        use the <Link href={reportHref} className="text-primary hover:underline">report link</Link> to request a
        correction or removal. See our <Link href="/contact" className="text-primary hover:underline">contact page</Link>{" "}
        for what to include. {siteName} is an independent directory and is not affiliated with {station.name} unless a
        page clearly says otherwise.
      </p>
    </div>
  );
}
