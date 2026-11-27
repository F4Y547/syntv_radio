import { NextResponse } from "next/server";
import { getClientIp, checkRateLimitAsync, rateLimitHeaders } from "@/lib/listeners";
import { getCurrentAdmin, assertSameOrigin, assertCsrf } from "@/lib/admin/auth";
import { hasDatabase, getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";

function isPrivateHost(hostname: string) {
  const h = hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".local") || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(h);
}

async function isAuthorized(request: Request) {
  const user = await getCurrentAdmin();
  if (user) return { ok: true as const, actorEmail: user.email, actorId: user.id, csrfToken: user.csrfToken, session: true as const };
  // Legacy token fallback
  const token = process.env.LISTENER_ADMIN_TOKEN?.trim();
  if (token) {
    const auth = request.headers.get("authorization") ?? "";
    const header = request.headers.get("x-listener-admin-token") ?? "";
    if (auth === `Bearer ${token}` || header === token) return { ok: true as const, actorEmail: "token-admin", actorId: null, csrfToken: "", session: false as const };
  }
  return { ok: false as const };
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`admin:stream-health:${ip}`, 20, 60_000);
  if (!rl.allowed) return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });
  const auth = await isAuthorized(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: rateLimitHeaders(rl) });
  const originErr = await assertSameOrigin(request).catch(() => null);
  if (auth.session) {
    if (originErr) return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403, headers: rateLimitHeaders(rl) });
    const csrfErr = assertCsrf(request, auth.csrfToken);
    if (csrfErr) return NextResponse.json({ ok: false, error: "Invalid CSRF token" }, { status: 403, headers: rateLimitHeaders(rl) });
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400, headers: rateLimitHeaders(rl) }); }
  const rec = (body && typeof body === "object") ? body as Record<string, unknown> : {};
  const url = typeof rec.url === "string" ? rec.url.trim() : "";
  const stationId = typeof rec.stationId === "string" ? rec.stationId.trim() : undefined;
  let parsed: URL;
  try { parsed = new URL(url); } catch { return NextResponse.json({ ok: false, error: "Invalid URL" }, { status: 400, headers: rateLimitHeaders(rl) }); }
  if (!["http:", "https:"].includes(parsed.protocol)) return NextResponse.json({ ok: false, error: "Only HTTP/HTTPS URLs allowed" }, { status: 400, headers: rateLimitHeaders(rl) });
  if (process.env.NODE_ENV === "production" && isPrivateHost(parsed.hostname)) {
    return NextResponse.json({ ok: false, error: "Private hosts are not allowed in production" }, { status: 400, headers: rateLimitHeaders(rl) });
  }

  const started = Date.now();
  let result: { ok: boolean; status?: number; contentType?: string; error?: string };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(parsed.toString(), { method: "GET", signal: controller.signal, headers: { "User-Agent": "SYNTV-Radio-HealthCheck/1.0" } });
    clearTimeout(timeout);
    result = { ok: res.ok, status: res.status, contentType: res.headers.get("content-type") || "" };
    try { controller.abort(); } catch {}
  } catch (err) {
    result = { ok: false, error: err instanceof Error ? err.message : "Request failed" };
  }

  const payload = {
    ...result,
    latencyMs: Date.now() - started,
    checkedAt: new Date().toISOString(),
    url: parsed.toString(),
  };

  if (hasDatabase()) {
    try {
      const prisma = getPrisma();
      const dbStationId = stationId ? (await prisma.station.findFirst({ where: { OR: [{ id: stationId }, { externalId: stationId }] }, select: { id: true } }))?.id : undefined;
      await prisma.streamHealthCheck.create({
        data: {
          stationId: dbStationId ?? null,
          streamUrl: parsed.toString(),
          ok: result.ok,
          statusCode: result.status ?? null,
          contentType: result.contentType ?? null,
          latencyMs: Date.now() - started,
          error: result.error ?? null,
          checkedBy: auth.actorEmail ?? null,
        },
      });
      await addAuditLog({ actorId: auth.actorId, actorEmail: auth.actorEmail, action: "stream_health.check", targetType: "stream", targetId: dbStationId ?? stationId ?? null, detail: { ok: result.ok, status: result.status ?? null } });
    } catch (e) {
      console.error("[admin/stream-health] failed to persist", e);
    }
  }

  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rl) } });
}
