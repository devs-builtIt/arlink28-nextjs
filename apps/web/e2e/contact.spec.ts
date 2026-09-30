import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

// The contact page and the enquiry form. Enquiries go to the mock API, which follows the real API's rules.

const form = (page: Page) => page.getByRole("form", { name: "Enquiry form" });
const inYears = (n: number) => `${new Date().getFullYear() + n}-01-12`;

async function fillGuest(page: Page) {
  await form(page).getByLabel("Your name").fill("Jane Doe");
  await form(page).getByLabel("Email address").fill("jane@example.com");
  await form(page)
    .getByLabel(/^I agree to the/)
    .check();
}

test.describe("enquiring about a package", () => {
  test("Enquire opens a form that knows the package and dates, and sending gives a reference", async ({ page }) => {
    await page.goto("/packages/sala-mara-escape");
    await page
      .getByRole("complementary", { name: "Get a price" })
      .getByRole("link", { name: /Enquire/ })
      .click();

    await expect(page).toHaveURL(
      /\/contact\?package=Sala\+Mara\+Escape&slug=sala-mara-escape&checkIn=\d{4}-\d{2}-\d{2}&nights=2/,
    );
    await expect(page.getByRole("heading", { name: "Contact us", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Send an enquiry" })).toBeVisible();

    const about = form(page).locator(".ct-about");
    await expect(about).toContainText("Sala Mara Escape");
    await expect(about).toContainText("2 nights");
    await expect(about.getByLabel("Check-in date")).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
    await expect(about).toContainText("US$7,472");

    // A package enquiry needs no subject.
    await expect(form(page).getByLabel("Subject")).toHaveCount(0);
    await expect(form(page).getByLabel("What is this about?")).toHaveCount(0);

    await fillGuest(page);
    await form(page)
      .getByLabel(/^Message/)
      .fill("Two adults and two children.");
    await form(page).getByRole("button", { name: "Send enquiry" }).click();

    const done = page.getByRole("status").filter({ hasText: "We have your enquiry" });
    await expect(done).toBeVisible();
    await expect(done).toContainText(/ENQ-\d{4}-\d{4}/);
    await expect(done).toContainText("jane@example.com");
    await expect(done).toBeFocused();
    await expect(done.getByRole("link", { name: "Message us on WhatsApp" })).toHaveAttribute(
      "href",
      /wa\.me\/2347047009128\?text=.*ENQ-/,
    );
    await expect(form(page)).toHaveCount(0);
  });

  test("the dates can be changed, and the price follows", async ({ page }) => {
    await page.goto(`/contact?slug=sala-mara-escape&checkIn=${inYears(1)}&nights=2`);
    const about = form(page).locator(".ct-about");
    await expect(about.getByLabel("Check-in date")).toHaveValue(inYears(1));
    await expect(about).toContainText("Price for these dates");

    await about.getByLabel("Check-in date").fill("2026-01-01"); // has passed
    await expect(about.getByText("Price for these dates")).toHaveCount(0);
    await form(page).getByRole("button", { name: "Send enquiry" }).click();
    await expect(form(page).getByText("Choose a date that has not passed.")).toBeVisible();
  });

  test("a link whose package is gone still says what it was about, as a general enquiry", async ({ page }) => {
    await page.goto("/contact?package=Old+Escape&slug=no-such-package");
    const about = form(page).locator(".ct-about");
    await expect(about).toContainText("Old Escape");
    await expect(about).toContainText("couldn't find that package");
    await expect(form(page).getByLabel("What is this about?")).toBeVisible();
    await expect(form(page).getByLabel("Subject")).toHaveValue("Enquiry about Old Escape");
  });

  test("a link with only the old title parameter still works", async ({ page }) => {
    await page.goto("/contact?package=Sala%27s+Classic+Safari&checkIn=2026-10-01&nights=3");
    await expect(form(page).locator(".ct-about")).toContainText("Sala's Classic Safari");
    await expect(page.getByRole("heading", { name: "Send a message" })).toBeVisible();
  });

  test("nonsense in the link is ignored", async ({ page }) => {
    await page.goto("/contact?slug=sala-mara-escape&checkIn=not-a-date&nights=abc");
    const about = form(page).locator(".ct-about");
    await expect(about.getByLabel("Check-in date")).toHaveValue("");
    await expect(about).toContainText("2 nights");
    await expect(about.getByText("Price for these dates")).toHaveCount(0);
  });
});

test.describe("a general message", () => {
  test("asks what it is about, and needs a subject and a message", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: "Send a message" })).toBeVisible();
    await expect(form(page).getByLabel("What is this about?")).toHaveValue("General");

    await form(page).getByRole("button", { name: "Send message" }).click();
    await expect(form(page).getByText("Enter your name.")).toBeVisible();
    await expect(form(page).getByText("Enter your email address.")).toBeVisible();
    await expect(form(page).getByText("Say what this is about.")).toBeVisible();
    await expect(form(page).getByText("Tell us a little more.")).toBeVisible();
    await expect(form(page).getByText("Please agree so we can contact you.")).toBeVisible();
    await expect(form(page).getByLabel("Your name")).toBeFocused();
    await expect(form(page).getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");

    await fillGuest(page);
    await form(page).getByLabel("What is this about?").selectOption("Career");
    await form(page).getByLabel("Subject").fill("Operations role");
    await form(page)
      .getByLabel(/^Message/)
      .fill("Applying for the operations coordinator role.");
    await form(page).getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("status").filter({ hasText: /ENQ-\d{4}-\d{4}/ })).toBeVisible();
  });

  test("?type= picks the kind of message", async ({ page }) => {
    await page.goto("/contact?type=investor");
    await expect(form(page).getByLabel("What is this about?")).toHaveValue("Investor");
  });

  test("refuses an email that isn't one", async ({ page }) => {
    await page.goto("/contact");
    await form(page).getByLabel("Email address").fill("jane@");
    await form(page).getByRole("button", { name: "Send message" }).click();
    await expect(form(page).getByText("Enter a valid email address, like you@example.com.")).toBeVisible();
  });
});

