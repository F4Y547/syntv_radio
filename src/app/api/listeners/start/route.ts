import { NextResponse } from "next/server";
import { LISTENER_SCOPE, getListenerStore, listenerConfig, isValidSessionId, isValidStationId, getClientIp, checkRateLimit, rateLimitHeaders } from "@/lib/listeners";


export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`listeners:start:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400, headers: rateLimitHeaders(rl) });
  }

  const { sessionId, stationId } = (body ?? {}) as Record<string, unknown>;
  if (!isValidSessionId(sessionId)) {
    return NextResponse.json({ success: false, error: "Invalid sessionId" }, { status: 400, headers: rateLimitHeaders(rl) });
  }
  if (!isValidStationId(stationId)) {
    return NextResponse.json({ success: false, error: "Invalid stationId" }, { status: 400, headers: rateLimitHeaders(rl) });
  }

  try {
    const store = getListenerStore();
    const now = Date.now();
    const ttlMs = listenerConfig.sessionTtlSeconds * 1000;
    const counts = await store.startSession({ sessionId, stationId, now, ttlMs });
    return NextResponse.json(
      {
        success: true,
        scope: LISTENER_SCOPE,
        stationId,
        listeners: counts.stationListeners,
        totalListeners: counts.totalListeners,
        updatedAt: new Date(now).toISOString(),
      },
      { headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rl) } },
    );
  } catch (error) {
    console.error("[listeners/start]", error);
    return NextResponse.json({ success: false, error: "Listener service unavailable" }, { status: 503, headers: rateLimitHeaders(rl) });
  }
}
