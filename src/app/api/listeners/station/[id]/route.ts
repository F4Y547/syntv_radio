import { NextResponse } from "next/server";
import { getListenerStore, isValidStationId, getClientIp, checkRateLimit, rateLimitHeaders } from "@/lib/listeners";


export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`listeners:station:${ip}`, 120, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  const { id } = await params;
  if (!isValidStationId(id)) {
    return NextResponse.json({ success: false, error: "Invalid stationId" }, { status: 400, headers: rateLimitHeaders(rl) });
  }

  try {
    const store = getListenerStore();
    const data = await store.getStationCount(id, Date.now());
    return NextResponse.json(
      {
        success: true,
        scope: "syntv_radio",
        ...data,
      },
      { headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rl) } },
    );
  } catch (error) {
    console.error("[listeners/station]", error);
    return NextResponse.json({ success: false, error: "Listener count unavailable" }, { status: 503, headers: rateLimitHeaders(rl) });
  }
}
