import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";
import { invalidatePublicDirectoryCache } from "@/lib/cache/invalidate-public";
import type { StationApprovalStatus } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const g = await adminGuard(request, { minimum: "editor", rateKey: "admin:stations:get" });
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  const prisma = getPrisma();
  const station = await prisma.station.findUnique({ where: { id }, include: { healthChecks: { orderBy: { checkedAt: "desc" }, take: 20 } } });
  if (!station) return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl);
  return adminJson({ ok: true, station }, undefined, g.rl);
}

export async function PATCH(request: Request, ctx: Ctx) {
  const g = await adminGuard(request, { minimum: "administrator", mutate: true, rateKey: "admin:stations:update" });
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  let body: unknown;
  try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const r = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof r.name === "string") data.name = r.name.trim();
  if (typeof r.streamUrl === "string") data.streamUrl = r.streamUrl.trim();
  if (typeof r.homepage === "string") data.homepage = r.homepage.trim() || null;
  if (typeof r.favicon === "string") data.favicon = r.favicon.trim() || null;
  if (typeof r.country === "string") data.country = r.country.trim() || null;
  if (typeof r.countryCode === "string") data.countryCode = r.countryCode.trim().toUpperCase() || null;
  if (typeof r.state === "string") data.state = r.state.trim() || null;
  if (typeof r.language === "string") data.language = r.language.trim() || null;
  if (typeof r.codec === "string") data.codec = r.codec.trim() || null;
  if (typeof r.bitrate === "number" && Number.isFinite(r.bitrate)) data.bitrate = Math.trunc(r.bitrate);
  if (r.bitrate === null) data.bitrate = null;
  if (typeof r.description === "string") data.description = r.description.trim() || null;
  if (typeof r.isActive === "boolean") data.isActive = r.isActive;
  if (typeof r.isFeatured === "boolean") data.isFeatured = r.isFeatured;
  if (typeof r.isVerified === "boolean") data.isVerified = r.isVerified;
  if (typeof r.approvalStatus === "string" && ["pending","approved","rejected"].includes(r.approvalStatus)) data.approvalStatus = r.approvalStatus as StationApprovalStatus;
  if (Array.isArray(r.tags)) data.tags = r.tags.filter((t): t is string => typeof t === "string").map((t) => t.trim()).filter(Boolean).slice(0, 20);
  if (typeof r.externalId === "string") data.externalId = r.externalId.trim() || null;
  if (Object.keys(data).length === 0) return adminJson({ ok: false, error: "No valid fields" }, { status: 400 }, g.rl);
  const prisma = getPrisma();
  try {
    const station = await prisma.station.update({ where: { id }, data });
    await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "station.update", targetType: "station", targetId: id, detail: { fields: Object.keys(data) } });
    await invalidatePublicDirectoryCache(["stations"]);
    return adminJson({ ok: true, station }, undefined, g.rl);
  } catch {
    return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl);
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const g = await adminGuard(request, { minimum: "owner", mutate: true, rateKey: "admin:stations:delete" });
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  const prisma = getPrisma();
  try {
    await prisma.station.delete({ where: { id } });
    await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "station.delete", targetType: "station", targetId: id });
    await invalidatePublicDirectoryCache(["stations"]);
    return adminJson({ ok: true }, undefined, g.rl);
  } catch {
    return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl);
  }
}
