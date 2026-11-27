import { getPrisma, hasDatabase } from "@/lib/db";
import type { Prisma, SubmissionStatus } from "@prisma/client";

export type { SubmissionStatus };

export async function recordContactSubmission(input: {
  name: string;
  email: string;
  topic: string;
  station: string;
  message: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  if (!hasDatabase()) {
    console.warn("[admin] DATABASE_URL not configured; contact submission not persisted to admin DB");
    return;
  }
  const prisma = getPrisma();
  await prisma.contactSubmission.create({
    data: {
      name: input.name,
      email: input.email,
      topic: input.topic,
      station: input.station || null,
      message: input.message,
      ip: input.ip ?? null,
      userAgent: input.userAgent?.slice(0, 500) ?? null,
      status: "new",
      delivery: "accepted",
    },
  });
}

export async function listContactSubmissions(limit = 100) {
  const prisma = getPrisma();
  return prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" }, take: Math.min(limit, 500) });
}

export async function updateContactSubmissionStatus(id: string, status: SubmissionStatus, notes?: string | null) {
  const prisma = getPrisma();
  return prisma.contactSubmission.update({
    where: { id },
    data: { status, notes: notes === undefined ? undefined : notes },
  });
}

export async function listStationOverrides() {
  if (!hasDatabase()) return [];
  const prisma = getPrisma();
  const rows = await prisma.station.findMany({
    where: { OR: [{ isFeatured: true }, { isVerified: true }, { isActive: false }, { approvalStatus: { not: "approved" } }, { externalId: { not: null } }] },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return rows.map((s) => ({
    stationId: s.externalId || s.id,
    dbId: s.id,
    featured: s.isFeatured,
    verified: s.isVerified,
    hidden: !s.isActive,
    approvalStatus: s.approvalStatus,
    updatedAt: s.updatedAt.toISOString(),
    name: s.name,
  }));
}

export async function upsertStationOverride(input: {
  stationId: string;
  featured?: boolean;
  verified?: boolean;
  hidden?: boolean;
  note?: string;
  updatedBy: string;
}) {
  const prisma = getPrisma();
  const externalId = input.stationId;
  const existing = await prisma.station.findFirst({ where: { OR: [{ externalId }, { id: externalId }] } });
  if (existing) {
    return prisma.station.update({
      where: { id: existing.id },
      data: {
        isFeatured: input.featured ?? existing.isFeatured,
        isVerified: input.verified ?? existing.isVerified,
        isActive: input.hidden === undefined ? existing.isActive : !input.hidden,
        description: input.note ?? existing.description,
      },
    });
  }
  return prisma.station.create({
    data: {
      externalId,
      name: `Station ${externalId.slice(0, 8)}`,
      streamUrl: "",
      isFeatured: Boolean(input.featured),
      isVerified: Boolean(input.verified),
      isActive: !input.hidden,
      description: input.note,
      approvalStatus: "pending",
    },
  });
}

export async function addAuditLog(entry: {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  detail?: Prisma.InputJsonValue | null;
  ip?: string | null;
}) {
  if (!hasDatabase()) return;
  try {
    const prisma = getPrisma();
    await prisma.auditLog.create({ data: { ...entry, detail: entry.detail ?? undefined } });
  } catch (err) {
    console.error("[audit] failed to write audit log", err);
  }
}

export async function listAuditLog(limit = 100) {
  if (!hasDatabase()) return [];
  const prisma = getPrisma();
  return prisma.auditLog.findMany({
    orderBy: { at: "desc" },
    take: Math.min(limit, 500),
    include: { actor: { select: { email: true, name: true } } },
  });
}

export async function getAdminData() {
  if (!hasDatabase()) {
    return { contactSubmissions: [], auditLog: [], stationOverrides: [] };
  }
  const [contactSubmissions, auditLog, stationOverrides] = await Promise.all([
    listContactSubmissions(50),
    listAuditLog(50),
    listStationOverrides(),
  ]);
  return { contactSubmissions, auditLog, stationOverrides };
}
