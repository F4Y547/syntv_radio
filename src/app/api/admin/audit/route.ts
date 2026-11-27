import { adminGuard, adminJson } from "@/lib/admin/api";
import { listAuditLogs } from "@/lib/admin/audit";

export async function GET(request: Request) {
  const g = await adminGuard(request, { minimum: "administrator" });
  if ("error" in g) return g.error;
  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || 100)));
  const items = await listAuditLogs(limit);
  return adminJson({ ok: true, items }, undefined, g.rl);
}
