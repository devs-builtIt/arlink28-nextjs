import { test, expect, signIn, errorNotice, SUPER_ADMIN } from "./fixtures";
import type { Page } from "@playwright/test";

// The destinations console. The mock API starts with 9 destinations (data/destinations.json plus the
// catalogue's three): 7 published and 2 drafts (Moremi Game Reserve, Egypt). Masai Mara has packages.

const rows = (page: Page) => page.locator("table.packages tbody tr");
const JPEG = {
  name: "falls.jpg",
  mimeType: "image/jpeg",
  buffer: Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(60)]),
};
const jpeg = (name: string) => ({ ...JPEG, name });

const editorTab = (page: Page, name: string) => page.getByRole("tab", { name: new RegExp(`^${name}`) });
async function openTab(page: Page, name: string) {
  const tab = editorTab(page, name);
  if ((await tab.getAttribute("aria-selected")) !== "true") await tab.click();
}

async function openList(page: Page) {
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Destinations" }).click();
  await expect(page).toHaveURL(/\/admin\/destinations$/);
}

async function openDestination(page: Page, name: string) {
  await page.goto("/admin/destinations");
  await rows(page).filter({ hasText: name }).first().getByRole("link", { name }).click();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
}

/** Creates a draft the way staff do: New destination, then the form. Lands on its editor. */
async function createPlace(page: Page, country: string, name: string) {
  await page.goto("/admin/destinations/new");
  await page.getByLabel("Country", { exact: true }).selectOption({ label: country });
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
}

test.describe("the destinations list", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
    await openList(page);
  });

  test("shows every destination with its status, and the counts per status", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Destinations", level: 1 })).toBeVisible();
    await expect(rows(page)).toHaveCount(9);
    await expect(page.getByRole("tab", { name: /^All\s*9$/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Published\s*7$/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Draft\s*2$/ })).toBeVisible();

    const botswana = rows(page).filter({ hasText: "Botswana" }).first();
    await expect(botswana).toContainText("Country");
    await expect(botswana).toContainText("3 places"); // drafts count: this is the staff view

    const chobe = rows(page).filter({ hasText: "Chobe National Park" });
    await expect(chobe).toContainText("Published");
    await expect(chobe).toContainText("Place");
    await expect(chobe).toContainText("2 attractions");
    await expect(chobe).toContainText("/chobe-national-park");

    await expect(rows(page).filter({ hasText: "Moremi Game Reserve" })).toContainText("Draft");
  });

  test("filters by status, country and kind, and searches by name", async ({ page }) => {
    await page.getByRole("tab", { name: /^Draft/ }).click();
    await expect(rows(page)).toHaveCount(2);
    await page.getByRole("tab", { name: /^All/ }).click();

    await page.getByRole("combobox", { name: "Country" }).selectOption({ label: "Botswana" });
    await expect(rows(page)).toHaveCount(4);
    await page.getByRole("combobox", { name: "Kind" }).selectOption({ label: "Countries" });
    await expect(rows(page)).toHaveCount(1);
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(rows(page)).toHaveCount(9);

    await page.getByRole("searchbox", { name: "Search destinations" }).fill("okavango");
    await expect(rows(page)).toHaveCount(1);
    await expect(page).toHaveURL(/q=okavango/);
    await page.getByRole("searchbox", { name: "Search destinations" }).fill("zzz");
    await expect(page.getByRole("heading", { name: "No destinations found" })).toBeVisible();
  });
});

test.describe("creating a destination", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
  });

  test("adds a country as a draft and lands on its editor", async ({ page }) => {
    await page.goto("/admin/destinations/new");
    await page.getByRole("radio", { name: /A country/ }).check();
    await page.getByLabel("Country", { exact: true }).selectOption({ label: "Zambia" });
    await page.getByLabel("Name", { exact: true }).fill("Zambia");
    await page.getByRole("button", { name: "Create draft" }).click();

    await expect(page.getByRole("heading", { name: "Zambia", level: 1 })).toBeVisible();
    await expect(page.getByText("Country", { exact: true }).first()).toBeVisible();
    await expect(page.locator(".pk-meta").getByText("/zambia", { exact: true })).toBeVisible();
    await expect(page.locator(".pk-heading").getByText("Draft")).toBeVisible();
    await expect(editorTab(page, "Places")).toBeVisible(); // only a country has places
  });

  test("a place is added inside a country, from the country's own page", async ({ page }) => {
    await openDestination(page, "Botswana");
    await openTab(page, "Places");
    const places = page.getByRole("list", { name: "Places" });
    await expect(places.getByRole("listitem")).toHaveCount(3);
    await page.getByRole("link", { name: "Add a place in Botswana" }).click();

    await expect(page.getByLabel("Country", { exact: true })).toHaveValue(/.+/); // Botswana is already chosen
    await page.getByLabel("Name", { exact: true }).fill("Tsodilo Hills");
    await page.getByRole("button", { name: "Create draft" }).click();

    await expect(page.getByRole("heading", { name: "Tsodilo Hills", level: 1 })).toBeVisible();
    await expect(page.getByText("Place in Botswana")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("listitem")).toHaveText([
      "Destinations",
      "Botswana",
      "Tsodilo Hills",
    ]);
  });

  test("a name that is already taken gets a numbered address", async ({ page }) => {
    await createPlace(page, "Botswana", "Chobe National Park");
    await expect(page.locator(".pk-meta").getByText("/chobe-national-park-2", { exact: true })).toBeVisible();
  });

  test("the form needs a country and a name before it will go", async ({ page }) => {
    await page.goto("/admin/destinations/new");
    const create = page.getByRole("button", { name: "Create draft" });
    await expect(create).toBeDisabled();
    await page.getByLabel("Name", { exact: true }).fill("Somewhere");
    await expect(create).toBeDisabled(); // still no country
    await page.getByLabel("Country", { exact: true }).selectOption({ label: "Botswana" });
    await expect(create).toBeEnabled();
  });
});

