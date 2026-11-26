"use client";

import { useEffect, useState } from "react";
import {
  Pause,
  Play,
  Volume2,
  VolumeX,
  Radio,
  LoaderCircle,
  Heart,
  AlertCircle,
  Timer,
} from "lucide-react";
import { usePlayer } from "./player-provider";
import { Equalizer } from "./equalizer";
import { CanvasVisualizer } from "./canvas-visualizer";

export function PlayerBar() {
  const {
    currentStation,
    status,
    error,
    volume,
    isMuted,
    sleepTimerEnd,
    togglePlay,
    retry,
    setVolume,
    toggleMute,
    toggleFavorite,
    isFavorite,
    setSleepTimer,
    clearSleepTimer,
  } = usePlayer();
  const [sleepMenuOpen, setSleepMenuOpen] = useState(false);
  const [sleepRemaining, setSleepRemaining] = useState<string | null>(null);
  const [showViz, setShowViz] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset image fallback when station changes
    setImgFailed(false);
  }, [currentStation?.favicon]);

  useEffect(() => {
    if (!sleepTimerEnd) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- clear display when timer removed */
      setSleepRemaining(null);
      return;
    }
    const tick = () => {
      const ms = Math.max(0, sleepTimerEnd - Date.now());
      const totalMin = Math.ceil(ms / 60_000);
      setSleepRemaining(`${totalMin}m`);
      if (ms <= 0) setSleepRemaining(null);
    };
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [sleepTimerEnd]);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";

  return (
    <section
      aria-label="Audio player"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--player-border)] bg-[var(--player-bg)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[var(--player-bg)]"
      style={{ boxShadow: "var(--player-shadow)" }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" aria-hidden="true" />
      <div className="container-page grid min-h-[var(--player-height)] grid-cols-[1fr_auto] items-center gap-3 py-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-all duration-500 ${isPlaying ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : ""}`}>
            {currentStation?.favicon && !imgFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentStation.favicon}
                alt=""
                className="h-full w-full rounded-xl object-cover transition-opacity duration-500"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <Radio size={20} aria-hidden="true" className={isPlaying ? "animate-pulse" : ""} />
            )}
          </div>
          <div key={currentStation?.id ?? "empty"} className="min-w-0 animate-player-rise">
            <p className="truncate font-display text-sm font-semibold text-foreground sm:text-base">
              {currentStation?.name ?? "Select a station to start listening"}
            </p>
            {showViz && <div className="mt-1 hidden sm:block"><CanvasVisualizer active={isPlaying} /></div>}
            <div className="mt-0.5 flex flex-col gap-1">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                {error ? (
                  <span className="inline-flex items-center gap-2 text-error">
                    <span className="inline-flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      <span className="truncate">{error}</span>
                    </span>
                    {currentStation && (
                      <button type="button" onClick={() => void retry()} className="shrink-0 underline underline-offset-2 hover:text-foreground">Retry</button>
                    )}
                  </span>
                ) : currentStation ? (
                  <>
                    <span className="mr-2 inline-flex items-center gap-2 text-live">
                      <span className={`inline-flex h-2 w-2 rounded-full ${isPlaying ? "bg-live animate-pulse" : "bg-muted-foreground"}`} aria-hidden="true" />
                      <Equalizer active={isPlaying} />
                      {isLoading ? "Connecting" : isPlaying ? "Live" : "Paused"}
                    </span>
                    {[currentStation.country, currentStation.state, currentStation.language, currentStation.codec, currentStation.bitrate ? `${currentStation.bitrate} kbps` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </>
                ) : (
                  "Explore free live radio from around the world"
                )}
              </p>
              {currentStation && !error && (
                <div className="hidden items-center gap-1.5 overflow-hidden sm:flex">
                  {currentStation.tags.slice(0, 3).map((t) => (
                    <span key={t} className="shrink-0 rounded-full border border-border bg-foreground/[0.03] px-2 py-0.5 text-[11px] text-muted-foreground">
                      {t}
                    </span>
                  ))}
                  {currentStation.votes > 0 && (
                    <span className="shrink-0 text-[11px] text-muted-foreground">♥ {currentStation.votes.toLocaleString()}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentStation && (
            <button
              type="button"
              onClick={() => toggleFavorite(currentStation)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-foreground/[0.03] text-foreground-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={isFavorite(currentStation.id) ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={isFavorite(currentStation.id)}
            >
              <Heart
                size={18}
                aria-hidden="true"
                className={isFavorite(currentStation.id) ? "fill-primary text-primary" : ""}
              />
            </button>
          )}
          <button
            type="button"
            onClick={() => void togglePlay()}
            disabled={!currentStation || isLoading}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)] transition duration-300 hover:scale-105 hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isPlaying ? "animate-live-pulse" : ""}`}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
              <LoaderCircle size={20} className="animate-spin" aria-hidden="true" />
            ) : isPlaying ? (
              <Pause size={20} aria-hidden="true" />
            ) : (
              <Play size={20} className="ml-0.5" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="hidden items-center justify-end gap-3 md:flex">
          <button
            type="button"
            onClick={() => setShowViz((v) => !v)}
            className={`inline-flex h-9 rounded-full px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${showViz ? "bg-primary-soft text-primary" : "text-foreground-muted hover:bg-foreground/[0.05] hover:text-foreground"}`}
            aria-pressed={showViz}
            aria-label="Toggle visualizer"
          >
            Viz
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSleepMenuOpen((v) => !v)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${sleepTimerEnd ? "bg-primary-soft text-primary" : "text-foreground-muted hover:bg-foreground/[0.05] hover:text-foreground"}`}
              aria-label="Sleep timer"
              aria-expanded={sleepMenuOpen}
            >
              <Timer size={16} aria-hidden="true" />
              <span>{sleepRemaining ?? "Sleep"}</span>
            </button>
            {sleepMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-40 rounded-xl border border-border bg-surface-elevated p-2 shadow-[var(--shadow-lg)]">
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Sleep timer</p>
                {[15, 30, 45, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setSleepTimer(m); setSleepMenuOpen(false); }}
                    className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-foreground hover:bg-foreground/[0.05]"
                  >
                    {m} minutes
                  </button>
                ))}
                {sleepTimerEnd && (
                  <button
                    type="button"
                    onClick={() => { clearSleepTimer(); setSleepMenuOpen(false); }}
                    className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-error hover:bg-error-soft"
                  >
                    Turn off
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={isMuted ? "Unmute" : "Mute"}
            aria-pressed={isMuted}
          >
            {isMuted || volume === 0 ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
          </button>
          <label className="flex items-center gap-2">
            <span className="sr-only">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-1.5 w-32 cursor-pointer accent-[var(--color-primary)]"
              aria-label="Volume"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
