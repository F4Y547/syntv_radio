import { NextResponse } from "next/server";
import { getListenerStore, listenerConfig, getClientIp, checkRateLimit, rateLimitHeaders } from "@/lib/listeners";


function isAuthorized(request: Request) {
  const token = listenerConfig.adminToken;
  if (!token) return false;
  const auth = request.headers.get("authorization") ?? "";
  if (auth === `Bearer ${token}`) return true;
  const header = request.headers.get("x-listener-admin-token") ?? "";
  return header === token;
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`listeners:admin:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  if (!listenerConfig.adminToken) {
    return NextResponse.json(
      { success: false, error: "Admin analytics not configured. Set LISTENER_ADMIN_TOKEN." },
      { status: 503, headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rl) } },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rl) } },
    );
  }

  try {
    const store = getListenerStore();
    const analytics = await store.getAnalytics(Date.now());
    return NextResponse.json(
      { success: true, ...analytics },
      { headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rl) } },
    );
  } catch (error) {
    console.error("[listeners/admin]", error);
    return NextResponse.json({ success: false, error: "Analytics unavailable" }, { status: 503, headers: rateLimitHeaders(rl) });
  }
}
