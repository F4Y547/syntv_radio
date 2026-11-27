import { NextResponse } from "next/server";
import { listenerConfig, getClientIp, checkRateLimitAsync, rateLimitHeaders } from "@/lib/listeners";

function isAuthorized(request: Request) {
  const token = listenerConfig.adminToken;
  if (!token) return false;
  const auth = request.headers.get("authorization") ?? "";
  if (auth === `Bearer ${token}`) return true;
  const header = request.headers.get("x-listener-admin-token") ?? "";
  return header === token;
}

function isPrivateHost(hostname: string) {
  const h = hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".local") || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(h);
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`admin:stream-health:${ip}`, 20, 60_000);
  if (!rl.allowed) return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });
  if (!listenerConfig.adminToken) return NextResponse.json({ ok: false, error: "Admin not configured" }, { status: 503, headers: rateLimitHeaders(rl) });
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: rateLimitHeaders(rl) });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400, headers: rateLimitHeaders(rl) }); }
  const url = typeof (body as { url?: unknown })?.url === "string" ? (body as { url: string }).url.trim() : "";
  let parsed: URL;
  try { parsed = new URL(url); } catch { return NextResponse.json({ ok: false, error: "Invalid URL" }, { status: 400, headers: rateLimitHeaders(rl) }); }
  if (!["http:", "https:"].includes(parsed.protocol)) return NextResponse.json({ ok: false, error: "Only HTTP/HTTPS URLs allowed" }, { status: 400, headers: rateLimitHeaders(rl) });
  if (process.env.NODE_ENV === "production" && isPrivateHost(parsed.hostname)) {
    return NextResponse.json({ ok: false, error: "Private hosts are not allowed in production" }, { status: 400, headers: rateLimitHeaders(rl) });
  }

  const started = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(parsed.toString(), { method: "GET", signal: controller.signal, headers: { "User-Agent": "SYNTV-Radio-HealthCheck/1.0" } });
    clearTimeout(timeout);
    const contentType = res.headers.get("content-type") || "";
    // don't consume large bodies
    controller.abort();
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      contentType,
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
      url: parsed.toString(),
    }, { headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rl) } });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Request failed",
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
      url: parsed.toString(),
    }, { headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rl) } });
  }
}
