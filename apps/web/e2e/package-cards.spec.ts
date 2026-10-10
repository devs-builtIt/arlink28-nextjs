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
