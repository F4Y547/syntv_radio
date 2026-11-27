import { PrismaClient } from "@prisma/client";

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

declare global {
  var __syntvPrisma: PrismaClient | undefined;
}

export function getPrisma(): PrismaClient {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not configured. A persistent Postgres database is required for admin features.");
  }
  if (!globalThis.__syntvPrisma) {
    globalThis.__syntvPrisma = createClient();
  }
  return globalThis.__syntvPrisma;
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