test.describe("editing a destination", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
  });

  test("saves the details and keeps them after a reload", async ({ page }) => {
    await createPlace(page, "Botswana", "Tsodilo Hills");
    const details = page.getByRole("region", { name: "Details", exact: true });
    const save = details.getByRole("button", { name: "Save changes" });
    await expect(save).toBeDisabled(); // nothing has changed yet

    await details.getByLabel("Tagline").fill("Rock art in the Kalahari");
    await details.getByLabel("Summary").fill("Four thousand paintings on a few hills in the desert.");
    await save.click();
    await expect(details.getByText("Saved")).toBeVisible();

    const story = page.getByRole("region", { name: "Write-up" });
    await story.getByLabel("Best time to visit").fill("April to October");
    await story.getByRole("button", { name: "Save changes" }).click();
    await expect(story.getByText("Saved")).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Tagline")).toHaveValue("Rock art in the Kalahari");
    await expect(page.getByLabel("Best time to visit")).toHaveValue("April to October");
  });

  test("a bad address or coordinate is stopped before it is sent", async ({ page }) => {
    await createPlace(page, "Botswana", "Tsodilo Hills");
    const details = page.getByRole("region", { name: "Details", exact: true });
    await details.getByLabel("Page address").fill("Not A Slug");
    await expect(details.getByText("lowercase letters, numbers and single hyphens")).toBeVisible();
    await expect(details.getByRole("button", { name: "Save changes" })).toBeDisabled();

    const position = page.getByRole("region", { name: "Position and order" });
    await position.getByLabel("Latitude").fill("120");
    await expect(position.getByText("Latitude is a number from -90 to 90.")).toBeVisible();
    await expect(position.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  test("an address already in use is refused, in the page's own words", async ({ page }) => {
    await createPlace(page, "Botswana", "Tsodilo Hills");
    const details = page.getByRole("region", { name: "Details", exact: true });
    await details.getByLabel("Page address").fill("okavango-delta");
    await details.getByRole("button", { name: "Save changes" }).click();
    await expect(errorNotice(page)).toContainText("already used by another destination");
  });

  test("the address of a published destination is locked", async ({ page }) => {
    await openDestination(page, "Chobe National Park");
    const slug = page.getByLabel("Page address");
    await expect(slug).toBeDisabled();
    await expect(page.getByText("so the address can't change")).toBeVisible();
  });

  test("the tab is held in the address, so a reload opens the same one", async ({ page }) => {
    await openDestination(page, "Chobe National Park");
    await openTab(page, "Things to do");
    await expect(page).toHaveURL(/tab=attractions/);
    await page.reload();
    await expect(editorTab(page, "Things to do")).toHaveAttribute("aria-selected", "true");
  });
});

test.describe("photos and things to do", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
  });

  test("uploads the main photo with its words, and a replacement starts with a blank credit", async ({ page }) => {
    await createPlace(page, "Botswana", "Tsodilo Hills");
    await openTab(page, "Photo");
    const hero = page.getByRole("region", { name: "Main photo" });
    await expect(hero.getByText("No main photo yet")).toBeVisible();

    await hero.locator('input[type="file"]').setInputFiles(JPEG);
    await expect(hero.getByText("falls.jpg isn't saved yet")).toBeVisible();
    await hero.getByLabel("Describe the photo").fill("White hills in the desert");
    await hero.getByLabel("Photo credit").fill("Photo by A. Photographer on Unsplash");
    await hero.getByRole("button", { name: "Upload photo" }).click();
    await expect(hero.getByRole("img", { name: "White hills in the desert" })).toBeVisible();
    await expect(hero.getByLabel("Photo credit")).toHaveValue("Photo by A. Photographer on Unsplash");

    // A new file starts afresh: the old credit belongs to the old picture.
    await hero.locator('input[type="file"]').setInputFiles(jpeg("second.jpg"));
    await expect(hero.getByLabel("Photo credit")).toHaveValue("");
    await expect(hero.getByLabel("Describe the photo")).toHaveValue("");
    await hero.getByRole("button", { name: "Cancel" }).click();
    await expect(hero.getByLabel("Photo credit")).toHaveValue("Photo by A. Photographer on Unsplash");
  });

  test("the saved alt text and credit can be edited without a new photo", async ({ page }) => {
    await openDestination(page, "Chobe National Park");
    await openTab(page, "Photo");
    const hero = page.getByRole("region", { name: "Main photo" });
    const save = hero.getByRole("button", { name: "Save text" });
    await expect(save).toBeDisabled();
    await hero.getByLabel("Photo credit").fill("Photo by R. Ashman");
    await save.click();
    await expect(hero.getByText("Saved")).toBeVisible();
    await page.reload();
    await openTab(page, "Photo");
    await expect(page.getByRole("region", { name: "Main photo" }).getByLabel("Photo credit")).toHaveValue(
      "Photo by R. Ashman",
    );
  });

  test("refuses a file that is not a photo", async ({ page }) => {
    await createPlace(page, "Botswana", "Tsodilo Hills");
    await openTab(page, "Photo");
    const hero = page.getByRole("region", { name: "Main photo" });
    await hero
      .locator('input[type="file"]')
      .setInputFiles({ name: "brochure.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
    await expect(errorNotice(page)).toContainText("brochure.pdf isn't a JPEG, PNG or WebP photo");
    await expect(hero.getByRole("button", { name: "Upload photo" })).toHaveCount(0);
  });

  test("attractions are added, reordered, saved, and keep their order", async ({ page }) => {
    await createPlace(page, "Botswana", "Tsodilo Hills");
    await openTab(page, "Things to do");
    const things = page.getByRole("region", { name: "Things to do" });
    await expect(things.getByText("No attractions yet")).toBeVisible();

    await things.getByRole("button", { name: "Add an attraction" }).click();
    await things.getByRole("button", { name: "Add an attraction" }).click();
    const names = things.getByLabel("Name", { exact: true });
    await names.nth(0).fill("Male Hill");
    await names.nth(1).fill("Rhino Trail");
    await expect(things.getByText("Save the list first, then you can add a photo.").first()).toBeVisible();

    await things.getByRole("button", { name: "Move Rhino Trail earlier" }).click();
    await things.getByRole("button", { name: "Save attractions" }).click();
    await expect(things.getByText("Saved")).toBeVisible();
    await expect(editorTab(page, "Things to do")).toContainText("2");

    await page.reload();
    const reloaded = page.getByRole("region", { name: "Things to do" }).getByLabel("Name", { exact: true });
    await expect(reloaded.first()).toHaveValue("Rhino Trail");
    await expect(reloaded.nth(1)).toHaveValue("Male Hill");
  });

  test("an attraction with no name cannot be saved", async ({ page }) => {
    await createPlace(page, "Botswana", "Tsodilo Hills");
    await openTab(page, "Things to do");
    const things = page.getByRole("region", { name: "Things to do" });
    await things.getByRole("button", { name: "Add an attraction" }).click();
    await expect(things.getByText("Every attraction needs a name.")).toBeVisible();
    await expect(things.getByRole("button", { name: "Save attractions" })).toBeDisabled();
  });

  test("a saved attraction takes a photo, and removing it deletes the row", async ({ page }) => {
    await createPlace(page, "Botswana", "Tsodilo Hills");
    await openTab(page, "Things to do");
    const things = page.getByRole("region", { name: "Things to do" });
    await things.getByRole("button", { name: "Add an attraction" }).click();
    await things.getByLabel("Name", { exact: true }).fill("Male Hill");
    await things.getByRole("button", { name: "Save attractions" }).click();
    await expect(things.getByText("Saved")).toBeVisible();

    await things.locator('input[type="file"]').setInputFiles(JPEG);
    await expect(things.getByRole("img", { name: "Male Hill" })).toBeVisible();
    await things.getByLabel("Photo credit").fill("Photo by A. Photographer");
    await things.getByRole("button", { name: "Save attractions" }).click();
    await expect(things.getByText("Saved")).toBeVisible();

    await things.getByRole("button", { name: "Remove Male Hill" }).click();
    await expect(things.getByText("No attractions yet")).toBeVisible();
    await things.getByRole("button", { name: "Save attractions" }).click();
    await expect(things.getByText("Saved")).toBeVisible();
  });
});

