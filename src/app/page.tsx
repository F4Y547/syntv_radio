import { Suspense } from "react";
import Link from "next/link";
import { StationBrowser } from "@/components/station/station-browser";
import { StationGridSkeleton } from "@/components/station/station-card-skeleton";
import { getCachedCountries, getCachedTags } from "@/lib/seo/data";
import { countrySlug, genreSlug } from "@/lib/seo/slugs";

async function BrowseDirectoryLinks() {
  const [countries, tags] = await Promise.all([
    getCachedCountries().catch(() => []),
    getCachedTags().catch(() => []),
  ]);
  const topCountries = countries.slice(0, 12);
  const topGenres = tags.slice(0, 12);
  if (topCountries.length === 0 && topGenres.length === 0) return null;
  return (
    <section aria-labelledby="browse-directory" className="space-y-6 pt-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Directory</p>
        <h2 id="browse-directory" className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Browse radio by country and genre
        </h2>
        <p className="mt-2 max-w-2xl text-foreground-muted">
          Explore live online radio stations by location or music style. Visit the{" "}
          <Link href="/stations" className="text-primary hover:underline">station directory</Link> for more.
        </p>
      </div>
      {topCountries.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Popular countries</h3>
          <div className="flex flex-wrap gap-2">
            {topCountries.map((c) => (
              <Link key={c.code} href={`/country/${countrySlug(c.name, c.code)}`} className="rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5 text-sm text-foreground-muted hover:border-primary/30 hover:text-foreground">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      {topGenres.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Popular genres</h3>
          <div className="flex flex-wrap gap-2">
            {topGenres.map((g) => (
              <Link key={g.name} href={`/genre/${genreSlug(g.name)}`} className="rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5 text-sm text-foreground-muted hover:border-primary/30 hover:text-foreground">
                {g.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function Home() {
  return (
    <div className="space-y-10">
      <Suspense
        fallback={
          <div className="space-y-10" role="status" aria-label="Loading">
            <div className="h-[420px] rounded-[2rem] border border-border/70 bg-surface/25 skeleton" />
            <StationGridSkeleton count={6} />
          </div>
        }
      >
        <StationBrowser />
      </Suspense>
      <Suspense fallback={null}>
        <BrowseDirectoryLinks />
      </Suspense>
    </div>
  );
}
