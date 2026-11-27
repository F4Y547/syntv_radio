import { test, expect, type Page } from "@playwright/test";

const ADSENSE_CLIENT = "ca-pub-6652257842391620";

const legalPages = [
  { path: "/privacy-policy", heading: /privacy policy/i },
  { path: "/terms", heading: /terms and conditions/i },
  { path: "/disclaimer", heading: /^disclaimer$/i },
  { path: "/about", heading: /radio discovery without the clutter/i },
  { path: "/faq", heading: /frequently asked questions/i },
  { path: "/contact", heading: /talk to syntv radio/i },
];

const indexablePages = [
  ...legalPages.map((page) => page.path),
  "/countries",
  "/genres",
  "/trending",
];

async function acceptEssentialConsent(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "syntv-radio:consent:v1",
      JSON.stringify({
        version: 1,
        necessary: true,
        analytics: false,
        advertising: false,
        method: "essential-only",
        updatedAt: "2026-11-27T00:00:00.000Z",
      }),
    );
  });
}

test.describe("legal and information pages", () => {
  for (const { path, heading } of legalPages) {
    test(`${path} renders with one canonical and is indexable`, async ({ page }) => {
      await acceptEssentialConsent(page);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      await expect(canonical).toHaveAttribute("href", new RegExp(`${path.replace(/\//g, "\\/")}$`));

      const robots = page.locator('meta[name="robots"]');
      if ((await robots.count()) > 0) {
        await expect(robots.first()).not.toHaveAttribute("content", /noindex/i);
      }
    });
  }

  test("privacy policy names the actual storage keys and practices", async ({ page }) => {
    await acceptEssentialConsent(page);
    await page.goto("/privacy-policy");
    await expect(page.getByText("syntv-radio:favorites", { exact: false })).toBeVisible();
    await expect(page.getByText("syntv-radio:listener-session-id", { exact: false })).toBeVisible();
    await expect(page.getByText(/not currently active/i).first()).toBeVisible();
    await expect(page.getByText(/Google-certified consent management platform/i).first()).toBeVisible();
  });

  test("footer exposes Explore, Information, and Legal sections", async ({ page }) => {
    await acceptEssentialConsent(page);
    await page.goto("/");
    const footer = page.locator("footer");
    for (const heading of ["Explore", "Information", "Legal"]) {
      await expect(footer.getByText(heading, { exact: true })).toBeVisible();
    }
    for (const href of ["/privacy-policy", "/terms", "/disclaimer", "/about", "/faq", "/contact", "/countries", "/genres", "/trending"]) {
      await expect(footer.locator(`a[href="${href}"]`).first()).toBeVisible();
    }
  });
});

test("footer has no broken internal links", async ({ page, request }) => {
  await acceptEssentialConsent(page);
  await page.goto("/");
  const hrefs = await page.locator("footer a[href^='/']").evaluateAll((links) =>
    [...new Set(links.map((link) => link.getAttribute("href")).filter((href): href is string => Boolean(href)))],
  );
  expect(hrefs.length).toBeGreaterThan(5);

  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.status(), `${href} should resolve`).toBeLessThan(400);
  }
});

