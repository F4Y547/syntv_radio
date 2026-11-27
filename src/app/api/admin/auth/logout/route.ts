import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, revokeAdminSession, getCurrentAdmin, assertSameOrigin } from "@/lib/admin/auth";
import { addAuditLog } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/listeners/validation";

export async function POST(request: Request) {
  const originErr = await assertSameOrigin(request);
  if (originErr) return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 });

  const user = await getCurrentAdmin();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await revokeAdminSession(token);
  if (user) await addAuditLog({ actorId: user.id, actorEmail: user.email, action: "admin.logout", ip: getClientIp(request) });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", expires: new Date(0), httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return res;
}
