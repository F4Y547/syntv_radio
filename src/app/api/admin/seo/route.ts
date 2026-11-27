import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";

export async function GET(request: Request) {
  const g = await adminGuard(request, { minimum: "editor" });
  if ("error" in g) return g.error;
  const items = await getPrisma().seoMetadata.findMany({ orderBy: { path: "asc" }, take: 500 });
  return adminJson({ ok: true, items }, undefined, g.rl);
}

export async function POST(request: Request) {
  const g = await adminGuard(request, { minimum: "administrator", mutate: true });
  if ("error" in g) return g.error;
  let body: unknown; try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const r = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const path = typeof r.path === "string" ? r.path.trim() : "";
  if (!path.startsWith("/")) return adminJson({ ok: false, error: "path must start with /" }, { status: 400 }, g.rl);
  const data = {
    path,
    title: typeof r.title === "string" ? r.title.trim() || null : null,
    description: typeof r.description === "string" ? r.description.trim() || null : null,
    canonical: typeof r.canonical === "string" ? r.canonical.trim() || null : null,
    ogImage: typeof r.ogImage === "string" ? r.ogImage.trim() || null : null,
    noindex: r.noindex === true,
    structuredData: r.structuredData && typeof r.structuredData === "object" ? (r.structuredData as object) : undefined,
    updatedBy: g.user.email,
  };
  const item = await getPrisma().seoMetadata.upsert({ where: { path }, create: data, update: data });
  await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "seo.upsert", targetType: "seo", targetId: item.id, detail: { path } });
  return adminJson({ ok: true, item }, { status: 201 }, g.rl);
}
