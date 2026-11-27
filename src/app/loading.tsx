/**
 * Lightweight loading shell. Real station cards are server-rendered in the
 * page's Suspense fallback, so the initial HTML never shows a station skeleton
 * as the only content.
 */
export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading content">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-surface/25 p-6 sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_68%_28%,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent_55%)]" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">SYNTV RADIO</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Discover live radio from around the world
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
            Preparing the live directory. Browse by country, style, or search as soon as the stations are ready.
          </p>
        </div>
      </section>
      <span className="sr-only">Loading content…</span>
    </div>
  );
}
