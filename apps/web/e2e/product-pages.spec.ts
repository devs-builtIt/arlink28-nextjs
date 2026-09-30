import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

// The public pages for flights, hotel reservations and visa support. The mock API publishes two flights,
// a hotel and a visa; the ten holiday packages are untouched.

const cards = (page: Page) => page.locator("article.pkgs-card");
const form = (page: Page) => page.getByRole("form", { name: "Enquiry form" });

async function fillGuest(page: Page) {
  await form(page).getByLabel("Your name").fill("Jane Doe");
  await form(page).getByLabel("Email address").fill("jane@example.com");
  await form(page)
    .getByLabel(/^I agree to the/)
    .check();
}

test.describe("the lists", () => {
  test("flights are listed with their route, facts and price, or an invitation to enquire", async ({ page }) => {
    await page.goto("/flights");
    await expect(page.getByRole("heading", { name: "Flights, priced by people", level: 1 })).toBeVisible();
    await expect(cards(page)).toHaveCount(2);
    await expect(page.getByRole("status").filter({ hasText: "2 flights" })).toBeVisible();

    const zanzibar = cards(page).filter({ hasText: "Nairobi to Zanzibar" });
    await expect(zanzibar).toContainText("Return");
    await expect(zanzibar).toContainText("Economy");
    await expect(zanzibar).toContainText("Fares from");
    await expect(zanzibar).toContainText("US$180");
    await expect(zanzibar).toContainText("Featured");
    await expect(cards(page).filter({ hasText: "Masai Mara to Nairobi" })).toContainText("Enquire for a price");
  });

  test("each kind has its own list, and the switcher moves between them", async ({ page }) => {
    await page.goto("/packages");
    const kinds = page.getByRole("navigation", { name: "Kind of listing" });
    await expect(kinds.getByRole("link", { name: "Holiday packages" })).toHaveAttribute("aria-current", "page");
    await expect(cards(page)).toHaveCount(10); // no flights among the holidays

    await kinds.getByRole("link", { name: "Hotel reservations" }).click();
    await expect(page).toHaveURL(/\/hotels$/);
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).first()).toContainText("Nairobi City Hotel");
    await expect(cards(page).first()).toContainText("Per night from");
    await expect(cards(page).first()).toContainText("Bed and breakfast");

    await kinds.getByRole("link", { name: "Visa support" }).click();
    await expect(page).toHaveURL(/\/visas$/);
    await expect(cards(page).first()).toContainText("Kenya eTA");
    await expect(cards(page).first()).toContainText("Service fee");
    await expect(cards(page).first()).toContainText("US$25");
  });

  test("search narrows the list, and an empty result says so", async ({ page }) => {
    await page.goto("/flights");
    await page.getByRole("search").getByLabel("Search flights").fill("zanzibar");
    await page.getByRole("search").getByRole("button", { name: "Search" }).click();
    await expect(cards(page)).toHaveCount(1);
    await expect(page).toHaveURL(/q=zanzibar/);

    await page.getByRole("search").getByLabel("Search flights").fill("nothing like this");
    await page.getByRole("search").getByRole("button", { name: "Search" }).click();
    await expect(page.getByRole("heading", { name: "No flights found" })).toBeVisible();
  });
});

