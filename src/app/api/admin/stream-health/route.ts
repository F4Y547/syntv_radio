import { NextResponse } from "next/server";
import dns from "node:dns/promises";
import net from "node:net";
import { getClientIp, checkRateLimitAsync, rateLimitHeaders } from "@/lib/listeners";
import { getCurrentAdmin, assertSameOrigin, assertCsrf } from "@/lib/admin/auth";
import { hasDatabase, getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";

function isPrivateIp(ip: string) {
  const v = net.isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 192 && b === 0 && (ip.split(".")[2] === "0" || ip.split(".")[2] === "2")) return true;
    if (a >= 224) return true;
    return false;
  }
  if (v === 6) {
    const n = ip.toLowerCase();
    return n === "::1" || n === "::" || n.startsWith("fc") || n.startsWith("fd") || n.startsWith("fe80") || n.startsWith("::ffff:127.") || n.startsWith("::ffff:10.") || n.startsWith("::ffff:192.168.") || n.startsWith("::ffff:172.1") || n.startsWith("::ffff:172.2") || n.startsWith("::ffff:172.3");
  }
  return false;
}

function isPrivateHost(hostname: string) {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (net.isIP(h)) return isPrivateIp(h);
  return false;
}

async function resolvesToPrivateHost(hostname: string) {
  if (isPrivateHost(hostname)) return true;
  if (net.isIP(hostname)) return isPrivateIp(hostname);
  try {
    const results = await dns.lookup(hostname, { all: true, verbatim: true });
    return results.length === 0 || results.some((r) => isPrivateIp(r.address));
  } catch {
    return true; // fail closed
  }
}

async function validateStreamUrl(raw: string) {
  let parsed: URL;
  try { parsed = new URL(raw); } catch { return { ok: false as const, error: "Invalid URL" }; }
  if (!["http:", "https:"].includes(parsed.protocol)) return { ok: false as const, error: "Only HTTP/HTTPS URLs allowed" };
  if (parsed.username || parsed.password) return { ok: false as const, error: "Credentials in URL are not allowed" };
  if (await resolvesToPrivateHost(parsed.hostname)) return { ok: false as const, error: "Private or unresolved hosts are not allowed" };
  return { ok: true as const, url: parsed };
}

async function safeFetch(url: URL) {
  let current = url;
  for (let i = 0; i < 4; i += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(current.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "SYNTV-Radio-HealthCheck/1.0", Accept: "audio/*,*/*;q=0.1" },
      });
      clearTimeout(timeout);
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        await res.body?.cancel().catch(() => {});
        if (!loc) return { ok: false, status: res.status, error: "Redirect missing location" };
        const next = new URL(loc, current);
        const valid = await validateStreamUrl(next.toString());
        if (!valid.ok) return { ok: false, status: res.status, error: `Blocked redirect: ${valid.error}` };
        current = valid.url;
        continue;
      }
      // Don't read full stream body; just enough to confirm response.
      await res.body?.cancel().catch(() => {});
      return { ok: res.ok, status: res.status, contentType: res.headers.get("content-type") || "" };
    } catch (err) {
      clearTimeout(timeout);
      return { ok: false, error: err instanceof Error ? err.message : "Request failed" };
    }
  }
  return { ok: false, error: "Too many redirects" };
}

async function isAuthorized(request: Request) {
  const user = await getCurrentAdmin();
  if (user) return { ok: true as const, actorEmail: user.email, actorId: user.id, csrfToken: user.csrfToken, session: true as const };
  const token = process.env.LISTENER_ADMIN_TOKEN?.trim();
  if (token) {
    const auth = request.headers.get("authorization") ?? "";
    const header = request.headers.get("x-listener-admin-token") ?? "";
    if (auth === `Bearer ${token}` || header === token) return { ok: true as const, actorEmail: "legacy-token-admin", actorId: null, csrfToken: "", session: false as const };
  }
  return { ok: false as const };
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`admin:stream-health:${ip}`, 20, 60_000);
  const headers = { "Cache-Control": "no-store", ...rateLimitHeaders(rl) };
  if (!rl.allowed) return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers });
  const auth = await isAuthorized(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers });
  const originErr = await assertSameOrigin(request).catch(() => "Invalid origin");
  if (auth.session) {
    if (originErr) return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403, headers });
    const csrfErr = assertCsrf(request, auth.csrfToken);
    if (csrfErr) return NextResponse.json({ ok: false, error: "Invalid CSRF token" }, { status: 403, headers });
  } else {
    // Legacy token: allow missing Origin for non-browser scripts, but reject bad origin.
    const origin = request.headers.get("origin");
    if (origin && originErr) return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403, headers });
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400, headers }); }
  const rec = (body && typeof body === "object") ? body as Record<string, unknown> : {};
  const url = typeof rec.url === "string" ? rec.url.trim() : "";
  const stationId = typeof rec.stationId === "string" ? rec.stationId.trim() : undefined;
  const valid = await validateStreamUrl(url);
  if (!valid.ok) return NextResponse.json({ ok: false, error: valid.error }, { status: 400, headers });

  const started = Date.now();
  const result = await safeFetch(valid.url);
  const payload = {
    ...result,
    latencyMs: Date.now() - started,
    checkedAt: new Date().toISOString(),
    url: valid.url.toString(),
  };

  if (hasDatabase()) {
    try {
      const prisma = getPrisma();
      const dbStationId = stationId ? (await prisma.station.findFirst({ where: { OR: [{ id: stationId }, { externalId: stationId }] }, select: { id: true } }))?.id : undefined;
      await prisma.streamHealthCheck.create({
        data: {
          stationId: dbStationId ?? null,
          streamUrl: valid.url.toString(),
          ok: Boolean(result.ok),
          statusCode: typeof result.status === "number" ? result.status : null,
          contentType: typeof result.contentType === "string" ? result.contentType : null,
          latencyMs: Date.now() - started,
          error: typeof result.error === "string" ? result.error.slice(0, 500) : null,
          checkedBy: auth.actorEmail ?? null,
        },
      });
      await addAuditLog({ actorId: auth.actorId, actorEmail: auth.actorEmail, action: "stream_health.check", targetType: "stream", targetId: dbStationId ?? stationId ?? null, detail: { ok: Boolean(result.ok), status: typeof result.status === "number" ? result.status : null } });
    } catch (e) {
      console.error("[admin/stream-health] failed to persist", e);
    }
  }

  return NextResponse.json(payload, { headers });
}
