import { test, expect } from "@playwright/test";

test.describe("admin API guards", () => {
  test("admin auth/me returns 503 when DATABASE_URL is not configured", async ({ request }) => {
    const res = await request.get("/api/admin/auth/me");
    // In environments without DATABASE_URL, admin DB features are unavailable.
    // With DATABASE_URL configured, unauthenticated request should be 401.
    expect([401, 503]).toContain(res.status());
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  test("admin login rejects missing credentials and reports DB/config state", async ({ request }) => {
    const res = await request.post("/api/admin/auth/login", { data: {} });
    expect([400, 401, 403, 503]).toContain(res.status());
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  test("admin stations endpoint requires auth/db", async ({ request }) => {
    const res = await request.get("/api/admin/stations");
    expect([401, 503]).toContain(res.status());
  });

  test("admin users endpoint requires auth/db and is protected", async ({ request }) => {
    const res = await request.get("/api/admin/users");
    expect([401, 403, 503]).toContain(res.status());
  });

  test("admin audit endpoint requires auth/db and is protected", async ({ request }) => {
    const res = await request.get("/api/admin/audit");
    expect([401, 403, 503]).toContain(res.status());
  });

  test("mutating admin endpoints reject invalid origin/unauthorized", async ({ request }) => {
    const res = await request.post("/api/admin/stations", {
      data: { name: "X", streamUrl: "https://example.com/stream" },
      headers: { origin: "https://evil.example" },
    });
    expect([401, 403, 503]).toContain(res.status());
  });

  test("legacy station-overrides endpoint requires auth/db", async ({ request }) => {
    const res = await request.get("/api/admin/station-overrides");
    expect([401, 503]).toContain(res.status());
  });
});
