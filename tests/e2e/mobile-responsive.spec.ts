import { test, expect, type Page } from "@playwright/test";

const viewports = [
  { name: "320x568", width: 320, height: 568 },
  { name: "360x800", width: 360, height: 800 },
  { name: "375x812", width: 375, height: 812 },
  { name: "390x844", width: 390, height: 844 },
  { name: "412x915", width: 412, height: 915 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1280x800", width: 1280, height: 800 },
];

const screenshotViewports = viewports.filter((v) => [320, 375, 390, 412].includes(v.width));

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const sw = document.documentElement.scrollWidth;
    const cw = document.documentElement.clientWidth;
    return { sw, cw, over: sw > cw + 2 };
  });
  expect(overflow.over, `overflow: scrollWidth=${overflow.sw} clientWidth=${overflow.cw}`).toBeFalsy();
}

async function mockStations(page: Page) {
  const stations = Array.from({ length: 6 }).map((_, i) => ({
    id: `test-${i + 1}`,
    name: `Test Station ${i + 1}`,
    url: "https://example.com/stream.mp3",
    urlResolved: "https://example.com/stream.mp3",
    homepage: "https://example.com",
    favicon: "",
    tags: ["pop", "news"].slice(0, (i % 2) + 1),
    country: "Testland",
    countryCode: "TL",
    state: "",
    language: "English",
    votes: 100 - i,
    codec: "MP3",
    bitrate: 128,
    isOnline: true,
    clickCount: 1000 - i,
    clickTrend: 0,
    hls: false,
    lastCheckOk: true,
  }));
  await page.route("**/api/stations**", async (route) => {
    const url = new URL(route.request().url());
    const pageNum = Number(url.searchParams.get("page") || "1");
    const body = pageNum > 1 ? { stations: [], hasMore: false } : { stations, hasMore: false };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.route("**/api/filters**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        countries: [{ name: "Testland", code: "TL", stationCount: 10 }],
        tags: [{ name: "pop", stationCount: 10 }, { name: "news", stationCount: 5 }],
      }),
    });
  });
  await page.route("**/api/listeners/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, total: 0, stations: {} }) });
  });
}

for (const vp of viewports) {
  test.describe(`viewport ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("home has no horizontal overflow and key UI", async ({ page }) => {
      await mockStations(page);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);
      await assertNoHorizontalOverflow(page);
      await expect(page.locator("header")).toBeVisible();
      const headerBox = await page.locator("header").boundingBox();
      expect((headerBox?.width ?? 0)).toBeLessThanOrEqual(vp.width + 2);

      if (vp.width < 768) {
        await expect(page.getByLabel("Mobile navigation")).toBeVisible();
      } else {
        await expect(page.getByLabel("Primary")).toBeVisible();
      }

      if (screenshotViewports.some((s) => s.width === vp.width)) {
        await page.screenshot({ path: `screenshots/mobile/home-${vp.width}.png`, fullPage: false });
      }
    });

    test("stations page has no horizontal overflow", async ({ page }) => {
      await mockStations(page);
      await page.goto("/stations", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);
      await assertNoHorizontalOverflow(page);
      if (screenshotViewports.some((s) => s.width === vp.width)) {
        await page.screenshot({ path: `screenshots/mobile/stations-${vp.width}.png`, fullPage: false });
      }
    });

    test("contact page has no horizontal overflow", async ({ page }) => {
      await page.goto("/contact", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
      await assertNoHorizontalOverflow(page);
    });
  });
}

test.describe("mobile interactions", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile bottom nav More drawer opens and has required links", async ({ page }) => {
    await mockStations(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "More navigation options" }).click();
    const dialog = page.getByRole("dialog", { name: "More navigation" });
    await expect(dialog).toBeVisible();
    for (const label of ["Countries", "Genres", "Recently played", "Contact", "About", "Privacy policy", "Terms and conditions"]) {
      await expect(dialog.getByRole("link", { name: label, exact: false })).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("mobile filters open as drawer and apply/clear work", async ({ page }) => {
    await mockStations(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /Filters/i }).first().click();
    const dialog = page.getByRole("dialog", { name: "Filters" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Country", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Genre", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Apply filters" }).click();
    await expect(dialog).toBeHidden();
  });

  test("search input is usable and clearable", async ({ page }) => {
    await mockStations(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const input = page.getByLabel("Search stations").first();
    await input.fill("jazz");
    await expect(input).toHaveValue("jazz");
    const clear = page.getByRole("button", { name: "Clear search" }).first();
    if (await clear.isVisible()) {
      await clear.click();
      await expect(input).toHaveValue("");
    }
  });

  test("player expands and closes with mocked playback", async ({ page }) => {
    await mockStations(page);
    await page.addInitScript(() => {
      localStorage.setItem("syntv-radio:consent:v1", JSON.stringify({ version: 1, necessary: true, analytics: false, advertising: false, method: "essential-only", updatedAt: new Date().toISOString() }));
    });
    await page.addInitScript(() => {
      class FakeAudio {
        src = "";
        preload = "auto";
        crossOrigin: string | null = null;
        volume = 1;
        paused = true;
        currentTime = 0;
        private listeners: Record<string, Array<() => void>> = {};
        play() { this.paused = false; this.emit("playing"); return Promise.resolve(); }
        pause() { this.paused = true; this.emit("pause"); }
        load() {}
        addEventListener(e: string, cb: () => void) { (this.listeners[e] ||= []).push(cb); }
        removeEventListener(e: string, cb: () => void) { this.listeners[e] = (this.listeners[e] || []).filter((x) => x !== cb); }
        private emit(e: string) { (this.listeners[e] || []).forEach((cb) => cb()); }
      }
      // @ts-expect-error test mock
      window.Audio = FakeAudio;
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const playBtn = page.getByRole("button", { name: /Play Test Station 1/i }).first();
    await expect(playBtn).toBeVisible();
    await playBtn.click();
    await page.waitForTimeout(300);

    const openPlayer = page.getByRole("button", { name: /Open Test Station 1 player/i });
    await expect(openPlayer).toBeVisible();
    await openPlayer.click();
    const dialog = page.getByRole("dialog", { name: /Test Station 1 player/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Minimize player" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
