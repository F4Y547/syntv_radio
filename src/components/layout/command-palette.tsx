"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Radio, Play, ArrowRight } from "lucide-react";
import type { Station } from "@/types/station";
import { usePlayer } from "@/components/player/player-provider";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const { playStation } = usePlayer();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reset dialog state on open/close */
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    if (!open) { setQuery(""); setResults([]); }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale results when query emptied */
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stations?search=${encodeURIComponent(q)}&limit=8`, { signal: controller.signal });
        if (!res.ok) {
          if (!controller.signal.aborted) setResults([]);
          return;
        }
        const data = (await res.json()) as { stations: Station[] };
        if (!controller.signal.aborted) setResults(data.stations);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 p-4 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true" aria-label="Command palette" onClick={() => setOpen(false)}>
      <div className="mx-auto mt-[10vh] max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-[var(--shadow-lg)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search size={18} className="text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stations, genres, countries..."
            className="w-full bg-transparent py-4 text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search stations"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground sm:inline">Esc</kbd>
        </div>
        <div className="max-h-[60vh] overflow-auto p-2">
          {!query.trim() && <p className="px-3 py-8 text-center text-sm text-muted-foreground">Type to search live radio stations worldwide.</p>}
          {loading && <p className="px-3 py-4 text-sm text-muted-foreground">Searching…</p>}
          {!loading && query.trim() && results.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">No stations found.</p>}
          {results.map((station) => (
            <div key={station.id} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-foreground/[0.05]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                {station.favicon ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={station.favicon}
                      alt=""
                      className="h-full w-full rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback instanceof HTMLElement) fallback.style.display = "flex";
                      }}
                    />
                    <span className="hidden h-full w-full items-center justify-center" aria-hidden="true">
                      <Radio size={18} />
                    </span>
                  </>
                ) : (
                  <Radio size={18} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{station.name}</p>
                <p className="truncate text-xs text-muted-foreground">{[station.country, station.tags[0]].filter(Boolean).join(" · ")}</p>
              </div>
              <button type="button" onClick={() => { void playStation(station); setOpen(false); }} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover" aria-label={`Play ${station.name}`}>
                <Play size={15} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => { router.push(`/station/${station.id}`); setOpen(false); }} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground-muted hover:text-foreground" aria-label={`Open ${station.name} details`}>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
