"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Heart, Clock, Radio, Timer } from "lucide-react";
import { usePlayer } from "@/components/player/player-provider";
import { StationCard } from "@/components/station/station-card";
import { getListeningStats, type ListeningStats } from "@/lib/storage/preferences";
import { useI18n } from "@/lib/i18n";

export default function StatsPage() {
  const { favorites, recents } = usePlayer();
  const { t } = useI18n();
  const [listening, setListening] = useState<ListeningStats>({ totalSeconds: 0, sessions: 0 });

  useEffect(() => {
    const refresh = () => setListening(getListeningStats());
    refresh();
    const id = window.setInterval(refresh, 15000);
    return () => window.clearInterval(id);
  }, []);

  const topCountries = useMemo(() => {
    const counts = new Map<string, number>();
    [...favorites, ...recents].forEach((s) => {
      if (s.country) counts.set(s.country, (counts.get(s.country) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [favorites, recents]);

  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    [...favorites, ...recents].forEach((s) => s.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [favorites, recents]);

  const hours = Math.floor(listening.totalSeconds / 3600);
  const mins = Math.floor((listening.totalSeconds % 3600) / 60);
  const stats = [
    { label: t("favorites"), value: String(favorites.length), icon: Heart },
    { label: t("recentlyPlayed"), value: String(recents.length), icon: Clock },
    { label: t("listeningTime"), value: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`, icon: Timer },
    { label: t("sessions"), value: String(listening.sessions), icon: Radio },
  ];

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          <BarChart3 size={14} aria-hidden="true" /> {t("yourListening")}
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{t("listeningStats")}</h1>
        <p className="max-w-2xl text-foreground-muted">{t("statsDesc")}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Stats summary">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border/70 bg-surface/50 p-5 backdrop-blur-sm shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon size={16} aria-hidden="true" />{label}</div>
            <p className="mt-3 font-display text-3xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border/70 bg-surface/40 p-5 backdrop-blur-sm shadow-[var(--shadow-sm)]">
          <h2 className="font-display text-lg font-semibold text-foreground">{t("topCountries")}</h2>
          <div className="mt-4 space-y-3">
            {topCountries.length ? topCountries.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">{name}</span>
                <span className="font-medium text-foreground">{count}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">{t("noCountryStats")}</p>}
          </div>
        </section>
        <section className="rounded-2xl border border-border/70 bg-surface/40 p-5 backdrop-blur-sm shadow-[var(--shadow-sm)]">
          <h2 className="font-display text-lg font-semibold text-foreground">{t("topGenres")}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {topTags.length ? topTags.map(([name, count]) => (
              <span key={name} className="rounded-full border border-border bg-foreground/[0.03] px-3 py-1 text-sm text-foreground-muted">
                {name} <span className="text-primary">{count}</span>
              </span>
            )) : <p className="text-sm text-muted-foreground">{t("noGenreStats")}</p>}
          </div>
        </section>
      </div>

      {favorites.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">{t("favoriteStations")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.slice(0, 6).map((station) => <StationCard key={station.id} station={station} />)}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border/70 bg-surface/40 p-5 backdrop-blur-sm shadow-[var(--shadow-sm)]">
        <h2 className="font-display text-lg font-semibold text-foreground">{t("syncLocalOnly")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("syncDesc")}</p>
      </section>
    </div>
  );
}
