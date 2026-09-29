import { test, expect, signIn, SUPER_ADMIN } from "./fixtures";

test.describe("on a phone", () => {
  test("the menu opens as a drawer, navigates, and closes", async ({ page }) => {
    await signIn(page, SUPER_ADMIN);

    const nav = page.getByRole("navigation", { name: "Admin" });
    const menu = page.getByRole("button", { name: "Menu" });
    await expect(nav).not.toBeInViewport();

    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(nav).toBeInViewport();

    await nav.getByRole("link", { name: "Staff" }).click();
    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(nav).not.toBeInViewport();
  });

  test("Escape closes the menu", async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
    const menu = page.getByRole("button", { name: "Menu" });
    await menu.click();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  });

  test("pages don't scroll sideways", async ({ page }) => {
    for (const path of ["/admin/login", "/admin/reset-password/request"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await signIn(page, SUPER_ADMIN);
    for (const path of ["/admin/dashboard", "/admin/users/invite", "/admin/change-password"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});
