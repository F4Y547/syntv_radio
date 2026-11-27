#!/usr/bin/env node
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

const email = (process.env.ADMIN_BOOTSTRAP_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || "";
const name = (process.env.ADMIN_BOOTSTRAP_NAME || "Owner").trim();
const force = process.env.ADMIN_BOOTSTRAP_FORCE === "true";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}
if (!email || !email.includes("@")) {
  console.error("ADMIN_BOOTSTRAP_EMAIL must be a valid email.");
  process.exit(1);
}
if (password.length < 12) {
  console.error("ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const existingOwner = await prisma.adminUser.findFirst({ where: { role: "owner", active: true } });
  if (existingOwner && !force) {
    console.error("An active owner already exists. Set ADMIN_BOOTSTRAP_FORCE=true only if you intentionally need another owner.");
    process.exit(2);
  }
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.error("User with this email already exists. Use admin UI or a deliberate DB procedure.");
    process.exit(3);
  }
  const user = await prisma.adminUser.create({
    data: { email, name, passwordHash: hashPassword(password), role: "owner", active: true },
  });
  await prisma.auditLog.create({
    data: { actorEmail: email, action: "admin.bootstrap_owner", targetType: "user", targetId: user.id, detail: { via: "scripts/bootstrap-admin.mjs" } },
  });
  console.log(`Owner created: ${user.email} (${user.id})`);
} finally {
  await prisma.$disconnect();
}
