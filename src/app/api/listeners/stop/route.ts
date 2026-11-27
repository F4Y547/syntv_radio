import { NextResponse } from "next/server";
import { LISTENER_SCOPE, getListenerStore, isValidSessionId, getClientIp, checkRateLimitAsync, rateLimitHeaders } from "@/lib/listeners";


export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`listeners:stop:${ip}`, 60, 60_000);
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

  const { sessionId, reason } = (body ?? {}) as Record<string, unknown>;
  if (!isValidSessionId(sessionId)) {
    return NextResponse.json({ success: false, error: "Invalid sessionId" }, { status: 400, headers: rateLimitHeaders(rl) });
  }
  const safeReason = reason === "error" ? "error" : reason === "pause" || reason === "switch" || reason === "stop" || reason === "unmount" ? String(reason) : undefined;

  try {
    const store = getListenerStore();
    const now = Date.now();
    const result = await store.stopSession({ sessionId, now, reason: safeReason });
    return NextResponse.json(
      {
        success: true,
        scope: LISTENER_SCOPE,
        stationId: result.stationId,
        listeners: result.stationListeners,
        totalListeners: result.totalListeners,
        updatedAt: new Date(now).toISOString(),
      },
      { headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rl) } },
    );
  } catch (error) {
    console.error("[listeners/stop]", error);
    return NextResponse.json({ success: false, error: "Listener service unavailable" }, { status: 503, headers: rateLimitHeaders(rl) });
  }
}