test.describe("publishing", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
  });

  test("says what is missing, then publishes once it is all in, and the page goes live", async ({ page }) => {
    await createPlace(page, "Botswana", "Tsodilo Hills");
    const ready = page.getByRole("region", { name: "Ready to publish" });
    await expect(ready).toContainText("3 still needed");

    await page.getByRole("button", { name: "Publish", exact: true }).click();
    const alert = page.getByRole("alert").filter({ hasText: "Not ready to publish" });
    await expect(alert).toContainText("A hero photo");
    await expect(alert).toContainText("A summary");
    await expect(alert).toContainText("At least one attraction");

    // Fix each one, from the checklist's own links.
    await ready.getByRole("button", { name: "A summary" }).click();
    await page.getByLabel("Summary").fill("Four thousand paintings on a few hills in the desert.");
    await page
      .getByRole("region", { name: "Details", exact: true })
      .getByRole("button", { name: "Save changes" })
      .click();
    await expect(ready).toContainText("2 still needed");

    await ready.getByRole("button", { name: "A hero photo" }).click();
    await page.getByRole("region", { name: "Main photo" }).locator('input[type="file"]').setInputFiles(JPEG);
    await page.getByRole("button", { name: "Upload photo" }).click();
    await expect(ready).toContainText("1 still needed");

    await ready.getByRole("button", { name: "At least one attraction" }).click();
    const things = page.getByRole("region", { name: "Things to do" });
    await things.getByRole("button", { name: "Add an attraction" }).click();
    await things.getByLabel("Name", { exact: true }).fill("Male Hill");
    await things.getByRole("button", { name: "Save attractions" }).click();
    await expect(things.getByText("Saved")).toBeVisible();
    await expect(ready).toContainText("Everything needed is in");

    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.locator(".pk-heading").getByText("Published")).toBeVisible();
    await expect(page.getByRole("region", { name: "Ready to publish" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "View on the site" })).toHaveAttribute(
      "href",
      "/destinations/tsodilo-hills",
    );

    // It is on the public site now, and its address is locked.
    await page.goto("/destinations/tsodilo-hills");
    await expect(page.getByRole("heading", { name: "Tsodilo Hills", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Male Hill" })).toBeVisible();
  });

  test("taking it off the site asks first and returns it to draft", async ({ page }) => {
    await openDestination(page, "Chobe National Park");
    await page.getByRole("button", { name: "Take off the site" }).click();
    await page.getByRole("button", { name: "Yes, take it off the site" }).click();
    await expect(page.locator(".pk-heading").getByText("Draft")).toBeVisible();
    // Unpublishing does not unlock the address: shared links must keep working if it comes back.
    await expect(page.getByLabel("Page address")).toBeDisabled();
  });

  test("a country needs a published place before it can go live", async ({ page }) => {
    await page.goto("/admin/destinations/new");
    await page.getByRole("radio", { name: /A country/ }).check();
    await page.getByLabel("Country", { exact: true }).selectOption({ label: "Zambia" });
    await page.getByLabel("Name", { exact: true }).fill("Zambia");
    await page.getByRole("button", { name: "Create draft" }).click();
    await expect(page.getByRole("heading", { name: "Zambia", level: 1 })).toBeVisible();

    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Not ready to publish" })).toContainText(
      "At least one published place",
    );
  });
});

