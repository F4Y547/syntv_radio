import { NextResponse } from "next/server";
import { authenticateAdmin, createAdminSession, SESSION_COOKIE, sessionCookieOptions, assertSameOrigin } from "@/lib/admin/auth";
import { hasDatabase } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";
import { checkRateLimitAsync, rateLimitHeaders } from "@/lib/listeners/rate-limit";
import { getClientIp } from "@/lib/listeners/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`admin:login:${ip}`, 10, 60_000);
  if (!rl.allowed) return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });

  const originErr = await assertSameOrigin(request);
  if (originErr) return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403, headers: rateLimitHeaders(rl) });

  if (!hasDatabase()) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL is not configured" }, { status: 503, headers: rateLimitHeaders(rl) });
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400, headers: rateLimitHeaders(rl) }); }
  const rec = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const email = typeof rec.email === "string" ? rec.email.trim().toLowerCase() : "";
  const password = typeof rec.password === "string" ? rec.password : "";
  const remember = rec.remember === true;

  if (!email || !password) return NextResponse.json({ ok: false, error: "Email and password required" }, { status: 400, headers: rateLimitHeaders(rl) });

  const user = await authenticateAdmin(email, password);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401, headers: rateLimitHeaders(rl) });
  }

  const { token, csrfToken, expiresAt } = await createAdminSession(user.id, remember, { ip, userAgent: request.headers.get("user-agent") });
  await addAuditLog({ actorId: user.id, actorEmail: user.email, action: "admin.login", ip });

  const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, csrfToken } }, { headers: rateLimitHeaders(rl) });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
}
