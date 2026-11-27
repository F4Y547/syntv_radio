"use client";

import { useCallback, useEffect, useState } from "react";

type Role = "owner" | "administrator" | "editor";
interface User { id: string; email: string; name: string | null; role: Role }
type Tab = "overview" | "stations" | "countries" | "genres" | "contacts" | "stream-health" | "seo" | "ads" | "audit" | "users" | "listeners";

interface ApiResult<T = unknown> { res: Response; json: T | null }

async function api<T = Record<string, unknown>>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(path, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const text = await res.text();
  let json: T | null = null;
  try { json = text ? (JSON.parse(text) as T) : null; } catch { json = { ok: false, error: text } as T; }
  return { res, json };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm"><span className="mb-1 block text-muted-foreground">{label}</span>{children}</label>;
}
const inputCls = "w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground";
const btnCls = "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50";
const btn2Cls = "rounded-lg border border-border px-3 py-2 text-sm text-foreground-muted hover:text-foreground disabled:opacity-50";

export function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [error] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    setLoading(true);
    try {
      const { res, json } = await api<{ ok?: boolean; user?: User }>("/api/admin/auth/me", { method: "GET" });
      if (res.ok && json?.ok && json.user) setUser(json.user);
      else setUser(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { (async () => { await refreshMe(); })(); }, [refreshMe]);

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading admin...</div>;
  if (!user) return <Login onAuthed={(u) => setUser(u)} />;

  const tabs: { id: Tab; label: string; min?: Role }[] = [
    { id: "overview", label: "Overview" },
    { id: "listeners", label: "Listener analytics" },
    { id: "stations", label: "Stations" },
    { id: "countries", label: "Countries" },
    { id: "genres", label: "Genres" },
    { id: "contacts", label: "Contact submissions" },
    { id: "stream-health", label: "Stream health" },
    { id: "seo", label: "SEO metadata" },
    { id: "ads", label: "Ad config" },
    { id: "audit", label: "Audit log", min: "administrator" },
    { id: "users", label: "Users", min: "administrator" },
  ];
  const rank: Record<Role, number> = { owner: 3, administrator: 2, editor: 1 };
  const visibleTabs = tabs.filter((t) => !t.min || rank[user.role] >= rank[t.min]);

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] border border-border/70 bg-surface/30 p-6 shadow-[var(--shadow-lg)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Protected admin</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">SYNTV RADIO Admin</h1>
            <p className="mt-2 text-sm text-foreground-muted">Signed in as {user.email} ({user.role}).</p>
          </div>
          <button type="button" className={btn2Cls} onClick={async () => { await api("/api/admin/auth/logout", { method: "POST" }); setUser(null); }}>Logout</button>
        </div>
        {error && <div className="mt-4 rounded-xl border border-error/30 bg-error-soft p-3 text-sm text-error">{error}</div>}
      </header>
      <div className="flex flex-wrap gap-2">
        {visibleTabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`rounded-full px-3 py-2 text-sm font-medium ${tab === t.id ? "bg-primary text-primary-foreground" : "border border-border bg-surface/40 text-foreground-muted hover:text-foreground"}`}>{t.label}</button>
        ))}
      </div>
      {tab === "overview" && <Overview />}
      {tab === "listeners" && <ListenersPanel />}
      {tab === "stations" && <StationsPanel user={user} />}
      {tab === "countries" && <CountriesPanel user={user} />}
      {tab === "genres" && <GenresPanel user={user} />}
      {tab === "contacts" && <ContactsPanel />}
      {tab === "stream-health" && <StreamHealthPanel />}
      {tab === "seo" && <SeoPanel />}
      {tab === "ads" && <AdsPanel />}
      {tab === "audit" && <AuditPanel />}
      {tab === "users" && <UsersPanel />}
    </div>
  );
}

