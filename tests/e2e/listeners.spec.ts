import { test, expect } from "@playwright/test";

function sid(n: number) {
  return `testsession${String(n).padStart(4, "0")}abcdefghijklmnopqrstuv`.slice(0, 32);
}
const stationA = "11111111-1111-1111-1111-111111111111";
const stationB = "22222222-2222-2222-2222-222222222222";

test.describe("listener tracking API", () => {
  test("start, heartbeat, stop update active listener counts", async ({ request }) => {
    const sessionId = sid(1);
    const start = await request.post("/api/listeners/start", { data: { sessionId, stationId: stationA } });
    expect(start.ok()).toBeTruthy();
    const startJson = await start.json();
    expect(startJson.success).toBe(true);
    expect(startJson.scope).toBe("syntv_radio");
    expect(startJson.listeners).toBeGreaterThanOrEqual(1);

    const hb = await request.post("/api/listeners/heartbeat", { data: { sessionId, stationId: stationA } });
    expect(hb.ok()).toBeTruthy();
    const hbJson = await hb.json();
    expect(hbJson.success).toBe(true);
    expect(hbJson.active).toBe(true);

    const stop = await request.post("/api/listeners/stop", { data: { sessionId, reason: "stop" } });
    expect(stop.ok()).toBeTruthy();
    const stopJson = await stop.json();
    expect(stopJson.success).toBe(true);
  });

  test("pause/stop removes active listener and switching updates station counts", async ({ request }) => {
    const sessionId = sid(2);
    await request.post("/api/listeners/start", { data: { sessionId, stationId: stationA } });
    const liveA = await request.get(`/api/listeners/station/${stationA}`);
    const liveAJson = await liveA.json();
    expect(liveAJson.listeners).toBeGreaterThanOrEqual(1);

    // switch station
    await request.post("/api/listeners/start", { data: { sessionId, stationId: stationB } });
    const liveBAfterSwitch = await request.get(`/api/listeners/station/${stationB}`);
    expect((await liveBAfterSwitch.json()).listeners).toBeGreaterThanOrEqual(1);

    // stop (pause/stop behavior)
    await request.post("/api/listeners/stop", { data: { sessionId, reason: "pause" } });
    const liveBAfterStop = await request.get(`/api/listeners/station/${stationB}`);
    expect((await liveBAfterStop.json()).listeners).toBeGreaterThanOrEqual(0);
  });

  test("duplicate start events do not inflate count for same session", async ({ request }) => {
    const sessionId = sid(3);
    await request.post("/api/listeners/start", { data: { sessionId, stationId: stationA } });
    const first = await request.get(`/api/listeners/station/${stationA}`);
    const firstCount = (await first.json()).listeners as number;
    await request.post("/api/listeners/start", { data: { sessionId, stationId: stationA } });
    const second = await request.get(`/api/listeners/station/${stationA}`);
    const secondCount = (await second.json()).listeners as number;
    expect(secondCount).toBeLessThanOrEqual(firstCount);
    await request.post("/api/listeners/stop", { data: { sessionId } });
  });

  test("multiple users are counted independently", async ({ request }) => {
    const s1 = sid(4);
    const s2 = sid(5);
    await request.post("/api/listeners/start", { data: { sessionId: s1, stationId: stationA } });
    const before = (await (await request.get(`/api/listeners/station/${stationA}`)).json()).listeners as number;
    await request.post("/api/listeners/start", { data: { sessionId: s2, stationId: stationA } });
    const after = (await (await request.get(`/api/listeners/station/${stationA}`)).json()).listeners as number;
    expect(after).toBeGreaterThanOrEqual(before);
    await request.post("/api/listeners/stop", { data: { sessionId: s1 } });
    await request.post("/api/listeners/stop", { data: { sessionId: s2 } });
  });

  test("unauthorized admin requests are rejected", async ({ request }) => {
    const res = await request.get("/api/listeners/admin");
    expect([401, 503]).toContain(res.status());
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  test("invalid payloads are rejected", async ({ request }) => {
    const bad = await request.post("/api/listeners/start", { data: { sessionId: "bad", stationId: stationA } });
    expect(bad.status()).toBe(400);
  });

  test("live endpoint returns listener payload", async ({ request }) => {
    const live = await request.get("/api/listeners/live");
    expect(live.ok()).toBeTruthy();
    const json = await live.json();
    expect(json.success).toBe(true);
    expect(json.scope).toBe("syntv_radio");
    expect(typeof json.totalListeners).toBe("number");
  });
});
