import { NextResponse } from "next/server";
import { getListenerStore, getClientIp, checkRateLimitAsync, rateLimitHeaders } from "@/lib/listeners";


export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`listeners:live:${ip}`, 120, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  try {
    const store = getListenerStore();
    const counts = await store.getLiveCounts(Date.now());
    return NextResponse.json(
      {
        success: true,
        ...counts,
      },
      { headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rl) } },
    );
  } catch (error) {
    console.error("[listeners/live]", error);
    return NextResponse.json({ success: false, error: "Listener count unavailable" }, { status: 503, headers: rateLimitHeaders(rl) });
  }
}
