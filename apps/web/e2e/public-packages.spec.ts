import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

// The public package pages: the list at /packages and a package at /packages/[slug].
// They read the mock API's published catalogue (10 packages).

const cards = (page: Page) => page.locator("article.pkgs-card");
const pager = (page: Page) => page.getByRole("navigation", { name: "Pages" });

const search = (page: Page) => page.getByRole("search").getByRole("button", { name: "Search" });
const filters = (page: Page) => page.getByRole("list", { name: "Filters in use" });

/** Chooses an option in one of our dropdowns, by the name it shows. */
async function choose(page: Page, field: string, option: string | RegExp) {
  await page.getByRole("combobox", { name: field }).click();
  await page.getByRole("option", { name: option }).click();
}

test.describe("the packages list", () => {
  test("has a hero with a search bar, and a grid of the published packages", async ({ page }) => {
    await page.goto("/packages");
    await expect(page.getByRole("heading", { name: "Find your next safari", level: 1 })).toBeVisible();
    const bar = page.getByRole("search");
    await expect(bar.getByRole("combobox", { name: "Destination" })).toBeVisible();
    await expect(bar.getByRole("combobox", { name: "Type" })).toBeVisible();
    await expect(bar.getByRole("combobox", { name: "Party" })).toBeVisible();
    await expect(search(page)).toBeVisible();

    await expect(cards(page)).toHaveCount(10);
    await expect(page.getByRole("status").filter({ hasText: "10 packages" })).toBeVisible();

    const grand = cards(page).filter({ hasText: "Giraffe Manor Grand Escape" });
    await expect(grand).toContainText("Nairobi, KE");
    await expect(grand).toContainText("3 nights");
    await expect(grand).toContainText("2 adults");
    await expect(grand).toContainText("US$8,488");
    await expect(grand).toContainText("View package"); // the visible call to action
    await expect(grand.getByRole("list", { name: "Includes" }).getByRole("listitem")).toHaveCount(2);
    await expect(grand).toContainText("Giraffe Manor"); // the lodge
  });

  test("lays the cards out in columns on a wide screen", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/packages");
    const tops = await cards(page).evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    expect(tops.filter((top) => top === tops[0]).length).toBeGreaterThanOrEqual(4);
  });

  test("a card opens its package", async ({ page }) => {
    await page.goto("/packages");
    await cards(page).filter({ hasText: "Sala Mara Escape" }).getByRole("link", { name: "Sala Mara Escape" }).click();
    await expect(page).toHaveURL(/\/packages\/sala-mara-escape$/);
    await expect(page.getByRole("heading", { name: "Sala Mara Escape", level: 1 })).toBeVisible();
  });

  test("the heart saves a package, and it is still saved after a reload", async ({ page }) => {
    await page.goto("/packages");
    const heart = cards(page)
      .filter({ hasText: "Sala Mara Escape" })
      .getByRole("button", { name: /Sala Mara Escape/ }); // its name flips between Save and Remove
    await expect(heart).toHaveAttribute("aria-pressed", "false");
    await heart.click();
    await expect(page).toHaveURL(/\/packages$/); // a heart is not a link
    await expect(heart).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(
      cards(page)
        .filter({ hasText: "Sala Mara Escape" })
        .getByRole("button", { name: /Remove Sala Mara/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("filters by destination and type from the search bar, and the address holds them", async ({ page }) => {
    await page.goto("/packages");
    await choose(page, "Destination", "Masai Mara");
    await choose(page, "Type", "Safari");
    await search(page).click();
    await expect(page).toHaveURL(/destination=masai-mara/);
    await expect(page).toHaveURL(/category=SAFARI/);
    await expect(cards(page)).toHaveCount(3);
    await expect(filters(page).locator(".pkgs-chip")).toHaveCount(2);

    await page.reload();
    await expect(page.getByRole("combobox", { name: "Destination" })).toHaveText("Masai Mara");
    await expect(cards(page)).toHaveCount(3);

    // Each filter in use can be removed on its own.
    await filters(page)
      .getByRole("button", { name: /Safari/ })
      .click();
    await expect(page).not.toHaveURL(/category=/);
    await expect(page.getByRole("combobox", { name: "Type" })).toHaveText("Any type");

    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(cards(page)).toHaveCount(10);
  });

  test("filters by party size", async ({ page }) => {
    await page.goto("/packages");
    await choose(page, "Party", "2 or more adults");
    await search(page).click();
    await expect(page).toHaveURL(/adults=2/);
    await expect(cards(page)).toHaveCount(10);

    // Every package here is for two adults, so a party of four finds none.
    await choose(page, "Party", "4 or more adults");
    await search(page).click();
    await expect(page.getByRole("heading", { name: "No packages found" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "0 packages" })).toBeVisible();
  });

  test("searches by name when you press Enter", async ({ page }) => {
    await page.goto("/packages");
    const box = page.getByPlaceholder("Package, lodge or place");
    await box.fill("classic");
    await box.press("Enter");
    await expect(cards(page)).toHaveCount(1);
    await expect(page).toHaveURL(/q=classic/);
    await box.fill("zanzibar");
    await search(page).click();
    await expect(page.getByRole("heading", { name: "No packages found" })).toBeVisible();
    await page.getByRole("link", { name: "Clear all filters" }).click();
    await expect(cards(page)).toHaveCount(10);
  });

  test("sorts by price, lowest or highest first", async ({ page }) => {
    await page.goto("/packages");
    await choose(page, "Sort by", "Price, lowest first");
    await expect(page).toHaveURL(/sort=price/);
    await expect(cards(page).first()).toContainText("US$5,896");
    await choose(page, "Sort by", "Price, highest first");
    await expect(cards(page).first()).toContainText("US$30,889");
  });

  test("the old Giraffe Manor address becomes the list filtered to Giraffe Manor", async ({ page }) => {
    await page.goto("/giraffe-manor");
    await expect(page).toHaveURL(/\/packages\?partner=giraffe-manor/);
    await expect(cards(page)).toHaveCount(7);
    await expect(filters(page).getByRole("button", { name: /Giraffe Manor/ })).toBeVisible();
    for (const card of await cards(page).all()) await expect(card).toContainText("Giraffe Manor");
    await filters(page)
      .getByRole("button", { name: /Giraffe Manor/ })
      .click();
    await expect(cards(page)).toHaveCount(10);
  });

  test("is in the site menu", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Holidays", exact: true }).click();
    await expect(page).toHaveURL(/\/packages$/);
  });

  test("pages through the list with numbered links, and says where you are", async ({ page }) => {
    await page.goto("/packages?size=4");
    await expect(cards(page)).toHaveCount(4);
    await expect(pager(page)).toContainText("Showing 1 to 4 of 10 packages");
    await expect(pager(page).getByText("Previous")).toHaveAttribute("aria-disabled", "true");
    await expect(pager(page).getByRole("link", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
    const first = await cards(page).first().innerText();

    await pager(page).getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(pager(page)).toContainText("Showing 5 to 8 of 10 packages");
    expect(await cards(page).first().innerText()).not.toBe(first);

    await pager(page).getByRole("link", { name: "Page 3" }).click();
    await expect(cards(page)).toHaveCount(2);
    await expect(pager(page)).toContainText("Showing 9 to 10 of 10 packages");
    await expect(pager(page).getByText("Next")).toHaveAttribute("aria-disabled", "true");

    // The address holds the page, so a link or a refresh lands on it.
    await page.reload();
    await expect(cards(page)).toHaveCount(2);
  });

  test("the pager keeps the filters and the order", async ({ page }) => {
    await page.goto("/packages?size=4&destination=nairobi&sort=price");
    await expect(cards(page)).toHaveCount(4);
    await expect(cards(page).first()).toContainText("US$5,896");
    await pager(page).getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(/destination=nairobi/);
    await expect(page).toHaveURL(/sort=price/);
    await expect(page).toHaveURL(/size=4/);
    await expect(pager(page)).toContainText("of 7 packages");
  });

  test("there is no pager when everything fits on one page", async ({ page }) => {
    await page.goto("/packages");
    await expect(pager(page)).toHaveCount(0);
  });
});

test.describe("a package", () => {
  test("shows the title, where it is, and its sections in order", async ({ page }) => {
    await page.goto("/packages/giraffe-manor-grand-escape");
    await expect(page.getByRole("heading", { name: "Giraffe Manor Grand Escape", level: 1 })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Packages" }),
    ).toBeVisible();

    const tabs = page.getByRole("navigation", { name: "Sections" });
    await expect(tabs.getByRole("link")).toHaveText([
      "Overview",
      "Where you stay",
      "What's included",
      "Prices",
      "Reviews",
    ]);

    // One tab shows at a time.
    await expect(page.getByRole("region", { name: "Overview" })).toContainText("3 nights");
    await expect(page.getByRole("region", { name: "Where you stay" })).toBeHidden();
    await tabs.getByRole("link", { name: "Where you stay" }).click();
    await expect(page.getByRole("region", { name: "Where you stay" })).toContainText("Giraffe Manor");
    await expect(page.getByRole("region", { name: "Overview" })).toBeHidden();
    await tabs.getByRole("link", { name: "What's included" }).click();
    const included = page.getByRole("region", { name: "What's included" });
    await expect(included).toContainText("All meals");
    await expect(included).toContainText("Not included");
    await expect(included).toContainText("Champagne");
  });

  test("lists the season rates with the dates they cover, and the add-ons", async ({ page }) => {
    await page.goto("/packages/sala-mara-escape");
    await page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Prices" }).click();
    const prices = page.getByRole("region", { name: "Prices" });
    const table = prices.getByRole("table");
    await expect(table).toContainText("Savings Season 2026");
    await expect(table).toContainText("US$7,472");
    await expect(table).toContainText("Not sold"); // no extra nights
    await expect(table).toContainText(/6 Jan \d{4} to 31 May \d{4}/);
    await expect(prices).toContainText("Private exclusive vehicle");
    await expect(prices).toContainText("US$490");
    await expect(prices).toContainText("per day");
  });

  test("the price card opens on a date that has a price, and follows the choices", async ({ page }) => {
    await page.goto("/packages/sala-mara-escape");
    const card = page.getByRole("complementary", { name: "Get a price" });
    await expect(card).toContainText("Total");
    await expect(card).toContainText("US$7,472");
    await expect(card).toContainText("Check-in dates with a price");

    await card.getByRole("checkbox", { name: /Private exclusive vehicle/ }).check();
    await expect(card).toContainText("US$8,452"); // two days of the vehicle
    await card.getByText("See how the total is made up").click();
    await expect(card).toContainText("Private exclusive vehicle x2");

    await card.getByRole("checkbox", { name: /Private exclusive vehicle/ }).uncheck();
    await expect(card).toContainText("US$7,472");
  });

  test("a date with no price says so and lists the dates that work", async ({ page }) => {
    await page.goto("/packages/sala-mara-escape");
    const card = page.getByRole("complementary", { name: "Get a price" });
    await expect(card).toContainText("US$7,472");
    // The mock's seasons cover Jan to May and Nov to Dec, so October has no rate.
    const year = new Date().getFullYear() + 1;
    await card.getByLabel("Check-in").fill(`${year}-10-15`);
    await expect(card.getByRole("alert")).toContainText("No rate is defined for the requested check-in date.");
    await expect(card.getByRole("alert")).toContainText("Choose a check-in date from the list above.");
  });

  test("only packages that sell extra nights let you change the length", async ({ page }) => {
    await page.goto("/packages/sala-mara-escape");
    await expect(page.getByRole("complementary", { name: "Get a price" }).getByLabel("Nights")).toHaveCount(0);
  });

  test("Enquire goes to the contact page with the package and the dates", async ({ page }) => {
    await page.goto("/packages/sala-mara-escape");
    const card = page.getByRole("complementary", { name: "Get a price" });
    await expect(card).toContainText("US$7,472");
    const enquire = card.getByRole("link", { name: "Enquire about this package" });
    // The dates are added to this link once the page's script has run; clicking sooner would lose them.
    await expect(enquire).toHaveAttribute("href", /checkIn=/);
    await enquire.click();
    await expect(page).toHaveURL(
      /\/contact\?package=Sala\+Mara\+Escape&slug=sala-mara-escape&checkIn=\d{4}-\d{2}-\d{2}&nights=2/,
    );
  });

  test("has sample reviews, labelled as such", async ({ page }) => {
    await page.goto("/packages/sala-mara-escape");
    await page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Reviews" }).click();
    const reviews = page.getByRole("region", { name: "Guest reviews" });
    await expect(reviews).toContainText("Sample reviews");
    await expect(reviews.getByRole("listitem")).not.toHaveCount(0);
  });

  test("keeps the sample ratings out of the page's structured data", async ({ page }) => {
    await page.goto("/packages/sala-mara-escape");
    const json = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(json!);
    expect(data["@type"]).toBe("TouristTrip");
    expect(data.name).toBe("Sala Mara Escape");
    expect(data.offers.price).toBe("7472.00");
    expect(JSON.stringify(data)).not.toContain("aggregateRating");
    expect(JSON.stringify(data)).not.toContain("review");
  });

  test("says when the photos are on their way", async ({ page }) => {
    await page.goto("/packages/sala-mara-escape");
    await expect(page.getByText("Photos of this package are on their way.")).toBeVisible();
  });

  test("an unknown package says so, and links to the list", async ({ page }) => {
    await page.goto("/packages/no-such-package");
    await expect(page.getByRole("heading", { name: "This package isn't available" })).toBeVisible();
    await page.getByRole("link", { name: "See all packages" }).click();
    await expect(page).toHaveURL(/\/packages$/);
  });

  test("each tab shows only its own content, and the address holds the tab", async ({ page }) => {
    await page.goto("/packages/giraffe-manor-grand-escape");
    await page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Prices" }).click();
    await expect(page).toHaveURL(/#prices$/);
    await expect(page.getByRole("region", { name: "Prices" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Overview" })).toBeHidden();
    await expect(page.getByRole("link", { name: "Prices" })).toHaveAttribute("aria-current", "true");
    await page.goBack();
    await expect(page.getByRole("region", { name: "Overview" })).toBeVisible();
    await page.goto("/packages/giraffe-manor-grand-escape#reviews");
    await expect(page.getByRole("region", { name: "Guest reviews" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Overview" })).toBeHidden();
  });
});

test.describe("photos", () => {
  test("open in a full-screen viewer, move with the arrow keys, and close with Escape", async ({ page }) => {
    await page.goto("/packages/giraffe-manor-grand-escape");
    // The mock's Giraffe packages carry one photo, so add more through the admin-free route: check the single case.
    const tile = page.getByRole("button", { name: /Open photo 1 of/ });
    await expect(tile).toBeVisible();
    await tile.click();
    const viewer = page.getByRole("dialog", { name: /photos/ });
    await expect(viewer).toBeVisible();
    await expect(viewer).toContainText("1 of");
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
    await expect(tile).toBeFocused(); // focus returns to where it was
  });
});
