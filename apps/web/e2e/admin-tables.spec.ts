import { test, expect, SUPER_ADMIN, signIn } from "./fixtures";

// A table in the admin never makes its card (or the page) scroll sideways: columns drop out on a mid-size
// screen, and on a phone each row becomes a small card.
test("admin tables fit without scrolling sideways", async ({ page }) => {
  test.setTimeout(240_000);
  await page.addInitScript(() => localStorage.setItem("arlink-packages-view", "list"));
  await signIn(page, SUPER_ADMIN);
  for (const width of [1440, 1100, 900, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/admin/dashboard",
      "/admin/packages",
      "/admin/enquiries",
      "/admin/destinations",
      "/admin/users",
    ]) {
      await page.goto(path);
      await expect(page.getByRole("table").first()).toBeAttached();
      const over = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        tables: [...document.querySelectorAll(".pk-table-scroll, .dv-table-wrap, .table-wrap")].map(
          (e) => e.scrollWidth - e.clientWidth,
        ),
      }));
      expect(over.page, `${path} at ${width}`).toBeLessThanOrEqual(0);
      for (const t of over.tables) expect(t, `${path} at ${width}`).toBeLessThanOrEqual(1);
    }
  }
});
