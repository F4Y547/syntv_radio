"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Globe2, MapPin, Minus, Plus, Radio, RotateCcw, X } from "lucide-react";
import type { GlobeMethods } from "react-globe.gl";
import { useI18n } from "@/lib/i18n";
import { usePlayer } from "@/components/player/player-provider";
import {
  joinCountriesToFeatures,
  type CountryFeature,
  type CountryFeatureCollection,
  type CountryStat,
} from "@/lib/geo/country-map";
import { WorldMap } from "./world-map";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

interface GlobeMapProps {
  countries: CountryStat[];
  className?: string;
  showFrame?: boolean;
}

type FeatureWithStats = CountryFeature & {
  properties: CountryFeature["properties"] & {
    __code: string;
    __name: string;
    __stationCount: number;
    __hasStations: boolean;
  };
};

type HubPoint = {
  lat: number;
  lng: number;
  code: string;
  name: string;
  stationCount: number;
  weight: number;
};

class GlobeErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] ?? ch));
}

function featureCentroid(feature: FeatureWithStats): { lat: number; lng: number } | null {
  const coords: [number, number][] = [];
  const walk = (arr: unknown): void => {
    if (!Array.isArray(arr)) return;
    if (typeof arr[0] === "number" && typeof arr[1] === "number") {
      coords.push([arr[0] as number, arr[1] as number]);
      return;
    }
    for (const item of arr) walk(item);
  };
  walk((feature.geometry as { coordinates?: unknown } | undefined)?.coordinates);
  if (!coords.length) return null;

  let minLng = 180;
  let maxLng = -180;
  let minLat = 90;
  let maxLat = -90;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  // Antimeridian-spanning countries (e.g. Russia) get a naive bbox; clamp to a sensible view.
  if (maxLng - minLng > 180) {
    return { lat: (minLat + maxLat) / 2, lng: 90 };
  }

  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
}