function Login({ onAuthed }: { onAuthed: (u: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <div className="mx-auto max-w-md rounded-[2rem] border border-border/70 bg-surface/30 p-6 shadow-[var(--shadow-lg)] sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Admin access</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">Sign in</h1>
      <p className="mt-2 text-sm text-foreground-muted">Use your admin account. Requires DATABASE_URL and a provisioned admin user.</p>
      <form className="mt-6 space-y-4" onSubmit={async (e) => {
        e.preventDefault(); setLoading(true); setError(null);
        const { res, json } = await api<{ ok?: boolean; user?: User; error?: string }>("/api/admin/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
        setLoading(false);
        if (!res.ok || !json?.ok || !json.user) { setError(json?.error || "Login failed"); return; }
        onAuthed(json.user);
      }}>
        <Field label="Email"><input className={inputCls} type="email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="username" required /></Field>
        <Field label="Password"><input className={inputCls} type="password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="current-password" required /></Field>
        {error && <div className="rounded-lg border border-error/30 bg-error-soft p-3 text-sm text-error">{error}</div>}
        <button className={btnCls} type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
      </form>
    </div>
  );
}

interface OverviewData { db: boolean; stations: number | null; contacts: number | null; auditOk: boolean }
function Overview() {
  const [data, setData] = useState<OverviewData | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [stations, contacts, audit] = await Promise.all([
        api<{ total?: number }>("/api/admin/stations?limit=1"),
        api<{ total?: number }>("/api/admin/contacts?limit=1"),
        api<{ ok?: boolean }>("/api/admin/audit?limit=1"),
      ]);
      if (cancelled) return;
      setData({ db: stations.res.status !== 503, stations: stations.json?.total ?? null, contacts: contacts.json?.total ?? null, auditOk: audit.res.ok });
    })();
    return () => { cancelled = true; };
  }, []);
  return <Panel title="Overview" subtitle="Real admin status. No fake metrics.">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Database" value={data ? (data.db ? "Configured" : "Missing") : "..."} />
      <Stat label="Stations in DB" value={data?.stations ?? "..."} />
      <Stat label="Contact submissions" value={data?.contacts ?? "..."} />
      <Stat label="Audit log" value={data ? (data.auditOk ? "Available" : "Restricted") : "..."} />
    </div>
    <p className="mt-4 text-sm text-muted-foreground">Use tabs to manage stations, countries, genres, contact submissions, stream health, SEO metadata, ads, audit logs, and users. Listener analytics remain available via the listener analytics tab.</p>
  </Panel>;
}

interface ListenerSummary { activeNow?: number; peakConcurrent?: number; totalSessionStarts?: number; topStations?: unknown; system?: unknown; error?: string }
function ListenersPanel() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<ListenerSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  return <Panel title="Listener analytics" subtitle="Uses existing protected listener analytics endpoint (LISTENER_ADMIN_TOKEN). Real data only.">
    <div className="flex flex-col gap-2 sm:flex-row">
      <input className={inputCls} type="password" value={token} onChange={(e)=>setToken(e.target.value)} placeholder="LISTENER_ADMIN_TOKEN" />
      <button className={btnCls} type="button" onClick={async ()=>{ setErr(null); const res = await fetch("/api/listeners/admin", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }); const json = await res.json() as ListenerSummary; if(!res.ok) setErr(json?.error||"Failed"); else setData(json); }}>Load</button>
    </div>
    {err && <p className="mt-3 text-sm text-error">{err}</p>}
    {data && <pre className="mt-4 overflow-auto rounded-xl border border-border/60 bg-background/30 p-3 text-xs text-foreground-muted">{JSON.stringify({ activeNow: data.activeNow, peakConcurrent: data.peakConcurrent, totalSessionStarts: data.totalSessionStarts, topStations: data.topStations, system: data.system }, null, 2)}</pre>}
  </Panel>;
}

