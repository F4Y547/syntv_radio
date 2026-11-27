"use client";

import { Radio } from "lucide-react";
import { useListenerCounts } from "./listener-counts-provider";
import { StationFavicon } from "@/components/station/station-favicon";

interface Props {
  stationId: string;
  stationName: string;
  stationLogo?: string;
}

function formatUpdatedAt(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function StationListenerStats({ stationId, stationName, stationLogo }: Props) {
  const { stationCounts, updatedAt, status } = useListenerCounts();
  const listeners = stationCounts[stationId];
  const hasCount = typeof listeners === "number";

  return (
    <section
      aria-labelledby="listener-stats-heading"
      className="rounded-2xl border border-border/70 bg-surface/40 p-5 backdrop-blur-sm shadow-[var(--shadow-sm)]"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary-soft text-primary">
            <StationFavicon src={stationLogo} alt={`${stationName} logo`} size={24} className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Live audience</p>
            <h2 id="listener-stats-heading" className="font-display text-xl font-semibold text-foreground">
              Listener statistics
            </h2>
            <p className="text-sm text-muted-foreground">{stationName}</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/60 px-3 py-1.5 text-xs font-medium text-primary">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
          </span>
          {hasCount && listeners > 0 ? "Live now" : "Live tracking"}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-background/30 p-4">
          <p className="text-sm text-muted-foreground">Current listeners</p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-foreground">
            {status === "unavailable" && !hasCount ? "Unavailable" : hasCount ? listeners.toLocaleString() : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Listening on SYNTV RADIO</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/30 p-4">
          <p className="text-sm text-muted-foreground">Live status</p>
          <div className="mt-2 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <Radio size={18} className="text-primary" aria-hidden="true" />
            {status === "unavailable" && !hasCount ? "Unavailable" : hasCount && listeners > 0 ? "Active" : "Standby"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Counts only active SYNTV RADIO playback sessions</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/30 p-4">
          <p className="text-sm text-muted-foreground">Last updated</p>
          <p className="mt-2 font-display text-lg font-semibold text-foreground">{formatUpdatedAt(updatedAt)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Updates automatically</p>
        </div>
      </div>
    </section>
  );
}
