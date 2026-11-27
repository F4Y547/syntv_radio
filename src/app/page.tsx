import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Globe2, Headphones, Heart, ListMusic, Radio, Search, Smartphone } from "lucide-react";
import { StationBrowser } from "@/components/station/station-browser";
import { StationGridSkeleton } from "@/components/station/station-card-skeleton";
import { FaqList } from "@/components/content/faq-list";
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
          <Link href="/stations" className="text-primary hover:underline">station directory</Link> for the full list.
        </p>
      </div>
      {topCountries.length > 0 && (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Popular countries</h3>
            <Link href="/countries" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              All countries <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
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
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Popular genres</h3>
            <Link href="/genres" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              All genres <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {topGenres.map((g) => (
              <Link key={g.name} href={`/genre/${genreSlug(g.name)}`} className="rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5 text-sm capitalize text-foreground-muted hover:border-primary/30 hover:text-foreground">
                {g.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

const discoveryPaths = [
  {
    icon: Search,
    title: "Search by name or detail",
    text: "Search a station name, city, language, or tag. Results update as you type, so you can move from a half-remembered name to a live stream quickly.",
  },
  {
    icon: Globe2,
    title: "Browse by place or style",
    text: "Use the country and genre directories when you do not have a station in mind. Each page shows real directory records and links to related places and styles.",
  },
  {
    icon: Heart,
    title: "Keep a personal shortlist",
    text: "Save favorites, build collections, and return to recently played stations. The library is stored in your browser, not in an account or a cloud profile.",
  },
];

const listeningFeatures = [
  {
    icon: Headphones,
    title: "Direct streams",
    text: "Playback connects your browser directly to the station. SYNTV RADIO does not re-broadcast or host the audio.",
  },
  {
    icon: Smartphone,
    title: "Phone, tablet, desktop",
    text: "The responsive player works across screen sizes and can be installed as a progressive web app in a compatible browser.",
  },
  {
    icon: ListMusic,
    title: "No account required",
    text: "There is no sign-up wall. Volume, favorites, collections, theme, language, and listening stats stay on your device.",
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
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

      <section aria-labelledby="discover-heading" className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">A simpler way to explore</p>
          <h2 id="discover-heading" className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Find live radio without fighting the interface
          </h2>
          <p className="mt-3 leading-relaxed text-foreground-muted">
            SYNTV RADIO is a free radio directory and web player. It is designed for the moment when you know roughly
            what you want &mdash; a country, a style, a language, or a station name &mdash; and want to start listening
            without creating an account. Browse the world map, open a country or genre page, or search directly from
            the homepage.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {discoveryPaths.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border/70 bg-surface/25 p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary-soft text-primary">
                <Icon size={18} aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-display text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="how-it-works" className="rounded-[2rem] border border-border/70 bg-surface/25 p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">How it works</p>
            <h2 id="how-it-works" className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              A directory in front of independent broadcasters
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground-muted">
              <p>
                Station names, countries, languages, tags, logos, and stream addresses come from the community-run
                Radio Browser directory. SYNTV RADIO requests that metadata through its own server routes, organizes
                it into browsable pages, and adds original guidance about the service.
              </p>
              <p>
                When you press Play, your browser connects to the selected station&rsquo;s own stream. The station
                remains responsible for its audio, schedule, music, news, advertising, and availability. We do not
                claim ownership of station content and do not represent that we hold broadcasting or music licences
                for those streams.
              </p>
              <p>
                Live listener counts show active SYNTV RADIO playback sessions only. They are not a station&rsquo;s
                global audience, official ratings, or a count of listeners on other platforms.
              </p>
            </div>
            <p className="mt-4 text-sm">
              <Link href="/about" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                Read more about the project <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {listeningFeatures.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-border/60 bg-background/30 p-4">
                <div className="flex items-start gap-3">
                  <Icon size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="home-faq" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Questions</p>
            <h2 id="home-faq" className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Before you press play
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
              Short answers about listening, saved stations, unavailable streams, and how listings work.
            </p>
          </div>
          <Link href="/faq" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-foreground/[0.03] px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/[0.06]">
            All questions <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <FaqList limit={5} />
      </section>

      <section aria-labelledby="editorial-note" className="rounded-2xl border border-border/70 bg-surface/30 p-5 text-sm leading-relaxed text-foreground-muted sm:p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary-soft text-primary">
            <Radio size={16} aria-hidden="true" />
          </span>
          <div>
            <h2 id="editorial-note" className="font-display text-base font-semibold text-foreground">
              Editorial note and corrections
            </h2>
            <p className="mt-1.5">
              We aim to describe the service accurately and do not publish invented reviews, fake ratings, or
              made-up audience figures. If a station is mislabelled, offline, duplicated, or no longer operating, the
              station owner or a listener can ask for the listing to be reviewed. See the{" "}
              <Link href="/disclaimer" className="text-primary hover:underline">Disclaimer</Link> for how third-party
              listings work, or use the <Link href="/contact" className="text-primary hover:underline">contact form</Link>{" "}
              to report an issue.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
