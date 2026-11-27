import type { ContactPriority, Prisma, SubmissionStatus } from "@prisma/client";
import { getPrisma, hasDatabase } from "@/lib/db";


export const CONTACT_STATUSES: SubmissionStatus[] = ["NEW", "READ", "IN_PROGRESS", "REPLIED", "ARCHIVED", "SPAM"];
export const CONTACT_PRIORITIES: ContactPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

export function isContactStatus(v: unknown): v is SubmissionStatus {
  return typeof v === "string" && (CONTACT_STATUSES as string[]).includes(v);
}
export function isContactPriority(v: unknown): v is ContactPriority {
  return typeof v === "string" && (CONTACT_PRIORITIES as string[]).includes(v);
}

export function canDeleteContact(role: string) {
  return role === "owner";
}
export function canManageContactConfig(role: string) {
  return role === "owner";
}
export function canReplyContact(role: string) {
  return role === "owner" || role === "administrator";
}
export function canAssignContact(role: string) {
  return role === "owner" || role === "administrator";
}
export function canManageNotes(role: string) {
  return role === "owner" || role === "administrator" || role === "editor";
}

export async function recordContactActivity(input: {
  submissionId: string;
  actorId?: string | null;
  actorEmail?: string | null;
  type: string;
  detail?: Prisma.InputJsonValue | null;
}) {
  if (!hasDatabase()) return;
  const prisma = getPrisma();
  await prisma.contactActivity.create({
    data: {
      submissionId: input.submissionId,
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      type: input.type,
      detail: input.detail ?? undefined,
    },
  });
}

export async function getContactStats() {
  const prisma = getPrisma();
  const [total, byStatus, unread] = await Promise.all([
    prisma.contactSubmission.count(),
    prisma.contactSubmission.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.contactSubmission.count({ where: { status: "NEW" } }),
  ]);
  const counts: Record<string, number> = { NEW: 0, READ: 0, IN_PROGRESS: 0, REPLIED: 0, ARCHIVED: 0, SPAM: 0 };
  for (const row of byStatus) counts[row.status] = row._count._all;
  return {
    total,
    unread,
    read: counts.READ,
    inProgress: counts.IN_PROGRESS,
    replied: counts.REPLIED,
    archived: counts.ARCHIVED,
    spam: counts.SPAM,
    byStatus: counts,
  };
}

export function parseDateRange(from: string | null, to: string | null) {
  const range: { gte?: Date; lte?: Date } = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) range.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); range.lte = d; }
  }
  return Object.keys(range).length ? range : undefined;
}

export function safeContactSelect() {
  return {
    id: true, createdAt: true, updatedAt: true, name: true, email: true, topic: true, station: true,
    message: true, status: true, priority: true, assignedToId: true, readAt: true, repliedAt: true,
    archivedAt: true, spamAt: true, delivery: true,
    assignedTo: { select: { id: true, email: true, name: true } },
  } as const;
}

export async function getContactDetail(id: string) {
  const prisma = getPrisma();
  return prisma.contactSubmission.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, email: true, name: true, role: true } },
      replies: { orderBy: { createdAt: "desc" }, include: { actor: { select: { id: true, email: true, name: true } } } },
      contactNotes: { orderBy: { createdAt: "desc" }, include: { author: { select: { id: true, email: true, name: true } } } },
      activities: { orderBy: { createdAt: "desc" }, take: 100, include: { actor: { select: { id: true, email: true, name: true } } } },
    },
  });
}
