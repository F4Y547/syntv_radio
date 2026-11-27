import { NextResponse } from "next/server";
import { getListenerStore, listenerConfig, getClientIp, checkRateLimitAsync, rateLimitHeaders } from "@/lib/listeners";
import { listAuditLog, listContactSubmissions, listStationOverrides } from "@/lib/admin/store";
import { getContactDeliveryConfig } from "@/lib/contact/config";
import { getPublicAdSenseConfig } from "@/lib/ads/config";

function isAuthorized(request: Request) {
  const token = listenerConfig.adminToken;
  if (!token) return false;
  const auth = request.headers.get("authorization") ?? "";
  if (auth === `Bearer ${token}`) return true;
  const header = request.headers.get("x-listener-admin-token") ?? "";
  return header === token;
}

function envStatus(name: string, value: string | undefined, opts?: { secret?: boolean }) {
  const present = Boolean(value && value.trim());
  return { name, configured: present, secret: Boolean(opts?.secret) };
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`listeners:admin:${ip}`, 30, 60_000);
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
    const now = Date.now();
    const [analytics, contactSubmissions, auditLog, stationOverrides] = await Promise.all([
      store.getAnalytics(now),
      listContactSubmissions(50).catch(() => []),
      listAuditLog(50).catch(() => []),
      listStationOverrides().catch(() => []),
    ]);

    const contact = getContactDeliveryConfig();
    const ads = getPublicAdSenseConfig();
    const system = {
      redisConfigured: Boolean(process.env.REDIS_URL?.trim()),
      listenerStore: process.env.REDIS_URL?.trim() ? "redis" : "memory",
      nodeEnv: process.env.NODE_ENV ?? "unknown",
      contact: {
        mode: contact.mode,
        problem: "problem" in contact ? contact.problem ?? null : null,
      },
      ads: {
        enabled: ads.enabled,
        cmpVerified: ads.cmpVerified,
        publisherConfigured: Boolean(ads.publisherId),
        slotConfigured: ads.slotIds.some(Boolean),
        anyPlaceholder: false,
      },
      env: [
        envStatus("REDIS_URL", process.env.REDIS_URL, { secret: true }),
        envStatus("LISTENER_ADMIN_TOKEN", process.env.LISTENER_ADMIN_TOKEN, { secret: true }),
        envStatus("CONTACT_WEBHOOK_URL", process.env.CONTACT_WEBHOOK_URL),
        envStatus("CONTACT_WEBHOOK_SECRET", process.env.CONTACT_WEBHOOK_SECRET, { secret: true }),
        envStatus("RESEND_API_KEY", process.env.RESEND_API_KEY, { secret: true }),
        envStatus("CONTACT_FROM_EMAIL", process.env.CONTACT_FROM_EMAIL),
        envStatus("CONTACT_TO_EMAIL", process.env.CONTACT_TO_EMAIL),
        envStatus("NEXT_PUBLIC_ADSENSE_CLIENT_ID", process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID),
        envStatus("ADS_ENABLED", process.env.ADS_ENABLED),
        envStatus("ADS_CMP_VERIFIED", process.env.ADS_CMP_VERIFIED),
      ],
    };

    return NextResponse.json(
      {
        success: true,
        ...analytics,
        system,
        contactSubmissions,
        auditLog,
        stationOverrides,
      },
      { headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rl) } },
    );
  } catch (error) {
    console.error("[listeners/admin]", error);
    return NextResponse.json({ success: false, error: "Analytics unavailable" }, { status: 503, headers: rateLimitHeaders(rl) });
  }
}
