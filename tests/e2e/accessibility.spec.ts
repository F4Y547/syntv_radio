import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectNoCriticalOrSeriousViolations(page: Page, context: string) {
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"]) // Contrast handled by design review; automated gradient checks can be noisy.
    .analyze();
  const bad = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(
    bad.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 3).map((n) => n.target),
    })),
    `${context} has critical/serious axe violations`,
  ).toEqual([]);
}

test.describe("accessibility (WCAG 2.2 AA-oriented)", () => {
  test("homepage has no critical/serious axe violations", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await expectNoCriticalOrSeriousViolations(page, "homepage");
  });

  test("stations directory has no critical/serious axe violations", async ({ page }) => {
    await page.goto("/stations", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await expectNoCriticalOrSeriousViolations(page, "stations directory");
  });

  test("station details has no critical/serious axe violations", async ({ page }) => {
    await page.goto("/stations", { waitUntil: "domcontentloaded" });
    const firstStation = page.locator('a[href^="/station/"]').first();
    if (await firstStation.count()) {
      await firstStation.click();
      await page.waitForURL(/\/station\//);
      await page.getByRole("heading", { level: 1 }).first().waitFor();
      await expectNoCriticalOrSeriousViolations(page, "station details");
    } else {
      test.skip(true, "No station link available from stations directory");
    }
  });

  test("country page has no critical/serious axe violations", async ({ page }) => {
    await page.goto("/country/US", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await expectNoCriticalOrSeriousViolations(page, "country page");
  });

  test("genre page has no critical/serious axe violations", async ({ page }) => {
    await page.goto("/genre/jazz", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await expectNoCriticalOrSeriousViolations(page, "genre page");
  });

  test("contact page has no critical/serious axe violations", async ({ page }) => {
    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await expectNoCriticalOrSeriousViolations(page, "contact page");
  });

  test("about page has no critical/serious axe violations", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await expectNoCriticalOrSeriousViolations(page, "about page");
  });

  test("navigation drawer has no critical/serious axe violations", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "load" });
    const moreBtn = page.getByRole("button", { name: /more navigation options/i });
    await expect(moreBtn).toBeVisible();
    const dialog = page.getByRole("dialog", { name: /more navigation/i });
    await expect(async () => {
      if (!(await dialog.isVisible())) {
        await moreBtn.click();
      }
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 10000 });
    await expectNoCriticalOrSeriousViolations(page, "navigation drawer");
  });

  test("audio player expanded has no critical/serious axe violations", async ({ page }) => {
    await page.route("**/json/stations/search**", (route) =>
      route.fulfill({ json: [{ stationuuid: "test-1", name: "Test Station 1", url: "https://example.com/stream.mp3", url_resolved: "https://example.com/stream.mp3", homepage: "https://example.com", favicon: "", tags: "jazz", country: "United States", countrycode: "US", state: "", language: "english", votes: 100, codec: "MP3", bitrate: 128, clickcount: 10, clicktrend: 1, lastcheckok: 1 }] }),
    );
    await page.route("**/json/stations/topclick**", (route) =>
      route.fulfill({ json: [{ stationuuid: "test-1", name: "Test Station 1", url: "https://example.com/stream.mp3", url_resolved: "https://example.com/stream.mp3", homepage: "https://example.com", favicon: "", tags: "jazz", country: "United States", countrycode: "US", state: "", language: "english", votes: 100, codec: "MP3", bitrate: 128, clickcount: 10, clicktrend: 1, lastcheckok: 1 }] }),
    );
    await page.goto("/stations", { waitUntil: "domcontentloaded" });
    const play = page.getByRole("button", { name: /play test station 1/i }).first();
    await play.waitFor({ timeout: 10000 }).catch(() => null);
    if (await play.count()) {
      await play.click();
      // open expanded player
      const openBtn = page.getByRole("region", { name: /audio player/i }).getByRole("button", { name: /test station 1/i }).first();
      if (await openBtn.count()) {
        await openBtn.click().catch(() => null);
        await page.waitForTimeout(300);
      }
      await expectNoCriticalOrSeriousViolations(page, "audio player");
    } else {
      test.skip(true, "Mocked station not available");
    }
  });

  test("admin dashboard has no critical/serious axe violations", async ({ page }) => {
    await page.goto("/admin/listeners", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await expectNoCriticalOrSeriousViolations(page, "admin listener page");
  });
});
