"use client";

import { useCallback, useEffect, useState } from "react";

type Role = "owner" | "administrator" | "editor";
type Status = "NEW" | "READ" | "IN_PROGRESS" | "REPLIED" | "ARCHIVED" | "SPAM";
type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

interface Assignee { id: string; email: string; name: string | null }
interface ContactItem {
  id: string; createdAt: string; updatedAt: string; name: string; email: string; topic: string; station: string | null;
  message: string; status: Status; priority: Priority; assignedToId: string | null; readAt: string | null; repliedAt: string | null;
  delivery: string; assignedTo: Assignee | null;
}
interface ContactReply { id: string; toEmail: string; subject: string; bodyText: string; status: "PENDING" | "SENT" | "FAILED"; providerMessageId: string | null; error: string | null; sentAt: string | null; createdAt: string; actorEmail: string | null; actor?: Assignee | null }
interface ContactNote { id: string; body: string; createdAt: string; updatedAt: string; authorId: string | null; authorEmail: string | null; author?: Assignee | null }
interface ContactActivity { id: string; type: string; detail: unknown; createdAt: string; actorEmail: string | null; actor?: Assignee | null }
interface ContactDetail extends ContactItem { ip: string | null; userAgent: string | null; replies: ContactReply[]; contactNotes: ContactNote[]; activities: ContactActivity[] }
interface Stats { total: number; unread: number; read: number; inProgress: number; replied: number; archived: number; spam: number }

const STATUSES: Status[] = ["NEW", "READ", "IN_PROGRESS", "REPLIED", "ARCHIVED", "SPAM"];
const PRIORITIES: Priority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

const inputCls = "w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground";
const btnCls = "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50";
const btn2Cls = "rounded-lg border border-border px-3 py-2 text-sm text-foreground-muted hover:text-foreground disabled:opacity-50";
const badgeBase = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide";

function statusBadge(status: Status) {
  const map: Record<Status, string> = {
    NEW: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
    READ: "bg-slate-500/15 text-slate-300 border border-slate-500/20",
    IN_PROGRESS: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
    REPLIED: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
    ARCHIVED: "bg-zinc-500/15 text-zinc-300 border border-zinc-500/20",
    SPAM: "bg-red-500/15 text-red-300 border border-red-500/20",
  };
  return <span className={`${badgeBase} ${map[status]}`}>{status.replace("_", " ")}</span>;
}
function priorityBadge(priority: Priority) {
  const map: Record<Priority, string> = {
    LOW: "bg-zinc-500/15 text-zinc-300 border border-zinc-500/20",
    NORMAL: "bg-sky-500/15 text-sky-300 border border-sky-500/20",
    HIGH: "bg-orange-500/15 text-orange-300 border border-orange-500/20",
    URGENT: "bg-red-500/15 text-red-300 border border-red-500/20",
  };
  return <span className={`${badgeBase} ${map[priority]}`}>{priority}</span>;
}

let _csrf = "";
async function api<T = Record<string, unknown>>(path: string, init?: RequestInit): Promise<{ res: Response; json: T | null }> {
  const method = (init?.method || "GET").toUpperCase();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...((init?.headers as Record<string, string>) || {}) };
  if (_csrf && !["GET", "HEAD", "OPTIONS"].includes(method)) headers["x-csrf-token"] = _csrf;
  const res = await fetch(path, { ...init, credentials: "include", headers });
  const text = await res.text();
  let json: T | null = null;
  try { json = text ? JSON.parse(text) as T : null; } catch { json = { ok: false, error: text } as T; }
  return { res, json };
}

function fmtDate(v: string | null | undefined) { if (!v) return "—"; const d = new Date(v); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString(); }
function preview(text: string, n = 90) { const t = text.replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; }

