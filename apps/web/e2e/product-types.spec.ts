import { test, expect, signIn, SUPER_ADMIN } from "./fixtures";
import type { Page } from "@playwright/test";

const rows = (page: Page) => page.locator("table.packages tbody tr");
const next = (page: Page) => page.getByRole("button", { name: "Next", exact: true }).click();

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("flights, hotel reservations and visa support", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
  });

  test("the chooser lists the four kinds", async ({ page }) => {
    await page.goto("/admin/packages/new");
    const links = page.locator(".pk-types a");
    await expect(links).toHaveCount(4);
    await expect(links.nth(1)).toContainText("Flight");
    await links.nth(1).click();
    await expect(page).toHaveURL(/type=Flight$/);
    await expect(page.getByRole("heading", { name: "New flight", level: 1 })).toBeVisible();
  });

  test("a flight is created in four steps and shows up with its route", async ({ page }) => {
    await page.goto("/admin/packages/new?type=Flight");
    await expect(page.getByLabel("Name", { exact: true })).toBeFocused();
    // No nights, party or style: those are holiday facts.
    await expect(page.getByLabel("Nights", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Style")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Steps" }).getByRole("button")).toHaveCount(4);

    await page.getByLabel("Name", { exact: true }).fill("Nairobi to Zanzibar");
    await page.getByLabel("Destination").selectOption({ label: "Masai Mara, KE" });
    await next(page);

    // The route is required before moving on (the browser stops Next on the empty field).
    await page.getByLabel("From", { exact: true }).fill("Nairobi");
    await next(page);
    await expect(page.getByRole("heading", { name: "Flight details", level: 2 })).toBeVisible(); // still here
    await page.getByLabel("To", { exact: true }).fill("Zanzibar");
    await page.getByLabel("Fares from").fill("180");
    await page.getByLabel("Trip").selectOption("Return");
    await next(page);
    await next(page); // photos are optional for a draft

    await expect(page.getByText("Nairobi to Zanzibar").first()).toBeVisible();
    await page.getByRole("button", { name: "Create flight" }).click();
    await expect(page).toHaveURL(/\/admin\/packages\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: "Nairobi to Zanzibar", level: 1 })).toBeVisible();
    await expect(page.locator(".pk-meta")).toContainText("Nairobi to Zanzibar");
    await expect(page.locator(".pk-meta")).toContainText("$180");

    // Only the tabs a flight has.
    const tabs = page.getByRole("tablist", { name: "Sections" }).getByRole("tab");
    await expect(tabs).toHaveText(["Details", "Offer", "Included", "Photos", "Listing"]);
  });

  test("a visa takes its price from the service fee, and a flight can be edited and published", async ({ page }) => {
    await page.goto("/admin/packages/new?type=VisaSupport");
    await page.getByLabel("Name", { exact: true }).fill("Kenya eTA");
    await page.getByLabel("Destination").selectOption({ label: "Masai Mara, KE" });
    await page.getByLabel("Summary").fill("We apply for your Kenya eTA.");
    await next(page);
    await page.getByLabel("Country").fill("Kenya");
    await page.getByLabel("Visa", { exact: true }).fill("eTA");
    await page.getByLabel("Our service fee").fill("25");
    await page.getByLabel("What the applicant needs").fill("Passport\nReturn ticket");
    await next(page);
    await page.locator('input[type="file"]').setInputFiles({ name: "kenya.png", mimeType: "image/png", buffer: PNG });
    await next(page);
    await page.getByRole("button", { name: "Create visa support" }).click();
    await expect(page).toHaveURL(/\/admin\/packages\/[0-9a-f-]{36}$/);
    await expect(page.locator(".pk-meta")).toContainText("Kenya, eTA");
    await expect(page.locator(".pk-meta")).toContainText("$25");

    // Edit the offer, then publish: a summary, the details and a photo are all it needs.
    await page.getByRole("tab", { name: "Offer" }).click();
    await page.getByLabel("Processing time").fill("3 working days");
    await page.getByRole("button", { name: "Save" }).first().click();
    await expect(page.getByText("Saved")).toBeVisible();
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.locator(".pk-heading")).toContainText("Published");
  });

  test("the list filters by kind and says what each row is", async ({ page }) => {
    await page.goto("/admin/packages/new?type=Flight");
    await page.getByLabel("Name", { exact: true }).fill("Nairobi to Zanzibar");
    await page.getByLabel("Destination").selectOption({ label: "Masai Mara, KE" });
    await next(page);
    await page.getByLabel("From", { exact: true }).fill("Nairobi");
    await page.getByLabel("To", { exact: true }).fill("Zanzibar");
    await next(page);
    await next(page);
    await page.getByRole("button", { name: "Create flight" }).click();
    await expect(page).toHaveURL(/\/admin\/packages\/[0-9a-f-]{36}$/);

    await page.goto("/admin/packages");
    await expect(rows(page)).toHaveCount(12);
    await page.getByLabel("Kind").selectOption("Flight");
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText("Nairobi to Zanzibar");
    await expect(page.getByRole("link", { name: "New flight" })).toBeVisible();
    await expect(page.getByLabel("Category")).toHaveCount(0);

    await page.getByLabel("Kind").selectOption("HolidayPackage");
    await expect(rows(page)).toHaveCount(11);
  });
});
