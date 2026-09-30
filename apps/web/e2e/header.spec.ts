import { test, expect, signIn, SUPER_ADMIN } from "./fixtures";

test.describe("getting to the portal from the public site", () => {
  test("the header's Sign in button opens the staff sign-in", async ({ page }) => {
    await page.goto("/");
    await page.locator("#header-signin-btn").click();

    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in", level: 1 })).toBeVisible();
  });

  test("signed-in staff go straight to the overview", async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
    await page.goto("/");
    await page.locator("#header-signin-btn").click();
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
  });
});