interface StationRow { id: string; name: string; streamUrl: string; approvalStatus: string; isVerified: boolean; isActive: boolean }
interface StationForm { name: string; streamUrl: string; country: string; countryCode: string; language: string; tags: string; approvalStatus: string }
function StationsPanel({ user }: { user: User }) {
  const [items, setItems] = useState<StationRow[]>([]);
  const [form, setForm] = useState<StationForm>({ name: "", streamUrl: "", country: "", countryCode: "", language: "", tags: "", approvalStatus: "approved" });
  const canEdit = user.role !== "editor";
  const load = useCallback(async () => { const { json } = await api<{ ok?: boolean; items?: StationRow[] }>("/api/admin/stations?limit=50"); if (json?.ok && json.items) setItems(json.items); }, []);
  useEffect(() => { let cancelled = false; (async () => { const { json } = await api<{ ok?: boolean; items?: StationRow[] }>("/api/admin/stations?limit=50"); if (!cancelled && json?.ok && json.items) setItems(json.items); })(); return () => { cancelled = true; }; }, []);
  return <Panel title="Stations" subtitle="Persistent DB-backed station CRUD and approval/verification flags.">
    {canEdit && <div className="mb-4 grid gap-3 rounded-xl border border-border/60 bg-background/20 p-4 sm:grid-cols-2">
      <Field label="Name"><input className={inputCls} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></Field>
      <Field label="Stream URL"><input className={inputCls} value={form.streamUrl} onChange={e=>setForm({...form,streamUrl:e.target.value})} /></Field>
      <Field label="Country"><input className={inputCls} value={form.country} onChange={e=>setForm({...form,country:e.target.value})} /></Field>
      <Field label="Country code"><input className={inputCls} value={form.countryCode} onChange={e=>setForm({...form,countryCode:e.target.value})} /></Field>
      <Field label="Language"><input className={inputCls} value={form.language} onChange={e=>setForm({...form,language:e.target.value})} /></Field>
      <Field label="Tags (comma-separated)"><input className={inputCls} value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} /></Field>
      <Field label="Approval"><select className={inputCls} value={form.approvalStatus} onChange={e=>setForm({...form,approvalStatus:e.target.value})}><option value="approved">approved</option><option value="pending">pending</option><option value="rejected">rejected</option></select></Field>
      <div className="flex items-end"><button className={btnCls} type="button" onClick={async ()=>{ const payload = {...form, tags: form.tags.split(",").map((t)=>t.trim()).filter(Boolean)}; const { res, json } = await api<{ error?: string }>("/api/admin/stations", { method:"POST", body: JSON.stringify(payload)}); if(res.ok) { setForm({name:"",streamUrl:"",country:"",countryCode:"",language:"",tags:"",approvalStatus:"approved"}); await load(); } else alert(json?.error||"Failed"); }}>Create station</button></div>
    </div>}
    <div className="space-y-2">{items.map((s) => <div key={s.id} className="rounded-xl border border-border/60 bg-background/20 p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium text-foreground">{s.name}</span><span className="text-xs text-muted-foreground">{s.approvalStatus} · {s.isVerified?"verified":"unverified"} · {s.isActive?"active":"hidden"}</span></div><div className="text-xs text-muted-foreground break-all">{s.streamUrl}</div>{canEdit && <div className="mt-2 flex flex-wrap gap-2"><button className={btn2Cls} onClick={async()=>{await api(`/api/admin/stations/${s.id}`,{method:"PATCH",body:JSON.stringify({isVerified:!s.isVerified})}); await load();}}>Toggle verified</button><button className={btn2Cls} onClick={async()=>{await api(`/api/admin/stations/${s.id}`,{method:"PATCH",body:JSON.stringify({isActive:!s.isActive})}); await load();}}>Toggle active</button><button className={btn2Cls} onClick={async()=>{await api(`/api/admin/stations/${s.id}`,{method:"PATCH",body:JSON.stringify({approvalStatus:s.approvalStatus==="approved"?"pending":"approved"})}); await load();}}>Toggle approval</button></div>}</div>)}
      {items.length===0 && <p className="text-sm text-muted-foreground">No DB stations yet.</p>}
    </div>
  </Panel>;
}