export function ContactsAdmin({ user, csrfToken }: { user: { id: string; role: Role }; csrfToken: string }) {
  useEffect(() => { _csrf = csrfToken; }, [csrfToken]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<ContactItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const canAssign = user.role === "owner" || user.role === "administrator";
  const canReply = user.role === "owner" || user.role === "administrator";
  const canDelete = user.role === "owner";

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (assignedToId) params.set("assignedToId", assignedToId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("sort", sort);
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    const { res, json } = await api<{ ok?: boolean; items?: ContactItem[]; total?: number; stats?: Stats; error?: string }>(`/api/admin/contacts?${params.toString()}`);
    setLoading(false);
    if (!res.ok || !json?.ok) { setError(json?.error || "Failed to load submissions"); return; }
    setItems(json.items || []);
    setTotal(json.total || 0);
    if (json.stats) setStats(json.stats);
  }, [q, status, priority, assignedToId, from, to, sort, offset]);

  useEffect(() => { void load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect -- initial/param fetch

  useEffect(() => {
    if (!canAssign) return;
    let cancelled = false;
    (async () => {
      const { res, json } = await api<{ ok?: boolean; users?: Assignee[] }>("/api/admin/users");
      if (!cancelled && res.ok && json?.ok && json.users) setAssignees(json.users.map(u => ({ id: u.id, email: u.email, name: u.name })));
    })();
    return () => { cancelled = true; };
  }, [canAssign]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    const { res, json } = await api<{ ok?: boolean; item?: ContactDetail; error?: string }>(`/api/admin/contacts/${id}`);
    setDetailLoading(false);
    if (!res.ok || !json?.ok || !json.item) { setError(json?.error || "Failed to load message"); return; }
    setDetail(json.item);
    setDetailId(id);
    void load(); // refresh list/stats for read status
  }, [load]);

  const patchContact = async (id: string, data: Record<string, unknown>) => {
    const { res, json } = await api<{ ok?: boolean; error?: string }>(`/api/admin/contacts/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    if (!res.ok || !json?.ok) { showToast(json?.error || "Update failed"); return false; }
    showToast("Updated");
    await load();
    if (detailId === id) await loadDetail(id);
    return true;
  };

  const bulkAction = async (action: string, payload: Record<string, unknown> = {}) => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) return;
    const { res, json } = await api<{ ok?: boolean; error?: string; updated?: number }>("/api/admin/contacts/bulk", { method: "POST", body: JSON.stringify({ action, ids, ...payload }) });
    if (!res.ok || !json?.ok) { showToast(json?.error || "Bulk action failed"); return; }
    showToast(`Updated ${json.updated ?? ids.length} submission(s)`);
    setSelected({});
    await load();
    if (detailId && ids.includes(detailId)) await loadDetail(detailId);
  };

  const allSelected = items.length > 0 && items.every((i) => selected[i.id]);
  const anySelected = Object.values(selected).some(Boolean);

  return (
    <div className="space-y-6">
      {toast && <div className="fixed right-4 top-4 z-50 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-lg">{toast}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total submissions" value={stats?.total ?? "…"} />
        <StatCard label="Unread" value={stats?.unread ?? "…"} accent="text-blue-300" />
        <StatCard label="In progress" value={stats?.inProgress ?? "…"} accent="text-amber-300" />
        <StatCard label="Replied" value={stats?.replied ?? "…"} accent="text-emerald-300" />
        <StatCard label="Read" value={stats?.read ?? "…"} />
        <StatCard label="Archived" value={stats?.archived ?? "…"} />
        <StatCard label="Spam" value={stats?.spam ?? "…"} accent="text-red-300" />
      </div>

      <section className="rounded-2xl border border-border/70 bg-surface/40 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Contact submissions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Search, filter, review, reply, and manage visitor messages.</p>
          </div>
          <button className={btn2Cls} onClick={() => void load()} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input className={inputCls} placeholder="Search name, email, topic, message" value={q} onChange={(e) => { setQ(e.target.value); setOffset(0); }} />
          <select className={inputCls} value={status} onChange={(e) => { setStatus(e.target.value); setOffset(0); }}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <select className={inputCls} value={priority} onChange={(e) => { setPriority(e.target.value); setOffset(0); }}>
            <option value="">All priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className={inputCls} value={assignedToId} onChange={(e) => { setAssignedToId(e.target.value); setOffset(0); }}>
            <option value="">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {assignees.map(a => <option key={a.id} value={a.id}>{a.name || a.email}</option>)}
          </select>
          <input className={inputCls} type="date" value={from} onChange={(e) => { setFrom(e.target.value); setOffset(0); }} />
          <input className={inputCls} type="date" value={to} onChange={(e) => { setTo(e.target.value); setOffset(0); }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <select className={`${inputCls} !w-auto`} value={sort} onChange={(e) => { setSort(e.target.value as "newest" | "oldest"); setOffset(0); }}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          {anySelected && <>
            <button className={btn2Cls} onClick={() => void bulkAction("set_status", { status: "READ" })}>Mark read</button>
            <button className={btn2Cls} onClick={() => void bulkAction("set_status", { status: "ARCHIVED" })}>Archive</button>
            <button className={btn2Cls} onClick={() => void bulkAction("set_status", { status: "SPAM" })}>Spam</button>
            {canDelete && <button className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10" onClick={() => { if (confirm("Permanently delete selected submissions? This cannot be undone.")) void bulkAction("delete"); }}>Delete</button>}
          </>}
        </div>

        {error && <div className="mt-3 rounded-lg border border-error/30 bg-error-soft p-3 text-sm text-error">{error}</div>}

        <div className="mt-4 overflow-x-auto rounded-xl border border-border/60">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-background/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-3"><input type="checkbox" checked={allSelected} onChange={(e) => { const next: Record<string, boolean> = {}; if (e.target.checked) items.forEach(i => next[i.id] = true); setSelected(next); }} aria-label="Select all" /></th>
                <th className="px-3 py-3">Sender</th>
                <th className="px-3 py-3">Subject / Topic</th>
                <th className="px-3 py-3">Preview</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Priority</th>
                <th className="px-3 py-3">Assigned</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-t border-border/50 align-top hover:bg-background/10">
                  <td className="px-3 py-3"><input type="checkbox" checked={!!selected[item.id]} onChange={(e) => setSelected(s => ({ ...s, [item.id]: e.target.checked }))} aria-label={`Select ${item.email}`} /></td>
                  <td className="px-3 py-3"><div className="font-medium text-foreground">{item.name || "—"}</div><div className="text-xs text-muted-foreground">{item.email}</div></td>
                  <td className="px-3 py-3 text-foreground-muted">{item.topic}</td>
                  <td className="px-3 py-3 max-w-[280px] text-foreground-muted">{preview(item.message)}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs text-muted-foreground">{fmtDate(item.createdAt)}</td>
                  <td className="px-3 py-3">{statusBadge(item.status)}</td>
                  <td className="px-3 py-3">{priorityBadge(item.priority)}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{item.assignedTo?.name || item.assignedTo?.email || "Unassigned"}</td>
                  <td className="px-3 py-3"><button className={btn2Cls} onClick={() => void loadDetail(item.id)}>Open</button></td>
                </tr>
              ))}
              {!loading && items.length === 0 && <tr><td colSpan={9} className="px-3 py-8 text-center text-sm text-muted-foreground">No submissions found.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {items.length === 0 ? 0 : offset + 1}-{offset + items.length} of {total}</span>
          <div className="flex gap-2">
            <button className={btn2Cls} disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Previous</button>
            <button className={btn2Cls} disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)}>Next</button>
          </div>
        </div>
      </section>

      {detailId && <ContactDetailPanel
        user={user}
        detail={detail}
        loading={detailLoading}
        assignees={assignees}
        canAssign={canAssign}
        canReply={canReply}
        canDelete={canDelete}
        onClose={() => { setDetailId(null); setDetail(null); }}
        onRefresh={() => detailId && void loadDetail(detailId)}
        onPatch={patchContact}
        onToast={showToast}
      />}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return <div className="rounded-xl border border-border/60 bg-background/20 p-4"><div className="text-xs text-muted-foreground">{label}</div><div className={`mt-1 font-display text-2xl font-semibold ${accent || "text-foreground"}`}>{value}</div></div>;
}

function ContactDetailPanel({
  user, detail, loading, assignees, canAssign, canReply, canDelete, onClose, onRefresh, onPatch, onToast,
}: {
  user: { id: string; role: Role };
  detail: ContactDetail | null;
  loading: boolean;
  assignees: Assignee[];
  canAssign: boolean;
  canReply: boolean;
  canDelete: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onPatch: (id: string, data: Record<string, unknown>) => Promise<boolean>;
  onToast: (msg: string) => void;
}) {
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyPreview, setReplyPreview] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    if (detail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form when selected submission changes
      setReplySubject(`Re: ${detail.topic} - SYNTV RADIO`);
      setReplyBody("");
      setReplyPreview(false);
    }
  }, [detail?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !detail) return <section className="rounded-2xl border border-border/70 bg-surface/40 p-5 text-sm text-muted-foreground">Loading message...</section>;
  if (!detail) return null;

  const sendReply = async () => {
    if (!replySubject.trim() || !replyBody.trim()) { onToast("Subject and message are required"); return; }
    setReplySending(true);
    const { res, json } = await api<{ ok?: boolean; error?: string }>(`/api/admin/contacts/${detail.id}/reply`, { method: "POST", body: JSON.stringify({ subject: replySubject, bodyText: replyBody }) });
    setReplySending(false);
    if (!res.ok || !json?.ok) { onToast(json?.error || "Reply failed"); return; }
    onToast("Reply sent");
    setReplyBody("");
    setReplyPreview(false);
    onRefresh();
  };

  const addNote = async () => {
    const body = noteBody.trim();
    if (!body) return;
    setNoteSaving(true);
    const { res, json } = await api<{ ok?: boolean; error?: string }>(`/api/admin/contacts/${detail.id}/notes`, { method: "POST", body: JSON.stringify({ body }) });
    setNoteSaving(false);
    if (!res.ok || !json?.ok) { onToast(json?.error || "Failed to add note"); return; }
    setNoteBody("");
    onToast("Note added");
    onRefresh();
  };

  const deleteContact = async () => {
    if (!confirm("Permanently delete this submission? This cannot be undone.")) return;
    const { res, json } = await api<{ ok?: boolean; error?: string }>(`/api/admin/contacts/${detail.id}`, { method: "DELETE" });
    if (!res.ok || !json?.ok) { onToast(json?.error || "Delete failed"); return; }
    onToast("Deleted");
    onClose();
  };

  return (
    <section className="rounded-2xl border border-border/70 bg-surface/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Message details</h3>
          <p className="text-sm text-muted-foreground">ID: {detail.id}</p>
        </div>
        <div className="flex gap-2">
          <button className={btn2Cls} onClick={onRefresh}>Refresh</button>
          <button className={btn2Cls} onClick={onClose}>Close</button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-background/20 p-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{detail.name || "â€”"}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{detail.email}</span></div>
              <div><span className="text-muted-foreground">Topic:</span> <span className="text-foreground">{detail.topic}</span></div>
              <div><span className="text-muted-foreground">Station:</span> <span className="text-foreground">{detail.station || "â€”"}</span></div>
              <div><span className="text-muted-foreground">Submitted:</span> <span className="text-foreground">{fmtDate(detail.createdAt)}</span></div>
              <div><span className="text-muted-foreground">Delivery:</span> <span className="text-foreground">{detail.delivery}</span></div>
              <div><span className="text-muted-foreground">Status:</span> {statusBadge(detail.status)}</div>
              <div><span className="text-muted-foreground">Priority:</span> {priorityBadge(detail.priority)}</div>
              <div><span className="text-muted-foreground">Assigned:</span> <span className="text-foreground">{detail.assignedTo?.name || detail.assignedTo?.email || "Unassigned"}</span></div>
              <div><span className="text-muted-foreground">Read at:</span> <span className="text-foreground">{fmtDate(detail.readAt)}</span></div>
            </div>
            <div className="mt-3"><div className="text-muted-foreground">Message</div><div className="mt-1 whitespace-pre-wrap rounded-lg bg-background/30 p-3 text-foreground">{detail.message}</div></div>
            <details className="mt-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer">Technical metadata</summary>
              <div className="mt-2 space-y-1">
                <div>IP: {detail.ip || "â€”"}</div>
                <div className="break-all">User agent: {detail.userAgent || "â€”"}</div>
              </div>
            </details>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/20 p-4">
            <h4 className="text-sm font-semibold text-foreground">Manage</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUSES.map(s => <button key={s} className={btn2Cls} onClick={() => void onPatch(detail.id, { status: s })}>{s.replace("_", " ")}</button>)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRIORITIES.map(p => <button key={p} className={btn2Cls} onClick={() => void onPatch(detail.id, { priority: p })}>{p}</button>)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className={btn2Cls} onClick={() => void onPatch(detail.id, { markUnread: true })}>Mark unread</button>
              {canAssign && <select className={`${inputCls} !w-auto`} value={detail.assignedToId || ""} onChange={(e) => void onPatch(detail.id, { assignedToId: e.target.value || null })}>
                <option value="">Unassigned</option>
                {assignees.map(a => <option key={a.id} value={a.id}>{a.name || a.email}</option>)}
              </select>}
              {canDelete && <button className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10" onClick={() => void deleteContact()}>Delete permanently</button>}
            </div>
          </div>

          {canReply && <div className="rounded-xl border border-border/60 bg-background/20 p-4">
            <h4 className="text-sm font-semibold text-foreground">Reply to visitor</h4>
            <p className="mt-1 text-xs text-muted-foreground">Sent via Resend using the configured verified sender. Reply is sent to {detail.email}.</p>
            <div className="mt-3 space-y-3">
              <input className={inputCls} value={replySubject} onChange={(e) => setReplySubject(e.target.value)} placeholder="Subject" maxLength={200} />
              <textarea className={`${inputCls} min-h-[140px]`} value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Write your reply..." maxLength={10000} />
              <div className="flex flex-wrap gap-2">
                <button className={btn2Cls} onClick={() => setReplyPreview(p => !p)} type="button">{replyPreview ? "Hide preview" : "Preview"}</button>
                <button className={btnCls} onClick={() => void sendReply()} disabled={replySending} type="button">{replySending ? "Sending..." : "Send reply"}</button>
              </div>
              {replyPreview && <div className="rounded-lg border border-border/60 bg-background/30 p-3 text-sm text-foreground whitespace-pre-wrap">{replyBody || "Nothing to preview."}</div>}
            </div>
          </div>}

          <div className="rounded-xl border border-border/60 bg-background/20 p-4">
            <h4 className="text-sm font-semibold text-foreground">Internal notes</h4>
            <p className="mt-1 text-xs text-muted-foreground">Private notes are never sent to visitors.</p>
            <div className="mt-3 flex gap-2">
              <textarea className={`${inputCls} min-h-[80px]`} value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Add an internal note..." maxLength={5000} />
            </div>
            <div className="mt-2"><button className={btnCls} onClick={() => void addNote()} disabled={noteSaving || !noteBody.trim()}>{noteSaving ? "Saving..." : "Add note"}</button></div>
            <div className="mt-4 space-y-3">
              {detail.contactNotes.map(note => <NoteItem key={note.id} note={note} user={user} submissionId={detail.id} onRefresh={onRefresh} onToast={onToast} />)}
              {detail.contactNotes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-background/20 p-4">
            <h4 className="text-sm font-semibold text-foreground">Reply history</h4>
            <div className="mt-3 space-y-3">
              {detail.replies.map(r => (
                <div key={r.id} className="rounded-lg border border-border/50 bg-background/20 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium text-foreground">{r.subject}</span><span className={`text-xs ${r.status === "SENT" ? "text-emerald-300" : r.status === "FAILED" ? "text-red-300" : "text-amber-300"}`}>{r.status}</span></div>
                  <div className="text-xs text-muted-foreground">{fmtDate(r.sentAt || r.createdAt)} Â· {r.actor?.name || r.actorEmail || "Unknown"} Â· to {r.toEmail}</div>
                  {r.providerMessageId && <div className="text-xs text-muted-foreground">Provider ID: {r.providerMessageId}</div>}
                  {r.error && <div className="text-xs text-red-300">Error: {r.error}</div>}
                  <div className="mt-2 whitespace-pre-wrap text-foreground-muted">{r.bodyText}</div>
                </div>
              ))}
              {detail.replies.length === 0 && <p className="text-sm text-muted-foreground">No replies sent.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/20 p-4">
            <h4 className="text-sm font-semibold text-foreground">Activity timeline</h4>
            <div className="mt-3 space-y-3">
              {detail.activities.map(a => (
                <div key={a.id} className="border-l border-border/60 pl-3 text-sm">
                  <div className="font-medium text-foreground">{a.type.replace(/_/g, " ")}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(a.createdAt)} Â· {a.actor?.name || a.actorEmail || "System"}</div>
                </div>
              ))}
              {detail.activities.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NoteItem({ note, user, submissionId, onRefresh, onToast }: { note: ContactNote; user: { id: string; role: Role }; submissionId: string; onRefresh: () => void; onToast: (m: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(note.body);
  const canMutate = user.role === "owner" || user.role === "administrator" || note.authorId === user.id;
  const save = async () => {
    const { res, json } = await api<{ ok?: boolean; error?: string }>(`/api/admin/contacts/${submissionId}/notes/${note.id}`, { method: "PATCH", body: JSON.stringify({ body }) });
    if (!res.ok || !json?.ok) { onToast(json?.error || "Failed to update note"); return; }
    setEditing(false); onToast("Note updated"); onRefresh();
  };
  const del = async () => {
    if (!confirm("Delete this note?")) return;
    const { res, json } = await api<{ ok?: boolean; error?: string }>(`/api/admin/contacts/${submissionId}/notes/${note.id}`, { method: "DELETE" });
    if (!res.ok || !json?.ok) { onToast(json?.error || "Failed to delete note"); return; }
    onToast("Note deleted"); onRefresh();
  };
  return (
    <div className="rounded-lg border border-border/50 bg-background/20 p-3 text-sm">
      <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{note.author?.name || note.authorEmail || "Unknown"}</span><span>{fmtDate(note.createdAt)}</span></div>
      {editing ? (
        <div className="mt-2 space-y-2">
          <textarea className={`${inputCls} min-h-[80px]`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} />
          <div className="flex gap-2"><button className={btnCls} onClick={() => void save()}>Save</button><button className={btn2Cls} onClick={() => { setEditing(false); setBody(note.body); }}>Cancel</button></div>
        </div>
      ) : <div className="mt-2 whitespace-pre-wrap text-foreground-muted">{note.body}</div>}
      {canMutate && !editing && <div className="mt-2 flex gap-2"><button className={btn2Cls} onClick={() => setEditing(true)}>Edit</button><button className={btn2Cls} onClick={() => void del()}>Delete</button></div>}
    </div>
  );
}

