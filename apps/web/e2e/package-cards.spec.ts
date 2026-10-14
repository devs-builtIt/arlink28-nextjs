import { test, expect, signIn, SUPER_ADMIN } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await signIn(page, SUPER_ADMIN);
  await page.goto("/admin/packages");
});

const card = (page: import("@playwright/test").Page, title: string) =>
  page.getByRole("article").filter({ hasText: title });

test.describe("package cards", () => {
  test("show every listing as a card by default, and what each one is missing", async ({ page }) => {
    await expect(page.getByRole("article")).toHaveCount(11);
    const draft = card(page, "Sala's Family Safari");
    await expect(draft).toContainText("Draft");
    await expect(draft.getByRole("list", { name: "Missing" })).toContainText("No price");
    await expect(card(page, "Giraffe Manor Grand Escape").getByRole("list", { name: "Missing" })).toHaveCount(0);
  });

  test("publishing a draft that isn't ready says what is still needed", async ({ page }) => {
    const draft = card(page, "Sala's Family Safari");
    await draft.getByRole("button", { name: "Publish" }).click();
    await expect(draft.getByRole("alert")).toContainText("Not ready to publish");
    await expect(draft).toContainText("Draft");
  });

  test("taking a listing off the site asks twice, then moves it to drafts", async ({ page }) => {
    const live = card(page, "Giraffe Manor Grand Escape");
    await live.getByRole("button", { name: "Take off" }).click();
    await expect(live.getByRole("button", { name: "Sure?" })).toBeVisible();
    await live.getByRole("button", { name: "Sure?" }).first().click();
    await expect(card(page, "Giraffe Manor Grand Escape")).toContainText("Draft");
  });

  test("archiving asks twice, and clicking away cancels", async ({ page }) => {
    const live = card(page, "Giraffe Manor Grand Escape");
    await live.getByRole("button", { name: "Archive" }).click();
    await expect(live.getByRole("button", { name: "Sure?" })).toBeVisible();
    await page.getByRole("heading", { name: "Packages", level: 1 }).click();
    await expect(live.getByRole("button", { name: "Archive" })).toBeVisible();
    await expect(live).toContainText("Published");
  });

  test("Edit opens the editor, and the list view is one click away", async ({ page }) => {
    await card(page, "Giraffe Manor Grand Escape").getByRole("link", { name: /^Edit/ }).click();
    await expect(page.getByRole("heading", { name: "Giraffe Manor Grand Escape", level: 1 })).toBeVisible();
    await page.goBack();
    await page.getByRole("button", { name: "List" }).click();
    await expect(page.getByRole("table")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("table")).toBeVisible(); // remembered in this browser
  });
});

test.describe("row menus in the list", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("arlink-packages-view", "list"));
    await page.goto("/admin/packages");
    await expect(page.getByRole("table")).toBeVisible();
  });

  const row = (page: import("@playwright/test").Page, title: string) =>
    page.getByRole("row").filter({ hasText: title });

  test("the three dots open a menu without opening the listing", async ({ page }) => {
    await row(page, "Giraffe Manor Grand Escape")
      .getByRole("button", { name: /^Actions for/ })
      .click();
    await expect(page).toHaveURL(/\/admin\/packages$/);
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem")).toHaveText(["Edit", "Take off the site", "Archive"]);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
  });

  test("a draft offers Publish, and says what it still needs", async ({ page }) => {
    await row(page, "Sala's Family Safari")
      .getByRole("button", { name: /^Actions for/ })
      .click();
    await page.getByRole("menuitem", { name: "Publish" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Not ready to publish" })).toBeVisible();
  });

  test("taking a listing off the site asks twice", async ({ page }) => {
    await row(page, "Giraffe Manor Grand Escape")
      .getByRole("button", { name: /^Actions for/ })
      .click();
    await page.getByRole("menuitem", { name: "Take off the site" }).click();
    await page.getByRole("menuitem", { name: "Sure?" }).click();
    await expect(row(page, "Giraffe Manor Grand Escape")).toContainText("Draft");
  });

  test("Edit opens the editor", async ({ page }) => {
    await row(page, "Giraffe Manor Grand Escape")
      .getByRole("button", { name: /^Actions for/ })
      .click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(page.getByRole("heading", { name: "Giraffe Manor Grand Escape", level: 1 })).toBeVisible();
  });
});
