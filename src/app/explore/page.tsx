"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Globe2, Radio, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const GlobeMap = dynamic(() => import("@/components/explore/globe-map").then((m) => m.GlobeMap), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-2xl border border-border bg-surface/40" />,
});

interface Country { name: string; code: string; stationCount: number }

export default function ExplorePage() {
  const { t } = useI18n();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const topCountries = countries.slice(0, 60);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          <Globe2 size={14} aria-hidden="true" /> {t("worldExplorer")}
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{t("exploreByCountry")}</h1>
        <p className="max-w-2xl text-foreground-muted">{t("exploreDesc")}</p>
      </section>

      {loading ? (
        <div className="h-[calc(100dvh-14rem)] min-h-[480px] animate-pulse rounded-2xl border border-border bg-surface" />
      ) : (
        <>
          <GlobeMap countries={countries} className="h-[calc(100dvh-14rem)] min-h-[480px]" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {topCountries.map((c) => (
            <Link
              key={c.code}
              href={`/?country=${encodeURIComponent(c.code)}`}
              className="group flex items-center justify-between rounded-2xl border border-border/70 bg-surface/40 p-5 backdrop-blur-sm shadow-[var(--shadow-sm)] transition hover:border-primary/40 hover:bg-primary-soft/20"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Radio size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display font-semibold text-foreground">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.stationCount.toLocaleString()} {t("stations")}</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-muted-foreground transition group-hover:text-primary" aria-hidden="true" />
            </Link>
          ))}
          </div>
        </>
      )}
    </div>
  );
}
