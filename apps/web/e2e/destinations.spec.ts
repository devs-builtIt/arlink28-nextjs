import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

// The public destination pages. They read the mock API's published destinations (see data/destinations.json):
// Botswana (country) with Chobe and the Okavango Delta, Giza (its country, Egypt, is a draft), Masai Mara with
// packages, Nairobi and Samburu without photos. Moremi and Egypt are drafts and must never show.

const tiles = (page: Page) => page.locator("article.dst-tile");
const country = (page: Page, name: string) => page.getByRole("region", { name });

test.describe("the destinations index", () => {
  test("groups the published places by country, in alphabetical order", async ({ page }) => {
    await page.goto("/destinations");
    await expect(page.getByRole("heading", { name: "Destinations", level: 1 })).toBeVisible();

    const jump = page.getByRole("navigation", { name: "Countries" });
    await expect(jump.getByRole("link")).toHaveText(["Botswana", "Egypt", "Kenya"]);

    const botswana = country(page, "Botswana");
    await expect(botswana.getByRole("heading", { name: "Botswana" }).getByRole("link")).toHaveAttribute(
      "href",
      "/destinations/botswana",
    );
    await expect(botswana).toContainText("A big, quiet country");
    await expect(botswana.locator("article.dst-tile")).toHaveCount(2);
    await expect(botswana.getByRole("link", { name: /Chobe National Park/ })).toHaveAttribute(
      "href",
      "/destinations/chobe-national-park",
    );
    await expect(botswana.getByRole("link", { name: /Okavango Delta/ })).toBeVisible();
    await expect(botswana.getByRole("img", { name: "Aerial view of the Okavango river" })).toBeVisible();
  });

  test("shows a country whose own page is a draft, but without linking to it", async ({ page }) => {
    await page.goto("/destinations");
    const egypt = country(page, "Egypt");
    await expect(egypt.getByRole("heading", { name: "Egypt" }).getByRole("link")).toHaveCount(0);
    await expect(egypt.getByRole("link", { name: /Giza/ })).toHaveAttribute("href", "/destinations/giza");
    await expect(page.locator('a[href="/destinations/egypt"]')).toHaveCount(0);
  });

  test("lists places that have no photo yet by name, linking to their packages", async ({ page }) => {
    await page.goto("/destinations");
    const kenya = country(page, "Kenya");
    await expect(kenya.locator("article.dst-tile")).toHaveCount(1); // only Masai Mara has a photo
    const others = kenya.locator(".dst-others");
    await expect(others).toContainText("Also on our packages:");
    await expect(others.getByRole("link", { name: "Nairobi" })).toHaveAttribute(
      "href",
      "/packages?destination=nairobi",
    );
    await expect(others.getByRole("link", { name: "Samburu" })).toHaveAttribute(
      "href",
      "/packages?destination=samburu",
    );
  });

  test("never shows a draft", async ({ page }) => {
    await page.goto("/destinations");
    await expect(page.getByText("Moremi")).toHaveCount(0);
    await expect(tiles(page)).toHaveCount(4); // Chobe, Okavango, Giza, Masai Mara
  });

  test("has no horizontal scroll on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/destinations");
    await expect(page.getByRole("heading", { name: "Destinations", level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

test.describe("a place", () => {
  test("shows the profile, its things to do and where it sits", async ({ page }) => {
    await page.goto("/destinations/chobe-national-park");
    await expect(page.getByRole("heading", { name: "Chobe National Park", level: 1 })).toBeVisible();
    await expect(page.getByText("The largest elephant herds in Africa")).toBeVisible();
    await expect(page.getByRole("img", { name: "A herd of elephants drinking at the Chobe River" })).toBeVisible();
    await expect(page.getByText("Photo by Rory Ashman on Unsplash").first()).toBeVisible();
    await expect(page.getByText("Chobe is best seen from the river")).toBeVisible();
    await expect(page.getByText("Boat safaris get closer than a vehicle can.")).toBeVisible();

    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("listitem");
    await expect(crumbs).toHaveText(["Destinations", "Botswana", "Chobe National Park"]);
    await expect(crumbs.nth(1).getByRole("link")).toHaveAttribute("href", "/destinations/botswana");

    const things = page.getByRole("region", { name: "Things to do" });
    await expect(things.getByRole("heading", { level: 3 })).toHaveText(["River safari", "Elephant crossing"]);
    await expect(things.getByRole("img", { name: "A boat on the Chobe River" })).toBeVisible();
    await expect(things.getByText("Photo by A. Photographer on Unsplash")).toBeVisible();

    const aside = page.getByRole("complementary", { name: "About this destination" });
    await expect(aside).toContainText("Best time to visit");
    await expect(aside).toContainText("May to September");
    await expect(aside.getByRole("link", { name: "See packages" })).toHaveAttribute(
      "href",
      "/packages?destination=chobe-national-park",
    );
    await expect(aside.getByRole("link", { name: "Ask us about Chobe National Park" })).toHaveAttribute(
      "href",
      "/contact?destination=chobe-national-park",
    );
  });

  test("says so, and offers to help, when there are no packages yet", async ({ page }) => {
    await page.goto("/destinations/chobe-national-park");
    const section = page.getByRole("region", { name: "Packages in Chobe National Park" });
    await expect(section).toContainText("We have no packages listed for Chobe National Park yet");
    await expect(section.getByRole("link", { name: "Contact us" })).toHaveAttribute(
      "href",
      "/contact?destination=chobe-national-park",
    );
    await expect(section.locator("article.pkgs-card")).toHaveCount(0);
  });

  test("lists the packages that go there", async ({ page }) => {
    await page.goto("/destinations/masai-mara");
    await expect(page.getByRole("heading", { name: "Masai Mara", level: 1 })).toBeVisible();
    const section = page.getByRole("region", { name: "Packages in Masai Mara" });
    expect(await section.locator("article.pkgs-card").count()).toBeGreaterThan(0);
    await expect(section).not.toContainText("We have no packages listed");
  });

  test("leaves out a country link when the country itself is not published", async ({ page }) => {
    await page.goto("/destinations/giza");
    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("listitem");
    await expect(crumbs).toHaveText(["Destinations", "Giza"]);
    await expect(page.getByRole("complementary", { name: "About this destination" })).toContainText("Giza");
  });

  test("describes itself to search engines", async ({ page }) => {
    await page.goto("/destinations/chobe-national-park");
    await expect(page).toHaveTitle("Chobe National Park | ARLink28");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /best seen from the river/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/destinations\/chobe-national-park$/);
    const [place, crumbs] = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
    expect(place).toMatchObject({ "@type": "TouristDestination", name: "Chobe National Park" });
    expect(place.containedInPlace).toMatchObject({ name: "Botswana" });
    expect(crumbs.itemListElement.map((i: { name: string }) => i.name)).toEqual([
      "Destinations",
      "Botswana",
      "Chobe National Park",
    ]);
  });

  test("has no horizontal scroll on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/destinations/chobe-national-park");
    await expect(page.getByRole("heading", { name: "Chobe National Park", level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

test.describe("a country", () => {
  test("lists its places and describes itself as a country", async ({ page }) => {
    await page.goto("/destinations/botswana");
    await expect(page.getByRole("heading", { name: "Botswana", level: 1 })).toBeVisible();
    const places = page.getByRole("region", { name: "Places in Botswana" });
    await expect(places.locator("article.dst-tile")).toHaveCount(2);
    await expect(places.getByRole("link", { name: /Okavango Delta/ })).toHaveAttribute(
      "href",
      "/destinations/okavango-delta",
    );
    await expect(page.getByRole("complementary", { name: "About this destination" })).toContainText("Country");
    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("listitem");
    await expect(crumbs).toHaveText(["Destinations", "Botswana"]);
    const [country] = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
    expect(country["@type"]).toBe("Country");
  });
});

test.describe("what is not available", () => {
  for (const slug of ["moremi-game-reserve", "egypt", "no-such-place"]) {
    test(`/destinations/${slug} is a 404 with a way back`, async ({ page }) => {
      const response = await page.goto(`/destinations/${slug}`);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { name: "This destination isn't available" })).toBeVisible();
      await expect(page.getByRole("link", { name: "See all destinations" })).toHaveAttribute("href", "/destinations");
    });
  }
});
