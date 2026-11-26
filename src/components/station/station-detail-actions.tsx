"use client";

import { useState } from "react";
import { Play, Pause, Heart, Share2, LoaderCircle, ExternalLink, Check } from "lucide-react";
import type { Station } from "@/types/station";
import { usePlayer } from "@/components/player/player-provider";

export function StationDetailActions({ station }: { station: Station }) {
  const { currentStation, status, playStation, togglePlay, toggleFavorite, isFavorite } = usePlayer();
  const [copied, setCopied] = useState(false);
  const isCurrent = currentStation?.id === station.id;
  const isPlaying = isCurrent && status === "playing";
  const isLoading = isCurrent && status === "loading";
  const favorite = isFavorite(station.id);

  const handlePlay = () => {
    if (isCurrent) {
      void togglePlay();
      return;
    }
    void playStation(station);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: station.name, text: `Listen to ${station.name} on SYNTV RADIO`, url });
        return;
      } catch {
        // fall back to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handlePlay}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={isPlaying ? `Pause ${station.name}` : `Play ${station.name}`}
      >
        {isLoading ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : isPlaying ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
        {isLoading ? "Connecting" : isPlaying ? "Playing" : "Play station"}
      </button>
      <button
        type="button"
        onClick={() => toggleFavorite(station)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-4 py-3 text-sm font-medium text-foreground transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-pressed={favorite}
      >
        <Heart size={18} aria-hidden="true" className={favorite ? "fill-primary text-primary" : ""} />
        {favorite ? "Saved" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => void handleShare()}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-4 py-3 text-sm font-medium text-foreground transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {copied ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
        {copied ? "Link copied" : "Share"}
      </button>
      {station.homepage && (
        <a
          href={station.homepage}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-4 py-3 text-sm font-medium text-foreground transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ExternalLink size={18} aria-hidden="true" /> Website
        </a>
      )}
    </div>
  );
}
