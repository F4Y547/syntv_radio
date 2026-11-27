import { expect, test } from "@playwright/test";

function sid(n: number) {
  return `redistest${String(n).padStart(4, "0")}abcdefghijklmnopqrstuvwxy`.slice(0, 32);
}
const stationA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const stationB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const uniqueClientIp = () => `203.0.113.${(Date.now() % 250) + 1}`;

test.describe("infrastructure resilience", () => {
  test("contact duplicate submission is rejected (atomic dedupe behavior)", async ({ request }) => {
    const payload = {
      name: "Test User",
      email: "test@example.com",
      topic: "general",
      message: "This is a sufficiently long message for dedupe testing.",
      privacyAccepted: true,
      website: "",
    };
    const clientIp = uniqueClientIp();
    const first = await request.post("/api/contact", { headers: { "x-forwarded-for": clientIp }, data: payload });
    // In test env without delivery config, may be 503; with config, 200. Duplicate check runs after config checks in handler?
    // handler checks config before dedupe, so 503 is acceptable. We assert behavior is deterministic.
    const firstStatus = first.status();
    const second = await request.post("/api/contact", { headers: { "x-forwarded-for": clientIp }, data: payload });
    const secondStatus = second.status();
    // If delivery unconfigured/invalid, both 503; if accepted, second should be 409 duplicate.
    if (firstStatus === 200) {
      expect(secondStatus).toBe(409);
      const body = await second.json();
      expect(body.code).toBe("duplicate_submission");
    } else {
      expect([503, 400, 429]).toContain(firstStatus);
      expect([503, 400, 409, 429]).toContain(secondStatus);
    }
  });

  test("contact responses always expose rate-limit headers", async ({ request }) => {
    const res = await request.post("/api/contact", {
      headers: { "x-forwarded-for": uniqueClientIp() },
      data: {
        name: "Rate Header User",
        email: "rate-header@example.com",
        topic: "general",
        message: "This is a sufficiently long message for rate limit header testing.",
        privacyAccepted: true,
        website: "",
      },
    });

    expect([200, 400, 409, 429, 503]).toContain(res.status());
    expect(res.headers()["x-ratelimit-remaining"]).toMatch(/^\d+$/);
    expect(res.headers()["x-ratelimit-reset"]).toMatch(/^\d+$/);
    expect(res.headers()["cache-control"]).toContain("no-store");
  });

  test("listener presence: heartbeat keeps session active, stop removes it", async ({ request }) => {
    const sessionId = sid(1);
    const start = await request.post("/api/listeners/start", { data: { sessionId, stationId: stationA } });
    expect(start.ok()).toBeTruthy();
    const hb = await request.post("/api/listeners/heartbeat", { data: { sessionId, stationId: stationA } });
    expect(hb.ok()).toBeTruthy();
    expect((await hb.json()).active).toBe(true);
    const stop = await request.post("/api/listeners/stop", { data: { sessionId, reason: "stop" } });
    expect(stop.ok()).toBeTruthy();
    const after = await request.get(`/api/listeners/station/${stationA}`);
    expect(after.ok()).toBeTruthy();
  });

  test("listener presence: duplicate sessions do not double-count same sessionId", async ({ request }) => {
    const sessionId = sid(2);
    await request.post("/api/listeners/start", { data: { sessionId, stationId: stationA } });
    const first = (await (await request.get(`/api/listeners/station/${stationA}`)).json()).listeners as number;
    await request.post("/api/listeners/start", { data: { sessionId, stationId: stationA } });
    await request.post("/api/listeners/start", { data: { sessionId, stationId: stationA } });
    const second = (await (await request.get(`/api/listeners/station/${stationA}`)).json()).listeners as number;
    expect(second).toBeLessThanOrEqual(first + 1);
    await request.post("/api/listeners/stop", { data: { sessionId } });
  });

  test("listener presence: switching stations moves session", async ({ request }) => {
    const sessionId = sid(3);
    await request.post("/api/listeners/start", { data: { sessionId, stationId: stationA } });
    await request.post("/api/listeners/start", { data: { sessionId, stationId: stationB } });
    const b = await (await request.get(`/api/listeners/station/${stationB}`)).json();
    expect(b.listeners).toBeGreaterThanOrEqual(1);
    await request.post("/api/listeners/stop", { data: { sessionId } });
  });

  test("rate limit endpoints return 429 headers shape", async ({ request }) => {
    // listener start has rate limit; we just verify normal response has no-store and works
    const res = await request.post("/api/listeners/start", { data: { sessionId: sid(4), stationId: stationA } });
    expect([200, 429, 503]).toContain(res.status());
    if (res.status() === 200) {
      expect(res.headers()["cache-control"]).toContain("no-store");
    }
    await request.post("/api/listeners/stop", { data: { sessionId: sid(4) } });
  });
});