test.describe("a listing", () => {
  test("a flight shows its details, fare notes and how to enquire", async ({ page }) => {
    await page.goto("/flights");
    await cards(page)
      .filter({ hasText: "Nairobi to Zanzibar" })
      .getByRole("link", { name: "Nairobi to Zanzibar" })
      .click();
    await expect(page).toHaveURL(/\/flights\/nairobi-to-zanzibar$/);
    await expect(page.getByRole("heading", { name: "Nairobi to Zanzibar", level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Flights");

    await page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Details" }).click();
    await expect(page.getByText("Coastal Air")).toBeVisible();
    await expect(page.getByText("One 23 kg bag and hand luggage")).toBeVisible();
    await expect(page.getByText("Changes are free up to 48 hours before departure.")).toBeVisible();

    const card = page.getByRole("complementary", { name: "Enquire" });
    await expect(card).toContainText("US$180");
    await expect(card.getByRole("link", { name: "Enquire about this flight" })).toHaveAttribute(
      "href",
      /\/contact\?package=Nairobi\+to\+Zanzibar&slug=nairobi-to-zanzibar/,
    );
  });

  test("a visa shows both fees and what the applicant needs", async ({ page }) => {
    await page.goto("/visas/kenya-eta");
    await page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Details" }).click();
    await expect(page.locator("#details").getByText("Our service fee")).toBeVisible();
    await expect(page.locator("#details").getByText("US$25")).toBeVisible();
    await expect(page.locator("#details").getByText("Government fee")).toBeVisible();
    await expect(page.locator("#details").getByText("US$30")).toBeVisible();
    await expect(page.getByText("3 working days")).toBeVisible();
    await expect(page.getByText("Passport valid for six months")).toBeVisible();
  });

  test("a hotel lists what is included", async ({ page }) => {
    await page.goto("/hotels/nairobi-city-hotel");
    await page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "What's included" }).click();
    await expect(page.getByText("Breakfast for two")).toBeVisible();
    await page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Details" }).click();
    await expect(page.getByText("Free cancellation up to 7 days before arrival.")).toBeVisible();
  });

  test("an address for the wrong kind goes to the right one, and an unknown one says so", async ({ page }) => {
    await page.goto("/packages/nairobi-to-zanzibar");
    await expect(page).toHaveURL(/\/flights\/nairobi-to-zanzibar$/);

    await page.goto("/flights/sala-mara-escape");
    await expect(page).toHaveURL(/\/packages\/sala-mara-escape$/);

    await page.goto("/visas/no-such-visa");
    await expect(page.getByRole("heading", { name: "This visa isn't available" })).toBeVisible();
    await expect(page.getByRole("link", { name: "See all visas" })).toBeVisible();
  });
});

test.describe("enquiring", () => {
  test("a flight enquiry asks for a travel date, not nights, and sends no quote", async ({ page }) => {
    await page.goto("/flights/nairobi-to-zanzibar");
    await page
      .getByRole("complementary", { name: "Enquire" })
      .getByRole("link", { name: /Enquire/ })
      .click();

    await expect(page.getByRole("heading", { name: "Send an enquiry" })).toBeVisible();
    await expect(form(page).getByRole("link", { name: "Nairobi to Zanzibar" })).toHaveAttribute(
      "href",
      "/flights/nairobi-to-zanzibar",
    );
    await expect(form(page)).toContainText("Nairobi to Zanzibar"); // what it is, in a line
    await expect(form(page).getByLabel("Preferred travel date")).toBeVisible();
    await expect(form(page).getByLabel("Nights")).toHaveCount(0);
    await expect(form(page).getByText("Price for these dates")).toHaveCount(0);

    await fillGuest(page);
    await form(page)
      .getByLabel("Preferred travel date")
      .fill(`${new Date().getFullYear() + 1}-03-10`);
    const sent = page.waitForRequest((r) => r.url().endsWith("/api/v1/enquiries") && r.method() === "POST");
    await form(page).getByRole("button", { name: "Send enquiry" }).click();
    const body = (await sent).postDataJSON();
    expect(body.slug).toBe("nairobi-to-zanzibar");
    expect(body.checkIn).toMatch(/-03-10$/);
    expect(body.nights).toBeNull();
    await expect(page.getByText(/ENQ-\d{4}-\d{4}/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse more flights" })).toHaveAttribute("href", "/flights");
  });

  test("a hotel enquiry asks for check-in and nights, a visa asks for neither", async ({ page }) => {
    await page.goto("/contact?package=Nairobi+City+Hotel&slug=nairobi-city-hotel");
    await expect(form(page).getByLabel("Check-in date")).toBeVisible();
    await expect(form(page).getByLabel("Nights")).toBeVisible();

    await page.goto("/contact?package=Kenya+eTA&slug=kenya-eta");
    await expect(form(page).getByLabel("Check-in date")).toHaveCount(0);
    await expect(form(page).getByLabel("Preferred travel date")).toHaveCount(0);
    await expect(form(page).getByLabel("Nights")).toHaveCount(0);
    await fillGuest(page);
    await form(page).getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByText(/ENQ-\d{4}-\d{4}/)).toBeVisible();
  });
});
