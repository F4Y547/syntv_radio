import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";

export async function GET(request: Request) {
  const g = await adminGuard(request, { minimum: "editor", rateKey: "admin:station-overrides:get" });
  if ("error" in g) return g.error;
  const prisma = getPrisma();
  const rows = await prisma.station.findMany({
    where: { OR: [{ isFeatured: true }, { isVerified: true }, { isActive: false }, { approvalStatus: { not: "approved" } }, { externalId: { not: null } }] },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  const overrides = rows.map((s) => ({
    stationId: s.externalId || s.id,
    featured: s.isFeatured,
    verified: s.isVerified,
    hidden: !s.isActive,
    approvalStatus: s.approvalStatus,
    note: s.description,
    updatedAt: s.updatedAt.toISOString(),
    updatedBy: "admin",
  }));
  return adminJson({ ok: true, overrides }, undefined, g.rl);
}

export async function POST(request: Request) {
  const g = await adminGuard(request, { minimum: "administrator", mutate: true, rateKey: "admin:station-overrides:post" });
  if ("error" in g) return g.error;
  let body: unknown;
  try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const rec = (body && typeof body === "object") ? body as Record<string, unknown> : {};
  const stationId = typeof rec.stationId === "string" ? rec.stationId.trim() : "";
  if (!stationId) return adminJson({ ok: false, error: "stationId required" }, { status: 400 }, g.rl);
  const prisma = getPrisma();
  const existing = await prisma.station.findFirst({ where: { OR: [{ externalId: stationId }, { id: stationId }] } });
  const data = {
    isFeatured: Boolean(rec.featured),
    isVerified: Boolean(rec.verified),
    isActive: !Boolean(rec.hidden),
    description: typeof rec.note === "string" ? rec.note.slice(0, 500) : existing?.description ?? null,
  };
  const station = existing
    ? await prisma.station.update({ where: { id: existing.id }, data })
    : await prisma.station.create({ data: { externalId: stationId, name: `Station ${stationId.slice(0, 8)}`, streamUrl: "", approvalStatus: "pending", ...data } });
  await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "station.override_upsert", targetType: "station", targetId: station.id, detail: { stationId, featured: data.isFeatured, verified: data.isVerified, hidden: !data.isActive } });
  return adminJson({ ok: true, override: { stationId, featured: station.isFeatured, verified: station.isVerified, hidden: !station.isActive, note: station.description, updatedAt: station.updatedAt.toISOString(), updatedBy: g.user.email } }, undefined, g.rl);
}
