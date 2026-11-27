import { NextResponse } from "next/server";
import { listenerConfig, getClientIp, checkRateLimitAsync, rateLimitHeaders } from "@/lib/listeners";
import { addAuditLog, listStationOverrides, upsertStationOverride } from "@/lib/admin/store";

function isAuthorized(request: Request) {
  const token = listenerConfig.adminToken;
  if (!token) return false;
  const auth = request.headers.get("authorization") ?? "";
  if (auth === `Bearer ${token}`) return true;
  return (request.headers.get("x-listener-admin-token") ?? "") === token;
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`admin:station-overrides:get:${ip}`, 30, 60_000);
  if (!rl.allowed) return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });
  if (!listenerConfig.adminToken) return NextResponse.json({ ok: false, error: "Admin not configured" }, { status: 503, headers: rateLimitHeaders(rl) });
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: rateLimitHeaders(rl) });
  const overrides = await listStationOverrides();
  return NextResponse.json({ ok: true, overrides }, { headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rl) } });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`admin:station-overrides:post:${ip}`, 20, 60_000);
  if (!rl.allowed) return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });
  if (!listenerConfig.adminToken) return NextResponse.json({ ok: false, error: "Admin not configured" }, { status: 503, headers: rateLimitHeaders(rl) });
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: rateLimitHeaders(rl) });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400, headers: rateLimitHeaders(rl) }); }
  const rec = (body && typeof body === "object") ? body as Record<string, unknown> : {};
  const stationId = typeof rec.stationId === "string" ? rec.stationId.trim() : "";
  if (!stationId) return NextResponse.json({ ok: false, error: "stationId required" }, { status: 400, headers: rateLimitHeaders(rl) });
  const override = {
    stationId,
    featured: Boolean(rec.featured),
    verified: Boolean(rec.verified),
    hidden: Boolean(rec.hidden),
    note: typeof rec.note === "string" ? rec.note.slice(0, 500) : undefined,
    updatedAt: new Date().toISOString(),
    updatedBy: "admin-token",
  };
  await upsertStationOverride(override);
  await addAuditLog({ actor: "admin-token", action: "station_override_upsert", target: stationId, detail: `featured=${override.featured} verified=${override.verified} hidden=${override.hidden}` });
  return NextResponse.json({ ok: true, override }, { headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rl) } });
}
