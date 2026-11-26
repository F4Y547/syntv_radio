import { test, expect } from "@playwright/test";

test("home has core SEO metadata", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/SYNTV RADIO/);
  const desc = page.locator('meta[name="description"]');
  await expect(desc).toHaveAttribute("content", /listen to live online radio stations/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /https:\/\/syntv\.online\/?$/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /SYNTV RADIO/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
});

test("stations directory has SEO metadata", async ({ page }) => {
  await page.goto("/stations");
  await expect(page).toHaveTitle(/Online Radio Stations Directory/i);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/stations$/);
});

test("explore page has SEO metadata", async ({ page }) => {
  await page.goto("/explore");
  await expect(page).toHaveTitle(/Explore World Radio/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/explore$/);
});

test("private/utility pages are noindex", async ({ page }) => {
  await page.goto("/offline");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
  await page.goto("/stats");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
});

test("robots.txt and sitemap.xml are accessible", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const robotsText = await robots.text();
  expect(robotsText).toContain("Sitemap: https://syntv.online/sitemap.xml");
  expect(robotsText).toContain("Disallow: /api/");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain("<loc>https://syntv.online</loc>");
  expect(xml).toContain("/stations");
  expect(xml).toContain("/explore");
});

test("home includes structured data", async ({ page }) => {
  await page.goto("/");
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  const joined = jsonLd.join("\n");
  expect(joined).toContain('"WebSite"');
  expect(joined).toContain('"Organization"');
});