test.describe("AdSense readiness", () => {
  test("the account verification meta tag appears exactly once", async ({ page }) => {
    await acceptEssentialConsent(page);
    for (const path of ["/", "/about", "/contact"]) {
      await page.goto(path);
      const meta = page.locator('meta[name="google-adsense-account"]');
      await expect(meta).toHaveCount(1);
      await expect(meta).toHaveAttribute("content", ADSENSE_CLIENT);
    }
  });

  test("ads.txt contains exactly the required publisher record", async ({ request }) => {
    const response = await request.get("/ads.txt");
    expect(response.status()).toBe(200);
    const body = (await response.text()).replace(/\r\n/g, "\n").trim();
    expect(body).toBe(`google.com, pub-6652257842391620, DIRECT, f08c47fec0942fa0`);
  });

  test("AdSense is consent-gated and no fake ad slots are rendered", async ({ page }) => {
    await acceptEssentialConsent(page);
    await page.goto("/");
    // Advertising is disabled until valid slots + owner/CMP verification + consent.
    // The account meta tag is present for verification; ad script/slots must not load.
    await expect(page.locator('[data-testid="ad-slot"]')).toHaveCount(0);
    await expect(page.locator('ins.adsbygoogle[data-ad-slot]')).toHaveCount(0);
    await expect(page.getByTestId("ad-slot")).toHaveCount(0);
    const adScript = page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
    await expect(adScript).toHaveCount(0);
  });

  test("sitemap includes public information pages and robots blocks admin", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    for (const path of [...indexablePages, "/", "/stations", "/explore"]) {
      expect(xml).toContain(path === "/" ? "<loc>https://syntv.online</loc>" : `<loc>https://syntv.online${path}</loc>`);
    }

    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    const text = await robots.text();
    expect(text).toContain("Sitemap: https://syntv.online/sitemap.xml");
    expect(text).toContain("Disallow: /api/");
    expect(text).toContain("Disallow: /admin/");
  });

  test("public information pages have no duplicate canonical", async ({ page }) => {
    await acceptEssentialConsent(page);
    for (const path of ["/", "/countries", "/genres", "/trending", ...legalPages.map((item) => item.path)]) {
      await page.goto(path);
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical, `${path} canonical count`).toHaveCount(1);
      const href = await canonical.getAttribute("href");
      expect(href, `${path} canonical target`).toBeTruthy();
      if (path === "/") {
        expect(href).toMatch(/^https:\/\/syntv\.online\/?$/);
      } else {
        expect(href).toContain(path);
      }
    }
  });
});

test.describe("contact form", () => {
  test("validates required fields before sending", async ({ page }) => {
    await acceptEssentialConsent(page);
    await page.goto("/contact");
    await page.getByRole("button", { name: /send message/i }).click();
    await expect(page.getByText(/please check the form:/i)).toBeVisible();
    await expect(page.locator("#contact-email-error")).toHaveText(/enter your email address/i);
    await expect(page.locator("#contact-message-error")).toHaveText(/at least 20 characters/i);
    await expect(page.locator("#contact-privacy-error")).toHaveText(/acknowledge the privacy notice/i);
  });

  test("API rejects an invalid email without delivering a message", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: {
        name: "Test",
        email: "not-an-email",
        topic: "general",
        message: "This message is long enough to pass the message length check.",
        privacyAccepted: true,
      },
    });
    expect(response.status()).toBe(400);
    const body = (await response.json()) as { success: boolean; field?: string };
    expect(body.success).toBe(false);
    expect(body.field).toBe("email");
  });
});

test.describe("mobile navigation", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile menu exposes information and legal navigation", async ({ page }) => {
    await acceptEssentialConsent(page);
    await page.goto("/");
    await page.getByRole("button", { name: "More navigation options" }).click();
    const moreDialog = page.getByRole("dialog", { name: "More navigation" });
    await expect(moreDialog).toBeVisible();
    await expect(moreDialog.getByRole("link", { name: "About", exact: false })).toBeVisible();
    await expect(moreDialog.getByRole("link", { name: "Privacy policy", exact: false })).toBeVisible();
    await moreDialog.getByRole("link", { name: "Contact", exact: false }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByRole("dialog", { name: "More navigation" })).toHaveCount(0);
  });
});

test("consent banner stores a choice and footer opens preferences", async ({ page }) => {
  await page.goto("/");
  const banner = page.getByTestId("consent-banner");
  await expect(banner).toBeVisible();
  await expect(banner.getByText(/optional analytics and advertising are off by default/i)).toBeVisible();

  await banner.getByRole("button", { name: /essential only/i }).click();
  await expect(banner).toHaveCount(0);

  const stored = await page.evaluate(() => localStorage.getItem("syntv-radio:consent:v1"));
  expect(stored).toBeTruthy();
  const parsed = JSON.parse(stored ?? "{}") as { analytics?: boolean; advertising?: boolean; method?: string };
  expect(parsed.analytics).toBe(false);
  expect(parsed.advertising).toBe(false);
  expect(parsed.method).toBe("essential-only");

  await page.locator("footer").getByRole("button", { name: /cookie preferences/i }).click();
  const dialog = page.getByRole("dialog", { name: /privacy choices/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("switch", { name: /optional analytics/i })).toHaveAttribute("aria-checked", "false");
  await expect(dialog.getByRole("switch", { name: /optional advertising/i })).toHaveAttribute("aria-checked", "false");
  await dialog.getByRole("button", { name: /cancel/i }).click();
  await expect(dialog).toHaveCount(0);
});
