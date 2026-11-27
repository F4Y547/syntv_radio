import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";
import { canAssignContact, canDeleteContact, getContactDetail, isContactPriority, isContactStatus, recordContactActivity } from "@/lib/contact/admin";
import type { Prisma, SubmissionStatus } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

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

export async function GET(request: Request, ctx: Ctx) {
  const g = await adminGuard(request, { minimum: "editor", rateKey: "admin:contacts:get" });
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  const prisma = getPrisma();
  const existing = await prisma.contactSubmission.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!existing) return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl);

  if (existing.status === "NEW") {
    const now = new Date();
    await prisma.contactSubmission.update({ where: { id }, data: { status: "READ", readAt: now } });
    await recordContactActivity({ submissionId: id, actorId: g.user.id, actorEmail: g.user.email, type: "opened", detail: { from: "NEW", to: "READ" } });
    await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "contact.opened", targetType: "contact", targetId: id, detail: { from: "NEW", to: "READ" } });
  } else {
    await recordContactActivity({ submissionId: id, actorId: g.user.id, actorEmail: g.user.email, type: "opened", detail: { status: existing.status } });
  }

  const item = await getContactDetail(id);
  if (!item) return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl);
  return adminJson({ ok: true, item }, undefined, g.rl);
}

export async function PATCH(request: Request, ctx: Ctx) {
  const g = await adminGuard(request, { minimum: "editor", mutate: true, rateKey: "admin:contacts:update" });
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  let body: unknown;
  try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const r = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  const prisma = getPrisma();
  const existing = await prisma.contactSubmission.findUnique({ where: { id } });
  if (!existing) return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl);

  const data: Prisma.ContactSubmissionUpdateInput = {};
  const activities: Array<{ type: string; detail: Prisma.InputJsonValue }> = [];

  if (r.status !== undefined) {
    if (!isContactStatus(r.status)) return adminJson({ ok: false, error: "Invalid status" }, { status: 400 }, g.rl);
    if (r.status !== existing.status) {
      data.status = r.status;
      Object.assign(data, statusTimestamps(r.status, new Date()));
      activities.push({ type: "status_changed", detail: { from: existing.status, to: r.status } });
    }
  }

  if (r.priority !== undefined) {
    if (!isContactPriority(r.priority)) return adminJson({ ok: false, error: "Invalid priority" }, { status: 400 }, g.rl);
    if (r.priority !== existing.priority) {
      data.priority = r.priority;
      activities.push({ type: "priority_changed", detail: { from: existing.priority, to: r.priority } });
    }
  }

  if (r.assignedToId !== undefined) {
    if (!canAssignContact(g.user.role)) return adminJson({ ok: false, error: "Forbidden" }, { status: 403 }, g.rl);
    const nextAssigned = r.assignedToId === null ? null : typeof r.assignedToId === "string" ? r.assignedToId : undefined;
    if (nextAssigned === undefined) return adminJson({ ok: false, error: "Invalid assignedToId" }, { status: 400 }, g.rl);
    if (nextAssigned !== existing.assignedToId) {
      if (nextAssigned) {
        const assignee = await prisma.adminUser.findUnique({ where: { id: nextAssigned }, select: { id: true, active: true } });
        if (!assignee || !assignee.active) return adminJson({ ok: false, error: "Invalid assignee" }, { status: 400 }, g.rl);
        data.assignedTo = { connect: { id: nextAssigned } };
      } else {
        data.assignedTo = { disconnect: true };
      }
      activities.push({ type: "assigned", detail: { from: existing.assignedToId, to: nextAssigned } });
    }
  }

  if (r.markUnread === true) {
    if (existing.status !== "NEW") {
      data.status = "NEW";
      data.readAt = null;
      activities.push({ type: "status_changed", detail: { from: existing.status, to: "NEW", reason: "mark_unread" } });
    }
  }

  if (Object.keys(data).length === 0) return adminJson({ ok: false, error: "No valid fields" }, { status: 400 }, g.rl);

  const item = await prisma.contactSubmission.update({
    where: { id },
    data,
    include: { assignedTo: { select: { id: true, email: true, name: true } } },
  });

  for (const a of activities) {
    await recordContactActivity({ submissionId: id, actorId: g.user.id, actorEmail: g.user.email, type: a.type, detail: a.detail });
  }
  await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "contact.update", targetType: "contact", targetId: id, detail: { changes: activities.map((a) => a.type) } as Prisma.InputJsonValue });
  return adminJson({ ok: true, item }, undefined, g.rl);
}

export async function DELETE(request: Request, ctx: Ctx) {
  const g = await adminGuard(request, { minimum: "editor", mutate: true, rateKey: "admin:contacts:delete" });
  if ("error" in g) return g.error;
  if (!canDeleteContact(g.user.role)) return adminJson({ ok: false, error: "Forbidden" }, { status: 403 }, g.rl);
  const { id } = await ctx.params;
  const prisma = getPrisma();
  const existing = await prisma.contactSubmission.findUnique({ where: { id }, select: { id: true, email: true } });
  if (!existing) return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl);
  await prisma.contactSubmission.delete({ where: { id } });
  await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "contact.delete", targetType: "contact", targetId: id, detail: { email: existing.email } });
  return adminJson({ ok: true }, undefined, g.rl);
}
