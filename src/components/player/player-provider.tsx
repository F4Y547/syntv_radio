"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Station } from "@/types/station";
import {
  addRecent,
  getFavorites,
  getRecents,
  getListeningStats,
  getVolume,
  saveListeningStats,
  setVolume as persistVolume,
  toggleFavorite as persistToggleFavorite,
} from "@/lib/storage/preferences";
import { getPlaybackTracker } from "@/lib/listeners/playback-tracker";

type PlayerStatus = "idle" | "loading" | "playing" | "error";

interface PlayerContextValue {
  currentStation: Station | null;
  status: PlayerStatus;
  error: string | null;
  volume: number;
  isMuted: boolean;
  favorites: Station[];
  recents: Station[];
  sleepTimerEnd: number | null;
  playStation: (station: Station) => Promise<void>;
  togglePlay: () => Promise<void>;
  retry: () => Promise<void>;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFavorite: (station: Station) => void;
  isFavorite: (stationId: string) => boolean;
  setSleepTimer: (minutes: number) => void;
  clearSleepTimer: () => void;
  clearError: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

const MAX_AUTO_RECONNECTS = 3;
const RECONNECT_DELAYS_MS = [1500, 3500, 7000];

function canUseMediaSession() {
  return typeof navigator !== "undefined" && "mediaSession" in navigator;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playRequestRef = useRef(0);
  const isSwitchingRef = useRef(false);
  const currentStationRef = useRef<Station | null>(null);
  const statusRef = useRef<PlayerStatus>("idle");
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldAutoReconnectRef = useRef(false);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [favorites, setFavorites] = useState<Station[]>([]);
  const [recents, setRecents] = useState<Station[]>([]);
  const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null);

