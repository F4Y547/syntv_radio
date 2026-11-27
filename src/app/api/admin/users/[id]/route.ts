import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { hashPassword } from "@/lib/admin/password";
import { addAuditLog } from "@/lib/admin/audit";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const g = await adminGuard(request, { minimum: "owner", mutate: true });
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  let body: unknown; try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const r = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof r.name === "string") data.name = r.name.trim() || null;
  if (typeof r.role === "string" && ["owner","administrator","editor"].includes(r.role)) data.role = r.role;
  if (typeof r.active === "boolean") data.active = r.active;
  if (typeof r.password === "string" && r.password.length >= 12) data.passwordHash = hashPassword(r.password);
  if (Object.keys(data).length === 0) return adminJson({ ok: false, error: "No valid fields" }, { status: 400 }, g.rl);
  try {
    const prisma = getPrisma();
    const user = await prisma.adminUser.update({ where: { id }, data, select: { id: true, email: true, name: true, role: true, active: true, updatedAt: true } });
    if (data.active === false) {
      await prisma.adminSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "user.sessions_revoked", targetType: "user", targetId: id, detail: { reason: "account_disabled" } });
    }
    await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "user.update", targetType: "user", targetId: id, detail: { fields: Object.keys(data).filter(k => k !== "passwordHash") } });
    return adminJson({ ok: true, user }, undefined, g.rl);
  } catch { return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl); }
}
