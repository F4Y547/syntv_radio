import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";
import { invalidatePublicDirectoryCache } from "@/lib/cache/invalidate-public";
type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, ctx: Ctx) {
  const g = await adminGuard(request, { minimum: "administrator", mutate: true });
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  try {
    await getPrisma().seoMetadata.delete({ where: { id } });
    await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "seo.delete", targetType: "seo", targetId: id });
    await invalidatePublicDirectoryCache(["stations", "countries", "genres"]);
    return adminJson({ ok: true }, undefined, g.rl);
  } catch { return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl); }
}
