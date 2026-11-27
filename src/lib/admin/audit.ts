import { getPrisma, hasDatabase } from "@/lib/db";
import type { Prisma } from "@prisma/client";

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
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        actorEmail: entry.actorEmail ?? null,
        action: entry.action,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        detail: entry.detail ?? undefined,
        ip: entry.ip ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write audit log", err);
  }
}

export async function listAuditLogs(limit = 100) {
  const prisma = getPrisma();
  return prisma.auditLog.findMany({
    orderBy: { at: "desc" },
    take: Math.min(limit, 500),
    include: { actor: { select: { email: true, name: true, role: true } } },
  });
}
