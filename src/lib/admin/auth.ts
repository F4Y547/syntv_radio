import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { getPrisma, hasDatabase } from "@/lib/db";
import { generateSessionToken, hashSessionToken, verifyPassword } from "./password";
import type { AdminRole } from "@prisma/client";

export const SESSION_COOKIE = "syntv_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours
const SESSION_REMEMBER_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface AdminSessionUser {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
}

export interface AdminSessionInfo extends AdminSessionUser {
  csrfToken: string;
}

export function roleRank(role: AdminRole): number {
  if (role === "owner") return 3;
  if (role === "administrator") return 2;
  return 1;
}

export function hasRole(user: AdminSessionUser, minimum: AdminRole): boolean {
  return roleRank(user.role) >= roleRank(minimum);
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export async function createAdminSession(userId: string, remember = false, meta?: { ip?: string | null; userAgent?: string | null }) {
  const prisma = getPrisma();
  const token = generateSessionToken();
  const csrfToken = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + (remember ? SESSION_REMEMBER_MS : SESSION_TTL_MS));
  await prisma.adminSession.create({
    data: {
      userId,
      tokenHash,
      csrfToken,
      expiresAt,
      ip: meta?.ip ?? null,
      userAgent: meta?.userAgent?.slice(0, 500) ?? null,
    },
  });
  return { token, csrfToken, expiresAt };
}

export async function revokeAdminSession(token: string) {
  if (!hasDatabase()) return;
  const prisma = getPrisma();
  const tokenHash = hashSessionToken(token);
  await prisma.adminSession.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function getCurrentAdmin(): Promise<AdminSessionInfo | null> {
  if (!hasDatabase()) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const prisma = getPrisma();
  const tokenHash = hashSessionToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  if (!session.user.active) return null;
  return { id: session.user.id, email: session.user.email, name: session.user.name, role: session.user.role, csrfToken: session.csrfToken };
}

export async function requireAdmin(minimum: AdminRole = "editor"): Promise<{ user: AdminSessionInfo } | { response: NextResponse }> {
  const user = await getCurrentAdmin();
  if (!user) {
    return { response: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasRole(user, minimum)) {
    return { response: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

export function assertCsrf(request: Request, csrfToken: string): string | null {
  const header = request.headers.get("x-csrf-token")?.trim() || "";
  if (!csrfToken || !header || header !== csrfToken) return "Invalid CSRF token";
  return null;
}

export async function authenticateAdmin(email: string, password: string) {
  const prisma = getPrisma();
  const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.active) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function assertSameOrigin(request: Request): Promise<string | null> {
  const h = await headers();
  const origin = request.headers.get("origin") || h.get("origin");
  const host = request.headers.get("host") || h.get("host");
  if (!origin || !host) return "Missing origin";
  try {
    const o = new URL(origin);
    if (o.host !== host) return "Invalid origin";
  } catch {
    return "Invalid origin";
  }
  return null;
}
