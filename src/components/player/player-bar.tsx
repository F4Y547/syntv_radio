"use client";

import { useEffect, useRef, useState } from "react";
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
  ChevronDown,
  ExternalLink,
  X,
} from "lucide-react";
import { usePlayer } from "./player-provider";
import { Equalizer } from "./equalizer";
import { CanvasVisualizer } from "./canvas-visualizer";
import { useListenerCounts } from "@/components/listeners/listener-counts-provider";
import { useFocusTrap } from "@/lib/use-focus-trap";

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
  const { stationCounts } = useListenerCounts();
  const [sleepMenuOpen, setSleepMenuOpen] = useState(false);
  const [expandedSleepMenu, setExpandedSleepMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sleepRemaining, setSleepRemaining] = useState<string | null>(null);
  const [showViz, setShowViz] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const expandedRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(expanded, expandedRef);

  const currentListeners = currentStation ? stationCounts[currentStation.id] : undefined;
  const isPlaying = status === "playing";
  const isLoading = status === "loading";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset image fallback when station changes
    setImgFailed(false);
  }, [currentStation?.favicon]);

  useEffect(() => {
    if (!sleepTimerEnd) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear display when timer removed
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

  useEffect(() => {
    if (!expanded) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const t = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [expanded]);

  const artwork = currentStation?.favicon && !imgFailed ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentStation.favicon}
      alt=""
      className="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
      onError={() => setImgFailed(true)}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-primary-soft text-primary">
      <Radio size={expanded ? 56 : 20} aria-hidden="true" className={isPlaying ? "animate-pulse" : ""} />
    </div>
  );

  const statusLabel = isLoading ? "Connecting" : isPlaying ? "Live" : error ? "Error" : "Paused";
  const statusColor = error ? "text-error" : isPlaying ? "text-live" : "text-muted-foreground";

  return (
    <>
      <section
        aria-label="Audio player"
        className="fixed inset-x-0 z-50 border-t border-[var(--player-border)] bg-[var(--player-bg)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[var(--player-bg)] bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px))] md:bottom-0 md:pb-[env(safe-area-inset-bottom,0px)]"
        style={{ boxShadow: "var(--player-shadow)" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden="true" />

        {/* Compact mini-player */}
        <div className="container-page grid min-h-[var(--player-height)] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2 sm:gap-3 sm:py-2.5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <button
            type="button"
            onClick={() => { if (currentStation) setExpanded(true); }}
            className="flex min-w-0 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
            aria-label={currentStation ? `Open ${currentStation.name} player` : undefined}
            disabled={!currentStation}
          >
            <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary-soft text-primary transition-all duration-500 sm:h-12 sm:w-12 ${isPlaying ? "ring-2 ring-primary/35 ring-offset-2 ring-offset-background" : ""}`}>
              {artwork}
            </div>

            <div key={currentStation?.id ?? "empty"} className="min-w-0 animate-player-rise">
              <p className="truncate font-display text-sm font-semibold text-foreground sm:text-base">
                {currentStation?.name ?? "Select a station to start listening"}
              </p>
              <div className="mt-0.5 flex items-center gap-2 overflow-hidden text-xs text-muted-foreground sm:text-sm">
                {error ? (
                  <span className="inline-flex min-w-0 items-center gap-1 text-error">
                    <AlertCircle size={14} aria-hidden="true" className="shrink-0" />
                    <span className="truncate">{error}</span>
                  </span>
                ) : currentStation ? (
                  <>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 ${statusColor}`}>
                      <span className={`inline-flex h-2 w-2 rounded-full ${isPlaying ? "bg-live animate-pulse" : error ? "bg-error" : "bg-muted-foreground"}`} aria-hidden="true" />
                      <span className="hidden sm:inline"><Equalizer active={isPlaying} /></span>
                      <span>{statusLabel}</span>
                    </span>
                    {typeof currentListeners === "number" && (
                      <span className="hidden shrink-0 text-live/90 sm:inline">· {currentListeners.toLocaleString()} listening</span>
                    )}
                    <span className="truncate">{[currentStation.country, currentStation.tags?.[0]].filter(Boolean).join(" · ") || "World radio"}</span>
                  </>
                ) : (
                  <span className="truncate">Explore free live radio from around the world</span>
                )}
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {currentStation && (
              <button
                type="button"
                onClick={() => toggleFavorite(currentStation)}
                className={`hidden h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex ${
                  isFavorite(currentStation.id)
                    ? "border-primary/30 bg-primary-soft text-primary"
                    : "border-border bg-foreground/[0.03] text-foreground-muted hover:border-primary/30 hover:text-primary"
                }`}
                aria-label={isFavorite(currentStation.id) ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={isFavorite(currentStation.id)}
              >
                <Heart size={18} aria-hidden="true" className={isFavorite(currentStation.id) ? "fill-current" : ""} />
              </button>
            )}

            <button
              type="button"
              onClick={toggleMute}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-foreground/[0.03] text-foreground-muted transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
              aria-label={isMuted ? "Unmute" : "Mute"}
              aria-pressed={isMuted}
            >
              {isMuted || volume === 0 ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
            </button>

            <button
              type="button"
              onClick={() => void togglePlay()}
              disabled={!currentStation || isLoading}
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_color-mix(in_srgb,var(--color-primary)_28%,transparent)] transition duration-300 hover:scale-[1.03] hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isPlaying ? "animate-live-pulse" : ""}`}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? <LoaderCircle size={20} className="animate-spin" aria-hidden="true" /> : isPlaying ? <Pause size={20} aria-hidden="true" /> : <Play size={20} className="ml-0.5" aria-hidden="true" />}
            </button>
          </div>

          <div className="hidden items-center justify-end gap-2 md:flex lg:gap-3">
            <button
              type="button"
              onClick={() => setShowViz((v) => !v)}
              className={`inline-flex h-9 rounded-full px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${showViz ? "bg-primary-soft text-primary" : "text-foreground-muted hover:bg-foreground/[0.05] hover:text-foreground"}`}
              aria-pressed={showViz}
              aria-label="Viz"
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
                    <button key={m} type="button" onClick={() => { setSleepTimer(m); setSleepMenuOpen(false); }} className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-foreground hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{m} minutes</button>
                  ))}
                  {sleepTimerEnd && (
                    <button type="button" onClick={() => { clearSleepTimer(); setSleepMenuOpen(false); }} className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-error hover:bg-error-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Turn off</button>
                  )}
                </div>
              )}
            </div>
            <button type="button" onClick={toggleMute} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={isMuted ? "Unmute" : "Mute"} aria-pressed={isMuted}>
              {isMuted || volume === 0 ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
            </button>
            <label className="flex items-center gap-2">
              <span className="sr-only">Volume</span>
              <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume} onChange={(e) => setVolume(Number(e.target.value))} className="h-1.5 w-28 cursor-pointer accent-[var(--color-primary)] lg:w-32" aria-label="Volume" />
            </label>
          </div>
        </div>
        {showViz && currentStation && <div className="container-page hidden pb-2 md:block"><CanvasVisualizer active={isPlaying} /></div>}
      </section>

      {/* Expanded full-screen player */}
      {expanded && currentStation && (
        <div ref={expandedRef} className="fixed inset-0 z-[70] flex flex-col bg-background/95 backdrop-blur-2xl animate-player-rise" role="dialog" aria-modal="true" aria-label={`${currentStation.name} player`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,color-mix(in_srgb,var(--color-primary)_18%,transparent),transparent_60%),radial-gradient(ellipse_50%_40%_at_80%_100%,color-mix(in_srgb,var(--color-live)_10%,transparent),transparent_55%)]" aria-hidden="true" />
          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-[calc(env(safe-area-inset-top,0px)+1rem)] sm:px-8">
            <div className="flex items-center justify-between gap-3">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setExpanded(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-foreground/[0.03] text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Minimize player"
              >
                <ChevronDown size={22} aria-hidden="true" />
              </button>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Now playing</p>
              <div className="h-11 w-11" aria-hidden="true" />
            </div>

            <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-6 sm:py-8">
              <div className="mx-auto aspect-square w-full max-w-[min(20rem,70vw)] overflow-hidden rounded-[2rem] border border-primary/20 bg-surface shadow-[0_24px_80px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]">
                {artwork}
              </div>

              <div className="mt-8 text-center">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${error ? "border-error/30 bg-error-soft text-error" : "border-primary/20 bg-primary-soft text-primary"}`}>
                  <span className={`h-2 w-2 rounded-full ${isPlaying ? "bg-live animate-pulse" : error ? "bg-error" : "bg-muted-foreground"}`} aria-hidden="true" />
                  {statusLabel}
                  {typeof currentListeners === "number" && !error && <span className="normal-case tracking-normal text-foreground-muted">· {currentListeners.toLocaleString()} listening</span>}
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{currentStation.name}</h2>
                <p className="mt-2 text-sm text-foreground-muted sm:text-base">
                  {[currentStation.country, currentStation.language].filter(Boolean).join(" · ") || "Global station"}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                  {currentStation.codec && <span className="rounded-full border border-border/70 bg-foreground/[0.03] px-2.5 py-1">{currentStation.codec}</span>}
                  {currentStation.bitrate ? <span className="rounded-full border border-border/70 bg-foreground/[0.03] px-2.5 py-1">{currentStation.bitrate} kbps</span> : null}
                  {currentStation.tags?.slice(0, 3).map((t) => <span key={t} className="rounded-full border border-border/70 bg-foreground/[0.03] px-2.5 py-1">{t}</span>)}
                </div>
              </div>

              <div className="mt-6 flex justify-center"><Equalizer active={isPlaying} /></div>

              {error && (
                <div className="mt-6 rounded-xl border border-error/30 bg-error-soft p-4 text-sm text-error">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p>{error}</p>
                      <button type="button" onClick={() => void retry()} className="mt-2 inline-flex items-center gap-2 rounded-full border border-error/30 px-3 py-1.5 font-medium text-error hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        Retry stream
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex items-center justify-center gap-4 sm:gap-6">
                <button
                  type="button"
                  onClick={() => toggleFavorite(currentStation)}
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isFavorite(currentStation.id) ? "border-primary/30 bg-primary-soft text-primary" : "border-border bg-foreground/[0.03] text-foreground-muted hover:text-foreground"}`}
                  aria-label={isFavorite(currentStation.id) ? "Remove from favorites" : "Add to favorites"}
                  aria-pressed={isFavorite(currentStation.id)}
                >
                  <Heart size={22} aria-hidden="true" className={isFavorite(currentStation.id) ? "fill-current" : ""} />
                </button>

                <button
                  type="button"
                  onClick={() => void togglePlay()}
                  disabled={isLoading}
                  className={`inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_40px_color-mix(in_srgb,var(--color-primary)_30%,transparent)] transition hover:scale-[1.03] hover:bg-primary-hover active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isPlaying ? "animate-live-pulse" : ""}`}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isLoading ? <LoaderCircle size={32} className="animate-spin" aria-hidden="true" /> : isPlaying ? <Pause size={32} aria-hidden="true" /> : <Play size={32} className="ml-1" aria-hidden="true" />}
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setExpandedSleepMenu((v) => !v)}
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${sleepTimerEnd ? "border-primary/30 bg-primary-soft text-primary" : "border-border bg-foreground/[0.03] text-foreground-muted hover:text-foreground"}`}
                    aria-label="Sleep timer"
                    aria-expanded={expandedSleepMenu}
                  >
                    <Timer size={22} aria-hidden="true" />
                  </button>
                  {expandedSleepMenu && (
                    <div className="absolute bottom-full left-1/2 mb-2 w-44 -translate-x-1/2 rounded-xl border border-border bg-surface-elevated p-2 shadow-[var(--shadow-lg)]">
                      <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Sleep timer {sleepRemaining ? `(${sleepRemaining})` : ""}</p>
                      {[15, 30, 45, 60].map((m) => (
                        <button key={m} type="button" onClick={() => { setSleepTimer(m); setExpandedSleepMenu(false); }} className="block w-full rounded-lg px-2 py-2 text-left text-sm text-foreground hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{m} minutes</button>
                      ))}
                      {sleepTimerEnd && (
                        <button type="button" onClick={() => { clearSleepTimer(); setExpandedSleepMenu(false); }} className="block w-full rounded-lg px-2 py-2 text-left text-sm text-error hover:bg-error-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Turn off</button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={toggleMute} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-foreground/[0.03] text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={isMuted ? "Unmute" : "Mute"} aria-pressed={isMuted}>
                    {isMuted || volume === 0 ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
                  </button>
                  <label className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="sr-only">Volume</span>
                    <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume} onChange={(e) => setVolume(Number(e.target.value))} className="h-2 w-full cursor-pointer accent-[var(--color-primary)]" aria-label="Volume" />
                    <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                  {currentStation.homepage && (
                    <a href={currentStation.homepage} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-4 py-2 text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <ExternalLink size={16} aria-hidden="true" /> Station website
                    </a>
                  )}
                  <button type="button" onClick={() => setExpanded(false)} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-4 py-2 text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <X size={16} aria-hidden="true" /> Close player
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}