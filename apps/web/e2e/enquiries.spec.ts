import { test, expect, signIn, errorNotice, SUPER_ADMIN, OPERATOR } from "./fixtures";
import type { Page } from "@playwright/test";

// The staff side of enquiries: the list at /admin/enquiries and an enquiry at /admin/enquiries/[id].
// The mock API starts with three: Sam Roe (New, general), Jane Doe (Contacted, a package), Amara Nwosu (Closed).

const rows = (page: Page) => page.locator("table.enq-table tbody tr");
const tab = (page: Page, name: string | RegExp) => page.getByRole("tab", { name });

test.describe("the enquiries list", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, OPERATOR);
    await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Enquiries" }).click();
    await expect(page).toHaveURL(/\/admin\/enquiries$/);
  });

  test("shows every enquiry, newest first, with the counts and how many wait", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Enquiries", level: 1 })).toBeVisible();
    await expect(page.getByText("1 enquiry is waiting for a reply.")).toBeVisible();
    await expect(rows(page)).toHaveCount(3);

    await expect(tab(page, /^All/)).toContainText("3");
    await expect(tab(page, /^New/)).toContainText("1");
    await expect(tab(page, /^Contacted/)).toContainText("1");
    await expect(tab(page, /^Closed/)).toContainText("1");

    const first = rows(page).nth(0);
    await expect(first).toContainText("Sam Roe");
    await expect(first).toContainText("sam.roe@example.test");
    await expect(first).toContainText("Group booking"); // the subject, since there is no package
    await expect(first).toContainText("General message");
    await expect(first).toContainText("New");
    await expect(first).toContainText(/ENQ-\d{4}-0003/);

    const trip = rows(page).nth(1);
    await expect(trip).toContainText("Sala Mara Escape");
    await expect(trip).toContainText("Jan 12, 2027, 2 nights, $7,472");
    await expect(trip).toContainText("Contacted");
  });

  test("a status tab narrows the list and the address remembers it", async ({ page }) => {
    await tab(page, /^Closed/).click();
    await expect(page).toHaveURL(/status=Closed/);
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText("Amara Nwosu");

    await page.reload();
    await expect(tab(page, /^Closed/)).toHaveAttribute("aria-selected", "true");
    await expect(rows(page)).toHaveCount(1);
  });

  test("a row opens the enquiry", async ({ page }) => {
    await rows(page).filter({ hasText: "Jane Doe" }).click();
    await expect(page).toHaveURL(/\/admin\/enquiries\/enq-2$/);
    await expect(page.getByRole("heading", { name: "Jane Doe", level: 1 })).toBeVisible();
  });

  test("pages the list", async ({ page }) => {
    await page.goto("/admin/enquiries?size=10");
    await expect(page.getByRole("status").filter({ hasText: "Showing 1 to 3 of 3 enquiries" })).toBeVisible();
  });
});

test.describe("one enquiry", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, OPERATOR);
  });

  test("a package enquiry shows the guest, the message, the trip and the price it was quoted", async ({ page }) => {
    await page.goto("/admin/enquiries/enq-2");
    await expect(page.getByRole("heading", { name: "Jane Doe", level: 1 })).toBeVisible();
    await expect(page.getByText("Two adults and two children.")).toBeVisible();

    const trip = page.getByRole("region", { name: "Package requested" });
    await expect(trip.getByRole("link", { name: "Sala Mara Escape" })).toBeVisible();
    await expect(trip).toContainText("Jan 12, 2027");
    await expect(trip).toContainText("2");
    await expect(trip).toContainText("$7,472");

    const guest = page.getByRole("region", { name: "Guest" });
    await expect(guest.getByRole("link", { name: "jane.doe@example.test" })).toBeVisible();
    await expect(guest.getByRole("link", { name: "+254700000000" })).toHaveAttribute("href", "tel:+254700000000");

    await expect(page.getByRole("link", { name: "Reply by email" })).toHaveAttribute(
      "href",
      /^mailto:jane\.doe@example\.test\?subject=Your%20ARLink28%20enquiry%20ENQ-\d{4}-0002$/,
    );
    await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", "https://wa.me/254700000000");
  });

  test("a general enquiry has no trip and no WhatsApp link without a phone number", async ({ page }) => {
    await page.goto("/admin/enquiries/enq-3");
    await expect(page.getByRole("heading", { name: "Group booking" })).toBeVisible(); // the subject heads the message
    await expect(page.getByText("Ten of us are travelling in June")).toBeVisible();
    await expect(page.getByRole("region", { name: "Package requested" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Guest" })).toContainText("Not given");
  });

  test("moving the status shows at once and survives a reload", async ({ page }) => {
    await page.goto("/admin/enquiries/enq-3");
    const status = page.getByRole("radiogroup", { name: "Status" });
    await expect(status.getByRole("radio", { name: "New" })).toBeChecked();

    await status.getByRole("radio", { name: "Contacted" }).click();
    await expect(status.getByRole("radio", { name: "Contacted" })).toBeChecked();
    await expect(page.getByText("Marked as contacted.")).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("radiogroup", { name: "Status" }).getByRole("radio", { name: "Contacted" }),
    ).toBeChecked();

    await page.goto("/admin/enquiries");
    await expect(page.getByText("Nothing is waiting for a reply.")).toBeVisible();
    await expect(tab(page, /^New/)).toContainText("0");
    await expect(tab(page, /^Contacted/)).toContainText("2");
  });

  test("puts the status back and says so when the change is refused", async ({ page }) => {
    await page.goto("/admin/enquiries/enq-3");
    await page.route("**/api/v1/admin/enquiries/enq-3", (route) =>
      route.request().method() === "PATCH"
        ? route.fulfill({
            status: 500,
            contentType: "application/problem+json",
            body: JSON.stringify({ title: "Internal Server Error", status: 500, code: "INTERNAL" }),
          })
        : route.continue(),
    );
    const status = page.getByRole("radiogroup", { name: "Status" });
    await status.getByRole("radio", { name: "Closed" }).click();
    await expect(errorNotice(page)).toContainText("Something went wrong on our side");
    await expect(status.getByRole("radio", { name: "New" })).toBeChecked();
  });

  test("an enquiry that isn't there says so", async ({ page }) => {
    await page.goto("/admin/enquiries/no-such-enquiry");
    await expect(page.getByRole("heading", { name: "Enquiry not found" })).toBeVisible();
    await page.getByRole("link", { name: "Back to enquiries" }).click();
    await expect(page).toHaveURL(/\/admin\/enquiries$/);
  });
});

test("an enquiry a guest sends appears at the top of the list as New", async ({ page }) => {
  await page.goto("/contact?slug=sala-mara-escape");
  const form = page.getByRole("form", { name: "Enquiry form" });
  await form.getByLabel("Your name").fill("Lena Okoro");
  await form.getByLabel("Email address").fill("lena@example.com");
  await form.getByLabel(/^I agree to the/).check();
  await form.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("status").filter({ hasText: /ENQ-\d{4}-0004/ })).toBeVisible();

  await signIn(page, SUPER_ADMIN);
  await page.goto("/admin/enquiries");
  const first = rows(page).first();
  await expect(first).toContainText("Lena Okoro");
  await expect(first).toContainText("Sala Mara Escape");
  await expect(first).toContainText("New");
  await expect(page.getByText("2 enquiries are waiting for a reply.")).toBeVisible();
});

test("the enquiries need a signed-in member of staff", async ({ page }) => {
  await page.goto("/admin/enquiries");
  await expect(page).toHaveURL(/\/admin\/login/);
});
