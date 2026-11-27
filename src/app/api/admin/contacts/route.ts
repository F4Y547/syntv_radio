import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { getContactStats, isContactPriority, isContactStatus, parseDateRange, safeContactSelect } from "@/lib/contact/admin";

function parseIntSafe(v: unknown) { const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : undefined; }

export async function GET(request: Request) {
  const g = await adminGuard(request, { minimum: "editor", rateKey: "admin:contacts:list" });
  if ("error" in g) return g.error;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");
  const assignedToId = url.searchParams.get("assignedToId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const sort = url.searchParams.get("sort") === "oldest" ? "asc" : "desc";
  const take = Math.min(100, Math.max(1, parseIntSafe(url.searchParams.get("limit")) ?? 20));
  const skip = Math.max(0, parseIntSafe(url.searchParams.get("offset")) ?? 0);
  const includeStats = url.searchParams.get("stats") !== "0";

  const createdAt = parseDateRange(from, to);
  const where = {
    ...(q ? {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
        { topic: { contains: q, mode: "insensitive" as const } },
        { message: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(isContactStatus(status) ? { status } : {}),
    ...(isContactPriority(priority) ? { priority } : {}),
    ...(assignedToId === "unassigned" ? { assignedToId: null } : assignedToId ? { assignedToId } : {}),
    ...(createdAt ? { createdAt } : {}),
  };

  const prisma = getPrisma();
  const [items, total, stats] = await Promise.all([
    prisma.contactSubmission.findMany({ where, orderBy: { createdAt: sort }, take, skip, select: safeContactSelect() }),
    prisma.contactSubmission.count({ where }),
    includeStats ? getContactStats() : Promise.resolve(null),
  ]);

  return adminJson({ ok: true, items, total, limit: take, offset: skip, stats }, undefined, g.rl);
}
