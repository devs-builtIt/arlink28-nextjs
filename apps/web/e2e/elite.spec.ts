import { test, expect } from "./fixtures";

test.describe("Elite private aviation", () => {
  test("the page shows the three tiers, with the catalogue's wording where it has one", async ({ page }) => {
    await page.goto("/elite-jets");
    await expect(page.getByRole("heading", { name: /Private aviation/, level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "ARLink28 Elite", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "ARLink28 Elite Signature" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "ARLink28 Bespoke" })).toBeVisible();

    // Signature is in the mock catalogue, so its words win; Elite and Bespoke use the built-in ones.
    const signature = page.locator("#arlink28-elite-signature");
    await expect(signature).toContainText("Signature as the catalogue words it.");
    await expect(signature).toContainText("Everything in ARLink28 Elite, plus");
    await expect(signature).toContainText("Catalogue catering item");
    await expect(page.locator("#arlink28-elite")).toContainText("Private aircraft charter");
    await expect(page.locator("#arlink28-bespoke")).toContainText("Destination concierge");
  });

  test("a tier's button opens the enquiry for that tier", async ({ page }) => {
    await page.goto("/elite-jets");
    await page
      .locator("#arlink28-elite-signature")
      .getByRole("link", { name: /Enquire about/ })
      .click();
    await expect(page).toHaveURL(/\/contact\?type=Booking&slug=arlink28-elite-signature/);
    await expect(page.getByText("You are enquiring about")).toBeVisible();
    await expect(page.getByRole("link", { name: "ARLink28 Elite Signature" })).toBeVisible();
    await expect(page.getByLabel("Preferred travel date")).toBeVisible();
    await expect(page.getByLabel("Nights")).toHaveCount(0);
  });

  test("the homepage teaser links to the tiers", async ({ page }) => {
    await page.goto("/");
    const teaser = page.getByRole("region", { name: /Private charter/ });
    await expect(teaser.getByRole("link", { name: /ARLink28 Bespoke/ })).toHaveAttribute(
      "href",
      "/elite-jets#arlink28-bespoke",
    );
    await expect(teaser.getByRole("link", { name: "See the tiers" })).toHaveAttribute("href", "/elite-jets");
  });
});