test.describe("when sending fails", () => {
  test("keeps what was typed, says so, and offers WhatsApp", async ({ page }) => {
    await page.route("**/api/v1/enquiries", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/problem+json",
        body: JSON.stringify({ title: "Internal Server Error", status: 500, code: "INTERNAL" }),
      }),
    );
    await page.goto("/contact?slug=sala-mara-escape");
    await fillGuest(page);
    await form(page).getByRole("button", { name: "Send enquiry" }).click();

    const alert = form(page).getByRole("alert");
    await expect(alert).toContainText("Something went wrong on our side");
    await expect(alert.getByRole("link", { name: "message us on WhatsApp" })).toBeVisible();
    await expect(form(page).getByLabel("Your name")).toHaveValue("Jane Doe");
    await expect(form(page).getByRole("button", { name: "Send enquiry" })).toBeEnabled();
  });

  test("shows the API's field errors under the fields", async ({ page }) => {
    await page.route("**/api/v1/enquiries", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/problem+json",
        body: JSON.stringify({
          title: "One or more validation errors occurred.",
          status: 400,
          code: "VALIDATION_FAILED",
          errors: { Email: ["'Email' is not a valid email address."] },
        }),
      }),
    );
    await page.goto("/contact?slug=sala-mara-escape");
    await fillGuest(page);
    await form(page).getByRole("button", { name: "Send enquiry" }).click();
    await expect(form(page).getByText("'Email' is not a valid email address.")).toBeVisible();
  });

  test("a rate-limited guest is told to wait", async ({ page }) => {
    await page.route("**/api/v1/enquiries", (route) =>
      route.fulfill({
        status: 429,
        contentType: "application/problem+json",
        body: JSON.stringify({
          title: "Too Many Requests",
          status: 429,
          detail: "Too many enquiries from this address. Please try again in a few minutes.",
          code: "RATE_LIMITED",
        }),
      }),
    );
    await page.goto("/contact?slug=sala-mara-escape");
    await fillGuest(page);
    await form(page).getByRole("button", { name: "Send enquiry" }).click();
    await expect(form(page).getByRole("alert")).toContainText("Too many enquiries from this address");
  });
});

test.describe("the rest of the page", () => {
  test("lists the ways to reach ARLink28, and the questions open and close", async ({ page }) => {
    await page.goto("/contact");
    const aside = page.getByRole("complementary", { name: "Other ways to reach us" });
    await expect(aside.getByRole("link", { name: "+234 704 700 9128" }).first()).toHaveAttribute(
      "href",
      "https://wa.me/2347047009128",
    );
    await expect(aside.getByRole("link", { name: "support@arlinks.com" })).toBeVisible();
    await expect(aside).toContainText("Ikoyi, Lagos");
    await expect(aside).toContainText("Covent Garden, London");

    const question = page.getByText("Can I change or cancel my booking?");
    const answer = page.getByText("Contact our support team via phone or email with your booking reference");
    await expect(answer).toBeHidden();
    await question.click();
    await expect(answer).toBeVisible();
    await question.click();
    await expect(answer).toBeHidden();
  });

  test("the honeypot is out of sight and out of the tab order", async ({ page }) => {
    await page.goto("/contact");
    const trap = page.locator("#ct-website");
    await expect(trap).toHaveAttribute("tabindex", "-1");
    await expect(page.locator(".ct-trap")).toHaveAttribute("aria-hidden", "true");
    const box = await page.locator(".ct-trap").boundingBox();
    expect(box && box.x + box.width).toBeLessThan(0);
  });

  for (const path of ["/contact?slug=sala-mara-escape", "/about"]) {
    test(`${path.split("?")[0]} does not scroll sideways on a phone`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(path);
      await page.waitForTimeout(500); // the scroll-reveal offsets are what used to widen the page
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
