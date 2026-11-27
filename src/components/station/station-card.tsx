"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Pause, Heart, Radio, LoaderCircle, Signal } from "lucide-react";
import type { Station } from "@/types/station";
import { usePlayer } from "@/components/player/player-provider";
import { useListenerCounts } from "@/components/listeners/listener-counts-provider";

interface StationCardProps {
  station: Station;
}

export function StationCard({ station }: StationCardProps) {
  const { currentStation, status, playStation, togglePlay, toggleFavorite, isFavorite } = usePlayer();
  const { stationCounts, status: listenerStatus } = useListenerCounts();
  const [imgFailed, setImgFailed] = useState(false);
  const isCurrent = currentStation?.id === station.id;
  const isPlaying = isCurrent && status === "playing";
  const isLoading = isCurrent && status === "loading";
  const favorite = isFavorite(station.id);
  const listeners = stationCounts[station.id];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset image fallback when favicon changes
    setImgFailed(false);
  }, [station.favicon]);

  const handlePlay = () => {
    if (isCurrent) {
      void togglePlay();
      return;
    }
    void playStation(station);
  };

  const meta = [station.country, station.language].filter(Boolean).join(" • ");

  return (
    <article
      className={`group relative flex h-full min-h-[188px] flex-col overflow-hidden rounded-[var(--card-radius)] border bg-[image:var(--card-bg)] p-4 backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/45 hover:shadow-[var(--card-shadow-hover)] focus-within:border-primary/45 ${
        isCurrent
          ? "border-primary/45 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-primary)_24%,transparent),0_16px_40px_color-mix(in_srgb,var(--color-primary)_12%,transparent)]"
          : "border-[var(--card-border)] shadow-[var(--card-shadow)]"
      }`}
    >
      {isCurrent && (
        <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
          <Signal size={12} aria-hidden="true" className={isPlaying ? "animate-pulse" : ""} />
          {isLoading ? "Connecting" : isPlaying ? "Now Playing" : "Selected"}
        </div>
      )}

      <div className={`flex min-w-0 items-start gap-3 ${isCurrent ? "pr-24 sm:pr-20" : ""}`}>
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 text-primary ring-1 ring-white/5 sm:h-16 sm:w-16">
          {station.favicon && !imgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={station.favicon}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-elevated/60">
              <Radio size={24} aria-hidden="true" />
            </div>
          )}
          {isPlaying && (
            <span className="absolute inset-0 rounded-xl ring-2 ring-inset ring-primary/50" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-semibold leading-snug text-foreground">
            <Link
              href={`/station/${station.id}`}
              className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {station.name}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{meta || "Global station"}</p>
          {typeof listeners === "number" ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-foreground-muted">
              <span className={`inline-flex h-1.5 w-1.5 rounded-full ${listeners > 0 ? "bg-live animate-pulse" : "bg-muted-foreground/50"}`} aria-hidden="true" />
              <span className={listeners > 0 ? "text-live" : ""}>{listeners.toLocaleString()} listening</span>
            </p>
          ) : listenerStatus === "unavailable" ? (
            <p className="mt-1 text-xs text-muted-foreground">Live count unavailable</p>
          ) : null}
          <div className="mt-2 flex min-h-[28px] flex-wrap gap-1.5">
            {station.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="max-w-[120px] truncate rounded-full border border-border/80 bg-foreground/[0.03] px-2 py-0.5 text-[11px] text-foreground-muted"
              >
                {tag}
              </span>
            ))}
            {station.bitrate > 0 && (
              <span className="rounded-full border border-border/80 bg-foreground/[0.03] px-2 py-0.5 text-[11px] text-foreground-muted">
                {station.bitrate} kbps
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <button
          type="button"
          onClick={handlePlay}
          className="inline-flex min-h-11 min-w-[44px] items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_color-mix(in_srgb,var(--color-primary)_24%,transparent)] transition-all duration-200 hover:-translate-y-px hover:bg-primary-hover hover:shadow-[0_12px_32px_color-mix(in_srgb,var(--color-primary)_30%,transparent)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5"
          aria-label={isPlaying ? `Pause ${station.name}` : `Play ${station.name}`}
          aria-pressed={isPlaying}
        >
          {isLoading ? (
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
          ) : isPlaying ? (
            <Pause size={16} aria-hidden="true" />
          ) : (
            <Play size={16} className="ml-0.5" aria-hidden="true" />
          )}
          {isLoading ? "Connecting" : isPlaying ? "Playing" : "Play"}
        </button>

        <button
          type="button"
          onClick={() => toggleFavorite(station)}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            favorite
              ? "border-primary/30 bg-primary-soft text-primary"
              : "border-border bg-foreground/[0.03] text-foreground-muted hover:border-primary/30 hover:text-primary"
          }`}
          aria-label={favorite ? `Remove ${station.name} from favorites` : `Add ${station.name} to favorites`}
          aria-pressed={favorite}
        >
          <Heart size={18} aria-hidden="true" className={favorite ? "fill-current" : ""} />
        </button>
      </div>
    </article>
  );
}