test.describe("deleting", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
  });

  test("a draft nothing uses is deleted after a confirmation, and leaves the list", async ({ page }) => {
    await createPlace(page, "Botswana", "Tsodilo Hills");
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Its photos are deleted too")).toBeVisible();
    await page.getByRole("button", { name: "Yes, delete it" }).click();
    await expect(page).toHaveURL(/\/admin\/destinations$/);
    await expect(rows(page).filter({ hasText: "Tsodilo Hills" })).toHaveCount(0);
    await expect(rows(page)).toHaveCount(9);
  });

  test("a destination that packages use says so and stays", async ({ page }) => {
    await openDestination(page, "Masai Mara");
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Yes, delete it" }).click();
    await expect(errorNotice(page)).toContainText("Packages still use Masai Mara");
    await expect(page.getByRole("heading", { name: "Masai Mara", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "See them" })).toHaveAttribute(
      "href",
      "/admin/packages?destination=masai-mara",
    );
  });

  test("a country with places inside it cannot be deleted", async ({ page }) => {
    await openDestination(page, "Botswana");
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Yes, delete it" }).click();
    await expect(errorNotice(page)).toContainText("still has 3 place(s) inside it");
  });
});

test.describe("access and small screens", () => {
  test("is for signed-in staff only", async ({ page }) => {
    await page.goto("/admin/destinations");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("the list and the editor do not scroll sideways on a phone", async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/admin/destinations");
    await expect(page.getByRole("heading", { name: "Destinations", level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.goto("/admin/destinations/new");
    await expect(page.getByRole("heading", { name: "New destination", level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
