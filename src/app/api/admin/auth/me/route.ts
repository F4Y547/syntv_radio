import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin/auth";
import { hasDatabase } from "@/lib/db";

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL is not configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, csrfToken: user.csrfToken } }, { headers: { "Cache-Control": "no-store" } });
}
