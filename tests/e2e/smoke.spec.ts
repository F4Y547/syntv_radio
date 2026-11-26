import { test, expect } from "@playwright/test";

test("home loads and shows discovery UI", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /listen to the world/i })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: /search stations/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /open search/i })).toBeVisible();
});

test("search query syncs to URL", async ({ page }) => {
  await page.goto("/?q=jazz");
  await expect(page.getByRole("searchbox", { name: /search stations/i })).toHaveValue("jazz");
  await expect(page.getByRole("heading", { name: /results for .jazz./i })).toBeVisible();
});

test("stats page renders", async ({ page }) => {
  await page.goto("/stats");
  await expect(page.getByRole("heading", { name: /listening stats/i })).toBeVisible();
});

test("collections page renders and can create collection", async ({ page }) => {
  await page.goto("/collections");
  await expect(page.getByRole("heading", { name: /collections/i })).toBeVisible();
  await page.getByPlaceholder(/morning focus/i).fill("Road Trip");
  await page.getByRole("button", { name: /^create$/i }).click();
  await expect(page.getByRole("heading", { name: "Road Trip" })).toBeVisible();
});

test("explore page renders", async ({ page }) => {
  await page.goto("/explore");
  await expect(page.getByRole("heading", { name: /explore by country/i })).toBeVisible();
});

test("offline page renders", async ({ page }) => {
  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: /you're offline/i })).toBeVisible();
});

test("explore globe falls back to world map when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      contextId: string,
      ...args: unknown[]
    ) {
      if (contextId === "webgl" || contextId === "experimental-webgl" || contextId === "webgl2") {
        return null;
      }
      return original.call(this, contextId as never, ...(args as never[]));
    } as typeof HTMLCanvasElement.prototype.getContext;
  });

  await page.goto("/explore");
  const map = page.getByRole("img", { name: /world station map/i });
  await expect(map).toBeVisible();
  await expect(page.getByText(/click a bubble to browse that country/i)).toBeVisible();

  const countryLink = page.locator('a[href*="/?country="]').first();
  await expect(countryLink).toBeVisible();
  await countryLink.click();
  await expect(page).toHaveURL(/\/\?country=/);
});

test("explore globe country selection works via globe controls", async ({ page }) => {
  await page.goto("/explore");
  const fallbackMap = page.getByRole("img", { name: /world station map/i });
  const countrySelect = page.getByTestId("globe-country-select");

  await expect(countrySelect.or(fallbackMap)).toBeVisible({ timeout: 15000 });
  if (await fallbackMap.isVisible()) {
    test.skip(true, "WebGL unavailable in this environment; fallback selection covered separately");
  }

  await countrySelect.selectOption({ index: 1 });
  await expect(page.getByText(/selected country/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /browse stations/i })).toBeVisible();
});
