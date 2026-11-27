import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";
import type { Prisma } from "@prisma/client";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const g = await adminGuard(request, { minimum: "editor", mutate: true });
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  let body: unknown; try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const r = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof r.status === "string" && ["new","reviewed","resolved","spam"].includes(r.status)) data.status = r.status;
  if (typeof r.notes === "string") data.notes = r.notes.slice(0, 2000);
  if (r.notes === null) data.notes = null;
  if (Object.keys(data).length === 0) return adminJson({ ok: false, error: "No valid fields" }, { status: 400 }, g.rl);
  try {
    const item = await getPrisma().contactSubmission.update({ where: { id }, data });
    await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "contact.update", targetType: "contact", targetId: id, detail: data as Prisma.InputJsonValue });
    return adminJson({ ok: true, item }, undefined, g.rl);
  } catch { return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl); }
}
