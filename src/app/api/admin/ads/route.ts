import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";

export async function GET(request: Request) {
  const g = await adminGuard(request, { minimum: "editor" });
  if ("error" in g) return g.error;
  const item = await getPrisma().adConfig.findUnique({ where: { key: "default" } });
  return adminJson({ ok: true, item }, undefined, g.rl);
}

export async function PUT(request: Request) {
  const g = await adminGuard(request, { minimum: "administrator", mutate: true });
  if ("error" in g) return g.error;
  let body: unknown; try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const r = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const data = {
    key: "default",
    enabled: r.enabled === true,
    cmpVerified: r.cmpVerified === true,
    publisherId: typeof r.publisherId === "string" ? r.publisherId.trim() || null : null,
    homeSlot: typeof r.homeSlot === "string" ? r.homeSlot.trim() || null : null,
    listingSlot: typeof r.listingSlot === "string" ? r.listingSlot.trim() || null : null,
    detailSlot: typeof r.detailSlot === "string" ? r.detailSlot.trim() || null : null,
    notes: typeof r.notes === "string" ? r.notes.trim().slice(0, 2000) || null : null,
    updatedBy: g.user.email,
  };
  const item = await getPrisma().adConfig.upsert({ where: { key: "default" }, create: data, update: data });
  await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "ads.update", targetType: "ads", targetId: item.id, detail: { enabled: data.enabled, cmpVerified: data.cmpVerified } });
  return adminJson({ ok: true, item }, undefined, g.rl);
}
