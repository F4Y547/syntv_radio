"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, Clock3, Database, Radio, RefreshCw, Shield, Users } from "lucide-react";

type Tab = "overview" | "analytics" | "trending" | "contacts" | "stations" | "health" | "seo-ads" | "system";

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
  system?: {
    redisConfigured: boolean;
    listenerStore: string;
    nodeEnv: string;
    contact: { mode: string; problem: string | null };
    ads: { enabled: boolean; cmpVerified: boolean; publisherConfigured: boolean; slotConfigured: boolean };
    env: Array<{ name: string; configured: boolean; secret: boolean }>;
  };
  contactSubmissions?: Array<{ id: string; createdAt: string; name: string; email: string; topic: string; station: string; message: string; status: string; delivery: string }>;
  auditLog?: Array<{ id: string; at: string; actor: string; action: string; target?: string; detail?: string }>;
  stationOverrides?: Array<{ stationId: string; featured?: boolean; verified?: boolean; hidden?: boolean; note?: string; updatedAt: string; updatedBy: string }>;
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
  try { return sessionStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}

export function AdminListenerDashboard() {
  const [token, setToken] = useState(readSavedToken);
  const [inputToken, setInputToken] = useState(readSavedToken);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [healthUrl, setHealthUrl] = useState("");
  const [healthResult, setHealthResult] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [overrideStationId, setOverrideStationId] = useState("");
  const [overrideFeatured, setOverrideFeatured] = useState(false);
  const [overrideVerified, setOverrideVerified] = useState(false);
  const [overrideHidden, setOverrideHidden] = useState(false);
  const [overrideNote, setOverrideNote] = useState("");
  const [overrideSaving, setOverrideSaving] = useState(false);

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
        setError(res.status === 401 ? "Unauthorized. Check the admin token." : json.error || "Failed to load admin data.");
        if (res.status === 401) setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional async fetch on token change; setState occurs in async callbacks
    void fetchAnalytics(token);
    const id = setInterval(() => { void fetchAnalytics(token); }, 15_000);
    return () => clearInterval(id);
  }, [token, fetchAnalytics]);

  const topStations = useMemo(() => (data?.topStations ?? []).slice(0, 10), [data]);
  const activeStations = useMemo(() => Object.entries(data?.stationCounts ?? {}).sort((a, b) => b[1] - a[1]), [data]);
  const maxDailyPeak = useMemo(() => Math.max(1, ...(data?.dailyTrends ?? []).map((d) => d.peakConcurrent)), [data]);

  const submitToken = (e: React.FormEvent) => {
    e.preventDefault();
    const next = inputToken.trim();
    setToken(next);
    try { if (next) sessionStorage.setItem(TOKEN_KEY, next); else sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  };

  const runStreamHealthCheck = async () => {
    if (!healthUrl.trim()) return;
    setHealthLoading(true);
    setHealthResult(null);
    try {
      const res = await fetch("/api/admin/stream-health", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: healthUrl.trim() }),
      });
      const json = await res.json();
      setHealthResult(JSON.stringify(json, null, 2));
    } catch {
      setHealthResult("Health check failed.");
    } finally {
      setHealthLoading(false);
    }
  };

  const saveOverride = async () => {
    if (!overrideStationId.trim()) return;
    setOverrideSaving(true);
    try {
      const res = await fetch("/api/admin/station-overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stationId: overrideStationId.trim(), featured: overrideFeatured, verified: overrideVerified, hidden: overrideHidden, note: overrideNote }),
      });
      if (res.ok) {
        setOverrideStationId(""); setOverrideNote(""); setOverrideFeatured(false); setOverrideVerified(false); setOverrideHidden(false);
        await fetchAnalytics(token);
      } else {
        const j = await res.json().catch(() => null);
        setError(j?.error || "Failed to save override");
      }
    } catch {
      setError("Failed to save override");
    } finally {
      setOverrideSaving(false);
    }
  };

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "analytics", label: "Listener analytics" },
    { id: "trending", label: "Trending" },
    { id: "contacts", label: "Contact submissions" },
    { id: "stations", label: "Station overrides" },
    { id: "health", label: "Stream health" },
    { id: "seo-ads", label: "SEO & Ads" },
    { id: "system", label: "System health" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/70 bg-surface/30 p-6 shadow-[var(--shadow-lg)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary"><Shield size={14} aria-hidden="true" /> Protected admin</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">SYNTV RADIO Admin</h1>
            <p className="mt-2 max-w-2xl text-foreground-muted">Real operational dashboard. No fake analytics or demo data. Some management features depend on configured persistent storage and env vars.</p>
          </div>
          <form onSubmit={submitToken} className="flex w-full max-w-md gap-2">
            <label className="sr-only" htmlFor="admin-token">Admin token</label>
            <input id="admin-token" type="password" value={inputToken} onChange={(e) => setInputToken(e.target.value)} placeholder="LISTENER_ADMIN_TOKEN" className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30" />
            <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Load</button>
          </form>
        </div>
        {error && <div className="mt-4 flex items-center gap-2 rounded-xl border border-error/30 bg-error-soft p-3 text-sm text-error"><AlertCircle size={16} aria-hidden="true" /> <span>{error}</span></div>}
      </section>

      {!token ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-surface/30 p-8 text-center text-sm text-muted-foreground">Enter `LISTENER_ADMIN_TOKEN` to access admin data.</div>
      ) : null}

      {data?.success && (
        <>
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`rounded-full px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tab === t.id ? "bg-primary text-primary-foreground" : "border border-border bg-surface/40 text-foreground-muted hover:text-foreground"}`}>
                {t.label}
              </button>
            ))}
            <button type="button" onClick={() => void fetchAnalytics(token)} className="ml-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface/40 px-3 py-2 text-sm text-foreground-muted hover:text-foreground"><RefreshCw size={14} aria-hidden="true" /> Refresh</button>
          </div>

          {tab === "overview" && (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Users} label="Active listeners now" value={String(data.activeNow ?? 0)} detail="Real SYNTV RADIO sessions" />
              <StatCard icon={Activity} label="Peak concurrent" value={String(data.peakConcurrent ?? 0)} detail={data.peakConcurrentAt ? `At ${new Date(data.peakConcurrentAt).toLocaleString()}` : "No peak recorded"} />
              <StatCard icon={Clock3} label="Avg listening duration" value={formatDuration(data.averageListeningSeconds ?? 0)} detail="Completed sessions" />
              <StatCard icon={Database} label="Store / Redis" value={data.system?.redisConfigured ? "Redis" : "Memory"} detail={`Contact: ${data.system?.contact.mode ?? "unknown"}`} />
            </section>
          )}

          {tab === "analytics" && (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Users} label="Active listeners now" value={String(data.activeNow ?? 0)} detail="Current concurrent SYNTV RADIO sessions" />
                <StatCard icon={Activity} label="Peak concurrent" value={String(data.peakConcurrent ?? 0)} detail={data.peakConcurrentAt ? `At ${new Date(data.peakConcurrentAt).toLocaleString()}` : "No peak recorded"} />
                <StatCard icon={Clock3} label="Avg listening duration" value={formatDuration(data.averageListeningSeconds ?? 0)} detail="Completed sessions" />
                <StatCard icon={Radio} label="Session activity" value={`${data.totalSessionStarts ?? 0} starts`} detail={`${data.totalSessionStops ?? 0} stops / ${data.totalErrors ?? 0} errors`} />
              </section>
              <section className="rounded-2xl border border-border/70 bg-surface/40 p-5">
                <h2 className="font-display text-lg font-semibold text-foreground">Daily listening trends</h2>
                <p className="mt-1 text-sm text-muted-foreground">Real aggregated data only.</p>
                {(data.dailyTrends ?? []).length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No historical trend data yet.</p> : (
                  <div className="mt-4 space-y-3">
                    {(data.dailyTrends ?? []).map((d) => (
                      <div key={d.date} className="grid gap-2 sm:grid-cols-[120px_1fr_220px] sm:items-center">
                        <div className="text-sm text-foreground-muted">{d.date}</div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-foreground/[0.06]"><div className="h-full rounded-full bg-primary" style={{ width: `${(d.peakConcurrent / maxDailyPeak) * 100}%` }} /></div>
                        <div className="text-xs text-muted-foreground">peak {d.peakConcurrent} · starts {d.sessionStarts} · {formatDuration(d.totalListeningSeconds)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {tab === "trending" && (
            <section className="grid gap-6 xl:grid-cols-2">
              <Panel title="Top stations now" subtitle="Real active listeners by station ID.">
                {topStations.length === 0 ? <Empty /> : topStations.map((s, i) => <Row key={s.stationId} left={`${i + 1}. ${s.stationId}`} right={String(s.listeners)} />)}
              </Panel>
              <Panel title="All active stations" subtitle="Current active SYNTV RADIO listeners.">
                {activeStations.length === 0 ? <Empty /> : activeStations.map(([stationId, count]) => <Row key={stationId} left={stationId} right={String(count)} />)}
              </Panel>
            </section>
          )}

          {tab === "contacts" && (
            <Panel title="Contact submissions" subtitle="Stored after successful delivery acceptance. Protected by admin token.">
              {(data.contactSubmissions ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No stored submissions yet.</p> : (
                <div className="space-y-3">
                  {(data.contactSubmissions ?? []).map((s) => (
                    <div key={s.id} className="rounded-xl border border-border/60 bg-background/20 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-medium text-foreground">{s.name} &lt;{s.email}&gt;</div>
                        <div className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">Topic: {s.topic}{s.station ? ` · Station: ${s.station}` : ""} · Status: {s.status} · Delivery: {s.delivery}</div>
                      <p className="mt-2 whitespace-pre-wrap text-foreground-muted">{s.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {tab === "stations" && (
            <Panel title="Station overrides" subtitle="Persistent featured/verified/hidden overrides. External Radio Browser stations remain source-of-truth for catalog data.">
              <div className="mb-4 grid gap-3 rounded-xl border border-border/60 bg-background/20 p-4">
                <p className="text-sm text-muted-foreground">Add/update local override by Radio Browser station ID (UUID).</p>
                <label className="text-sm"><span className="mb-1 block text-muted-foreground">Station ID</span><input value={overrideStationId} onChange={(e)=>setOverrideStationId(e.target.value)} className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground" /></label>
                <div className="flex flex-wrap gap-4 text-sm text-foreground-muted">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={overrideFeatured} onChange={(e)=>setOverrideFeatured(e.target.checked)} /> Featured</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={overrideVerified} onChange={(e)=>setOverrideVerified(e.target.checked)} /> Verified</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={overrideHidden} onChange={(e)=>setOverrideHidden(e.target.checked)} /> Hidden</label>
                </div>
                <label className="text-sm"><span className="mb-1 block text-muted-foreground">Note</span><input value={overrideNote} onChange={(e)=>setOverrideNote(e.target.value)} className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground" /></label>
                <div><button type="button" onClick={()=>void saveOverride()} disabled={overrideSaving || !overrideStationId.trim()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{overrideSaving ? "Saving..." : "Save override"}</button></div>
              </div>
              {(data.stationOverrides ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No station overrides stored.</p> : (
                <div className="space-y-2">
                  {(data.stationOverrides ?? []).map((o) => (
                    <div key={o.stationId} className="rounded-xl border border-border/60 bg-background/20 px-3 py-2 text-sm">
                      <div className="flex flex-wrap justify-between gap-2"><span className="font-medium text-foreground break-all">{o.stationId}</span><span className="text-xs text-muted-foreground">{new Date(o.updatedAt).toLocaleString()}</span></div>
                      <div className="text-xs text-muted-foreground">featured: {String(!!o.featured)} · verified: {String(!!o.verified)} · hidden: {String(!!o.hidden)} · by: {o.updatedBy}</div>
                      {o.note && <div className="text-xs text-foreground-muted mt-1">{o.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {tab === "health" && (
            <Panel title="Stream health monitoring" subtitle="Run real on-demand stream checks. Checks are not cached as live playback status.">
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="sr-only" htmlFor="health-url">Stream URL</label>
                <input id="health-url" value={healthUrl} onChange={(e) => setHealthUrl(e.target.value)} placeholder="https://example.com/stream" className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground" />
                <button type="button" onClick={() => void runStreamHealthCheck()} disabled={healthLoading} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{healthLoading ? "Checking..." : "Check stream"}</button>
              </div>
              {healthResult && <pre className="mt-4 overflow-auto rounded-xl border border-border/60 bg-background/30 p-3 text-xs text-foreground-muted">{healthResult}</pre>}
            </Panel>
          )}

          {tab === "seo-ads" && (
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Ad configuration" subtitle="Real config status. Advertising remains disabled until all requirements are satisfied.">
                <StatusRow ok={!!data.system?.ads.publisherConfigured} label="AdSense publisher configured" />
                <StatusRow ok={!!data.system?.ads.slotConfigured} label="Real slot IDs configured" />
                <StatusRow ok={!!data.system?.ads.cmpVerified} label="ADS_CMP_VERIFIED (owner attestation)" />
                <StatusRow ok={!!data.system?.ads.enabled} label="ADS_ENABLED" />
                <p className="mt-3 text-xs text-muted-foreground">No ads are served unless enabled, CMP verified, consent granted, and valid slot IDs are present.</p>
              </Panel>
              <Panel title="SEO/system config" subtitle="Key public SEO and verification settings.">
                <StatusRow ok={true} label="robots.txt and sitemap.xml endpoints present" />
                <StatusRow ok={true} label="Canonical/OG metadata implemented in app routes" />
                <StatusRow ok={Boolean(data.system?.env.find(e=>e.name==="NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION")?.configured)} label="Google Search Console verification token configured" />
                <StatusRow ok={Boolean(data.system?.env.find(e=>e.name==="NEXT_PUBLIC_BING_SITE_VERIFICATION")?.configured)} label="Bing verification token configured" />
              </Panel>
            </div>
          )}

          {tab === "system" && (
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="System health" subtitle="Real runtime/config status.">
                <StatusRow ok={!!data.system?.redisConfigured} label={`Redis configured (${data.system?.listenerStore ?? "unknown"})`} />
                <StatusRow ok={data.system?.contact.mode === "webhook" || data.system?.contact.mode === "resend"} label={`Contact delivery: ${data.system?.contact.mode ?? "unknown"}`} />
                <StatusRow ok={!!data.system?.env.find(e=>e.name==="LISTENER_ADMIN_TOKEN")?.configured} label="Admin token configured" />
                <div className="mt-3 text-xs text-muted-foreground">Node env: {data.system?.nodeEnv}. {data.system?.contact.problem ? `Contact issue: ${data.system.contact.problem}` : ""}</div>
              </Panel>
              <Panel title="Environment variables" subtitle="Presence only; secret values are never displayed.">
                <div className="space-y-2">
                  {(data.system?.env ?? []).map((e) => (
                    <div key={e.name} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/20 px-3 py-2 text-sm">
                      <span className="text-foreground-muted">{e.name}{e.secret ? " (secret)" : ""}</span>
                      <span className={e.configured ? "text-green-400" : "text-muted-foreground"}>{e.configured ? "Configured" : "Missing"}</span>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Audit log" subtitle="Recent admin/store events recorded by the system.">
                {(data.auditLog ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No audit log entries yet.</p> : (
                  <div className="space-y-2">
                    {(data.auditLog ?? []).map((a) => (
                      <div key={a.id} className="rounded-xl border border-border/50 bg-background/20 px-3 py-2 text-xs text-muted-foreground">
                        <div className="flex justify-between gap-2"><span className="font-medium text-foreground">{a.action}</span><span>{new Date(a.at).toLocaleString()}</span></div>
                        <div>actor: {a.actor}{a.target ? ` · target: ${a.target}` : ""}{a.detail ? ` · ${a.detail}` : ""}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
              <Panel title="Operational notes" subtitle="Honest production limitations.">
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>Redis is required for multi-instance shared listener/rate-limit/admin-store consistency.</li>
                  <li>Without Redis, file/memory fallbacks are development/single-instance only.</li>
                  <li>Station catalog data is sourced from Radio Browser; local overrides provide curation controls.</li>
                  <li>AdSense must remain disabled until real slots, certified CMP, consent, and policy requirements are satisfied.</li>
                </ul>
              </Panel>
            </div>
          )}

          <p className="text-xs text-muted-foreground">{loading ? "Refreshing…" : data.generatedAt ? `Last updated ${new Date(data.generatedAt).toLocaleString()}` : ""}</p>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail }: { icon: typeof Users; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-surface/40 p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon size={16} className="text-primary" aria-hidden="true" /> {label}</div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-surface/40 p-5">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/20 px-3 py-2 text-sm">
      <span className="min-w-0 break-all text-foreground">{left}</span>
      <span className="shrink-0 font-semibold text-primary">{right}</span>
    </div>
  );
}

function Empty() { return <p className="text-sm text-muted-foreground">No data.</p>; }

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  const Icon = ok ? CheckCircle2 : AlertCircle;
  return (
    <div className="flex items-center gap-2 py-1.5 text-sm">
      <Icon size={16} className={ok ? "text-green-400" : "text-muted-foreground"} aria-hidden="true" />
      <span className={ok ? "text-foreground" : "text-foreground-muted"}>{label}</span>
    </div>
  );
}