  const setStatusSafe = useCallback((next: PlayerStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate client-only storage after mount */
    setFavorites(getFavorites());
    setRecents(getRecents());
    setVolumeState(getVolume());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    currentStationRef.current = currentStation;
  }, [currentStation]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    if (!canUseMediaSession() || !currentStation) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentStation.name,
      artist: currentStation.country || "World Radio",
      album: "SYNTV RADIO",
      artwork: currentStation.favicon
        ? [{ src: currentStation.favicon, sizes: "512x512", type: "image/png" }]
        : [],
    });
  }, [currentStation]);

  useEffect(() => {
    if (!canUseMediaSession()) return;
    navigator.mediaSession.playbackState =
      status === "playing" ? "playing" : status === "loading" ? "playing" : "paused";
  }, [status]);

  const startPlaybackInternal = useCallback(async (station: Station, isReconnect = false) => {
    const audio = audioRef.current;
    if (!audio) return false;

    const requestId = ++playRequestRef.current;
    isSwitchingRef.current = true;
    clearReconnectTimer();
    if (!isReconnect) {
      reconnectAttemptsRef.current = 0;
      void getPlaybackTracker().stop("switch");
    }
    setError(null);
    setCurrentStation(station);
    setRecents(addRecent(station));

    const candidates = [station.urlResolved, station.url].filter(
      (url, i, arr): url is string => Boolean(url) && arr.indexOf(url) === i,
    );
    if (candidates.length === 0) {
      if (requestId === playRequestRef.current) {
        setStatusSafe("error");
        setError("This station does not have a playable stream URL.");
        isSwitchingRef.current = false;
        shouldAutoReconnectRef.current = false;
      }
      return false;
    }

    setStatusSafe("loading");
    shouldAutoReconnectRef.current = true;
    try {
      for (let i = 0; i < candidates.length; i += 1) {
        if (requestId !== playRequestRef.current) return false;
        const streamUrl = candidates[i];
        try {
          audio.pause();
          audio.src = streamUrl;
          audio.load();
          await audio.play();
          if (requestId !== playRequestRef.current) return false;
          // Status becomes "playing" on the onPlaying event to avoid claiming
          // playback before the browser has actually started audio output.
          const stats = getListeningStats();
          saveListeningStats({ ...stats, sessions: stats.sessions + (isReconnect ? 0 : 1), lastPlayedAt: Date.now() });
          return true;
        } catch (playError) {
          if (requestId !== playRequestRef.current) return false;
          console.error("Playback attempt failed", streamUrl, playError);
          if (i === candidates.length - 1) {
            setStatusSafe("error");
            setError("Unable to play this stream. It may be offline, blocked, or unavailable in your browser.");
            void getPlaybackTracker().stop("play-error");
            return false;
          }
        }
      }
      return false;
    } finally {
      if (requestId === playRequestRef.current) isSwitchingRef.current = false;
    }
  }, [clearReconnectTimer, setStatusSafe]);

  const playStation = useCallback(async (station: Station) => {
    reconnectAttemptsRef.current = 0;
    shouldAutoReconnectRef.current = true;
    await startPlaybackInternal(station, false);
  }, [startPlaybackInternal]);

  const retry = useCallback(async () => {
    const station = currentStationRef.current;
    if (!station) return;
    reconnectAttemptsRef.current = 0;
    shouldAutoReconnectRef.current = true;
    await startPlaybackInternal(station, false);
  }, [startPlaybackInternal]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    const station = currentStationRef.current;
    if (!audio || !station || isSwitchingRef.current) return;
    if (statusRef.current === "playing" || statusRef.current === "loading") {
      shouldAutoReconnectRef.current = false;
      clearReconnectTimer();
      audio.pause();
      setStatusSafe("idle");
      void getPlaybackTracker().stop("pause");
      return;
    }
    setError(null);
    shouldAutoReconnectRef.current = true;
    try {
      setStatusSafe("loading");
      await audio.play();
      // Actual "playing" state is set by onPlaying.
    } catch {
      if (isSwitchingRef.current) return;
      setStatusSafe("error");
      setError("Unable to resume playback. Try again or choose another station.");
      void getPlaybackTracker().stop("resume-error");
    }
  }, [clearReconnectTimer, setStatusSafe]);

  useEffect(() => {
    if (!canUseMediaSession()) return;
    const safeAction = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported */ }
    };
    safeAction("play", () => { void togglePlay(); });
    safeAction("pause", () => { void togglePlay(); });
    safeAction("stop", () => {
      shouldAutoReconnectRef.current = false;
      clearReconnectTimer();
      audioRef.current?.pause();
      setStatusSafe("idle");
      void getPlaybackTracker().stop("media-stop");
    });
    return () => {
      safeAction("play", null);
      safeAction("pause", null);
      safeAction("stop", null);
    };
  }, [clearReconnectTimer, setStatusSafe, togglePlay]);

  const scheduleReconnectRef = useRef<(reason: string) => void>(() => {});
  const scheduleReconnect = useCallback((reason: string) => {
    const station = currentStationRef.current;
    const audio = audioRef.current;
    if (!station || !audio) return;
    if (!shouldAutoReconnectRef.current || isSwitchingRef.current) return;
    if (document.visibilityState === "hidden") return;
    const attempt = reconnectAttemptsRef.current;
    if (attempt >= MAX_AUTO_RECONNECTS) {
      setStatusSafe("error");
      setError("Stream connection lost. Please retry or choose another station.");
      void getPlaybackTracker().stop("reconnect-exhausted");
      return;
    }
    const delay = RECONNECT_DELAYS_MS[Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)];
    reconnectAttemptsRef.current = attempt + 1;
    setStatusSafe("loading");
    setError(`Connection interrupted. Reconnecting (${reconnectAttemptsRef.current}/${MAX_AUTO_RECONNECTS})...`);
    clearReconnectTimer();
    reconnectTimerRef.current = setTimeout(() => {
      const current = currentStationRef.current;
      if (!current || current.id !== station.id) return;
      if (!shouldAutoReconnectRef.current) return;
      void (async () => {
        const ok = await startPlaybackInternal(current, true);
        if (!ok && shouldAutoReconnectRef.current && reconnectAttemptsRef.current < MAX_AUTO_RECONNECTS) {
          scheduleReconnectRef.current(reason);
        } else if (!ok) {
          setStatusSafe("error");
          setError("Stream connection lost. Please retry or choose another station.");
          void getPlaybackTracker().stop("reconnect-failed");
        }
      })();
    }, delay);
  }, [clearReconnectTimer, setStatusSafe, startPlaybackInternal]);
  useEffect(() => {
    scheduleReconnectRef.current = scheduleReconnect;
  }, [scheduleReconnect]);

  const clearSleepTimer = useCallback(() => setSleepTimerEnd(null), []);
  const setSleepTimer = useCallback((minutes: number) => {
    setSleepTimerEnd(Date.now() + minutes * 60_000);
  }, []);

  useEffect(() => {
    if (!sleepTimerEnd) return;
    const id = window.setInterval(() => {
      if (Date.now() >= sleepTimerEnd) {
        shouldAutoReconnectRef.current = false;
        clearReconnectTimer();
        audioRef.current?.pause();
        setStatusSafe("idle");
        setSleepTimerEnd(null);
        void getPlaybackTracker().stop("sleep-timer");
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [clearReconnectTimer, setStatusSafe, sleepTimerEnd]);

  useEffect(() => {
    if (status !== "playing") return;
    const id = window.setInterval(() => {
      const current = getListeningStats();
      saveListeningStats({ ...current, totalSeconds: current.totalSeconds + 15, lastPlayedAt: Date.now() });
    }, 15000);
    return () => window.clearInterval(id);
  }, [status]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      clearReconnectTimer();
      shouldAutoReconnectRef.current = false;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      void getPlaybackTracker().stop("provider-unmount");
    };
  }, [clearReconnectTimer]);

  const setVolume = useCallback((nextVolume: number) => {
    const clamped = Math.min(1, Math.max(0, nextVolume));
    setVolumeState(clamped);
    persistVolume(clamped);
    if (clamped > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleFavorite = useCallback((station: Station) => {
    setFavorites(persistToggleFavorite(station));
  }, []);

  const isFavorite = useCallback(
    (stationId: string) => favorites.some((item) => item.id === stationId),
    [favorites],
  );

  const value = useMemo<PlayerContextValue>(
    () => ({
      currentStation,
      status,
      error,
      volume,
      isMuted,
      favorites,
      recents,
      sleepTimerEnd,
      playStation,
      togglePlay,
      retry,
      setVolume,
      toggleMute,
      toggleFavorite,
      isFavorite,
      setSleepTimer,
      clearSleepTimer,
      clearError: () => setError(null),
    }),
    [currentStation, status, error, volume, isMuted, favorites, recents, sleepTimerEnd, playStation, togglePlay, retry, setVolume, toggleMute, toggleFavorite, isFavorite, setSleepTimer, clearSleepTimer],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        onPlaying={() => {
          if (isSwitchingRef.current) return;
          reconnectAttemptsRef.current = 0;
          clearReconnectTimer();
          setError(null);
          setStatusSafe("playing");
          const station = currentStationRef.current;
          if (station) void getPlaybackTracker().start(station.id);
        }}
        onPause={() => {
          if (isSwitchingRef.current) return;
          setStatusSafe((statusRef.current === "error" || statusRef.current === "loading") ? statusRef.current : "idle");
          if (statusRef.current !== "loading" && statusRef.current !== "error") {
            void getPlaybackTracker().stop("pause");
          }
        }}
        onWaiting={() => {
          if (isSwitchingRef.current) return;
          if (statusRef.current === "playing") {
            setStatusSafe("loading");
            // Do not immediately stop listener session; heartbeat/TTL handles brief buffering.
          }
        }}
        onStalled={() => {
          if (isSwitchingRef.current || statusRef.current !== "playing") return;
          setStatusSafe("loading");
        }}
        onError={() => {
          if (isSwitchingRef.current) return;
          void getPlaybackTracker().stop("error");
          scheduleReconnect("audio-error");
        }}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
}
