import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import Redis from "ioredis";

export type AdminRole = "admin" | "operator" | "viewer";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  active: boolean;
}

export interface ContactSubmission {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  topic: string;
  station: string;
  message: string;
  status: "new" | "reviewed" | "resolved";
  delivery: "accepted";
}

export interface AuditLogEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target?: string;
  detail?: string;
}

export interface StationOverride {
  stationId: string;
  featured?: boolean;
  verified?: boolean;
  hidden?: boolean;
  note?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AdminData {
  contactSubmissions: ContactSubmission[];
  auditLog: AuditLogEntry[];
  stationOverrides: Record<string, StationOverride>;
}

const EMPTY: AdminData = { contactSubmissions: [], auditLog: [], stationOverrides: {} };
const REDIS_KEY = "syntv:admin:data:v1";
const FILE_PATH = path.join(process.cwd(), ".data", "admin.json");

function getRedisUrl() {
  return process.env.REDIS_URL?.trim() || "";
}

function getRedis(url: string): Redis {
  const g = globalThis as typeof globalThis & { __syntvAdminRedis?: Redis; __syntvAdminRedisUrl?: string };
  if (g.__syntvAdminRedis && g.__syntvAdminRedisUrl === url) return g.__syntvAdminRedis;
  g.__syntvAdminRedis = new Redis(url, { maxRetriesPerRequest: 2, enableReadyCheck: true, lazyConnect: false, connectTimeout: 5000 });
  g.__syntvAdminRedis.on("error", (err) => console.error("[admin][redis]", err.message));
  g.__syntvAdminRedisUrl = url;
  return g.__syntvAdminRedis;
}

async function readFileStore(): Promise<AdminData> {
  try {
    const raw = await readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<AdminData>;
    return {
      contactSubmissions: Array.isArray(parsed.contactSubmissions) ? parsed.contactSubmissions : [],
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
      stationOverrides: parsed.stationOverrides && typeof parsed.stationOverrides === "object" ? parsed.stationOverrides as Record<string, StationOverride> : {},
    };
  } catch {
    return { ...EMPTY, contactSubmissions: [], auditLog: [], stationOverrides: {} };
  }
}

async function writeFileStore(data: AdminData): Promise<void> {
  await mkdir(path.dirname(FILE_PATH), { recursive: true });
  await writeFile(FILE_PATH, JSON.stringify(data, null, 2), "utf8");
}

async function readStore(): Promise<AdminData> {
  const url = getRedisUrl();
  if (url) {
    try {
      const raw = await getRedis(url).get(REDIS_KEY);
      if (!raw) return { ...EMPTY, contactSubmissions: [], auditLog: [], stationOverrides: {} };
      const parsed = JSON.parse(raw) as Partial<AdminData>;
      return {
        contactSubmissions: Array.isArray(parsed.contactSubmissions) ? parsed.contactSubmissions : [],
        auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
        stationOverrides: parsed.stationOverrides && typeof parsed.stationOverrides === "object" ? parsed.stationOverrides as Record<string, StationOverride> : {},
      };
    } catch (err) {
      console.error("[admin] redis read failed", err);
      return readFileStore();
    }
  }
  return readFileStore();
}

async function writeStore(data: AdminData): Promise<void> {
  const url = getRedisUrl();
  if (url) {
    try {
      await getRedis(url).set(REDIS_KEY, JSON.stringify(data));
      return;
    } catch (err) {
      console.error("[admin] redis write failed", err);
    }
  }
  await writeFileStore(data);
}

export async function recordContactSubmission(input: Omit<ContactSubmission, "id" | "createdAt" | "status" | "delivery">): Promise<void> {
  const data = await readStore();
  data.contactSubmissions.unshift({
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "new",
    delivery: "accepted",
  });
  data.contactSubmissions = data.contactSubmissions.slice(0, 500);
  await writeStore(data);
}

export async function listContactSubmissions(limit = 100): Promise<ContactSubmission[]> {
  const data = await readStore();
  return data.contactSubmissions.slice(0, limit);
}

export async function addAuditLog(entry: Omit<AuditLogEntry, "id" | "at">): Promise<void> {
  const data = await readStore();
  data.auditLog.unshift({ ...entry, id: randomUUID(), at: new Date().toISOString() });
  data.auditLog = data.auditLog.slice(0, 1000);
  await writeStore(data);
}

export async function listAuditLog(limit = 100): Promise<AuditLogEntry[]> {
  const data = await readStore();
  return data.auditLog.slice(0, limit);
}

export async function upsertStationOverride(override: StationOverride): Promise<void> {
  const data = await readStore();
  data.stationOverrides[override.stationId] = override;
  await writeStore(data);
}

export async function listStationOverrides(): Promise<StationOverride[]> {
  const data = await readStore();
  return Object.values(data.stationOverrides).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getAdminData(): Promise<AdminData> {
  return readStore();
}
