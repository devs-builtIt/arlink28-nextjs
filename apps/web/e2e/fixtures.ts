import { test as base, expect, type Page } from "@playwright/test";

// Test-only accounts served by e2e/mock-api.mjs (same values as there).
export const SUPER_ADMIN = { username: "anna_bello", password: "Runway-2026" };
export const OPERATOR = { username: "kwame_mensah", password: "Taxiway-2026" };

const MOCK_API = "http://localhost:5399";

/**
 * Our error notice. Not getByRole("alert"): Next.js adds its own (empty)
 * role="alert" route announcer to every page.
 */
export const errorNotice = (page: Page) => page.locator('.notice[role="alert"]');

export async function signIn(page: Page, who: { username: string; password: string }) {
  await page.goto("/admin/login");
  await page.getByLabel("Username").fill(who.username);
  await page.getByLabel("Password").fill(who.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

/** Every test starts from the mock API's seed data. */
export const test = base.extend<{ resetApi: void }>({
  resetApi: [
    async ({ request }, use) => {
      await request.post(`${MOCK_API}/__reset`);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
