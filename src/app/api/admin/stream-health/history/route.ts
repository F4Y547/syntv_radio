import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";

export async function GET(request: Request) {
  const g = await adminGuard(request, { minimum: "editor" });
  if ("error" in g) return g.error;
  const url = new URL(request.url);
  const stationId = url.searchParams.get("stationId")?.trim();
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || 50)));
  const prisma = getPrisma();
  const where = stationId ? { OR: [{ stationId }, { station: { externalId: stationId } }] } : {};
  const items = await prisma.streamHealthCheck.findMany({
    where,
    orderBy: { checkedAt: "desc" },
    take: limit,
    include: { station: { select: { id: true, name: true, externalId: true } } },
  });
  return adminJson({ ok: true, items }, undefined, g.rl);
}
