import { test, expect } from "./fixtures";

// Every inner page opens with the same banner (components/PageBanner.tsx): the same photo, the same height,
// the same typeface. This visits them all so one page cannot quietly drift from the rest.

const PAGES = [
  "/about",
  "/team",
  "/services",
  "/connect",
  "/engagement",
  "/engagement-details",
  "/opportunities",
  "/travel",
  "/contact",
  "/quote",
  "/elite-jets",
  "/blogs",
  "/packages",
  "/flights",
  "/hotels",
  "/visas",
  "/destinations",
  "/book/flight",
  "/book/hotel",
  "/book/visa",
  "/book/holiday",
  "/privacy-policy",
  "/terms-of-service",
  "/refund-policy",
  "/cookie-policy",
  "/disclaimer",
  "/affiliate-disclosure",
];

async function measure(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const banners = document.querySelectorAll(".pb");
    const card = banners[0]?.querySelector(".pb-card");
    const h1 = card?.querySelector("h1");
    const img = card?.querySelector<HTMLImageElement>(".pb-img");
    const box = card?.getBoundingClientRect();
    return {
      banners: banners.length,
      h1s: document.querySelectorAll("h1").length,
      heightPx: box ? Math.round(box.height) : 0,
      left: box ? Math.round(box.left) : -1,
      right: box ? Math.round(window.innerWidth - box.right) : -1,
      radius: card ? getComputedStyle(card).borderRadius : "",
      font: h1 ? getComputedStyle(h1).fontFamily.split(",")[0].replaceAll('"', "") : "",
      weight: h1 ? getComputedStyle(h1).fontWeight : "",
      size: h1 ? getComputedStyle(h1).fontSize : "",
      photo: img ? img.currentSrc.split("/").slice(-2).join("/") : "",
      loaded: img ? img.complete && img.naturalWidth > 0 : false,
      sideways: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
}

test.describe("the banner at the top of the inner pages", () => {
  test("is the same on every page: one photo, one height, one typeface", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const seen = new Map<string, string[]>();
    for (const path of PAGES) {
      await page.goto(path);
      const m = await measure(page);
      expect(m.banners, `${path}: exactly one banner`).toBe(1);
      expect(m.h1s, `${path}: exactly one h1`).toBe(1);
      expect(m.loaded, `${path}: the photo loads`).toBe(true);
      expect(m.sideways, `${path}: no sideways scroll`).toBe(false);
      const key = JSON.stringify({
        h: m.heightPx,
        left: m.left,
        right: m.right,
        radius: m.radius,
        font: m.font,
        weight: m.weight,
        size: m.size,
        photo: m.photo,
      });
      seen.set(key, [...(seen.get(key) ?? []), path]);
    }
    // Every page reports the same measurements, so there is a single group.
    expect([...seen.entries()].map(([k, paths]) => `${k} -> ${paths.length} pages`)).toHaveLength(1);
    const [only] = [...seen.keys()];
    expect(JSON.parse(only)).toMatchObject({
      h: 440,
      left: 30,
      right: 30,
      radius: "12px",
      font: "Satoshi",
      weight: "600",
      size: "58px",
    });
  });

  test("is a rounded card inset from the page edges, the same shape as the homepage hero", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const hero = await page.evaluate(() => {
      const card = document.querySelector(".hm-hero-card")!;
      const box = card.getBoundingClientRect();
      return { left: Math.round(box.left), radius: getComputedStyle(card).borderRadius };
    });
    await page.goto("/about");
    const banner = await measure(page);
    expect(banner.left).toBe(hero.left);
    expect(banner.radius).toBe(hero.radius);
    expect(banner.left).toBeGreaterThan(0); // inset, not edge to edge
  });

  test("serves a sharp photo: the larger file to a high-density screen", async ({ browser }) => {
    for (const [density, file] of [
      [1, "banner-1920.webp"],
      [2, "banner-2560.webp"],
    ] as const) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: density });
      const page = await context.newPage();
      await page.goto("/about");
      const served = await page.evaluate(() =>
        document.querySelector<HTMLImageElement>(".pb-img")!.currentSrc.split("/").pop(),
      );
      expect(served, `a ${density}x screen`).toBe(file);
      await context.close();
    }
  });

  test("keeps the title readable and the page still without sideways scroll on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    for (const path of ["/about", "/engagement", "/packages", "/book/flight", "/privacy-policy", "/contact"]) {
      await page.goto(path);
      const m = await measure(page);
      expect(m.size, `${path}: title size`).toBe("34px");
      expect(m.sideways, `${path}: no sideways scroll`).toBe(false);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("keeps the real content that used to sit in the old banners", async ({ page }) => {
    await page.goto("/engagement");
    await expect(page.getByRole("link", { name: "Our engagements" })).toBeVisible();
    await expect(page.getByLabel("Engagement at a glance")).toContainText("Industry Engagements");
    await expect(page.getByLabel("Engagement at a glance")).toContainText("Through industry summits");

    await page.goto("/opportunities");
    await expect(page.getByLabel("Opportunities at a glance")).toContainText("Open Roles");

    await page.goto("/book/flight");
    await expect(page.getByRole("link", { name: "Back to search" })).toHaveAttribute("href", "/");
    await expect(page.getByRole("heading", { name: "Choose your flight partner", level: 1 })).toBeVisible();

    await page.goto("/engagement-details");
    await expect(page.getByRole("link", { name: "Back to engagement" })).toHaveAttribute("href", "/engagement");
  });
});
