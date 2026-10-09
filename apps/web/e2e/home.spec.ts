import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

// The homepage's quote request. It sends to the mock API, which follows the real API's rules.

const quote = (page: Page) => page.locator("#quote");

test.describe("the homepage quote request", () => {
  test("a flight quote takes two steps and ends with a reference", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("people who know the routes");

    await quote(page).getByLabel("From").fill("Lagos");
    await quote(page).getByRole("option", { name: /Lagos/ }).first().click();
    await expect(quote(page).getByLabel("From")).toHaveValue("Lagos (LOS)");
    await quote(page).getByLabel("To").fill("Nairobi");
    await page.keyboard.press("Enter");
    await expect(quote(page).getByLabel("To")).toHaveValue("Nairobi (NBO)");
    await quote(page).getByRole("button", { name: "Get my quote" }).click();

    await expect(quote(page)).toContainText("Flight quote: Lagos (LOS) to Nairobi (NBO)");
    await quote(page).getByLabel("Your name").fill("Jane Doe");
    await quote(page).getByLabel("Email").fill("jane@example.com");
    await quote(page)
      .getByLabel(/^I agree that ARLink28/)
      .check();
    await quote(page).getByRole("button", { name: "Send my request" }).click();

    await expect(quote(page).getByRole("status")).toContainText(/Reference ENQ-\d{4}-\d{4}/);
    await expect(quote(page).getByRole("link", { name: /WhatsApp/ })).toHaveCount(0);
  });

  test("asks for what is missing instead of sending", async ({ page }) => {
    await page.goto("/");
    await quote(page).getByRole("button", { name: "Get my quote" }).click();
    await expect(quote(page)).toContainText("Where are you flying from?");
    await expect(quote(page)).toContainText("Where to?");

    await quote(page).getByRole("radio", { name: "Visa" }).click();
    await quote(page).getByLabel("Visa for which country?").fill("Kenya");
    await quote(page).getByRole("button", { name: "Get my quote" }).click();
    await quote(page).getByRole("button", { name: "Send my request" }).click();
    await expect(quote(page)).toContainText("Enter your name.");
    await expect(quote(page)).toContainText("Please agree so we can contact you.");
    await expect(quote(page).getByRole("status")).toHaveCount(0);
  });

  test("choosing a route fills in the form", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Accra.*From Lagos/ }).click();
    await expect(quote(page).getByLabel("From")).toHaveValue("Lagos (LOS)");
    await expect(quote(page).getByLabel("To")).toHaveValue("Accra (ACC)");
  });

  test("Victoria Falls is among the destinations, London is not, and choosing it fills in the form", async ({
    page,
  }) => {
    await page.goto("/");
    const cards = page.getByRole("list", { name: "Start a quote for a destination" }).getByRole("listitem");
    await expect(cards).toHaveCount(6);
    await expect(cards.filter({ hasText: "London" })).toHaveCount(0);
    await page.getByRole("button", { name: /Victoria Falls.*From Johannesburg/ }).click();
    await expect(quote(page).getByLabel("From")).toHaveValue("Johannesburg (JNB)");
    await expect(quote(page).getByLabel("To")).toHaveValue("Victoria Falls (VFA)");
  });

  test("does not scroll sideways", async ({ page }) => {
    await page.goto("/");
    const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(wide).toBe(false);
  });

  test("the theme toggle switches and remembers light and dark, on the homepage only", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Switch to (light|dark) theme/ }).click();
    const chosen = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(["light", "dark"]).toContain(chosen);
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(chosen);

    // The older pages stay dark and have no toggle.
    await page.goto("/about");
    await expect(page.getByRole("button", { name: /Switch to (light|dark) theme/ })).toHaveCount(0);
  });
});