interface CountryRow { id: string; name: string; code: string; slug: string }
function CountriesPanel({ user }: { user: User }) {
  const [items, setItems] = useState<CountryRow[]>([]);
  const [form, setForm] = useState({ name: "", code: "", slug: "" });
  const canEdit = user.role !== "editor";
  const load = useCallback(async () => { const { json } = await api<{ ok?: boolean; items?: CountryRow[] }>("/api/admin/countries"); if (json?.ok && json.items) setItems(json.items); }, []);
  useEffect(()=>{ let cancelled=false; (async()=>{ const { json } = await api<{ ok?: boolean; items?: CountryRow[] }>("/api/admin/countries"); if(!cancelled && json?.ok && json.items) setItems(json.items); })(); return ()=>{cancelled=true;}; },[]);
  return <Panel title="Countries" subtitle="Persistent country management.">
    {canEdit && <div className="mb-4 grid gap-3 rounded-xl border border-border/60 bg-background/20 p-4 sm:grid-cols-4"><input className={inputCls} placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input className={inputCls} placeholder="Code" value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/><input className={inputCls} placeholder="Slug" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/><button className={btnCls} onClick={async()=>{await api("/api/admin/countries",{method:"POST",body:JSON.stringify(form)}); setForm({name:"",code:"",slug:""}); await load();}}>Add</button></div>}
    <div className="space-y-2">{items.map(c=><div key={c.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/20 px-3 py-2 text-sm"><span>{c.name} ({c.code}) <span className="text-muted-foreground">/{c.slug}</span></span>{canEdit && <button className={btn2Cls} onClick={async()=>{await api(`/api/admin/countries/${c.id}`,{method:"DELETE"}); await load();}}>Delete</button>}</div>)}</div>
  </Panel>;
}

interface GenreRow { id: string; name: string; slug: string }
function GenresPanel({ user }: { user: User }) {
  const [items, setItems] = useState<GenreRow[]>([]);
  const [form, setForm] = useState({ name: "", slug: "" });
  const canEdit = user.role !== "editor";
  const load = useCallback(async () => { const { json } = await api<{ ok?: boolean; items?: GenreRow[] }>("/api/admin/genres"); if (json?.ok && json.items) setItems(json.items); }, []);
  useEffect(()=>{ let cancelled=false; (async()=>{ const { json } = await api<{ ok?: boolean; items?: GenreRow[] }>("/api/admin/genres"); if(!cancelled && json?.ok && json.items) setItems(json.items); })(); return ()=>{cancelled=true;}; },[]);
  return <Panel title="Genres" subtitle="Persistent genre management.">
    {canEdit && <div className="mb-4 grid gap-3 rounded-xl border border-border/60 bg-background/20 p-4 sm:grid-cols-3"><input className={inputCls} placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input className={inputCls} placeholder="Slug" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/><button className={btnCls} onClick={async()=>{await api("/api/admin/genres",{method:"POST",body:JSON.stringify(form)}); setForm({name:"",slug:""}); await load();}}>Add</button></div>}
    <div className="space-y-2">{items.map(g=><div key={g.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/20 px-3 py-2 text-sm"><span>{g.name} <span className="text-muted-foreground">/{g.slug}</span></span>{canEdit && <button className={btn2Cls} onClick={async()=>{await api(`/api/admin/genres/${g.id}`,{method:"DELETE"}); await load();}}>Delete</button>}</div>)}</div>
  </Panel>;
}

interface ContactRow { id: string; createdAt: string; name: string; email: string; topic: string; status: string; message: string }
function ContactsPanel() {
  const [items, setItems] = useState<ContactRow[]>([]);
  const load = useCallback(async () => { const { json } = await api<{ ok?: boolean; items?: ContactRow[] }>("/api/admin/contacts?limit=50"); if (json?.ok && json.items) setItems(json.items); }, []);
  useEffect(()=>{ let cancelled=false; (async()=>{ const { json } = await api<{ ok?: boolean; items?: ContactRow[] }>("/api/admin/contacts?limit=50"); if(!cancelled && json?.ok && json.items) setItems(json.items); })(); return ()=>{cancelled=true;}; },[]);
  return <Panel title="Contact submissions" subtitle="Persistent DB-backed contact submissions from successful deliveries.">
    <div className="space-y-3">{items.map(s=><div key={s.id} className="rounded-xl border border-border/60 bg-background/20 p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium text-foreground">{s.name} &lt;{s.email}&gt;</span><span className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</span></div><div className="text-xs text-muted-foreground">Topic: {s.topic} · Status: {s.status}</div><p className="mt-2 whitespace-pre-wrap text-foreground-muted">{s.message}</p><div className="mt-2 flex gap-2">{(["new","reviewed","resolved","spam"] as const).map(st=><button key={st} className={btn2Cls} onClick={async()=>{await api(`/api/admin/contacts/${s.id}`,{method:"PATCH",body:JSON.stringify({status:st})}); await load();}}>{st}</button>)}</div></div>)}{items.length===0 && <p className="text-sm text-muted-foreground">No submissions.</p>}</div>
  </Panel>;
}

interface HealthRow { id: string; ok: boolean; statusCode: number | null; latencyMs: number | null; checkedAt: string; streamUrl: string }
function StreamHealthPanel() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<HealthRow[]>([]);
  const loadHistory = useCallback(async () => { const { json } = await api<{ ok?: boolean; items?: HealthRow[] }>("/api/admin/stream-health/history?limit=20"); if (json?.ok && json.items) setHistory(json.items); }, []);
  useEffect(()=>{ let cancelled=false; (async()=>{ const { json } = await api<{ ok?: boolean; items?: HealthRow[] }>("/api/admin/stream-health/history?limit=20"); if(!cancelled && json?.ok && json.items) setHistory(json.items); })(); return ()=>{cancelled=true;}; },[]);
  return <Panel title="Stream health" subtitle="Real on-demand checks; results stored in DB when configured.">
    <div className="flex flex-col gap-2 sm:flex-row"><input className={inputCls} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://stream.example/live" /><button className={btnCls} onClick={async()=>{const {json}=await api("/api/admin/stream-health",{method:"POST",body:JSON.stringify({url})}); setResult(JSON.stringify(json,null,2)); await loadHistory();}}>Check</button></div>
    {result && <pre className="mt-3 overflow-auto rounded-xl border border-border/60 bg-background/30 p-3 text-xs text-foreground-muted">{result}</pre>}
    <h3 className="mt-4 text-sm font-semibold text-foreground">Recent checks</h3>
    <div className="mt-2 space-y-2">{history.map(h=><div key={h.id} className="rounded-xl border border-border/60 bg-background/20 px-3 py-2 text-xs text-muted-foreground"><span className={h.ok?"text-green-400":"text-error"}>{h.ok?"OK":"FAIL"}</span> · {h.statusCode ?? ""} · {h.latencyMs ?? "?"}ms · {new Date(h.checkedAt).toLocaleString()} · <span className="break-all">{h.streamUrl}</span></div>)}</div>
  </Panel>;
}

interface SeoRow { id: string; path: string; title: string | null; noindex: boolean }
function SeoPanel() {
  const [items, setItems] = useState<SeoRow[]>([]);
  const [form, setForm] = useState({ path: "/", title: "", description: "" });
  const load = useCallback(async () => { const { json } = await api<{ ok?: boolean; items?: SeoRow[] }>("/api/admin/seo"); if (json?.ok && json.items) setItems(json.items); }, []);
  useEffect(()=>{ let cancelled=false; (async()=>{ const { json } = await api<{ ok?: boolean; items?: SeoRow[] }>("/api/admin/seo"); if(!cancelled && json?.ok && json.items) setItems(json.items); })(); return ()=>{cancelled=true;}; },[]);
  return <Panel title="SEO metadata" subtitle="Persistent per-path metadata overrides (title/description/canonical/OG/noindex).">
    <div className="mb-4 grid gap-3 rounded-xl border border-border/60 bg-background/20 p-4 sm:grid-cols-4"><input className={inputCls} placeholder="/path" value={form.path} onChange={e=>setForm({...form,path:e.target.value})}/><input className={inputCls} placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><input className={inputCls} placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><button className={btnCls} onClick={async()=>{await api("/api/admin/seo",{method:"POST",body:JSON.stringify(form)}); await load();}}>Save</button></div>
    <div className="space-y-2">{items.map(i=><div key={i.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/20 px-3 py-2 text-sm"><div><div className="font-medium text-foreground">{i.path}</div><div className="text-xs text-muted-foreground">{i.title || "—"} {i.noindex?"· noindex":""}</div></div><button className={btn2Cls} onClick={async()=>{await api(`/api/admin/seo/${i.id}`,{method:"DELETE"}); await load();}}>Delete</button></div>)}</div>
  </Panel>;
}

interface AdForm { enabled: boolean; cmpVerified: boolean; publisherId: string; homeSlot: string; listingSlot: string; detailSlot: string; notes: string }
function AdsPanel() {
  const [form, setForm] = useState<AdForm>({ enabled: false, cmpVerified: false, publisherId: "", homeSlot: "", listingSlot: "", detailSlot: "", notes: "" });
  const [msg, setMsg] = useState<string|null>(null);
  useEffect(()=>{
    let cancelled = false;
    (async () => {
      const { json } = await api<{ item?: Partial<AdForm> & { publisherId?: string|null; homeSlot?: string|null; listingSlot?: string|null; detailSlot?: string|null; notes?: string|null } }>("/api/admin/ads");
      if (cancelled || !json?.item) return;
      const item = json.item;
      setForm({ enabled: !!item.enabled, cmpVerified: !!item.cmpVerified, publisherId: item.publisherId || "", homeSlot: item.homeSlot || "", listingSlot: item.listingSlot || "", detailSlot: item.detailSlot || "", notes: item.notes || "" });
    })();
    return () => { cancelled = true; };
  },[]);
  return <Panel title="Advertisement configuration" subtitle="Persisted config. Ads must remain disabled until real slots, certified CMP, consent, and policy requirements are satisfied.">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={e=>setForm({...form,enabled:e.target.checked})}/> Enabled (owner attestation)</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.cmpVerified} onChange={e=>setForm({...form,cmpVerified:e.target.checked})}/> CMP verified (owner attestation)</label>
      <Field label="Publisher ID"><input className={inputCls} value={form.publisherId} onChange={e=>setForm({...form,publisherId:e.target.value})}/></Field>
      <Field label="Home slot"><input className={inputCls} value={form.homeSlot} onChange={e=>setForm({...form,homeSlot:e.target.value})}/></Field>
      <Field label="Listing slot"><input className={inputCls} value={form.listingSlot} onChange={e=>setForm({...form,listingSlot:e.target.value})}/></Field>
      <Field label="Detail slot"><input className={inputCls} value={form.detailSlot} onChange={e=>setForm({...form,detailSlot:e.target.value})}/></Field>
    </div>
    <Field label="Notes"><input className={inputCls} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></Field>
    <div className="mt-3 flex gap-2"><button className={btnCls} onClick={async()=>{const {res,json}=await api<{ error?: string }>("/api/admin/ads",{method:"PUT",body:JSON.stringify(form)}); setMsg(res.ok?"Saved":"Failed: "+(json?.error||""));}}>Save</button>{msg && <span className="text-sm text-muted-foreground">{msg}</span>}</div>
  </Panel>;
}

interface AuditRow { id: string; at: string; action: string; actorEmail: string | null; actor?: { email: string } | null; targetType: string | null; targetId: string | null }
function AuditPanel() {
  const [items, setItems] = useState<AuditRow[]>([]);
  useEffect(()=>{
    let cancelled = false;
    (async () => { const { json } = await api<{ ok?: boolean; items?: AuditRow[] }>("/api/admin/audit?limit=100"); if (!cancelled && json?.ok && json.items) setItems(json.items); })();
    return () => { cancelled = true; };
  },[]);
  return <Panel title="Audit log" subtitle="Recent admin actions recorded in database.">
    <div className="space-y-2">{items.map(a=><div key={a.id} className="rounded-xl border border-border/60 bg-background/20 px-3 py-2 text-xs text-muted-foreground"><div className="flex justify-between gap-2"><span className="font-medium text-foreground">{a.action}</span><span>{new Date(a.at).toLocaleString()}</span></div><div>{a.actorEmail || a.actor?.email || "system"} {a.targetType?`· ${a.targetType}`:""} {a.targetId?`· ${a.targetId}`:""}</div></div>)}{items.length===0 && <p className="text-sm text-muted-foreground">No audit entries.</p>}</div>
  </Panel>;
}

interface UserRow { id: string; email: string; name: string | null; role: Role; active: boolean }
function UsersPanel() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "editor" as Role });
  const load = useCallback(async () => { const { json } = await api<{ ok?: boolean; users?: UserRow[] }>("/api/admin/users"); if (json?.ok && json.users) setItems(json.users); }, []);
  useEffect(()=>{ let cancelled=false; (async()=>{ const { json } = await api<{ ok?: boolean; users?: UserRow[] }>("/api/admin/users"); if(!cancelled && json?.ok && json.users) setItems(json.users); })(); return ()=>{cancelled=true;}; },[]);
  return <Panel title="Admin users" subtitle="Owner can create/update users and roles. Passwords are scrypt-hashed.">
    <div className="mb-4 grid gap-3 rounded-xl border border-border/60 bg-background/20 p-4 sm:grid-cols-2"><input className={inputCls} placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input className={inputCls} placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input className={inputCls} placeholder="Password (min 12 chars)" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><select className={inputCls} value={form.role} onChange={e=>setForm({...form,role:e.target.value as Role})}><option value="editor">editor</option><option value="administrator">administrator</option><option value="owner">owner</option></select><button className={btnCls} onClick={async()=>{const {res,json}=await api<{ error?: string }>("/api/admin/users",{method:"POST",body:JSON.stringify(form)}); if(res.ok){setForm({email:"",password:"",name:"",role:"editor"}); await load();} else alert(json?.error||"Failed");}}>Create user</button></div>
    <div className="space-y-2">{items.map(u=><div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/20 px-3 py-2 text-sm"><div><span className="font-medium text-foreground">{u.email}</span> <span className="text-muted-foreground">· {u.role} · {u.active?"active":"disabled"}</span></div><div className="flex gap-2"><button className={btn2Cls} onClick={async()=>{await api(`/api/admin/users/${u.id}`,{method:"PATCH",body:JSON.stringify({active:!u.active})}); await load();}}>{u.active?"Disable":"Enable"}</button></div></div>)}</div>
  </Panel>;
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-border/70 bg-surface/40 p-5"><h2 className="font-display text-lg font-semibold text-foreground">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p><div className="mt-4">{children}</div></section>;
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-border/60 bg-background/20 p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-display text-2xl font-semibold text-foreground">{value}</div></div>;
}
