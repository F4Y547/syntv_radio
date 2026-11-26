"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Globe2, Radio, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { countrySlug } from "@/lib/seo/slugs";

const GlobeMap = dynamic(() => import("@/components/explore/globe-map").then((m) => m.GlobeMap), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-2xl border border-border bg-surface/40" />,
});

interface Country { name: string; code: string; stationCount: number }

export function ExploreClient({ initialCountries }: { initialCountries: Country[] }) {
  const { t } = useI18n();
  const [countries, setCountries] = useState<Country[]>(initialCountries);
  const [loading, setLoading] = useState(initialCountries.length === 0);

  useEffect(() => {
    if (initialCountries.length > 0) return;
    let cancelled = false;
    fetch("/api/filters")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load filters");
        return r.json();
      })
      .then((d) => {
        if (!cancelled) setCountries(d.countries ?? []);
      })
      .catch(() => {
        if (!cancelled) setCountries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialCountries.length]);

  const top = countries.slice(0, 24);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          <Globe2 size={14} aria-hidden="true" /> {t("worldAtlas")}
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t("exploreByCountry")}
        </h1>
        <p className="max-w-2xl text-foreground-muted">
          {t("exploreDesc")}
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface/20 shadow-[var(--shadow-sm)]" style={{ height: "min(70vh, 760px)", minHeight: "420px" }}>
        <GlobeMap countries={top} />
      </div>

      <section aria-labelledby="countries-heading" className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">{t("browse")}</p>
          <h2 id="countries-heading" className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("topCountriesRadio")}
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-surface" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {top.map((c) => (
              <Link
                key={c.code}
                href={`/country/${countrySlug(c.name, c.code)}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/40 px-4 py-3 transition hover:border-primary/30 hover:bg-surface-elevated/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-bold text-primary">
                    {c.code.slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <Radio size={12} className="mr-1 inline-block" aria-hidden="true" />
                      {c.stationCount.toLocaleString()} {t("stationsCount")}
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="shrink-0 text-muted-foreground transition group-hover:text-primary" aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}