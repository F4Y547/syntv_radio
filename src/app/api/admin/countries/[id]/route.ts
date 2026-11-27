import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";
import { invalidatePublicDirectoryCache } from "@/lib/cache/invalidate-public";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const g = await adminGuard(request, { minimum: "administrator", mutate: true });
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  let body: unknown; try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const r = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof r.name === "string") data.name = r.name.trim();
  if (typeof r.code === "string") data.code = r.code.trim().toUpperCase();
  if (typeof r.slug === "string") data.slug = r.slug.trim().toLowerCase();
  if (typeof r.isActive === "boolean") data.isActive = r.isActive;
  const prisma = getPrisma();
  try {
    const item = await prisma.country.update({ where: { id }, data });
    await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "country.update", targetType: "country", targetId: id });
    await invalidatePublicDirectoryCache(["countries"]);
    return adminJson({ ok: true, item }, undefined, g.rl);
  } catch { return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl); }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const g = await adminGuard(request, { minimum: "owner", mutate: true });
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  const prisma = getPrisma();
  try {
    await prisma.country.delete({ where: { id } });
    await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "country.delete", targetType: "country", targetId: id });
    await invalidatePublicDirectoryCache(["countries"]);
    return adminJson({ ok: true }, undefined, g.rl);
  } catch { return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl); }
}
