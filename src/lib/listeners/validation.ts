const SESSION_ID_RE = /^[A-Za-z0-9_-]{16,128}$/;
// Radio Browser UUIDs are typically hex+hyphens, but be permissive for valid IDs.
const STATION_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

export function isValidSessionId(value: unknown): value is string {
  return typeof value === "string" && SESSION_ID_RE.test(value);
}

export function isValidStationId(value: unknown): value is string {
  return typeof value === "string" && STATION_ID_RE.test(value);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
