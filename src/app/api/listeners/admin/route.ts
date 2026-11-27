import { NextResponse } from "next/server";
import { getListenerStore, getClientIp, checkRateLimitAsync, rateLimitHeaders } from "@/lib/listeners";
import { getContactDeliveryConfig } from "@/lib/contact/config";
import { getPublicAdSenseConfig } from "@/lib/ads/config";
import { hasDatabase } from "@/lib/db";
import { getCurrentAdmin, hasRole } from "@/lib/admin/auth";

function isAuthorizedLegacy(request: Request) {
  const token = process.env.LISTENER_ADMIN_TOKEN?.trim();
  if (!token) return false;
  const auth = request.headers.get("authorization") ?? "";
  const header = request.headers.get("x-listener-admin-token") ?? "";
  return auth === `Bearer ${token}` || header === token;
}

function envStatus(name: string, value: string | undefined, opts?: { secret?: boolean }) {
  const present = Boolean(value && value.trim());
  return { name, configured: present, secret: Boolean(opts?.secret) };
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`listeners:admin:${ip}`, 30, 60_000);
  const headers = { "Cache-Control": "no-store", ...rateLimitHeaders(rl) };
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers });
  }

  const admin = await getCurrentAdmin();
  const legacyOk = isAuthorizedLegacy(request);
  if (!admin && !legacyOk) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401, headers },
    );
  }
  if (admin && !hasRole(admin, "administrator")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403, headers });
  }

  try {
    const store = getListenerStore();
    const now = Date.now();
    const analytics = await store.getAnalytics(now);

    const contact = getContactDeliveryConfig();
    const ads = getPublicAdSenseConfig();
    const system = {
      redisConfigured: Boolean(process.env.REDIS_URL?.trim()),
      databaseConfigured: hasDatabase(),
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
        envStatus("DATABASE_URL", process.env.DATABASE_URL, { secret: true }),
        envStatus("LISTENER_ADMIN_TOKEN", process.env.LISTENER_ADMIN_TOKEN, { secret: true }),
        envStatus("CONTACT_WEBHOOK_URL", process.env.CONTACT_WEBHOOK_URL),
        envStatus("RESEND_API_KEY", process.env.RESEND_API_KEY, { secret: true }),
        envStatus("CONTACT_FROM_EMAIL", process.env.CONTACT_FROM_EMAIL),
        envStatus("CONTACT_TO_EMAIL", process.env.CONTACT_TO_EMAIL),
        envStatus("CONTACT_EMAIL_VERIFIED", process.env.CONTACT_EMAIL_VERIFIED),
        envStatus("NEXT_PUBLIC_ADSENSE_CLIENT_ID", process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID),
        envStatus("ADS_ENABLED", process.env.ADS_ENABLED),
        envStatus("ADS_CMP_VERIFIED", process.env.ADS_CMP_VERIFIED),
      ],
    };

    // PII/contact submissions/audit logs are intentionally not exposed here.
    // Use /api/admin/contacts and /api/admin/audit with RBAC.
    return NextResponse.json(
      {
        success: true,
        ...analytics,
        system,
        contactSubmissions: [],
        auditLog: [],
        stationOverrides: [],
      },
      { headers },
    );
  } catch (error) {
    console.error("[listeners/admin]", error);
    return NextResponse.json({ success: false, error: "Analytics unavailable" }, { status: 503, headers });
  }
}
