import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";
import { invalidatePublicDirectoryCache } from "@/lib/cache/invalidate-public";
import type { StationApprovalStatus } from "@prisma/client";

function parseIntSafe(v: unknown) { const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : undefined; }

export async function GET(request: Request) {
  const g = await adminGuard(request, { minimum: "editor", rateKey: "admin:stations:list" });
  if ("error" in g) return g.error;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const status = url.searchParams.get("status") as StationApprovalStatus | null;
  const take = Math.min(100, Math.max(1, parseIntSafe(url.searchParams.get("limit")) ?? 50));
  const skip = Math.max(0, parseIntSafe(url.searchParams.get("offset")) ?? 0);
  const prisma = getPrisma();
  const where = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { country: { contains: q, mode: "insensitive" as const } }, { externalId: { contains: q, mode: "insensitive" as const } }] } : {}),
    ...(status && ["pending","approved","rejected"].includes(status) ? { approvalStatus: status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.station.findMany({ where, orderBy: { updatedAt: "desc" }, take, skip }),
    prisma.station.count({ where }),
  ]);
  return adminJson({ ok: true, items, total, limit: take, offset: skip }, undefined, g.rl);
}

export async function POST(request: Request) {
  const g = await adminGuard(request, { minimum: "administrator", mutate: true, rateKey: "admin:stations:create" });
  if ("error" in g) return g.error;
  let body: unknown;
  try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const r = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name.trim() : "";
  const streamUrl = typeof r.streamUrl === "string" ? r.streamUrl.trim() : "";
  if (!name || !streamUrl) return adminJson({ ok: false, error: "name and streamUrl required" }, { status: 400 }, g.rl);
  const tags = Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === "string").map((t) => t.trim()).filter(Boolean).slice(0, 20) : [];
  const prisma = getPrisma();
  const station = await prisma.station.create({
    data: {
      name, streamUrl,
      homepage: typeof r.homepage === "string" ? r.homepage.trim() || null : null,
      favicon: typeof r.favicon === "string" ? r.favicon.trim() || null : null,
      country: typeof r.country === "string" ? r.country.trim() || null : null,
      countryCode: typeof r.countryCode === "string" ? r.countryCode.trim().toUpperCase() || null : null,
      state: typeof r.state === "string" ? r.state.trim() || null : null,
      language: typeof r.language === "string" ? r.language.trim() || null : null,
      tags,
      codec: typeof r.codec === "string" ? r.codec.trim() || null : null,
      bitrate: typeof r.bitrate === "number" && Number.isFinite(r.bitrate) ? Math.trunc(r.bitrate) : null,
      description: typeof r.description === "string" ? r.description.trim() || null : null,
      isActive: r.isActive !== false,
      isFeatured: r.isFeatured === true,
      isVerified: r.isVerified === true,
      approvalStatus: (["pending","approved","rejected"].includes(String(r.approvalStatus)) ? r.approvalStatus : "approved") as StationApprovalStatus,
      externalId: typeof r.externalId === "string" ? r.externalId.trim() || null : null,
    },
  });
  await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "station.create", targetType: "station", targetId: station.id, detail: { name: station.name } });
  await invalidatePublicDirectoryCache(["stations"]);
  return adminJson({ ok: true, station }, { status: 201 }, g.rl);
}
