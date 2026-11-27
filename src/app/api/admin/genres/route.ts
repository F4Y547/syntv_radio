import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";
import { invalidatePublicDirectoryCache } from "@/lib/cache/invalidate-public";

export async function GET(request: Request) {
  const g = await adminGuard(request, { minimum: "editor" });
  if ("error" in g) return g.error;
  const items = await getPrisma().genre.findMany({ orderBy: { name: "asc" }, take: 500 });
  return adminJson({ ok: true, items }, undefined, g.rl);
}

export async function POST(request: Request) {
  const g = await adminGuard(request, { minimum: "administrator", mutate: true });
  if ("error" in g) return g.error;
  let body: unknown; try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const r = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name.trim() : "";
  const slug = typeof r.slug === "string" ? r.slug.trim().toLowerCase() : "";
  if (!name || !slug) return adminJson({ ok: false, error: "name, slug required" }, { status: 400 }, g.rl);
  const item = await getPrisma().genre.create({ data: { name, slug, isActive: r.isActive !== false } });
  await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "genre.create", targetType: "genre", targetId: item.id, detail: { slug } });
  await invalidatePublicDirectoryCache(["genres"]);
  return adminJson({ ok: true, item }, { status: 201 }, g.rl);
}
