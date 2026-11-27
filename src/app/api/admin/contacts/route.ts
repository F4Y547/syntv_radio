import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";

export async function GET(request: Request) {
  const g = await adminGuard(request, { minimum: "editor" });
  if ("error" in g) return g.error;
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const take = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));
  const prisma = getPrisma();
  const where = status && ["new","reviewed","resolved","spam"].includes(status) ? { status: status as "new" | "reviewed" | "resolved" | "spam" } : {};
  const [items, total] = await Promise.all([
    prisma.contactSubmission.findMany({ where, orderBy: { createdAt: "desc" }, take }),
    prisma.contactSubmission.count({ where }),
  ]);
  return adminJson({ ok: true, items, total }, undefined, g.rl);
}
