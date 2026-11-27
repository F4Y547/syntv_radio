import { test, expect } from "@playwright/test";

const PUBLIC_ROUTES = [
  { path: "/", title: /SYNTV RADIO/i, h1: true },
  { path: "/stations", title: /Radio Stations|Stations/i, h1: true },
  { path: "/explore", title: /Explore|World Radio/i, h1: true },
  { path: "/countries", title: /Country|Countries/i, h1: true },
  { path: "/genres", title: /Genre|Genres/i, h1: true },
  { path: "/trending", title: /Trending/i, h1: true },
  { path: "/about", title: /About/i, h1: true },
  { path: "/contact", title: /Contact/i, h1: true },
  { path: "/faq", title: /FAQ|Frequently Asked Questions/i, h1: true },
  { path: "/privacy-policy", title: /Privacy/i, h1: true },
  { path: "/terms", title: /Terms/i, h1: true },
  { path: "/disclaimer", title: /Disclaimer/i, h1: true },
];

test("home has core SEO metadata", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/SYNTV RADIO/);
  const desc = page.locator('meta[name="description"]');
  await expect(desc).toHaveAttribute("content", /listen to live online radio stations/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /https:\/\/syntv\.online\/?$/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /SYNTV RADIO/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
});

for (const route of PUBLIC_ROUTES) {
  test(`public route ${route.path} has title, description, canonical, h1`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    if (route.h1) {
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    }
    await expect(page).toHaveTitle(route.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", new RegExp(`https://syntv\\.online${route.path === "/" ? "/?" : route.path}$`));
    // No unexpected noindex on public routes
    const robots = page.locator('meta[name="robots"]');
    if (await robots.count()) {
      await expect(robots).not.toHaveAttribute("content", /noindex/i);
    }
  });
}

test("country and genre pages have metadata and canonical", async ({ page }) => {
  await page.goto("/country/US");
  await expect(page).toHaveTitle(/United States|US/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/country\/(US|the-united-states-of-america)$/i);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  await page.goto("/genre/jazz");
  await expect(page).toHaveTitle(/Jazz/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/genre\/jazz$/i);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
});

test("private/utility pages are noindex", async ({ page }) => {
  for (const path of ["/offline", "/stats", "/admin/listeners", "/admin"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
  }
});

test("robots.txt and sitemap.xml are accessible and valid basics", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const robotsText = await robots.text();
  expect(robotsText).toContain("Sitemap: https://syntv.online/sitemap.xml");
  expect(robotsText).toContain("Disallow: /api/");
  expect(robotsText.toLowerCase()).toContain("disallow: /admin");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain("<loc>https://syntv.online</loc>");
  for (const p of ["/stations", "/explore", "/about", "/contact", "/privacy-policy", "/terms"]) {
    expect(xml).toContain(p);
  }
});

test("home includes structured data", async ({ page }) => {
  await page.goto("/");
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  const joined = jsonLd.join("\n");
  expect(joined).toContain('"WebSite"');
  expect(joined).toContain('"Organization"');
});

test("public pages have lang attribute and images have alt", async ({ page }) => {
  for (const path of ["/", "/stations", "/about", "/contact"]) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", /.+/);
    const imgs = page.locator("img:visible");
    const count = await imgs.count();
    for (let i = 0; i < Math.min(count, 20); i++) {
      const alt = await imgs.nth(i).getAttribute("alt");
      expect(alt, `img without alt on ${path}`).not.toBeNull();
    }
  }
});
