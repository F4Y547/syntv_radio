import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";
import { canAssignContact, canDeleteContact, isContactPriority, isContactStatus, recordContactActivity } from "@/lib/contact/admin";
import type { Prisma, SubmissionStatus } from "@prisma/client";

function statusTimestamps(status: SubmissionStatus, now: Date) {
  const patch: Record<string, Date | null> = {};
  if (status === "READ") patch.readAt = now;
  if (status === "REPLIED") patch.repliedAt = now;
  if (status === "ARCHIVED") patch.archivedAt = now;
  if (status === "SPAM") patch.spamAt = now;
  if (status !== "ARCHIVED") patch.archivedAt = null;
  if (status !== "SPAM") patch.spamAt = null;
  return patch;
}

export async function POST(request: Request) {
  const g = await adminGuard(request, { minimum: "editor", mutate: true, rateKey: "admin:contacts:bulk", limit: 20, windowMs: 60_000 });
  if ("error" in g) return g.error;
  let body: unknown;
  try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const r = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const action = typeof r.action === "string" ? r.action : "";
  const ids = Array.isArray(r.ids) ? r.ids.filter((x): x is string => typeof x === "string").slice(0, 100) : [];
  if (ids.length === 0) return adminJson({ ok: false, error: "No ids provided" }, { status: 400 }, g.rl);

  const prisma = getPrisma();
  const now = new Date();
  let updated = 0;

  if (action === "set_status") {
    if (!isContactStatus(r.status)) return adminJson({ ok: false, error: "Invalid status" }, { status: 400 }, g.rl);
    const status = r.status;
    const data = { status, ...statusTimestamps(status, now) };
    const result = await prisma.contactSubmission.updateMany({ where: { id: { in: ids } }, data });
    updated = result.count;
    for (const id of ids) await recordContactActivity({ submissionId: id, actorId: g.user.id, actorEmail: g.user.email, type: "status_changed", detail: { to: status, bulk: true } });
  } else if (action === "set_priority") {
    if (!isContactPriority(r.priority)) return adminJson({ ok: false, error: "Invalid priority" }, { status: 400 }, g.rl);
    const result = await prisma.contactSubmission.updateMany({ where: { id: { in: ids } }, data: { priority: r.priority } });
    updated = result.count;
    for (const id of ids) await recordContactActivity({ submissionId: id, actorId: g.user.id, actorEmail: g.user.email, type: "priority_changed", detail: { to: r.priority, bulk: true } });
  } else if (action === "assign") {
    if (!canAssignContact(g.user.role)) return adminJson({ ok: false, error: "Forbidden" }, { status: 403 }, g.rl);
    const assignedToId = r.assignedToId === null ? null : typeof r.assignedToId === "string" ? r.assignedToId : undefined;
    if (assignedToId === undefined) return adminJson({ ok: false, error: "Invalid assignedToId" }, { status: 400 }, g.rl);
    if (assignedToId) {
      const assignee = await prisma.adminUser.findUnique({ where: { id: assignedToId }, select: { id: true, active: true } });
      if (!assignee?.active) return adminJson({ ok: false, error: "Invalid assignee" }, { status: 400 }, g.rl);
    }
    const result = await prisma.contactSubmission.updateMany({ where: { id: { in: ids } }, data: { assignedToId } });
    updated = result.count;
    for (const id of ids) await recordContactActivity({ submissionId: id, actorId: g.user.id, actorEmail: g.user.email, type: "assigned", detail: { to: assignedToId, bulk: true } });
  } else if (action === "delete") {
    if (!canDeleteContact(g.user.role)) return adminJson({ ok: false, error: "Forbidden" }, { status: 403 }, g.rl);
    const result = await prisma.contactSubmission.deleteMany({ where: { id: { in: ids } } });
    updated = result.count;
  } else {
    return adminJson({ ok: false, error: "Invalid action" }, { status: 400 }, g.rl);
  }

  await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "contact.bulk", targetType: "contact", targetId: null, detail: { action, count: updated, ids: ids.slice(0, 20) } as Prisma.InputJsonValue });
  return adminJson({ ok: true, updated }, undefined, g.rl);
}
