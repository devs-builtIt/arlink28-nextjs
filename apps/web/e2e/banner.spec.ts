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
    const pb = banners[0];
    const h1 = pb?.querySelector("h1");
    const img = pb?.querySelector<HTMLImageElement>(".pb-img");
    return {
      banners: banners.length,
      h1s: document.querySelectorAll("h1").length,
      heightPx: pb ? Math.round(pb.getBoundingClientRect().height) : 0,
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
      const key = JSON.stringify({ h: m.heightPx, font: m.font, weight: m.weight, size: m.size, photo: m.photo });
      seen.set(key, [...(seen.get(key) ?? []), path]);
    }
    // Every page reports the same measurements, so there is a single group.
    expect([...seen.entries()].map(([k, paths]) => `${k} -> ${paths.length} pages`)).toHaveLength(1);
    const [only] = [...seen.keys()];
    expect(JSON.parse(only)).toMatchObject({ h: 450, font: "Satoshi", weight: "600", size: "58px" });
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
