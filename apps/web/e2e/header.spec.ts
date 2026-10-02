import { test, expect, signIn, SUPER_ADMIN } from "./fixtures";

test.describe("getting to the portal from the public site", () => {
  test("the footer's Staff sign in link opens the staff sign-in", async ({ page }) => {
    await page.goto("/");
    await page.locator("#footer-signin").click();

    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in", level: 1 })).toBeVisible();
  });

  test("signed-in staff go straight to the overview", async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
    await page.goto("/");
    await page.locator("#footer-signin").click();
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
  });

  test("Essentials opens the company links, and Elite Jets has its own page", async ({ page }) => {
    await page.goto("/");
    const main = page.getByRole("navigation", { name: "Main" });
    await main.getByRole("button", { name: "Essentials" }).click();
    for (const name of ["About us", "Team", "Blogs", "Contact"]) {
      await expect(main.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await expect(main.getByRole("link", { name: /^Blogs/ })).toHaveCount(0);

    await main.getByRole("button", { name: "Essentials" }).click();
    await main.getByRole("link", { name: /^Blogs/ }).click();
    await expect(page).toHaveURL(/\/blogs$/);
    await expect(page.getByRole("heading", { name: "Blogs", level: 1 })).toBeVisible();

    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Elite Jets" }).click();
    await expect(page).toHaveURL(/\/elite-jets$/);
    await expect(page.getByRole("heading", { name: "Elite Jets", level: 1 })).toBeVisible();
  });
});
