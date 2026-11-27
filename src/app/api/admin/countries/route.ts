import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";

export async function GET(request: Request) {
  const g = await adminGuard(request, { minimum: "editor" });
  if ("error" in g) return g.error;
  const prisma = getPrisma();
  const items = await prisma.country.findMany({ orderBy: { name: "asc" }, take: 500 });
  return adminJson({ ok: true, items }, undefined, g.rl);
}

export async function POST(request: Request) {
  const g = await adminGuard(request, { minimum: "administrator", mutate: true });
  if ("error" in g) return g.error;
  let body: unknown; try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const r = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name.trim() : "";
  const code = typeof r.code === "string" ? r.code.trim().toUpperCase() : "";
  const slug = typeof r.slug === "string" ? r.slug.trim().toLowerCase() : "";
  if (!name || !code || !slug) return adminJson({ ok: false, error: "name, code, slug required" }, { status: 400 }, g.rl);
  const prisma = getPrisma();
  const item = await prisma.country.create({ data: { name, code, slug, isActive: r.isActive !== false } });
  await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "country.create", targetType: "country", targetId: item.id, detail: { code } });
  return adminJson({ ok: true, item }, { status: 201 }, g.rl);
}
