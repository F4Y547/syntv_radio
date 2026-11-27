import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { hashPassword } from "@/lib/admin/password";
import { addAuditLog } from "@/lib/admin/audit";

export async function GET(request: Request) {
  const g = await adminGuard(request, { minimum: "administrator" });
  if ("error" in g) return g.error;
  const users = await getPrisma().adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true, updatedAt: true },
  });
  return adminJson({ ok: true, users }, undefined, g.rl);
}

export async function POST(request: Request) {
  const g = await adminGuard(request, { minimum: "owner", mutate: true });
  if ("error" in g) return g.error;
  let body: unknown; try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const r = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const email = typeof r.email === "string" ? r.email.trim().toLowerCase() : "";
  const password = typeof r.password === "string" ? r.password : "";
  const name = typeof r.name === "string" ? r.name.trim() || null : null;
  const role = r.role === "owner" || r.role === "administrator" || r.role === "editor" ? r.role : "editor";
  if (!email || password.length < 12) return adminJson({ ok: false, error: "Valid email and password (min 12 chars) required" }, { status: 400 }, g.rl);
  const prisma = getPrisma();
  const exists = await prisma.adminUser.findUnique({ where: { email } });
  if (exists) return adminJson({ ok: false, error: "User already exists" }, { status: 409 }, g.rl);
  const user = await prisma.adminUser.create({ data: { email, name, passwordHash: hashPassword(password), role, active: true } });
  await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "user.create", targetType: "user", targetId: user.id, detail: { email, role } });
  return adminJson({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, active: user.active } }, { status: 201 }, g.rl);
}
