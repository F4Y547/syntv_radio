import { NextResponse } from "next/server";
import { assertSameOrigin, requireAdmin } from "./auth";
import { hasDatabase } from "@/lib/db";
import { checkRateLimitAsync, rateLimitHeaders } from "@/lib/listeners/rate-limit";
import { getClientIp } from "@/lib/listeners/validation";
import type { AdminRole } from "@prisma/client";

export async function adminGuard(request: Request, opts?: { minimum?: AdminRole; rateKey?: string; limit?: number; windowMs?: number; mutate?: boolean }) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(opts?.rateKey ?? `admin:api:${ip}`, opts?.limit ?? 60, opts?.windowMs ?? 60_000);
  if (!rl.allowed) {
    return { error: NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) }), rl };
  }
  if (opts?.mutate) {
    const originErr = await assertSameOrigin(request);
    if (originErr) return { error: NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403, headers: rateLimitHeaders(rl) }), rl };
  }
  if (!hasDatabase()) {
    return { error: NextResponse.json({ ok: false, error: "DATABASE_URL is not configured" }, { status: 503, headers: rateLimitHeaders(rl) }), rl };
  }
  const auth = await requireAdmin(opts?.minimum ?? "editor");
  if ("response" in auth) {
    return { error: new NextResponse(auth.response.body, { status: auth.response.status, headers: { ...Object.fromEntries(auth.response.headers), ...rateLimitHeaders(rl) } }), rl };
  }
  return { user: auth.user, rl };
}

export function adminJson(data: unknown, init?: ResponseInit, rl?: { remaining: number; resetAt: number }) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  if (rl) {
    headers.set("X-RateLimit-Remaining", String(Math.max(0, rl.remaining)));
    headers.set("X-RateLimit-Reset", String(Math.ceil(rl.resetAt / 1000)));
  }
  return NextResponse.json(data, { ...init, headers });
}
