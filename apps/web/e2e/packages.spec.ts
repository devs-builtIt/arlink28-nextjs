import { test, expect, signIn, errorNotice, SUPER_ADMIN, OPERATOR } from "./fixtures";
import type { Page } from "@playwright/test";

/** The next date (today or later) with this month and day, as yyyy-mm-dd. */
function next(month: number, day: number): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let d = new Date(now.getFullYear(), month - 1, day);
  if (d < today) d = new Date(now.getFullYear() + 1, month - 1, day);
  return `${d.getFullYear()}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const rows = (page: Page) => page.locator("table.packages tbody tr");

// 10 published packages from the catalogue, and one draft.
const ALL = 11;
const PUBLISHED = 10;

async function openList(page: Page) {
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Packages" }).click();
  await expect(page).toHaveURL(/\/admin\/packages$/);
}

/** Opens a package the way staff do: from the list. */
async function openPackage(page: Page, title: string) {
  await page.goto("/admin/packages");
  await rows(page).filter({ hasText: title }).getByRole("link", { name: title }).click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
}

// Which tab of the package editor each section lives on. Anything not listed is always on screen.
const TAB_OF: Record<string, string> = {
  Details: "Details",
  "Where you stay": "Stays",
  Pricing: "Pricing",
  "Season rates": "Pricing",
  "What's included": "Included",
  "Add-ons": "Add-ons",
  Photos: "Photos",
  Listing: "Listing",
};

const editorTab = (page: Page, name: string) => page.getByRole("tab", { name: new RegExp(`^${name}`) });

/** A section of the package editor, opened first: each tab shows only its own sections. */
async function section(page: Page, name: string) {
  const label = TAB_OF[name];
  if (label) {
    const tab = editorTab(page, label);
    if ((await tab.getAttribute("aria-selected")) !== "true") await tab.click();
  }
  return page.getByRole("region", { name });
}

test.describe("packages list", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
    await openList(page);
  });

  const tab = (page: Page, name: string) => page.getByRole("tab", { name: new RegExp(`^${name}`) });
  const pager = (page: Page) => page.getByRole("navigation", { name: "Pagination" });

  test("shows every package, drafts included, with its status", async ({ page }) => {
    await expect(rows(page)).toHaveCount(ALL);
    const grand = rows(page).filter({ hasText: "Giraffe Manor Grand Escape" });
    await expect(grand).toContainText("Nairobi");
    await expect(grand).toContainText("3 nights");
    await expect(grand).toContainText("2 adults");
    await expect(grand).toContainText("Published");
    await expect(grand).toContainText("$8,488");
    await expect(rows(page).filter({ hasText: "Sala's Family Safari" })).toContainText("Draft");
    await expect(rows(page).filter({ hasText: "Sala's Family Safari" })).toContainText("No price");
  });

  test("the status tabs show how many packages are in each", async ({ page }) => {
    await expect(tab(page, "All")).toContainText(String(ALL));
    await expect(tab(page, "Published")).toContainText(String(PUBLISHED));
    await expect(tab(page, "Draft")).toContainText("1");
    await expect(tab(page, "Archived")).toContainText("0");
    await expect(tab(page, "All")).toHaveAttribute("aria-selected", "true");

    await tab(page, "Draft").click();
    await expect(rows(page)).toHaveCount(1);
    await expect(tab(page, "Draft")).toHaveAttribute("aria-selected", "true");
    // The counts belong to the search, not to the tab that is open.
    await expect(tab(page, "Published")).toContainText(String(PUBLISHED));

    await tab(page, "Archived").click();
    await expect(page.getByText("There are no archived packages.")).toBeVisible();
    await tab(page, "Published").click();
    await expect(rows(page)).toHaveCount(PUBLISHED);
  });

  test("filters by destination and category, and clears", async ({ page }) => {
    await page.getByLabel("Destination").selectOption("masai-mara");
    await expect(rows(page)).toHaveCount(4);
    await page.getByLabel("Destination").selectOption("nairobi");
    await page.getByLabel("Category").selectOption("SAFARI");
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page)).toContainText("Giraffe and Nairobi Wildlife Escape");
    // The tabs follow the filters.
    await expect(tab(page, "All")).toContainText("1");

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(rows(page)).toHaveCount(ALL);
    await expect(page.getByRole("button", { name: "Clear filters" })).toHaveCount(0);
  });

  test("search narrows by name, on the server, and says when nothing matches", async ({ page }) => {
    await page.getByPlaceholder("Search by name").fill("family");
    await expect(rows(page)).toHaveCount(4);
    await expect(tab(page, "Draft")).toContainText("1");
    await expect(page).toHaveURL(/q=family/);
    await page.getByPlaceholder("Search by name").fill("zanzibar");
    await expect(page.getByText("No packages match these filters.")).toBeVisible();
    await expect(pager(page)).toHaveCount(0);
  });

  test("a row opens the package", async ({ page }) => {
    await rows(page).filter({ hasText: "Sala Mara Escape" }).click();
    await expect(page).toHaveURL(/\/admin\/packages\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: "Sala Mara Escape", level: 1 })).toBeVisible();
  });

  test("New asks what kind of listing, then starts that stepper", async ({ page }) => {
    await page.getByRole("link", { name: "New listing" }).click();
    await expect(page).toHaveURL(/\/admin\/packages\/new$/);
    await expect(page.getByRole("heading", { name: "What are you adding?", level: 1 })).toBeVisible();
    await page.getByRole("link", { name: /Holiday package/ }).click();
    await expect(page).toHaveURL(/\/admin\/packages\/new\?type=HolidayPackage$/);
    await expect(page.getByRole("heading", { name: "New package", level: 1 })).toBeVisible();
  });

  test("pages through the list, and says where you are", async ({ page }) => {
    await pager(page).getByLabel("Rows per page").selectOption("10");
    await expect(rows(page)).toHaveCount(10);
    await expect(pager(page)).toContainText("Showing 1 to 10 of 11 packages");
    await expect(pager(page).getByRole("button", { name: "Previous" })).toBeDisabled();
    await expect(pager(page).getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
    const firstPage = await rows(page).first().innerText();

    await pager(page).getByRole("button", { name: "Next" }).click();
    await expect(rows(page)).toHaveCount(1);
    await expect(pager(page)).toContainText("Showing 11 to 11 of 11 packages");
    await expect(pager(page).getByRole("button", { name: "Next" })).toBeDisabled();
    await expect(page).toHaveURL(/page=2/);
    expect(await rows(page).first().innerText()).not.toBe(firstPage);

    // The address holds the page, so a refresh lands on it.
    await page.reload();
    await expect(pager(page)).toContainText("Showing 11 to 11 of 11 packages");

    await pager(page).getByRole("button", { name: "Page 1" }).click();
    await expect(rows(page)).toHaveCount(10);
    await expect(page).not.toHaveURL(/page=/);
  });

  test("a bigger page size shows everything, and filtering goes back to page one", async ({ page }) => {
    await page.goto("/admin/packages?size=10&page=2");
    await expect(rows(page)).toHaveCount(1);
    await tab(page, "Published").click();
    await expect(page).not.toHaveURL(/page=/);
    await expect(rows(page)).toHaveCount(10);
    await expect(pager(page)).toContainText("Showing 1 to 10 of 10 packages");

    await pager(page).getByLabel("Rows per page").selectOption("50");
    await expect(pager(page).getByRole("button", { name: "Page 2" })).toHaveCount(0);
  });

  test("a page past the end goes to the last one", async ({ page }) => {
    await page.goto("/admin/packages?size=10&page=9");
    await expect(rows(page)).toHaveCount(1);
    await expect(page).toHaveURL(/page=2/);
  });

  test("shows placeholders in the shape of the table while the first page loads", async ({ page }) => {
    await page.route("**/api/v1/admin/packages?*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 900));
      await route.continue();
    });
    await page.goto("/admin/packages");
    await expect(page.locator("table.packages .sk").first()).toBeVisible();
    await expect(page.locator("table.packages .pkg-title")).toHaveCount(0); // placeholders, not packages
    await expect(rows(page)).toHaveCount(ALL);
    await expect(page.locator("table.packages .sk")).toHaveCount(0);
  });

  test("keeps the rows on screen, dimmed, while another page loads", async ({ page }) => {
    await page.goto("/admin/packages?size=10");
    await expect(rows(page)).toHaveCount(10);
    await page.route("**/api/v1/admin/packages?*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 900));
      await route.continue();
    });
    await pager(page).getByRole("button", { name: "Next" }).click();
    await expect(page.locator('.pk-table-panel[aria-busy="true"]')).toBeVisible();
    await expect(rows(page)).toHaveCount(10); // the old page stays until the new one arrives
    await expect(rows(page)).toHaveCount(1);
    await expect(page.locator('.pk-table-panel[aria-busy="true"]')).toHaveCount(0);
  });
});

test.describe("package detail", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
  });

  test("a published package's forms hold its details, stays, rates, inclusions and add-ons", async ({ page }) => {
    await openPackage(page, "Sala Mara Escape");

    const details = await section(page, "Details");
    await expect(details.getByLabel("Package name")).toHaveValue("Sala Mara Escape");
    await expect(details.getByLabel("Destination")).toContainText("Masai Mara");
    await expect(details.getByLabel("Nights", { exact: true })).toHaveValue("2");

    const pricing = await section(page, "Pricing");
    await expect(pricing.getByLabel("Minimum stay")).toHaveValue("2");
    await expect(pricing.getByLabel("Priced")).toHaveValue("PerParty");
    await expect(pricing.getByLabel("Main currency")).toHaveValue("USD");

    const stays = await section(page, "Where you stay");
    await expect(stays.getByLabel("Stay 1 property")).toHaveValue("prop-salas-camp");
    await expect(stays.getByLabel("Stay 1 nights")).toHaveValue("2");
    await expect(stays.getByLabel("Stay 1 room type")).toHaveValue(/Keekorok Tent with Pool/);
    await expect(stays).toContainText("2 of 2 nights placed");

    const rates = await section(page, "Season rates");
    await expect(rates.getByLabel("Rate 1 season")).toHaveValue("season-safari-collection-savings-2026");
    await expect(rates.getByLabel("Rate 1 currency")).toHaveValue("USD");
    await expect(rates.getByLabel("Rate 1 package price")).toHaveValue("7472");

    const included = await section(page, "What's included");
    await expect(
      included.getByRole("group", { name: "Included", exact: true }).locator('input[value="All meals"]'),
    ).toBeVisible();
    await expect(
      included.getByRole("group", { name: "Not included" }).locator('input[value="Champagne"]'),
    ).toBeVisible();

    const addOns = await section(page, "Add-ons");
    await expect(addOns.getByLabel("Add-on 1 name")).toHaveValue("Private exclusive vehicle");
    await expect(addOns.getByLabel("Add-on 1 charged")).toHaveValue("PerDay");
    await expect(addOns.getByLabel("Add-on 1 price")).toHaveValue("490");

    await expect(page.getByRole("region", { name: "Status" })).toContainText("Customers can see it on the site.");
  });

  test("prices a stay, with an add-on charged per day", async ({ page }) => {
    await openPackage(page, "Sala Mara Escape");
    await editorTab(page, "Pricing").click();
    const checker = page.getByRole("region", { name: "Check a price" });
    await checker.getByLabel("Check-in").fill(next(11, 10));
    await checker.getByRole("button", { name: "Get price" }).click();
    await expect(checker.getByRole("status", { name: "Price" })).toContainText("$7,472");

    await checker.getByRole("checkbox", { name: /Private exclusive vehicle/ }).check();
    await checker.getByRole("button", { name: "Get price" }).click();
    const price = checker.getByRole("status", { name: "Price" });
    await expect(price).toContainText("Private exclusive vehicle x2");
    await expect(price).toContainText("Total for 2 nights");
    await expect(price).toContainText("$8,452");
  });

  test("the Grand Escape quotes $8,488 (the API's parity case)", async ({ page }) => {
    await openPackage(page, "Giraffe Manor Grand Escape");
    await editorTab(page, "Pricing").click();
    const checker = page.getByRole("region", { name: "Check a price" });
    await checker.getByLabel("Check-in").fill(next(11, 10));
    await checker.getByRole("button", { name: "Get price" }).click();
    await expect(checker.getByRole("status", { name: "Price" })).toContainText("$8,488");
  });

  test("a date outside every season explains what to do", async ({ page }) => {
    await openPackage(page, "Sala Mara Escape");
    await editorTab(page, "Pricing").click();
    const checker = page.getByRole("region", { name: "Check a price" });
    await checker.getByLabel("Check-in").fill(next(10, 15));
    await checker.getByRole("button", { name: "Get price" }).click();
    await expect(errorNotice(page)).toContainText("No rate is defined for the requested check-in date.");
    await expect(errorNotice(page)).toContainText("Try a date inside one of the seasons");
  });

  test("a draft opens empty, and Publish says what it still needs", async ({ page }) => {
    await openPackage(page, "Sala's Family Safari");
    await expect(page.getByRole("region", { name: "Check a price" })).toHaveCount(0);
    await expect(await section(page, "Photos")).toContainText("No photos yet");
    await expect(await section(page, "Where you stay")).toContainText("No stays yet");
    await expect(await section(page, "Season rates")).toContainText("No rates yet");

    await page.getByRole("button", { name: "Publish", exact: true }).click();
    const needed = page.locator('.notice[role="alert"]', { hasText: "Still needed" });
    await expect(needed).toContainText("A summary");
    await expect(needed).toContainText("At least one stay");
    await expect(needed).toContainText("A USD rate for a season that has not ended");
    await expect(needed).toContainText("A main photo");
    await expect(page.getByRole("region", { name: "Status" })).toContainText("Not on the site yet.");
  });

  test("an unknown package says so", async ({ page }) => {
    await page.goto("/admin/packages/00000000-0000-4000-8000-000000000000");
    await expect(errorNotice(page)).toContainText("doesn't exist");
    await page.getByRole("link", { name: "Back to packages" }).click();
    await expect(page).toHaveURL(/\/admin\/packages$/);
  });

  test("changes to the details save, and Save stays off until something changes", async ({ page }) => {
    await openPackage(page, "Sala's Family Safari");
    const details = await section(page, "Details");
    const save = details.getByRole("button", { name: "Save changes" });
    await expect(save).toBeDisabled();

    await details.getByLabel("Nights").fill("4");
    await details.getByLabel("Tagline").fill("Two lodges, one plane");
    await expect(save).toBeEnabled();
    await save.click();
    await expect(details.getByRole("status")).toHaveText("Saved");
    await expect(save).toBeDisabled();

    await page.reload();
    await expect((await section(page, "Details")).getByLabel("Nights")).toHaveValue("4");
    await expect((await section(page, "Details")).getByLabel("Tagline")).toHaveValue("Two lodges, one plane");
  });
});

// Real image bytes: a 1x1 PNG and a minimal JPEG. The API identifies photos by these, not by name.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
  "base64",
);
const photo = (name: string, bytes = PNG) => ({
  name,
  mimeType: name.endsWith(".png") ? "image/png" : "image/jpeg",
  buffer: bytes,
});

const newPackageForm = async (page: Page) => {
  await page.goto("/admin/packages/new?type=HolidayPackage");
  await expect(page.getByLabel("Destination")).toContainText("Masai Mara");
  return page;
};

const STEP_TITLES = ["Details", "Where you stay", "Pricing", "What's included", "Add-ons", "Photos", "Review"];
const stepHeading = (page: Page, title: string) => page.getByRole("heading", { name: title, level: 2, exact: true });
const clickNext = (page: Page) => page.getByRole("button", { name: "Next", exact: true }).click();

/** Moves forward with Next until the step is showing. */
async function goToStep(page: Page, title: string) {
  for (let i = 0; i < STEP_TITLES.length; i++) {
    if (await stepHeading(page, title).isVisible()) return;
    await clickNext(page);
  }
  await expect(stepHeading(page, title)).toBeVisible();
}

const createButton = (page: Page) => page.getByRole("button", { name: /^Create package/ });

async function fillBasics(page: Page, name: string) {
  await page.getByLabel("Package name").fill(name);
  await page.getByLabel("Destination").selectOption({ label: "Masai Mara, KE" });
}

test.describe("creating a package", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
  });

  test("is a stepper, and starts with sensible defaults so a name and a destination are enough", async ({ page }) => {
    await newPackageForm(page);
    const steps = page.getByRole("navigation", { name: "Steps" });
    await expect(steps.getByRole("button")).toHaveCount(7);
    await expect(steps.getByRole("button", { name: /Basics/ })).toHaveAttribute("aria-current", "step");
    await expect(page.getByLabel("Package name")).toBeFocused();
    await expect(page.getByLabel("Style")).toHaveValue("SAFARI");
    await expect(page.getByLabel("Nights", { exact: true })).toHaveValue("2");
    await expect(page.getByLabel("Adults")).toHaveValue("2");
    await expect(page.getByLabel("Children")).toHaveValue("0");

    await fillBasics(page, "Amboseli Elephant Weekend");
    await goToStep(page, "Review");
    await createButton(page).click();

    await expect(page).toHaveURL(/\/admin\/packages\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: "Amboseli Elephant Weekend", level: 1 })).toBeVisible();
    await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
  });

  test("walks through every step and saves the whole package in one go", async ({ page }) => {
    await newPackageForm(page);

    // Details
    await fillBasics(page, "Sasaab Sunset Retreat");
    await page.getByLabel("Summary").fill("Two nights above the Samburu plains.");
    await page.getByLabel("Full description").fill("The longer story.");
    await clickNext(page);

    // Stays
    await expect(stepHeading(page, "Where you stay")).toBeFocused();
    await page.getByRole("button", { name: "Add a stay" }).click();
    await page.getByLabel("Stay 1 property").selectOption("prop-salas-camp");
    await page.getByLabel("Stay 1 room type").fill("Forest Tent with Pool");
    await expect(page.getByText("2 of 2 nights placed")).toBeVisible();
    await clickNext(page);

    // Pricing
    await page.getByLabel("Minimum stay").fill("1");
    await page.getByLabel("Priced").selectOption("PerPerson");
    await page.getByRole("button", { name: "Add a rate" }).click();
    await page.getByLabel("Rate 1 season").selectOption("season-safari-collection-savings-2026");
    await page.getByLabel("Rate 1 package price").fill("7,472.50");
    await clickNext(page);

    // What's included
    await page.getByRole("button", { name: "Add to Included" }).click();
    await page.getByLabel("Included line 1", { exact: true }).selectOption({ label: "All meals" });
    await page.getByRole("button", { name: "Add to Not included" }).click();
    await page.getByLabel("Not included line 1 text").fill("Park fees");
    await clickNext(page);

    // Add-ons
    await page.getByRole("button", { name: "Add an add-on" }).click();
    await page.getByLabel("Add-on 1 name").fill("Hot air balloon");
    await page.getByLabel("Add-on 1 charged").selectOption("PerPerson");
    await page.getByLabel("Add-on 1 price").fill("480");
    await clickNext(page);

    // Photos
    await page
      .locator('input[type="file"]')
      .setInputFiles([photo("lawn.png"), photo("porch.png"), photo("dining-room.jpg", JPEG)]);
    const pending = page.getByRole("list", { name: "Photos to upload" }).getByRole("listitem");
    await expect(pending).toHaveCount(3);
    await pending.nth(1).getByRole("button", { name: "Make main" }).click();
    await expect(pending.first().getByRole("button", { name: "Remove porch.png" })).toBeVisible();
    await clickNext(page);

    // Review: everything is there, and nothing is missing for publishing
    const review = page.getByRole("region", { name: "Review" });
    await expect(review).toContainText("Sasaab Sunset Retreat");
    await expect(review).toContainText("2 nights, 2 adults");
    await expect(review).toContainText("1 stay");
    await expect(review).toContainText("Per person in USD, from $7,472.50");
    await expect(review).toContainText("2 lines");
    await expect(review).toContainText("1 add-on");
    await expect(review).toContainText("3 photos");
    await expect(review).not.toContainText("To publish it later");
    await createButton(page).click();

    // Land on the edit page with all of it saved
    await expect(page).toHaveURL(/\/admin\/packages\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: "Sasaab Sunset Retreat", level: 1 })).toBeVisible();
    await expect(page.locator(".pk-header")).toContainText("From $7,472.50");
    const details = await section(page, "Details");
    await expect(details.getByLabel("Summary")).toHaveValue("Two nights above the Samburu plains.");
    const pricing = await section(page, "Pricing");
    await expect(pricing.getByLabel("Priced")).toHaveValue("PerPerson");
    await expect(pricing.getByLabel("Minimum stay")).toHaveValue("1");
    const stays = await section(page, "Where you stay");
    await expect(stays.getByLabel("Stay 1 property")).toHaveValue("prop-salas-camp");
    await expect(stays.getByLabel("Stay 1 room type")).toHaveValue("Forest Tent with Pool");
    await expect((await section(page, "Season rates")).getByLabel("Rate 1 package price")).toHaveValue("7472.50");
    const included = await section(page, "What's included");
    await expect(included.getByLabel("Included line 1", { exact: true })).toHaveValue(/feat-/);
    await expect(included.getByLabel("Not included line 1 text")).toHaveValue("Park fees");
    await expect((await section(page, "Add-ons")).getByLabel("Add-on 1 name")).toHaveValue("Hot air balloon");

    // The uploaded files are served back through this app (/media is rewritten to the API).
    await editorTab(page, "Photos").click();
    const photos = page.getByRole("list", { name: "Package photos" }).getByRole("listitem");
    await expect(photos).toHaveCount(3);
    await expect(photos.first()).toContainText("Main photo");
    const src = await photos.first().locator("img").getAttribute("src");
    expect(src).toMatch(/^\/media\/packages\//);
    expect((await page.request.get(src!)).status()).toBe(200);
    await expect
      .poll(() =>
        photos
          .first()
          .locator("img")
          .evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBeGreaterThan(0);

    // It's complete, so it can go straight to published.
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.getByRole("region", { name: "Status" })).toContainText("Customers can see it on the site.");
  });

  test("Next is never disabled: it says what a step still needs, and Enter means Next", async ({ page }) => {
    await newPackageForm(page);
    // The name and destination are required, and the browser says so.
    await clickNext(page);
    await expect(stepHeading(page, "Details")).toBeVisible();
    const missing = await page
      .getByLabel("Package name")
      .evaluate((el) => (el as HTMLInputElement).validity.valueMissing);
    expect(missing).toBe(true);

    await page.getByLabel("Package name").fill("Enter Key Lodge");
    await page.getByLabel("Destination").selectOption({ label: "Masai Mara, KE" });
    await page.getByLabel("Package name").press("Enter");
    await expect(stepHeading(page, "Where you stay")).toBeVisible();
    await expect(createButton(page)).toHaveCount(0); // Enter didn't create anything

    await page.getByRole("button", { name: "Add a stay" }).click();
    await page.getByLabel("Stay 1 room type").fill("Garden Suite"); // started, but no property yet
    await expect(page.getByLabel("Stay 1 nights")).toHaveValue("2"); // the nights still to place
    await clickNext(page);
    await expect(errorNotice(page)).toContainText("Choose a property and the nights for every stay.");
    await expect(page.getByLabel("Stay 1 property")).toBeFocused();
    await expect(page.getByLabel("Stay 1 property")).toHaveAttribute("aria-invalid", "true");

    await page.getByLabel("Stay 1 property").selectOption("prop-giraffe-manor");
    await expect(page.getByLabel("Stay 1 property")).not.toHaveAttribute("aria-invalid", "true");
    await clickNext(page);
    await expect(stepHeading(page, "Pricing")).toBeVisible();
    await expect(errorNotice(page)).toHaveCount(0);
  });

  test("blank lines never block a step, and a half-filled one is pointed out", async ({ page }) => {
    await newPackageForm(page);
    await fillBasics(page, "Blank Lines");
    await goToStep(page, "What's included");

    // Lines added by a stray click and left empty are simply ignored.
    await page.getByRole("button", { name: "Add to Included" }).click();
    await page.getByRole("button", { name: "Add to Included" }).click();
    await page.getByRole("button", { name: "Add to Notes" }).click();
    await clickNext(page);
    await expect(stepHeading(page, "Add-ons")).toBeVisible();

    // Coming back, the blank lines are still there. Give one a footnote but no text.
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.getByLabel("Included line 1 footnote").fill("Served on arrival");
    await clickNext(page);
    await expect(stepHeading(page, "What's included")).toBeVisible();
    await expect(errorNotice(page)).toContainText("Every line needs some text, or a choice from the list.");
    await expect(page.getByLabel("Included line 1 text")).toBeFocused();
    await expect(page.getByLabel("Included line 1 text")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Included line 2 text")).not.toHaveAttribute("aria-invalid", "true");

    await page.getByLabel("Included line 1 text").fill("Champagne breakfast");
    await clickNext(page);
    await expect(stepHeading(page, "Add-ons")).toBeVisible();

    // Only the filled line is saved.
    await goToStep(page, "Review");
    await expect(page.getByRole("region", { name: "Review" })).toContainText("1 line");
  });

  test("earlier steps can be revisited, later ones stay locked until reached", async ({ page }) => {
    await newPackageForm(page);
    await fillBasics(page, "First Name");
    const steps = page.getByRole("navigation", { name: "Steps" });
    await expect(steps.getByRole("button", { name: /Pricing/ })).toBeDisabled();

    await goToStep(page, "Add-ons");
    await expect(steps.getByRole("button", { name: /Pricing/ })).toBeEnabled();
    await steps.getByRole("button", { name: /Basics/ }).click();
    await expect(page.getByLabel("Package name")).toHaveValue("First Name");
    await page.getByLabel("Package name").fill("Second Name");
    await goToStep(page, "Review");
    await expect(page.getByRole("region", { name: "Review" })).toContainText("Second Name");

    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(stepHeading(page, "Photos")).toBeVisible();
  });

  test("the review says what publishing will still need, and lets you jump back to fix it", async ({ page }) => {
    await newPackageForm(page);
    await fillBasics(page, "Draft Only");
    await goToStep(page, "Where you stay");
    await page.getByRole("button", { name: "Add a stay" }).click();
    await page.getByLabel("Stay 1 property").selectOption("prop-salas-camp");
    await page.getByLabel("Stay 1 nights").fill("1");
    await goToStep(page, "Review");

    const review = page.getByRole("region", { name: "Review" });
    await expect(review).toContainText("1 of 2 nights placed");
    await expect(review).toContainText("To publish it later it still needs");
    await expect(review).toContainText("A summary");
    await expect(review).toContainText("Stays that add up to 2 nights (they add up to 1)");
    await expect(review).toContainText("A USD rate");
    await expect(review).toContainText("A main photo");

    await review.getByRole("button", { name: "Change stays" }).click();
    await expect(stepHeading(page, "Where you stay")).toBeVisible();
  });

  test("turns away files that aren't JPEG, PNG or WebP, and says why", async ({ page }) => {
    await newPackageForm(page);
    await fillBasics(page, "Photo Test");
    await goToStep(page, "Photos");
    await page
      .locator('input[type="file"]')
      .setInputFiles([
        photo("lawn.png"),
        { name: "brochure.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") },
        { name: "IMG_4021.heic", mimeType: "image/heic", buffer: Buffer.from("heic") },
      ]);
    await expect(page.getByRole("list", { name: "Photos to upload" }).getByRole("listitem")).toHaveCount(1);
    await expect(errorNotice(page)).toContainText("brochure.pdf isn't a JPEG, PNG or WebP photo");
    await expect(errorNotice(page)).toContainText("IMG_4021.heic is an iPhone HEIC photo");
  });

  test("a photo can be removed before creating", async ({ page }) => {
    await newPackageForm(page);
    await fillBasics(page, "Photo Test");
    await goToStep(page, "Photos");
    await page.locator('input[type="file"]').setInputFiles([photo("a.png"), photo("b.png")]);
    const pending = page.getByRole("list", { name: "Photos to upload" }).getByRole("listitem");
    await expect(pending).toHaveCount(2);
    await pending.first().getByRole("button", { name: "Remove a.png" }).click();
    await expect(pending).toHaveCount(1);
    await goToStep(page, "Review");
    await expect(page.getByRole("region", { name: "Review" })).toContainText("1 photo");
  });

  test("a rejected upload keeps the draft, and fixing it finishes the job without a second package", async ({
    page,
  }) => {
    await newPackageForm(page);
    await fillBasics(page, "Retry Lodge Escape");
    await goToStep(page, "Photos");
    // Named like a photo and typed like one, but the bytes are text: only the API can tell.
    await page
      .locator('input[type="file"]')
      .setInputFiles([{ name: "fake.jpg", mimeType: "image/jpeg", buffer: Buffer.from("this is not an image") }]);
    await goToStep(page, "Review");
    await createButton(page).click();

    await expect(errorNotice(page)).toContainText("The draft is saved, but the photos didn't save");
    await expect(errorNotice(page)).toContainText("fake.jpg isn't a JPEG, PNG or WebP photo");
    await expect(page.getByRole("link", { name: "Open the draft" })).toBeVisible();

    // Swap the bad file for a good one and try again.
    await page
      .getByRole("navigation", { name: "Steps" })
      .getByRole("button", { name: /Photos/ })
      .click();
    await page.getByRole("button", { name: "Remove fake.jpg" }).click();
    await page.locator('input[type="file"]').setInputFiles([photo("lawn.png")]);
    await goToStep(page, "Review");
    await createButton(page).click();

    await expect(page).toHaveURL(/\/admin\/packages\/[0-9a-f-]{36}$/);
    await editorTab(page, "Photos").click();
    await expect(page.getByRole("list", { name: "Package photos" }).getByRole("listitem")).toHaveCount(1);
    await page.goto("/admin/packages");
    await expect(rows(page).filter({ hasText: "Retry Lodge Escape" })).toHaveCount(1);
  });

  test("operators can create packages too", async ({ page }) => {
    await page.context().clearCookies();
    await signIn(page, OPERATOR);
    await newPackageForm(page);
    await fillBasics(page, "Operator Made");
    await goToStep(page, "Review");
    await createButton(page).click();
    await expect(page.getByRole("heading", { name: "Operator Made", level: 1 })).toBeVisible();
  });
});

test.describe("filling in a package", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
    await openPackage(page, "Sala's Family Safari");
  });

  test("a draft can be filled in section by section and published", async ({ page }) => {
    // Summary (details)
    const details = await section(page, "Details");
    await details.getByLabel("Summary").fill("Three nights in the Mara, with game drives.");
    await details.getByRole("button", { name: "Save changes" }).click();
    await expect(details.getByRole("status")).toHaveText("Saved");
    const listing = await section(page, "Listing");
    await listing.getByLabel("Full description").fill("A longer story about the camp.");
    await listing.getByRole("button", { name: "Save changes" }).click();
    await expect(listing.getByRole("status")).toHaveText("Saved");

    // A stay
    const stays = await section(page, "Where you stay");
    await stays.getByRole("button", { name: "Add a stay" }).click();
    await stays.getByLabel("Stay 1 property").selectOption("prop-salas-camp");
    await stays.getByLabel("Stay 1 nights").fill("3");
    await stays.getByLabel("Stay 1 room type").fill("Forest Tent with Pool");
    await stays.getByRole("button", { name: "Save changes" }).click();
    await expect(stays.getByRole("status")).toHaveText("Saved");
    await expect(stays).toContainText("3 of 3 nights placed");

    // A rate, which sets the from-price
    const rates = await section(page, "Season rates");
    await rates.getByRole("button", { name: "Add a rate" }).click();
    await rates.getByLabel("Rate 1 season").selectOption("season-safari-collection-savings-2026");
    await rates.getByLabel("Rate 1 package price").fill("7,472.50");
    await rates.getByLabel("Rate 1 extra night price").fill("2500");
    await rates.getByRole("button", { name: "Save changes" }).click();
    await expect(rates.getByRole("status")).toHaveText("Saved");
    await expect(page.locator(".pk-header")).toContainText("From $7,472.50");

    // Inclusions: one of the shared lines, one of our own, one exclusion
    const included = await section(page, "What's included");
    await included.getByRole("button", { name: "Add to included" }).click();
    await included.getByLabel("Included line 1", { exact: true }).selectOption({ label: "All meals" });
    await included.getByRole("button", { name: "Add to included" }).click();
    await included.getByLabel("Included line 2 text").fill("Two game drives a day");
    await included.getByLabel("Included line 2 footnote").fill("Shared vehicle");
    await included.getByRole("button", { name: "Add to not included" }).click();
    await included.getByLabel("Not included line 1 text").fill("Park fees");
    await included.getByRole("button", { name: "Save changes" }).click();
    await expect(included.getByRole("status")).toHaveText("Saved");

    // An add-on
    const addOns = await section(page, "Add-ons");
    await addOns.getByRole("button", { name: "Add an add-on" }).click();
    await addOns.getByLabel("Add-on 1 name").fill("Hot air balloon");
    await addOns.getByLabel("Add-on 1 charged").selectOption("PerPerson");
    await addOns.getByLabel("Add-on 1 price").fill("480");
    await addOns.getByRole("button", { name: "Save changes" }).click();
    await expect(addOns.getByRole("status")).toHaveText("Saved");

    // Still no photo, so it can't go live yet
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.locator('.notice[role="alert"]', { hasText: "Still needed" })).toHaveText(/A main photo/);
    await expect(page.locator('.notice[role="alert"]', { hasText: "Still needed" })).not.toContainText("A summary");

    await section(page, "Photos");
    await page.locator('input[type="file"]').setInputFiles([photo("camp.png")]);
    await expect(page.getByRole("list", { name: "Package photos" }).getByRole("listitem")).toHaveCount(1);

    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(await section(page, "Status")).toContainText("Customers can see it on the site.");
    await expect((await section(page, "Status")).getByText("Published", { exact: true })).toBeVisible();

    // Everything survived a reload
    await page.reload();
    await expect((await section(page, "Details")).getByLabel("Summary")).toHaveValue(
      "Three nights in the Mara, with game drives.",
    );
    await expect((await section(page, "Where you stay")).getByLabel("Stay 1 room type")).toHaveValue(
      "Forest Tent with Pool",
    );
    await expect((await section(page, "Season rates")).getByLabel("Rate 1 package price")).toHaveValue("7472.50");
    await expect((await section(page, "Season rates")).getByLabel("Rate 1 extra night price")).toHaveValue("2500");
    await expect((await section(page, "What's included")).getByLabel("Included line 1", { exact: true })).toHaveValue(
      /feat-/,
    );
    await expect((await section(page, "What's included")).getByLabel("Included line 2 footnote")).toHaveValue(
      "Shared vehicle",
    );
    await expect((await section(page, "What's included")).getByLabel("Not included line 1 text")).toHaveValue(
      "Park fees",
    );
    await expect((await section(page, "Add-ons")).getByLabel("Add-on 1 name")).toHaveValue("Hot air balloon");
    await expect((await section(page, "Add-ons")).getByLabel("Add-on 1 price")).toHaveValue("480");

    // And the list shows the price
    await page.goto("/admin/packages");
    await expect(rows(page).filter({ hasText: "Sala's Family Safari" })).toContainText("$7,472.50");
  });

  test("stays that don't add up to the nights are flagged, and block publishing", async ({ page }) => {
    const stays = await section(page, "Where you stay");
    await stays.getByRole("button", { name: "Add a stay" }).click();
    await stays.getByLabel("Stay 1 property").selectOption("prop-giraffe-manor");
    await expect(stays).toContainText("3 of 3 nights placed"); // a new stay starts with the nights left
    await stays.getByLabel("Stay 1 nights").fill("1");
    await expect(stays).toContainText("1 of 3 nights placed. A package can only be published when they match.");
    await stays.getByRole("button", { name: "Save changes" }).click();
    await expect(stays.getByRole("status")).toHaveText("Saved");

    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.locator('.notice[role="alert"]', { hasText: "Still needed" })).toContainText(
      "Stays that add up to 3 nights (they add up to 1)",
    );
  });

  test("overlapping seasons are refused, with the reason", async ({ page }) => {
    const rates = await section(page, "Season rates");
    await rates.getByRole("button", { name: "Add a rate" }).click();
    await rates.getByLabel("Rate 1 season").selectOption("season-safari-collection-peak-2026");
    await rates.getByLabel("Rate 1 package price").fill("9000");
    await rates.getByRole("button", { name: "Add a rate" }).click();
    await rates.getByLabel("Rate 2 season").selectOption("season-giraffe-manor-2026");
    await rates.getByLabel("Rate 2 package price").fill("8000");
    await rates.getByRole("button", { name: "Save changes" }).click();
    await expect(errorNotice(page)).toContainText("overlap");

    // The same two seasons are fine in different currencies.
    await rates.getByLabel("Rate 2 currency").fill("EUR");
    await rates.getByRole("button", { name: "Save changes" }).click();
    await expect(rates.getByRole("status")).toHaveText("Saved");
  });

  test("a price that isn't a number is caught before anything is sent", async ({ page }) => {
    const rates = await section(page, "Season rates");
    await rates.getByRole("button", { name: "Add a rate" }).click();
    await rates.getByLabel("Rate 1 season").selectOption("season-safari-collection-peak-2026");
    await rates.getByLabel("Rate 1 package price").fill("lots");
    await expect(rates.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await expect(rates).toContainText("Every rate needs a season, a three-letter currency and a price.");
    await rates.getByLabel("Rate 1 package price").fill("9,000");
    await expect(rates.getByRole("button", { name: "Save changes" })).toBeEnabled();
  });

  test("a section's Save stays off until something in it changes", async ({ page }) => {
    const addOns = await section(page, "Add-ons");
    await expect(addOns.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await addOns.getByRole("button", { name: "Add an add-on" }).click();
    await expect(addOns.getByRole("button", { name: "Save changes" })).toBeDisabled(); // nameless
    await addOns.getByLabel("Add-on 1 name").fill("Extra bed");
    await addOns.getByLabel("Add-on 1 price").fill("90");
    await expect(addOns.getByRole("button", { name: "Save changes" })).toBeEnabled();
  });
});

test.describe("changing a published package", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
    await openPackage(page, "Sala Mara Escape");
  });

  test("an add-on can be edited, added and removed", async ({ page }) => {
    const addOns = await section(page, "Add-ons");
    await addOns.getByLabel("Add-on 1 price").fill("500");
    await addOns.getByRole("button", { name: "Add an add-on" }).click();
    await addOns.getByLabel("Add-on 2 name").fill("Airport pickup");
    await addOns.getByLabel("Add-on 2 price").fill("80");
    await addOns.getByRole("button", { name: "Save changes" }).click();
    await expect(addOns.getByRole("status")).toHaveText("Saved");

    await page.reload();
    await expect(addOns.getByLabel("Add-on 1 price")).toHaveValue("500");
    await expect(addOns.getByLabel("Add-on 2 name")).toHaveValue("Airport pickup");

    await addOns.getByRole("button", { name: "Remove add-on 2" }).click();
    await addOns.getByRole("button", { name: "Save changes" }).click();
    await expect(addOns.getByRole("status")).toHaveText("Saved");
    await page.reload();
    await expect(addOns.getByLabel("Add-on 2 name")).toHaveCount(0);
  });

  test("the from-price follows a rate change", async ({ page }) => {
    const rates = await section(page, "Season rates");
    await rates.getByLabel("Rate 1 package price").fill("8,000");
    await rates.getByRole("button", { name: "Save changes" }).click();
    await expect(rates.getByRole("status")).toHaveText("Saved");
    await expect(page.locator(".pk-header")).toContainText("From $8,000");
  });

  test("taking it off the site takes two clicks, and it can go back", async ({ page }) => {
    // Sala Mara Escape has no main photo, so it couldn't go back up. The Giraffe Manor packages do.
    await openPackage(page, "Giraffe Manor Grand Escape");
    const status = page.getByRole("region", { name: "Status" });
    await status.getByRole("button", { name: "Take off the site" }).click();
    await expect(status.getByText("Published", { exact: true })).toBeVisible(); // asked first, nothing moved yet
    await status.getByRole("button", { name: "Yes, take it off the site" }).click();
    await expect(status).toContainText("Not on the site yet.");
    await expect(status.getByRole("button", { name: "Publish", exact: true })).toBeVisible();

    await status.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(status).toContainText("Customers can see it on the site.");
  });

  test("archiving asks first, and an archived package can move back to drafts", async ({ page }) => {
    const status = page.getByRole("region", { name: "Status" });
    await status.getByRole("button", { name: "Archive" }).click();
    await status.getByRole("button", { name: "Yes, archive it" }).click();
    await expect(status).toContainText("Hidden from the site.");
    await status.getByRole("button", { name: "Move to drafts" }).click();
    await expect(status).toContainText("Not on the site yet.");
  });
});

test.describe("the package editor's tabs", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
    await openPackage(page, "Sala Mara Escape");
  });

  test("shows one part of the package at a time, in the order it is built", async ({ page }) => {
    const tabs = page.getByRole("tablist", { name: "Sections" });
    await expect(tabs.getByRole("tab")).toHaveText([
      /Details/,
      /Stays/,
      /Pricing/,
      /Included/,
      /Add-ons/,
      /Photos/,
      /Listing/,
    ]);
    await expect(editorTab(page, "Details")).toHaveAttribute("aria-selected", "true");

    // Details: only the name and facts.
    await expect(page.getByLabel("Package name")).toBeVisible();
    await expect(page.getByLabel("Minimum stay")).toBeHidden();
    await expect(page.getByLabel("Full description")).toBeHidden();
    await expect(page.getByRole("region", { name: "Where you stay" })).toBeHidden();

    // Pricing: the price rules and the rates, and the price checker that goes with them.
    await editorTab(page, "Pricing").click();
    await expect(page.getByRole("region", { name: "Pricing" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Season rates" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Check a price" })).toBeVisible();
    await expect(page.getByLabel("Package name")).toBeHidden();

    // Photos and the rest: no price checker, nothing from the other tabs.
    await editorTab(page, "Photos").click();
    await expect(page.getByRole("region", { name: "Check a price" })).toBeHidden();
    await expect(page.getByRole("region", { name: "Season rates" })).toBeHidden();

    // The status stays in view on every tab.
    await expect(page.getByRole("region", { name: "Status" })).toBeVisible();
  });

  test("the tabs show how much is in each", async ({ page }) => {
    await expect(editorTab(page, "Stays")).toContainText("1");
    await expect(editorTab(page, "Pricing")).toContainText("1");
    await expect(editorTab(page, "Add-ons")).toContainText("1");
    await expect(editorTab(page, "Included")).toContainText(/\d+/);
  });

  test("the address holds the tab, so a refresh reopens it", async ({ page }) => {
    await editorTab(page, "Included").click();
    await expect(page).toHaveURL(/tab=included/);
    await page.reload();
    await expect(editorTab(page, "Included")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("region", { name: "What's included" })).toBeVisible();

    await editorTab(page, "Details").click();
    await expect(page).not.toHaveURL(/tab=/);

    await page.goto(page.url() + "?tab=nonsense");
    await expect(editorTab(page, "Details")).toHaveAttribute("aria-selected", "true");
  });

  test("arrow keys move between the tabs", async ({ page }) => {
    await editorTab(page, "Details").focus();
    await page.keyboard.press("ArrowRight");
    await expect(editorTab(page, "Stays")).toHaveAttribute("aria-selected", "true");
    await expect(editorTab(page, "Stays")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(editorTab(page, "Listing")).toHaveAttribute("aria-selected", "true"); // wraps round
  });

  test("something typed on one tab is still there after looking at another", async ({ page }) => {
    const details = await section(page, "Details");
    await details.getByLabel("Tagline").fill("A half-written tagline");
    await expect(details.getByRole("button", { name: "Save changes" })).toBeEnabled();
    await expect(details).toContainText("Unsaved changes");

    await editorTab(page, "Stays").click();
    await editorTab(page, "Photos").click();
    await editorTab(page, "Details").click();

    await expect(details.getByLabel("Tagline")).toHaveValue("A half-written tagline");
    await expect(details.getByRole("button", { name: "Save changes" })).toBeEnabled();
  });

  test("each tab saves only its own fields", async ({ page }) => {
    const pricing = await section(page, "Pricing");
    await pricing.getByLabel("Minimum stay").fill("1");
    await pricing.getByRole("button", { name: "Save changes" }).click();
    await expect(pricing.getByRole("status")).toHaveText("Saved");

    const listing = await section(page, "Listing");
    await listing.getByLabel("Page title").fill("Sala Mara Escape, Masai Mara");
    await listing.getByRole("button", { name: "Save changes" }).click();
    await expect(listing.getByRole("status")).toHaveText("Saved");

    await page.reload();
    await expect(editorTab(page, "Listing")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByLabel("Page title")).toHaveValue("Sala Mara Escape, Masai Mara");
    await editorTab(page, "Pricing").click();
    await expect(page.getByLabel("Minimum stay")).toHaveValue("1");
    await editorTab(page, "Details").click();
    await expect(page.getByLabel("Package name")).toHaveValue("Sala Mara Escape"); // untouched
  });

  test("a published package has no checklist", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Ready to publish" })).toHaveCount(0);
  });
});

test.describe("a draft's checklist", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
    await openPackage(page, "Sala's Family Safari");
  });

  test("lists what is missing, and each item opens the tab where it is fixed", async ({ page }) => {
    const ready = page.getByRole("region", { name: "Ready to publish" });
    await expect(ready).toContainText("5 still needed");

    await ready.getByRole("button", { name: "At least one stay" }).click();
    await expect(editorTab(page, "Stays")).toHaveAttribute("aria-selected", "true");
    await ready.getByRole("button", { name: /rate/ }).click();
    await expect(editorTab(page, "Pricing")).toHaveAttribute("aria-selected", "true");
    await ready.getByRole("button", { name: "A main photo" }).click();
    await expect(editorTab(page, "Photos")).toHaveAttribute("aria-selected", "true");
  });

  test("ticks items off as they are done", async ({ page }) => {
    const ready = page.getByRole("region", { name: "Ready to publish" });
    const details = await section(page, "Details");
    await details.getByLabel("Summary").fill("Three nights in the Mara.");
    await details.getByRole("button", { name: "Save changes" }).click();
    await expect(details.getByRole("status")).toHaveText("Saved");

    await expect(ready).toContainText("4 still needed");
    await expect(ready.getByRole("button", { name: "A summary" })).toHaveCount(0);
    await expect(ready.getByText("A summary")).toBeVisible();
  });
});

test.describe("managing a package's photos", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
    await openPackage(page, "Sala's Family Safari");
    await editorTab(page, "Photos").click();
  });

  const tiles = (page: Page) => page.getByRole("list", { name: "Package photos" }).getByRole("listitem");

  test("adds photos: the first becomes the main one, later ones join the gallery", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles([photo("one.png"), photo("two.png")]);
    await expect(tiles(page)).toHaveCount(2);
    await expect(tiles(page).first()).toContainText("Main photo");
    await expect(tiles(page).nth(1)).not.toContainText("Main photo");

    await page.locator('input[type="file"]').setInputFiles([photo("three.png")]);
    await expect(tiles(page)).toHaveCount(3);
    await expect(page.getByText("Main photo", { exact: true })).toHaveCount(1);

    // The photos survive a reload.
    await page.reload();
    await expect(tiles(page)).toHaveCount(3);
  });

  test("makes another photo the main one", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles([photo("one.png"), photo("two.png"), photo("three.png")]);
    await expect(tiles(page)).toHaveCount(3);

    await tiles(page).nth(2).getByRole("button", { name: "Make main" }).click();
    await expect(tiles(page).first()).toContainText("Main photo");
    await expect(page.getByText("Main photo", { exact: true })).toHaveCount(1);
    await expect(tiles(page).first().locator("img")).toHaveAttribute("alt", "three");
  });

  test("reorders photos", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles([photo("one.png"), photo("two.png"), photo("three.png")]);
    await expect(tiles(page)).toHaveCount(3);
    const alts = () =>
      tiles(page)
        .locator("img")
        .evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt")));

    await expect(tiles(page).first().getByRole("button", { name: "Move photo 1 earlier" })).toBeDisabled();
    await tiles(page).nth(2).getByRole("button", { name: "Move photo 3 earlier" }).click();
    await expect.poll(alts).toEqual(["one", "three", "two"]);
    await page.reload();
    await expect.poll(alts).toEqual(["one", "three", "two"]);
  });

  test("removing takes two clicks, and removing the main photo promotes the next", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles([photo("one.png"), photo("two.png")]);
    await expect(tiles(page)).toHaveCount(2);

    await tiles(page).first().getByRole("button", { name: "Remove photo 1" }).click();
    await expect(tiles(page)).toHaveCount(2); // asked first, nothing removed yet
    await tiles(page).first().getByRole("button", { name: "Remove it" }).click();

    await expect(tiles(page)).toHaveCount(1);
    await expect(tiles(page).first()).toContainText("Main photo");
    await expect(tiles(page).first().locator("img")).toHaveAttribute("alt", "two");
  });

  test("a rejected photo changes nothing", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles([photo("one.png")]);
    await expect(tiles(page)).toHaveCount(1);
    await page
      .locator('input[type="file"]')
      .setInputFiles([
        photo("two.png"),
        { name: "fake.png", mimeType: "image/png", buffer: Buffer.from("not an image at all") },
      ]);
    await expect(errorNotice(page)).toContainText("fake.png isn't a JPEG, PNG or WebP photo");
    await expect(tiles(page)).toHaveCount(1);
  });
});

test("operators can browse packages too", async ({ page }) => {
  await signIn(page, OPERATOR);
  await openList(page);
  await expect(rows(page)).toHaveCount(ALL);
});
