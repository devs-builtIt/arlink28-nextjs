import { test, expect } from "./fixtures";

// Search engines read the HTTP status, not the words on the page. A package, flight, hotel or visa that does not
// exist must answer 404 (a "soft 404" is a 200 that says "not found"), and a normal page must stay 200.
// These routes each have a loading.tsx above them, which starts the response before the page can say "missing".

const MISSING = [
  ["/packages/no-such-package", "This package isn't available", "See all packages"],
  ["/flights/no-such-flight", "This flight isn't available", "See all flights"],
  ["/hotels/no-such-hotel", "This hotel isn't available", "See all hotels"],
  ["/visas/no-such-visa", "This visa isn't available", "See all visas"],
] as const;

test.describe("missing listings answer 404", () => {
  for (const [path, heading, link] of MISSING) {
    test(`${path} is a real 404 that still explains itself`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page.getByRole("link", { name: link })).toBeVisible();
    });

    test(`${path} asks search engines not to index it`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    });
  }

  test("an unknown page elsewhere on the site is still a 404", async ({ page }) => {
    expect((await page.goto("/no-such-page"))?.status()).toBe(404);
  });
});

test.describe("existing listings are unaffected", () => {
  for (const path of [
    "/packages/sala-mara-escape",
    "/flights/nairobi-to-zanzibar",
    "/packages",
    "/flights",
    "/destinations",
  ]) {
    test(`${path} answers 200`, async ({ page }) => {
      expect((await page.goto(path))?.status()).toBe(200);
    });
  }

  test("a listing opened at the wrong kind's address is still redirected permanently to its own", async ({
    request,
  }) => {
    const wrongKind = await request.get("/packages/nairobi-to-zanzibar", { maxRedirects: 0 });
    expect(wrongKind.status()).toBe(308);
    expect(wrongKind.headers()["location"]).toMatch(/\/flights\/nairobi-to-zanzibar$/);

    const other = await request.get("/flights/sala-mara-escape", { maxRedirects: 0 });
    expect(other.status()).toBe(308);
    expect(other.headers()["location"]).toMatch(/\/packages\/sala-mara-escape$/);
  });
});
