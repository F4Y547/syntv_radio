"use client";

import { useEffect, useState } from "react";
import { ListMusic, Plus, Trash2, X, Download, Upload, Share2 } from "lucide-react";
import type { Collection } from "@/types/station";
import { usePlayer } from "@/components/player/player-provider";
import { StationCard } from "@/components/station/station-card";
import {
  addStationToCollection,
  createCollection,
  getCollections,
  removeCollection,
  removeStationFromCollection,
  saveCollections,
} from "@/lib/storage/preferences";
import { useI18n } from "@/lib/i18n";

export default function CollectionsPage() {
  const { favorites, recents } = usePlayer();
  const { t } = useI18n();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate local collections after mount */
    setCollections(getCollections());
  }, []);

  const create = () => {
    if (!name.trim()) return;
    setCollections(createCollection(name));
    setName("");
  };

  const exportCollections = () => {
    const blob = new Blob([JSON.stringify(collections, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "syntv-radio-collections.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCollections = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Collection[];
      if (!Array.isArray(parsed)) return;
      const valid = parsed.filter((c) => c && typeof c.id === "string" && typeof c.name === "string" && Array.isArray(c.stations));
      if (!valid.length) return;
      const merged = [...valid, ...getCollections()].filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i).slice(0, 20);
      saveCollections(merged);
      setCollections(merged);
    } catch {
      // ignore invalid file
    }
  };

  const shareCollections = async () => {
    const text = JSON.stringify(collections, null, 2);
    if (navigator.share) {
      try { await navigator.share({ title: "SYNTV RADIO Collections", text }); return; } catch { /* fallback */ }
    }
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          <ListMusic size={14} aria-hidden="true" /> {t("yourLibrary")}
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{t("collections")}</h1>
        <p className="max-w-2xl text-foreground-muted">{t("collectionsDesc")}</p>
      </section>

      <section className="rounded-2xl border border-border/70 bg-surface/40 p-5 backdrop-blur-sm shadow-[var(--shadow-sm)]">
        <h2 className="font-display text-lg font-semibold text-foreground">{t("createCollection")}</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Collection name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              placeholder="e.g. Morning focus, Jazz nights..."
              className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </label>
          <button type="button" onClick={create} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary-hover">
            <Plus size={16} aria-hidden="true" /> {t("create")}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={exportCollections} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground">
            <Download size={15} aria-hidden="true" /> {t("exportJson")}
          </button>
          <button type="button" onClick={() => void shareCollections()} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground">
            <Share2 size={15} aria-hidden="true" /> {t("share")}
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground">
            <Upload size={15} aria-hidden="true" /> {t("importJson")}
            <input type="file" accept="application/json" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importCollections(f); e.currentTarget.value = ""; }} />
          </label>
        </div>
      </section>

      {collections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-surface/30 p-10 backdrop-blur-sm text-center text-sm text-muted-foreground">
          {t("noCollections")}
        </div>
      ) : (
        collections.map((collection) => (
          <section key={collection.id} className="space-y-4 rounded-2xl border border-border/70 bg-surface/30 p-5 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">{collection.name}</h2>
                <p className="text-sm text-muted-foreground">{collection.stations.length} stations</p>
              </div>
              <button type="button" onClick={() => setCollections(removeCollection(collection.id))} className="inline-flex items-center gap-2 rounded-full border border-error/30 px-3 py-1.5 text-sm text-error hover:bg-error-soft">
                <Trash2 size={14} aria-hidden="true" /> {t("delete")}
              </button>
            </div>

            {collection.stations.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {collection.stations.map((station) => (
                  <div key={station.id} className="relative">
                    <StationCard station={station} />
                    <button
                      type="button"
                      onClick={() => setCollections(removeStationFromCollection(collection.id, station.id))}
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-error"
                      aria-label={`Remove ${station.name} from collection`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No stations yet. Add from favorites or recents below.</p>
            )}

            <details className="rounded-lg border border-border bg-background/20 p-3">
              <summary className="cursor-pointer text-sm font-medium text-foreground">{t("addStations")}</summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[...favorites, ...recents].filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i).slice(0, 12).map((station) => {
                  const added = collection.stations.some((s) => s.id === station.id);
                  return (
                    <button
                      key={station.id}
                      type="button"
                      disabled={added}
                      onClick={() => setCollections(addStationToCollection(collection.id, station))}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm disabled:opacity-50 hover:bg-foreground/[0.05]"
                    >
                      <span className="truncate text-foreground">{station.name}</span>
                      <span className="ml-2 shrink-0 text-muted-foreground">{added ? t("added") : t("add")}</span>
                    </button>
                  );
                })}
              </div>
            </details>
          </section>
        ))
      )}
    </div>
  );
}
