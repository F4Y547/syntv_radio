"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Pause, Heart, Radio, LoaderCircle } from "lucide-react";
import type { Station } from "@/types/station";
import { usePlayer } from "@/components/player/player-provider";

interface StationCardProps {
  station: Station;
}

export function StationCard({ station }: StationCardProps) {
  const { currentStation, status, playStation, togglePlay, toggleFavorite, isFavorite } = usePlayer();
  const [imgFailed, setImgFailed] = useState(false);
  const isCurrent = currentStation?.id === station.id;
  const isPlaying = isCurrent && status === "playing";
  const isLoading = isCurrent && status === "loading";
  const favorite = isFavorite(station.id);

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

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-[var(--card-radius)] border bg-[image:var(--card-bg)] p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--card-border-hover)] hover:shadow-[var(--card-shadow-hover)] ${
        isCurrent ? "border-primary/35 shadow-[var(--shadow-glow)]" : "border-[var(--card-border)] shadow-[var(--card-shadow)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-white/10">
          {station.favicon && !imgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={station.favicon}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Radio size={22} aria-hidden="true" />
            </div>
          )}
          {isCurrent && isPlaying && <span className="absolute inset-0 ring-2 ring-primary/40 ring-inset rounded-xl" aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-semibold text-foreground">
            <Link href={`/station/${station.id}`} className="hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
              {station.name}
            </Link>
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {[station.country, station.language].filter(Boolean).join(" • ") || "Global station"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {station.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-foreground/[0.03] px-2 py-0.5 text-[11px] text-foreground-muted"
              >
                {tag}
              </span>
            ))}
            {station.bitrate > 0 && (
              <span className="rounded-full border border-border bg-foreground/[0.03] px-2 py-0.5 text-[11px] text-foreground-muted">
                {station.bitrate} kbps
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handlePlay}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_color-mix(in_srgb,var(--color-primary)_25%,transparent)] transition-all duration-200 hover:-translate-y-px hover:bg-primary-hover hover:shadow-[0_12px_32px_color-mix(in_srgb,var(--color-primary)_30%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={isPlaying ? `Pause ${station.name}` : `Play ${station.name}`}
          aria-pressed={isPlaying}
        >
          {isLoading ? (
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
          ) : isPlaying ? (
            <Pause size={16} aria-hidden="true" />
          ) : (
            <Play size={16} aria-hidden="true" />
          )}
          {isLoading ? "Connecting" : isPlaying ? "Playing" : "Play"}
        </button>

        <button
          type="button"
          onClick={() => toggleFavorite(station)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-foreground/[0.03] text-foreground-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={favorite ? `Remove ${station.name} from favorites` : `Add ${station.name} to favorites`}
          aria-pressed={favorite}
        >
          <Heart size={18} aria-hidden="true" className={favorite ? "fill-primary text-primary" : ""} />
        </button>
      </div>
    </article>
  );
}
