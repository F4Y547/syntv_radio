"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Globe2, Sparkles, AlertCircle, RefreshCw, X, LoaderCircle, Radio, Music2, MapPinned, ChevronLeft, ChevronRight } from "lucide-react";

const GlobeMap = dynamic(() => import("@/components/explore/globe-map").then((m) => m.GlobeMap), {
  ssr: false,
  loading: () => <div className="h-full min-h-[280px] animate-pulse rounded-2xl border border-border bg-surface/30" />,
});
import type { Station } from "@/types/station";
import { StationCard } from "./station-card";
import { StationGridSkeleton } from "./station-card-skeleton";
import { usePlayer } from "@/components/player/player-provider";
import { GlobalListenerCounter } from "@/components/listeners/global-listener-counter";

interface Filters {
  countries: { name: string; code: string; stationCount: number }[];
  tags: { name: string; stationCount: number }[];
  languages: { name: string; stationCount: number }[];
}

const PAGE_SIZE = 24;

export function StationBrowser() {
  const { favorites, recents } = usePlayer();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const initialCountry = searchParams.get("country") ?? "";
  const initialTag = searchParams.get("tag") ?? "";
  const initialLanguage = searchParams.get("language") ?? "";
  const initialSort = searchParams.get("sort") ?? "popular";

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [country, setCountry] = useState(initialCountry);
  const [tag, setTag] = useState(initialTag);
  const [language, setLanguage] = useState(initialLanguage);
  const [sort, setSort] = useState(initialSort);
  const [searchFocused, setSearchFocused] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [filters, setFilters] = useState<Filters>({ countries: [], tags: [], languages: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(filtersOpen, filterRef);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setFiltersOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => filterRef.current?.querySelector<HTMLElement>('button[aria-label="Close filters"]')?.focus(), 0);
    return () => { window.clearTimeout(t); document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = prev; };
  }, [filtersOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = query.trim();
      setDebouncedQuery(next);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const lastStateStr = useRef("");
  useEffect(() => {
    const stateStr = `${debouncedQuery}|${country}|${tag}|${language}|${sort}`;
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (country) params.set("country", country);
    if (tag) params.set("tag", tag);
    if (language) params.set("language", language);
    if (sort && sort !== "popular") params.set("sort", sort);
    const next = params.toString();
    const current = searchParams.toString();
    if (stateStr !== lastStateStr.current) {
      lastStateStr.current = stateStr;
      if (next !== current) {
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      }
    }
  }, [debouncedQuery, country, tag, language, sort, pathname, router, searchParams]);

  const stateRef = useRef({ country, tag, language, sort, debouncedQuery });
  useEffect(() => {
    stateRef.current = { country, tag, language, sort, debouncedQuery };
  }, [country, tag, language, sort, debouncedQuery]);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const c = searchParams.get("country") ?? "";
    const tg = searchParams.get("tag") ?? "";
    const lg = searchParams.get("language") ?? "";
    const st = searchParams.get("sort") ?? "popular";
    const cur = stateRef.current;
    const changed = q !== cur.debouncedQuery || c !== cur.country || tg !== cur.tag || lg !== cur.language || st !== cur.sort;
    if (q !== cur.debouncedQuery) {
      setQuery(q);
      setDebouncedQuery(q);
    }
    if (c !== cur.country) setCountry(c);
    if (tg !== cur.tag) setTag(tg);
    if (lg !== cur.language) setLanguage(lg);
    if (st !== cur.sort) setSort(st);
    if (changed) setPage(1);
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadFilters() {
      try {
        const res = await fetch("/api/filters", { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as Partial<Filters>;
        setFilters({
          countries: Array.isArray(data.countries) ? data.countries : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          languages: Array.isArray(data.languages) ? data.languages : [],
        });
      } catch {
        // Filters are optional; ignore.
      }
    }
    void loadFilters();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadStations() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set("search", debouncedQuery);
        if (country) params.set("country", country);
        if (tag) params.set("tag", tag);
        if (language) params.set("language", language);
        if (sort === "name") {
          params.set("order", "name");
          params.set("reverse", "false");
        } else if (sort === "recent") {
          params.set("order", "clicktrend");
          params.set("reverse", "true");
        } else if (sort === "votes") {
          params.set("order", "votes");
          params.set("reverse", "true");
        } else {
          params.set("order", "clickcount");
          params.set("reverse", "true");
        }
        params.set("limit", String(PAGE_SIZE));
        params.set("offset", String((page - 1) * PAGE_SIZE));
        const res = await fetch(`/api/stations?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load stations");
        const data = (await res.json()) as { stations: Station[] };
        setStations(data.stations);
        setHasNext(data.stations.length === PAGE_SIZE);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("Could not load stations. Check your connection and try again.");
        setStations([]);
        setHasNext(false);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadStations();
    return () => controller.abort();
  }, [debouncedQuery, country, tag, language, sort, reloadKey, page]);

  const activeFilterCount = [country, tag, language, debouncedQuery, sort !== "popular" ? sort : ""].filter(Boolean).length;
  const heading = useMemo(() => {
    if (debouncedQuery) return `Results for “${debouncedQuery}”`;
    if (country || tag) return "Filtered stations";
    return "Trending worldwide";
  }, [debouncedQuery, country, tag]);
  const totalStations = useMemo(
    () => filters.countries.reduce((sum, c) => sum + c.stationCount, 0),
    [filters.countries],
  );
  const quickTags = useMemo(() => filters.tags.slice(0, 6).map((t) => t.name), [filters.tags]);
  const searchSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const pool = [
      ...filters.countries.map((c) => c.name),
      ...filters.tags.map((t) => t.name),
      ...filters.languages.map((l) => l.name),
      ...stations.map((s) => s.name),
    ];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of pool) {
      const key = item.toLowerCase();
      if (!key.includes(q) || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= 8) break;
    }
    return out;
  }, [query, filters.countries, filters.tags, filters.languages, stations]);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-surface/25 p-5 shadow-[var(--shadow-lg)] backdrop-blur-sm sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_68%_28%,color-mix(in_srgb,var(--color-primary)_18%,transparent),transparent_55%),radial-gradient(ellipse_45%_45%_at_18%_82%,color-mix(in_srgb,var(--color-live)_10%,transparent),transparent_55%),radial-gradient(ellipse_35%_35%_at_50%_0%,color-mix(in_srgb,var(--color-primary)_8%,transparent),transparent_60%)]" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" aria-hidden="true" />
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:items-stretch">
          <div className="self-center">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-live shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-live)_15%,transparent)]" aria-hidden="true" />
                <Sparkles size={13} aria-hidden="true" /> Live from every corner
              </p>
              <h1 className="mt-4 max-w-3xl font-display text-[2rem] font-bold leading-[1.05] tracking-tight text-foreground sm:mt-5 sm:text-5xl lg:text-[4rem] lg:leading-[0.95]">
                Listen to the world, <span className="bg-gradient-to-r from-primary via-cyan-300 to-primary/80 bg-clip-text text-transparent">one station at a time.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground-muted sm:mt-5 sm:text-lg">
                Discover free live radio across countries, languages, and genres. Search instantly, save favorites, and keep playback running while you explore the globe.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5 text-sm text-foreground-muted">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/35 px-3 py-1.5 backdrop-blur-sm">
                  <Radio size={14} className="text-primary" aria-hidden="true" />
                  <span><span className="font-semibold text-foreground">{totalStations > 0 ? totalStations.toLocaleString() : "—"}</span> stations mapped</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/35 px-3 py-1.5 backdrop-blur-sm">
                  <MapPinned size={14} className="text-primary" aria-hidden="true" />
                  <span><span className="font-semibold text-foreground">{filters.countries.length || "—"}</span> countries</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/35 px-3 py-1.5 backdrop-blur-sm">
                  <Music2 size={14} className="text-primary" aria-hidden="true" />
                  <span><span className="font-semibold text-foreground">{filters.tags.length || "—"}</span> genres</span>
                </div>
              </div>
              <div className="mt-5">
                <GlobalListenerCounter />
              </div>
            </div>

            <div className="mt-6 space-y-4 sm:mt-8">
              <form
                className="grid gap-3 sm:grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_auto]"
                onSubmit={(e) => { e.preventDefault(); setDebouncedQuery(query.trim()); setPage(1); }}
                role="search"
              >
                <label className="group relative block">
                  <span className="sr-only">Search stations</span>
                  <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    onKeyDown={(e) => { if (e.key === "Escape" && query) { e.preventDefault(); setQuery(""); setSearchFocused(false); } }}
                    placeholder="Search stations, cities, genres..."
                    className="w-full rounded-xl border border-border bg-background/65 py-3.5 pl-11 pr-24 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] placeholder:text-muted-foreground transition focus:border-primary focus:bg-background/85 focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                  {searchFocused && searchSuggestions.length > 0 && query.trim().length >= 2 && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-border bg-surface-elevated/95 shadow-[var(--shadow-lg)] backdrop-blur-xl">
                      {searchSuggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setQuery(s); setDebouncedQuery(s); setPage(1); setSearchFocused(false); }}
                          className="block w-full px-4 py-2.5 text-left text-sm text-foreground-muted hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:bg-foreground/[0.05]"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                    {loading && (query || country || tag) ? (
                      <LoaderCircle size={16} className="animate-spin text-primary" aria-label="Loading" />
                    ) : null}
                    {query ? (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Clear search"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    ) : (
                      <kbd className="hidden rounded-md border border-border bg-foreground/[0.03] px-2 py-0.5 text-[11px] text-muted-foreground sm:inline">Ctrl K</kbd>
                    )}
                  </div>
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_color-mix(in_srgb,var(--color-primary)_20%,transparent)] transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Search size={16} aria-hidden="true" /> Search
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-border bg-foreground/[0.03] px-4 py-3.5 text-sm font-medium text-foreground transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden sm:col-span-2"
                  aria-expanded={filtersOpen}
                  aria-controls="mobile-filter-drawer"
                >
                  <SlidersHorizontal size={16} aria-hidden="true" /> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </button>
              </form>

              {/* Desktop filters */}
              <div className="hidden gap-3 lg:grid lg:grid-cols-[200px_200px_180px_170px_auto]">
                <label className="relative block">
                  <span className="sr-only">Filter by country</span>
                  <Globe2 size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <select value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }} className="w-full appearance-none rounded-xl border border-border bg-background/55 py-3 pl-11 pr-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30">
                    <option value="">All countries</option>
                    {filters.countries.map((c) => (<option key={c.code} value={c.code}>{c.name}</option>))}
                  </select>
                </label>
                <label className="relative block">
                  <span className="sr-only">Filter by genre</span>
                  <SlidersHorizontal size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <select value={tag} onChange={(e) => { setTag(e.target.value); setPage(1); }} className="w-full appearance-none rounded-xl border border-border bg-background/55 py-3 pl-11 pr-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30">
                    <option value="">All genres</option>
                    {filters.tags.map((t) => (<option key={t.name} value={t.name}>{t.name}</option>))}
                  </select>
                </label>
                <label className="relative block">
                  <span className="sr-only">Filter by language</span>
                  <Radio size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <select value={language} onChange={(e) => { setLanguage(e.target.value); setPage(1); }} className="w-full appearance-none rounded-xl border border-border bg-background/55 py-3 pl-11 pr-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30">
                    <option value="">All languages</option>
                    {filters.languages.map((l) => (<option key={l.name} value={l.name}>{l.name}</option>))}
                  </select>
                </label>
                <label className="relative block">
                  <span className="sr-only">Sort stations</span>
                  <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="w-full appearance-none rounded-xl border border-border bg-background/55 py-3 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30">
                    <option value="popular">Most popular</option>
                    <option value="votes">Most voted</option>
                    <option value="name">Name A-Z</option>
                    <option value="recent">Trending</option>
                  </select>
                </label>
                <button type="button" onClick={() => { setQuery(""); setCountry(""); setTag(""); setLanguage(""); setSort("popular"); setPage(1); }} className="self-center justify-self-start rounded-lg border border-border bg-foreground/[0.03] px-3 py-2 text-xs font-medium text-foreground-muted transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Clear{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </button>
              </div>

              {/* Mobile filter drawer */}
              {filtersOpen && (
                <div id="mobile-filter-drawer" className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
                  <button type="button" className="absolute inset-0 bg-black/45 backdrop-blur-sm" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />
                  <div ref={filterRef} className="absolute inset-x-0 bottom-0 max-h-[min(85vh,40rem)] overflow-y-auto rounded-t-[1.75rem] border-t border-border/70 bg-background/95 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] shadow-[var(--shadow-lg)] backdrop-blur-2xl animate-player-rise">
                    <div className="sticky top-0 z-10 bg-background/95 px-5 pb-3 pt-3 backdrop-blur-2xl">
                      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-foreground/20" aria-hidden="true" />
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-display text-lg font-semibold text-foreground">Filters</p>
                          <p className="text-sm text-muted-foreground">{activeFilterCount > 0 ? `${activeFilterCount} active filter${activeFilterCount > 1 ? "s" : ""}` : "Refine your station search"}</p>
                        </div>
                        <button type="button" onClick={() => setFiltersOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-foreground/[0.03] text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close filters">
                          <X size={20} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4 px-5 pb-4">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-foreground">Country</span>
                        <div className="relative">
                          <Globe2 size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                          <select value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }} className="w-full appearance-none rounded-xl border border-border bg-background/55 py-3.5 pl-11 pr-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30">
                            <option value="">All countries</option>
                            {filters.countries.map((c) => (<option key={c.code} value={c.code}>{c.name}</option>))}
                          </select>
                        </div>
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-foreground">Genre</span>
                        <div className="relative">
                          <SlidersHorizontal size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                          <select value={tag} onChange={(e) => { setTag(e.target.value); setPage(1); }} className="w-full appearance-none rounded-xl border border-border bg-background/55 py-3.5 pl-11 pr-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30">
                            <option value="">All genres</option>
                            {filters.tags.map((t) => (<option key={t.name} value={t.name}>{t.name}</option>))}
                          </select>
                        </div>
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-foreground">Language</span>
                        <div className="relative">
                          <Radio size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                          <select value={language} onChange={(e) => { setLanguage(e.target.value); setPage(1); }} className="w-full appearance-none rounded-xl border border-border bg-background/55 py-3.5 pl-11 pr-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30">
                            <option value="">All languages</option>
                            {filters.languages.map((l) => (<option key={l.name} value={l.name}>{l.name}</option>))}
                          </select>
                        </div>
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-foreground">Sort by</span>
                        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="w-full appearance-none rounded-xl border border-border bg-background/55 py-3.5 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30">
                          <option value="popular">Most popular</option>
                          <option value="votes">Most voted</option>
                          <option value="name">Name A-Z</option>
                          <option value="recent">Trending</option>
                        </select>
                      </label>
                    </div>
                    <div className="flex gap-3 border-t border-border/60 px-5 pt-4">
                      <button type="button" onClick={() => { setCountry(""); setTag(""); setLanguage(""); setSort("popular"); setPage(1); }} className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-border bg-foreground/[0.03] px-4 py-3 text-sm font-medium text-foreground hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Clear all</button>
                      <button type="button" onClick={() => setFiltersOpen(false)} className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Apply filters</button>
                    </div>
                  </div>
                </div>
              )}

              {quickTags.length > 0 && !debouncedQuery && !country && !tag && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Quick picks</span>
                  {quickTags.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => { setTag(name); setPage(1); }}
                      className="rounded-full border border-border/70 bg-background/35 px-3 py-1.5 text-xs font-medium text-foreground-muted transition hover:border-primary/30 hover:bg-primary-soft/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="min-h-[280px] sm:min-h-[340px] lg:min-h-[580px]">
            <GlobeMap countries={filters.countries} showFrame={false} className="min-h-[280px] sm:min-h-[340px] lg:min-h-0 h-full" />
          </div>
        </div>
      </section>

      <section aria-labelledby="stations-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Discover</p>
            <h2 id="stations-heading" className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {heading}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {!loading ? `Page ${page} · ${stations.length} stations` : "Loading..."}
          </p>
        </div>

        {error && (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-error/30 bg-error-soft p-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-error">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-2 rounded-full border border-error/30 px-3 py-1.5 text-error transition hover:bg-error/10"
            >
              <RefreshCw size={14} aria-hidden="true" /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <StationGridSkeleton count={6} />
        ) : stations.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {stations.map((station) => (
                <StationCard key={station.id} station={station} />
              ))}
            </div>
            {(page > 1 || hasNext) && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    document.getElementById("stations-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-foreground/[0.06] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronLeft size={16} aria-hidden="true" /> Previous
                </button>
                <span className="min-w-[96px] text-center text-sm text-muted-foreground" aria-live="polite">
                  Page {page}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPage((p) => p + 1);
                    document.getElementById("stations-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  disabled={!hasNext}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Next <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        ) : !error ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-surface/30 p-10 backdrop-blur-sm text-center">
            <p className="font-display text-lg font-semibold text-foreground">No stations found</p>
            <p className="mt-2 text-sm text-muted-foreground">Try a different search, country, or genre.</p>
          </div>
        ) : null}
      </section>

      {recents.length > 0 && (
        <section id="recents" aria-labelledby="recents-heading" className="space-y-4 scroll-mt-24">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Jump back in</p>
            <h2 id="recents-heading" className="font-display text-2xl font-bold tracking-tight text-foreground">Recently played</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recents.slice(0, 6).map((station) => (
              <StationCard key={`recent-${station.id}`} station={station} />
            ))}
          </div>
        </section>
      )}

      <section id="favorites" aria-labelledby="favorites-heading" className="space-y-4 scroll-mt-24">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Your library</p>
          <h2 id="favorites-heading" className="font-display text-2xl font-bold tracking-tight text-foreground">Favorites</h2>
        </div>
        {favorites.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.map((station) => (
              <StationCard key={`fav-${station.id}`} station={station} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-surface/30 p-8 backdrop-blur-sm text-center text-sm text-muted-foreground">
            Save stations you love and they’ll appear here.
          </div>
        )}
      </section>
    </div>
  );
}
