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

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playRequestRef = useRef(0);
  const isSwitchingRef = useRef(false);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [favorites, setFavorites] = useState<Station[]>([]);
  const [recents, setRecents] = useState<Station[]>([]);
  const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate client-only storage after mount */
    setFavorites(getFavorites());
    setRecents(getRecents());
    setVolumeState(getVolume());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentStation) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentStation.name,
      artist: currentStation.country || "World Radio",
      album: "SYNTV RADIO",
      artwork: currentStation.favicon
        ? [{ src: currentStation.favicon, sizes: "512x512", type: "image/png" }]
        : [],
    });
    const safeAction = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported */ }
    };
    safeAction("play", () => { void audioRef.current?.play(); });
    safeAction("pause", () => { audioRef.current?.pause(); });
    safeAction("stop", () => { audioRef.current?.pause(); setStatus("idle"); });
  }, [currentStation]);

  const playStation = useCallback(async (station: Station) => {
    const audio = audioRef.current;
    if (!audio) return;

    const requestId = ++playRequestRef.current;
    isSwitchingRef.current = true;
    setError(null);
    setCurrentStation(station);
    setRecents(addRecent(station));

    const candidates = [station.urlResolved, station.url].filter(
      (url, i, arr): url is string => Boolean(url) && arr.indexOf(url) === i,
    );
    if (candidates.length === 0) {
      if (requestId === playRequestRef.current) {
        setStatus("error");
        setError("This station does not have a playable stream URL.");
        isSwitchingRef.current = false;
      }
      return;
    }

    setStatus("loading");
    try {
      for (let i = 0; i < candidates.length; i += 1) {
        if (requestId !== playRequestRef.current) return;
        const streamUrl = candidates[i];
        try {
          audio.pause();
          audio.src = streamUrl;
          audio.load();
          await audio.play();
          if (requestId !== playRequestRef.current) return;
          const stats = getListeningStats();
          saveListeningStats({ ...stats, sessions: stats.sessions + 1, lastPlayedAt: Date.now() });
          setStatus("playing");
          return;
        } catch (playError) {
          if (requestId !== playRequestRef.current) return;
          console.error("Playback attempt failed", streamUrl, playError);
          if (i === candidates.length - 1) {
            setStatus("error");
            setError("Unable to play this stream. It may be offline, blocked, or unavailable in your browser.");
          }
        }
      }
    } finally {
      if (requestId === playRequestRef.current) isSwitchingRef.current = false;
    }
  }, []);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentStation || isSwitchingRef.current) return;
    if (status === "playing") {
      audio.pause();
      setStatus("idle");
      return;
    }
    setError(null);
    try {
      setStatus("loading");
      await audio.play();
      setStatus("playing");
    } catch {
      if (isSwitchingRef.current) return;
      setStatus("error");
      setError("Unable to resume playback. Try again or choose another station.");
    }
  }, [currentStation, status]);

  const retry = useCallback(async () => {
    if (currentStation) await playStation(currentStation);
  }, [currentStation, playStation]);

  const clearSleepTimer = useCallback(() => setSleepTimerEnd(null), []);
  const setSleepTimer = useCallback((minutes: number) => {
    setSleepTimerEnd(Date.now() + minutes * 60_000);
  }, []);

  useEffect(() => {
    if (!sleepTimerEnd) return;
    const id = window.setInterval(() => {
      if (Date.now() >= sleepTimerEnd) {
        audioRef.current?.pause();
        setStatus("idle");
        setSleepTimerEnd(null);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [sleepTimerEnd]);

  useEffect(() => {
    if (status !== "playing") return;
    const id = window.setInterval(() => {
      const current = getListeningStats();
      saveListeningStats({ ...current, totalSeconds: current.totalSeconds + 15, lastPlayedAt: Date.now() });
    }, 15000);
    return () => window.clearInterval(id);
  }, [status]);

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
        onPlaying={() => { if (!isSwitchingRef.current) setStatus("playing"); }}
        onPause={() => { if (!isSwitchingRef.current) setStatus((prev) => (prev === "error" ? prev : "idle")); }}
        onWaiting={() => { if (!isSwitchingRef.current) setStatus("loading"); }}
        onError={() => {
          if (isSwitchingRef.current) return;
          setStatus("error");
          setError("Stream interrupted or unavailable. Please try another station.");
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
