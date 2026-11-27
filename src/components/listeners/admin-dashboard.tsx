"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, Clock3, Radio, Shield, Users } from "lucide-react";

interface AnalyticsData {
  success: boolean;
  error?: string;
  generatedAt?: string;
  activeNow?: number;
  peakConcurrent?: number;
  peakConcurrentAt?: string | null;
  stationCounts?: Record<string, number>;
  topStations?: Array<{ stationId: string; listeners: number }>;
  dailyTrends?: Array<{ date: string; peakConcurrent: number; sessionStarts: number; totalListeningSeconds: number }>;
  averageListeningSeconds?: number;
  totalSessionStarts?: number;
  totalSessionStops?: number;
  totalErrors?: number;
}

const TOKEN_KEY = "syntv-radio:listener-admin-token";

function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function readSavedToken() {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function AdminListenerDashboard() {
  const [token, setToken] = useState(readSavedToken);
  const [inputToken, setInputToken] = useState(readSavedToken);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = useCallback(async (authToken: string) => {
    if (!authToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/listeners/admin", {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: "no-store",
      });
      const json = (await res.json()) as AnalyticsData;
      if (!res.ok || !json.success) {
        if (res.status === 401) {
          setError("Unauthorized. Check the admin token.");
        } else {
          setError(json.error || "Failed to load analytics.");
        }
        if (res.status === 401) setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional async fetch on token change; setState occurs in async callbacks
    void fetchAnalytics(token);
    const id = setInterval(() => { void fetchAnalytics(token); }, 10_000);
    return () => clearInterval(id);
  }, [token, fetchAnalytics]);

  const topStations = useMemo(() => (data?.topStations ?? []).slice(0, 10), [data]);
  const activeStations = useMemo(
    () => Object.entries(data?.stationCounts ?? {}).sort((a, b) => b[1] - a[1]),
    [data],
  );
  const maxDailyPeak = useMemo(
    () => Math.max(1, ...(data?.dailyTrends ?? []).map((d) => d.peakConcurrent)),
    [data],
  );

  const submitToken = (e: React.FormEvent) => {
    e.preventDefault();
    const next = inputToken.trim();
    setToken(next);
    try {
      if (next) sessionStorage.setItem(TOKEN_KEY, next);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/70 bg-surface/30 p-6 shadow-[var(--shadow-lg)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <Shield size={14} aria-hidden="true" /> Protected admin
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Listener analytics</h1>
            <p className="mt-2 max-w-2xl text-foreground-muted">Real-time SYNTV RADIO playback session analytics. Counts reflect active SYNTV RADIO listeners only.</p>
          </div>
          <form onSubmit={submitToken} className="flex w-full max-w-md gap-2">
            <label className="sr-only" htmlFor="admin-token">Admin token</label>
            <input
              id="admin-token"
              type="password"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="LISTENER_ADMIN_TOKEN"
              className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Load</button>
          </form>
        </div>
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-error/30 bg-error-soft p-3 text-sm text-error">
            <AlertCircle size={16} aria-hidden="true" /> <span>{error}</span>
          </div>
        )}
      </section>

      {!token ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-surface/30 p-8 text-center text-sm text-muted-foreground">
          Enter `LISTENER_ADMIN_TOKEN` to view real listener analytics.
        </div>
      ) : null}

      {data?.success && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Active listeners now" value={String(data.activeNow ?? 0)} detail="Current concurrent SYNTV RADIO sessions" />
            <StatCard icon={Activity} label="Peak concurrent" value={String(data.peakConcurrent ?? 0)} detail={data.peakConcurrentAt ? `At ${new Date(data.peakConcurrentAt).toLocaleString()}` : "No peak recorded"} />
            <StatCard icon={Clock3} label="Avg listening duration" value={formatDuration(data.averageListeningSeconds ?? 0)} detail="Completed sessions" />
            <StatCard icon={Radio} label="Session activity" value={`${data.totalSessionStarts ?? 0} starts`} detail={`${data.totalSessionStops ?? 0} stops · ${data.totalErrors ?? 0} errors`} />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-surface/40 p-5">
              <h2 className="font-display text-lg font-semibold text-foreground">Top 10 stations now</h2>
              <p className="mt-1 text-sm text-muted-foreground">Active listeners by station ID.</p>
              <div className="mt-4 space-y-2">
                {topStations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active station listeners.</p>
                ) : topStations.map((s, i) => (
                  <div key={s.stationId} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/20 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                      <span className="break-all text-foreground">{s.stationId}</span>
                    </div>
                    <span className="shrink-0 font-semibold text-primary">{s.listeners.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-surface/40 p-5">
              <h2 className="font-display text-lg font-semibold text-foreground">Active listeners by station</h2>
              <p className="mt-1 text-sm text-muted-foreground">All stations with active SYNTV RADIO listeners.</p>
              <div className="mt-4 max-h-[360px] space-y-2 overflow-auto pr-1">
                {activeStations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active listeners.</p>
                ) : activeStations.map(([stationId, count]) => (
                  <div key={stationId} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/20 px-3 py-2 text-sm">
                    <span className="min-w-0 break-all text-foreground">{stationId}</span>
                    <span className="shrink-0 font-semibold text-primary">{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-surface/40 p-5">
            <h2 className="font-display text-lg font-semibold text-foreground">Daily listening trends</h2>
            <p className="mt-1 text-sm text-muted-foreground">Real aggregated daily data. Shown only when data exists.</p>
            {(data.dailyTrends ?? []).length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No historical trend data yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {(data.dailyTrends ?? []).map((d) => (
                  <div key={d.date} className="grid gap-2 sm:grid-cols-[120px_1fr_220px] sm:items-center">
                    <div className="text-sm text-foreground-muted">{d.date}</div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(d.peakConcurrent / maxDailyPeak) * 100}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      peak {d.peakConcurrent} · starts {d.sessionStarts} · {formatDuration(d.totalListeningSeconds)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <p className="text-xs text-muted-foreground">
            {loading ? "Refreshing…" : data.generatedAt ? `Last updated ${new Date(data.generatedAt).toLocaleString()}` : ""}
          </p>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail }: { icon: typeof Users; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-surface/40 p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon size={16} className="text-primary" aria-hidden="true" /> {label}
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