export function GlobeMap({ countries, className = "", showFrame = true }: GlobeMapProps) {
  const { t } = useI18n();
  const { currentStation, status } = usePlayer();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const polygonClickRef = useRef(false);
  const [size, setSize] = useState({ w: 900, h: 520 });
  const [features, setFeatures] = useState<FeatureWithStats[]>([]);
  const [hover, setHover] = useState<FeatureWithStats | null>(null);
  const [selected, setSelected] = useState<FeatureWithStats | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [failed, setFailed] = useState(false);
  const [globeReady, setGlobeReady] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsLight(root.classList.contains("light"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (!r) return;
      setSize({ w: Math.max(320, Math.floor(r.width)), h: Math.max(280, Math.floor(r.height)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/world-countries.geojson")
      .then((r) => r.json())
      .then((data: CountryFeatureCollection) => {
        if (cancelled) return;
        setFeatures(joinCountriesToFeatures(data.features || [], countries) as FeatureWithStats[]);
      })
      .catch(() => {
        if (!cancelled) setFeatures([]);
      });
    return () => {
      cancelled = true;
    };
  }, [countries]);

  const maxStations = useMemo(() => Math.max(1, ...countries.map((c) => c.stationCount)), [countries]);

  const hubs = useMemo<HubPoint[]>(() => {
    if (!features.length) return [];
    const byCode = new Map(countries.map((c) => [c.code.toUpperCase(), c]));
    const points: HubPoint[] = [];

    for (const f of features) {
      const code = f.properties.__code;
      const stat = code ? byCode.get(code) : undefined;
      if (!stat || stat.stationCount <= 0) continue;
      const centroid = featureCentroid(f);
      if (!centroid) continue;
      const weight = Math.min(1, stat.stationCount / maxStations);
      points.push({
        ...centroid,
        code,
        name: stat.name,
        stationCount: stat.stationCount,
        weight,
      });
    }

    return points.sort((a, b) => b.stationCount - a.stationCount).slice(0, 28);
  }, [countries, features, maxStations]);

  const rings = useMemo(() => hubs.slice(0, 10), [hubs]);

  const nowPlaying = useMemo(() => {
    const code = currentStation?.countryCode?.toUpperCase();
    if (!code) return null;
    const feat = features.find((f) => f.properties.__code === code) ?? null;
    const centroid = feat ? featureCentroid(feat) : null;
    if (!feat || !centroid) return null;
    const stat = countries.find((c) => c.code.toUpperCase() === code);
    return {
      code,
      feature: feat,
      lat: centroid.lat,
      lng: centroid.lng,
      name: stat?.name || feat.properties.__name || currentStation?.country || code,
      stationName: currentStation?.name ?? "Radio",
      isPlaying: status === "playing" || status === "loading",
    };
  }, [countries, currentStation, features, status]);

  const labels = useMemo(() => {
    const top = hubs.slice(0, 10).map((h) => ({
      lat: h.lat,
      lng: h.lng,
      text: h.name,
      size: 0.7 + h.weight * 0.55,
      color: "rgba(226, 232, 240, 0.85)",
      code: h.code,
    }));
    if (nowPlaying && !top.some((l) => l.code === nowPlaying.code)) {
      top.push({
        lat: nowPlaying.lat,
        lng: nowPlaying.lng,
        text: nowPlaying.name,
        size: 0.95,
        color: "rgba(251, 191, 36, 0.95)",
        code: nowPlaying.code,
      });
    } else if (nowPlaying) {
      const item = top.find((l) => l.code === nowPlaying.code);
      if (item) item.color = "rgba(251, 191, 36, 0.95)";
    }
    return top;
  }, [hubs, nowPlaying]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls?.() as
      | { autoRotate?: boolean; autoRotateSpeed?: number; enableZoom?: boolean; enablePan?: boolean }
      | undefined;
    if (controls) {
      controls.autoRotate = !reducedMotion && !isInteracting;
      controls.autoRotateSpeed = 0.28;
      controls.enableZoom = true;
      controls.enablePan = false;
    }
  }, [reducedMotion, isInteracting, features.length, globeReady]);

  const focusFeature = (feat: FeatureWithStats) => {
    const g = globeRef.current;
    if (!g) return;
    const centroid = featureCentroid(feat);
    if (!centroid) return;
    g.pointOfView({ ...centroid, altitude: 1.75 }, 900);
  };

  const polygonCapColor = (f: object) => {
    const feat = f as FeatureWithStats;
    const code = feat.properties.__code;
    if (selected?.properties.__code === code) return "rgba(251, 191, 36, 0.78)";
    if (hover?.properties.__code === code) return "rgba(45, 212, 191, 0.62)";
    if (nowPlaying?.code === code) return "rgba(251, 191, 36, 0.28)";
    if (feat.properties.__hasStations) {
      const tVal = Math.min(1, feat.properties.__stationCount / maxStations);
      const alpha = 0.16 + tVal * 0.42;
      return `rgba(56, 201, 232, ${alpha.toFixed(3)})`;
    }
    return "rgba(148, 163, 184, 0.08)";
  };

  const polygonSideColor = (f: object) => {
    const feat = f as FeatureWithStats;
    const code = feat.properties.__code;
    if (selected?.properties.__code === code) return "rgba(251, 191, 36, 0.28)";
    if (hover?.properties.__code === code) return "rgba(45, 212, 191, 0.18)";
    if (nowPlaying?.code === code) return "rgba(251, 191, 36, 0.22)";
    return "rgba(56, 201, 232, 0.05)";
  };

  const onPolygonClick = (f: object) => {
    const feat = f as FeatureWithStats;
    const code = feat.properties.__code;
    if (!code) return;
    polygonClickRef.current = true;
    window.setTimeout(() => {
      polygonClickRef.current = false;
    }, 0);
    setSelected(feat);
    focusFeature(feat);
  };

  const selectedStat = selected
    ? countries.find((c) => c.code.toUpperCase() === selected.properties.__code)
    : null;

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const ok = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- one-time WebGL capability check */
      if (!ok) setFailed(true);
    } catch {
      setFailed(true);
    }
  }, []);

  const adjustAltitude = (delta: number) => {
    const g = globeRef.current;
    if (!g) return;
    const pov = g.pointOfView() as { lat: number; lng: number; altitude: number };
    const altitude = Math.min(3.5, Math.max(1.2, pov.altitude + delta));
    g.pointOfView({ ...pov, altitude }, 350);
  };

  const resetView = () => {
    setSelected(null);
    const g = globeRef.current;
    g?.pointOfView({ lat: 22, lng: 12, altitude: 2.25 }, 900);
  };

  if (failed) return <WorldMap countries={countries} />;

  const selectedCount = selectedStat?.stationCount ?? selected?.properties.__stationCount ?? 0;

  const hasHeight = /\bh-\S+/.test(className);
  const hasMinHeight = /\bmin-h-\S+/.test(className);

  return (
    <div className={`${hasHeight ? "" : "h-full"} ${hasMinHeight ? "" : "min-h-[320px]"} ${className}`.trim()}>
      <div
        ref={containerRef}
        className={`relative h-full min-h-[320px] overflow-hidden rounded-2xl shadow-none ${
          isLight
            ? "bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,color-mix(in_srgb,var(--color-primary)_10%,white),transparent_62%),radial-gradient(ellipse_40%_35%_at_75%_70%,color-mix(in_srgb,var(--color-live)_8%,white),transparent_60%)]"
            : "bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,color-mix(in_srgb,var(--color-primary)_12%,transparent),transparent_62%),radial-gradient(ellipse_40%_35%_at_75%_70%,color-mix(in_srgb,var(--color-live)_8%,transparent),transparent_60%)]"
        } ${showFrame ? "border border-border/50" : ""}`.trim()}
        onPointerEnter={() => setIsInteracting(true)}
        onPointerLeave={() => setIsInteracting(false)}
      >
        <div className={`pointer-events-none absolute inset-0 ${isLight ? "bg-[radial-gradient(circle_at_50%_50%,transparent_45%,rgb(255_255_255/0.08)_100%)]" : "bg-[radial-gradient(circle_at_50%_50%,transparent_40%,rgb(0_0_0/0.06)_100%)]"}`} aria-hidden="true" />

        <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-7rem)] flex-col gap-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/65 px-3 py-1.5 text-xs text-foreground-muted backdrop-blur">
            <Globe2 size={14} className="text-primary" aria-hidden="true" />
            <span>{t("interactiveGlobe")}</span>
            <span className="hidden sm:inline text-muted-foreground/70">• Drag to explore</span>
          </div>
          {nowPlaying && (
            <button
              type="button"
              onClick={() => {
                setSelected(nowPlaying.feature);
                focusFeature(nowPlaying.feature);
              }}
              className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-amber-400/30 bg-background/70 px-3 py-1.5 text-left text-xs text-foreground backdrop-blur transition hover:bg-background/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Now playing: ${nowPlaying.stationName} in ${nowPlaying.name}. Focus on globe`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${nowPlaying.isPlaying ? "bg-amber-400 animate-pulse" : "bg-amber-400/60"}`} aria-hidden="true" />
              <span className="truncate">
                <span className="font-medium text-amber-300">{nowPlaying.isPlaying ? "Now playing" : "Paused"}</span>
                <span className="text-muted-foreground"> · {nowPlaying.stationName}</span>
              </span>
            </button>
          )}
          {features.length > 0 && (
            <label className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-border bg-background/65 px-3 py-1.5 text-xs text-foreground-muted backdrop-blur">
              <span className="sr-only">Jump to country</span>
              <select
                data-testid="globe-country-select"
                value={selected?.properties.__code ?? ""}
                onChange={(e) => {
                  const code = e.target.value;
                  if (!code) {
                    setSelected(null);
                    return;
                  }
                  const feat = features.find((f) => f.properties.__code === code);
                  if (feat) {
                    setSelected(feat);
                    focusFeature(feat);
                  }
                }}
                className="max-w-[220px] bg-transparent text-xs text-foreground outline-none"
                aria-label="Jump to country on globe"
              >
                <option value="">Jump to country…</option>
                {[...countries]
                  .filter((c) => features.some((f) => f.properties.__code === c.code.toUpperCase()))
                  .sort((a, b) => b.stationCount - a.stationCount)
                  .slice(0, 120)
                  .map((c) => (
                    <option key={c.code} value={c.code.toUpperCase()}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
        </div>

        <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => adjustAltitude(-0.35)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/70 text-foreground-muted backdrop-blur transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Zoom in"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => adjustAltitude(0.35)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/70 text-foreground-muted backdrop-blur transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Zoom out"
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/70 text-foreground-muted backdrop-blur transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Reset globe view"
          >
            <RotateCcw size={15} aria-hidden="true" />
          </button>
        </div>

        {!globeReady && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-full border border-border bg-background/70 px-4 py-2 text-sm text-foreground-muted backdrop-blur">
              Loading globe…
            </div>
          </div>
        )}

        <GlobeErrorBoundary fallback={<WorldMap countries={countries} />}>
          <Globe
            ref={globeRef}
            width={size.w}
            height={size.h}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="/textures/earth-blue-marble.jpg"
            bumpImageUrl="/textures/earth-topology.png"
            atmosphereColor={isLight ? "#7dd3fc" : "#67dff3"}
            atmosphereAltitude={isLight ? 0.18 : 0.2}
            animateIn={!reducedMotion}
            polygonsData={features}
            polygonCapColor={polygonCapColor}
            polygonSideColor={polygonSideColor}
            polygonStrokeColor={(f: object) => {
              const code = (f as FeatureWithStats).properties.__code;
              if (selected?.properties.__code === code) return "rgba(251,191,36,0.95)";
              if (hover?.properties.__code === code) return "rgba(94,234,212,0.75)";
              if (nowPlaying?.code === code) return "rgba(251,191,36,0.7)";
              return "rgba(255,255,255,0.08)";
            }}
            polygonAltitude={(f: object) => {
              const feat = f as FeatureWithStats;
              const code = feat.properties.__code;
              if (selected?.properties.__code === code) return 0.04;
              if (hover?.properties.__code === code) return 0.024;
              if (nowPlaying?.code === code) return 0.018;
              if (feat.properties.__hasStations) return 0.012;
              return 0.006;
            }}
            polygonLabel={(f: object) => {
              const feat = f as FeatureWithStats;
              const name = feat.properties.__name || feat.properties.ADMIN || "";
              const count = feat.properties.__stationCount || 0;
              const safeName = escapeHtml(name);
              const playing = nowPlaying?.code === feat.properties.__code;
              const playingLine = playing ? `<div style="color:#fbbf24;margin-top:4px;font-weight:600">Now playing: ${escapeHtml(nowPlaying?.stationName ?? "")}</div>` : "";
              return `<div style="background:rgba(15,23,42,.94);color:#e5eef7;padding:7px 10px;border-radius:10px;border:1px solid rgba(56,201,232,.22);font-size:12px;box-shadow:0 10px 30px rgba(0,0,0,.35)"><strong style="font-size:12px">${safeName}</strong><div style="color:#9fb0c3;margin-top:2px">${count.toLocaleString()} ${escapeHtml(t("stations"))}</div>${playingLine}</div>`;
            }}
            onPolygonHover={(f: object | null) => setHover((f as FeatureWithStats) || null)}
            onPolygonClick={onPolygonClick}
            onGlobeClick={() => {
              if (polygonClickRef.current) return;
              setSelected(null);
            }}
            polygonsTransitionDuration={250}
            pointsData={[
              ...hubs.filter((h) => h.code !== nowPlaying?.code),
              ...(nowPlaying
                ? [{
                    lat: nowPlaying.lat,
                    lng: nowPlaying.lng,
                    code: nowPlaying.code,
                    name: nowPlaying.name,
                    stationCount: 0,
                    weight: 1,
                    __nowPlaying: true,
                    __stationName: nowPlaying.stationName,
                    __isPlaying: nowPlaying.isPlaying,
                  }]
                : []),
            ]}
            pointLat={(d: object) => (d as HubPoint).lat}
            pointLng={(d: object) => (d as HubPoint).lng}
            pointAltitude={(d: object) => {
              const p = d as HubPoint & { __nowPlaying?: boolean };
              if (p.__nowPlaying) return 0.06;
              return 0.018 + p.weight * 0.045;
            }}
            pointRadius={(d: object) => {
              const p = d as HubPoint & { __nowPlaying?: boolean };
              if (p.__nowPlaying) return 0.7;
              return 0.18 + p.weight * 0.5;
            }}
            pointColor={(d: object) => {
              const p = d as HubPoint & { __nowPlaying?: boolean; __isPlaying?: boolean };
              if (p.__nowPlaying) return p.__isPlaying ? "rgba(251,191,36,0.98)" : "rgba(251,191,36,0.72)";
              if (selected?.properties.__code === p.code) return "rgba(251,191,36,0.95)";
              return `rgba(94, 234, 212, ${0.45 + p.weight * 0.45})`;
            }}
            pointLabel={(d: object) => {
              const p = d as HubPoint & { __nowPlaying?: boolean; __stationName?: string; __isPlaying?: boolean };
              if (p.__nowPlaying) {
                const statusLabel = p.__isPlaying ? "Now playing" : "Paused";
                return `<div style="background:rgba(15,23,42,.96);color:#e5eef7;padding:7px 10px;border-radius:10px;border:1px solid rgba(251,191,36,.35);font-size:12px;box-shadow:0 10px 30px rgba(0,0,0,.35)"><strong style="color:#fbbf24">${escapeHtml(statusLabel)}</strong><div style="margin-top:2px">${escapeHtml(p.__stationName ?? "")}</div><div style="color:#9fb0c3;margin-top:2px">${escapeHtml(p.name)}</div></div>`;
              }
              return `<div style="background:rgba(15,23,42,.94);color:#e5eef7;padding:6px 9px;border-radius:10px;border:1px solid rgba(56,201,232,.22);font-size:12px"><strong>${escapeHtml(p.name)}</strong><div style="color:#9fb0c3;margin-top:2px">${p.stationCount.toLocaleString()} ${escapeHtml(t("stations"))}</div></div>`;
            }}
            onPointClick={(d: object) => {
              const p = d as HubPoint & { __nowPlaying?: boolean };
              const feat = features.find((f) => f.properties.__code === p.code);
              if (feat) {
                polygonClickRef.current = true;
                window.setTimeout(() => {
                  polygonClickRef.current = false;
                }, 0);
                setSelected(feat);
                focusFeature(feat);
              }
            }}
            ringsData={[
              ...rings.filter((r) => r.code !== nowPlaying?.code),
              ...(nowPlaying
                ? [{
                    lat: nowPlaying.lat,
                    lng: nowPlaying.lng,
                    code: nowPlaying.code,
                    name: nowPlaying.name,
                    stationCount: 0,
                    weight: 1.2,
                    __nowPlaying: true,
                    __isPlaying: nowPlaying.isPlaying,
                  }]
                : []),
            ]}
            ringLat={(d: object) => (d as HubPoint).lat}
            ringLng={(d: object) => (d as HubPoint).lng}
            ringColor={(d: object) => {
              const p = d as HubPoint & { __nowPlaying?: boolean; __isPlaying?: boolean };
              if (p.__nowPlaying) {
                return (tVal: number) => `rgba(251, 191, 36, ${Math.max(0, (p.__isPlaying ? 0.8 : 0.45) * (1 - tVal))})`;
              }
              return (tVal: number) => `rgba(56, 201, 232, ${Math.max(0, 0.55 * (1 - tVal))})`;
            }}
            ringMaxRadius={(d: object) => {
              const p = d as HubPoint & { __nowPlaying?: boolean };
              if (p.__nowPlaying) return 4.5;
              return 1.6 + p.weight * 2.4;
            }}
            ringPropagationSpeed={(d: object) => ((d as HubPoint & { __nowPlaying?: boolean }).__nowPlaying ? 1.8 : 1.4)}
            ringRepeatPeriod={(d: object) => ((d as HubPoint & { __nowPlaying?: boolean }).__nowPlaying ? 1400 : 2200)}
            labelsData={labels}
            labelLat={(d: object) => (d as { lat: number }).lat}
            labelLng={(d: object) => (d as { lng: number }).lng}
            labelText={(d: object) => (d as { text: string }).text}
            labelSize={(d: object) => (d as { size: number }).size}
            labelColor={(d: object) => (d as { color: string }).color}
            labelAltitude={0.025}
            labelDotRadius={0.25}
            labelIncludeDot={false}
            labelResolution={2}
            onGlobeReady={() => {
              setGlobeReady(true);
              const g = globeRef.current;
              if (!g) return;
              g.pointOfView({ lat: 22, lng: 12, altitude: 2.25 }, 0);
              const controls = g.controls?.() as { autoRotate?: boolean; autoRotateSpeed?: number; enablePan?: boolean } | undefined;
              if (controls) {
                controls.autoRotate = !reducedMotion;
                controls.autoRotateSpeed = 0.28;
                controls.enablePan = false;
              }
            }}
          />
        </GlobeErrorBoundary>

        <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden rounded-xl border border-border/60 bg-background/65 px-3 py-2.5 text-[11px] text-muted-foreground backdrop-blur sm:block">
          <p className="mb-1.5 font-medium text-foreground/80">
            {countries.filter((c) => c.stationCount > 0).length.toLocaleString()} countries · {countries.reduce((sum, c) => sum + c.stationCount, 0).toLocaleString()} stations mapped
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[rgba(56,201,232,0.7)]" aria-hidden="true" />More stations</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[rgba(251,191,36,0.85)]" aria-hidden="true" />Selected</span>
            {nowPlaying && <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden="true" />Now playing</span>}
          </div>
        </div>

        {selected && (() => {
          const code = selected.properties.__code;
          const rank = countries.findIndex((c) => c.code.toUpperCase() === code);
          const share = maxStations > 0 ? Math.round((selectedCount / maxStations) * 100) : 0;
          const isNowPlayingCountry = nowPlaying?.code === code;
          return (
            <div className="absolute bottom-4 left-4 right-4 z-10 rounded-xl border border-border bg-background/90 p-4 shadow-none backdrop-blur sm:left-auto sm:right-4 sm:w-[22rem]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    <MapPin size={14} aria-hidden="true" /> {t("selectedCountry")}
                  </p>
                  <h3 className="mt-1 truncate font-display text-xl font-bold text-foreground">{selected.properties.__name}</h3>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Radio size={14} aria-hidden="true" /> {selectedCount.toLocaleString()} {t("stations")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full p-1.5 text-muted-foreground transition hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t("clearSelection")}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border/70 bg-foreground/[0.02] px-3 py-2">
                  <p className="text-muted-foreground">Global rank</p>
                  <p className="mt-0.5 font-semibold text-foreground">{rank >= 0 ? `#${rank + 1}` : "—"}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-foreground/[0.02] px-3 py-2">
                  <p className="text-muted-foreground">Relative size</p>
                  <p className="mt-0.5 font-semibold text-foreground">{share}% of top</p>
                </div>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-amber-300"
                  style={{ width: `${Math.max(8, Math.min(100, (selectedCount / maxStations) * 100))}%` }}
                />
              </div>

              {isNowPlayingCountry && currentStation && (
                <div className="mt-3 rounded-lg border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300">
                    {status === "playing" || status === "loading" ? "Now playing here" : "Paused here"}
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">{currentStation.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {[currentStation.language, currentStation.codec, currentStation.bitrate ? `${currentStation.bitrate} kbps` : null]
                      .filter(Boolean)
                      .join(" · ") || currentStation.country}
                  </p>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (code) router.push(`/?country=${encodeURIComponent(code)}`);
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t("browseStations")}
                </button>
                <button
                  type="button"
                  onClick={resetView}
                  className="inline-flex items-center justify-center rounded-full border border-border bg-foreground/[0.03] px-4 py-2 text-sm font-medium text-foreground transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Reset
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
