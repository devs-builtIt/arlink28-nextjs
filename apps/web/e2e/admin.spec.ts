import { test, expect, signIn, errorNotice, SUPER_ADMIN } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await signIn(page, SUPER_ADMIN);
});

test.describe("overview", () => {
  test("shows the session and real staff numbers", async ({ page }) => {
    await expect(page.getByText("Signed in as anna_bello.")).toBeVisible();

    const session = page.getByRole("region", { name: "Your session" });
    await expect(session.getByRole("img", { name: /^[78]h \d+m left$/ })).toBeVisible();
    await expect(session.getByText("Super admin")).toBeVisible();

    const accounts = page.getByRole("region", { name: "Staff accounts" });
    await expect(accounts.getByText("5 active")).toBeVisible();
    await expect(accounts.getByRole("img", { name: "5 of 6 accounts active" })).toBeVisible();

    const roles = page.getByRole("region", { name: "Roles" });
    await expect(roles.getByText("Super admins")).toBeVisible();

    // Most recent first; yusuf_bakare has never signed in, so isn't listed.
    const recent = page.getByRole("region", { name: "Recent sign-ins" }).getByRole("listitem");
    await expect(recent).toHaveCount(5);
    await expect(recent.first()).toContainText("anna_bello");
    await expect(page.getByRole("region", { name: "Recent sign-ins" })).not.toContainText("yusuf_bakare");
  });

  test("the current page is marked in the navigation", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Admin" });
    await expect(nav.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "Staff" }).click();
    await expect(nav.getByRole("link", { name: "Staff" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current", "page");
  });
});

test.describe("staff", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.getByRole("table")).toBeVisible();
  });

  const row = (page: import("@playwright/test").Page, username: string) =>
    page.getByRole("row").filter({ hasText: username });

  test("lists everyone with role, status and last sign-in", async ({ page }) => {
    await expect(page.getByText("5 people can sign in to the admin.")).toBeVisible();
    await expect(page.getByRole("row")).toHaveCount(7); // header + 6 staff
    await expect(row(page, "grace_wanjiru")).toContainText("Deactivated");
    await expect(row(page, "yusuf_bakare")).toContainText("Never");
  });

  test("you can't change your own role or deactivate yourself", async ({ page }) => {
    const you = row(page, "anna_bello");
    await expect(you).toContainText("(you)");
    await expect(you.getByRole("combobox")).toHaveCount(0);
    await expect(you.getByRole("button", { name: "Deactivate" })).toHaveCount(0);
  });

  test("changing a role saves and confirms", async ({ page }) => {
    await row(page, "kwame_mensah").getByRole("combobox", { name: "Role for kwame_mensah" }).selectOption("SuperAdmin");
    await expect(page.getByRole("status")).toHaveText("kwame_mensah is now a super admin.");

    await page.reload();
    await expect(row(page, "kwame_mensah").getByRole("combobox")).toHaveValue("SuperAdmin");
  });

  test("deactivating asks first, and cancel leaves the account alone", async ({ page }) => {
    const fatima = row(page, "fatima_diallo");
    await fatima.getByRole("button", { name: "Deactivate" }).click();
    await expect(fatima.getByText("Stop fatima_diallo signing in?")).toBeVisible();
    await fatima.getByRole("button", { name: "Cancel" }).click();
    await expect(fatima).toContainText("Active");

    await fatima.getByRole("button", { name: "Deactivate" }).click();
    await fatima.getByRole("button", { name: "Deactivate" }).click();
    await expect(page.getByRole("status")).toHaveText("fatima_diallo can no longer sign in.");
    await expect(fatima).toContainText("Deactivated");
    await expect(page.getByText("4 people can sign in to the admin.")).toBeVisible();
  });
});

test.describe("inviting staff", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/users/invite");
  });

  test("sends an invite and says who it went to", async ({ page }) => {
    await page.getByLabel("Email").fill("pilot.one@arlink28.test");
    await page.getByRole("radio", { name: /Super admin/ }).check();
    await page.getByRole("button", { name: "Send invite" }).click();

    await expect(page.getByRole("status")).toHaveText("Invite sent to pilot.one@arlink28.test.");
    await expect(page.getByLabel("Email")).toHaveValue("");
    await expect(page.getByRole("radio", { name: /Operator/ })).toBeChecked();
  });

  test("shows the API's reason when an invite is refused", async ({ page }) => {
    await page.getByLabel("Email").fill("kwame.mensah@arlink28.test");
    await page.getByRole("button", { name: "Send invite" }).click();
    await expect(errorNotice(page)).toHaveText("A staff member with this email already exists.");
  });

  test("Back to staff returns to the list", async ({ page }) => {
    await page.getByRole("link", { name: "Back to staff" }).click();
    await expect(page).toHaveURL(/\/admin\/users$/);
  });
});

test.describe("changing your password", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Password" }).click();
    await expect(page).toHaveURL(/\/admin\/change-password$/);
  });

  test("a wrong current password is refused", async ({ page }) => {
    await page.getByLabel("Current password").fill("Not-my-password1");
    await page.getByLabel("New password").fill("Hangar-2026");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(errorNotice(page)).toHaveText("Current password is incorrect.");
  });

  test("the new password works at the next sign-in", async ({ page }) => {
    await page.getByLabel("Current password").fill(SUPER_ADMIN.password);
    await page.getByLabel("New password").fill("Hangar-2026");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByRole("status")).toHaveText("Password changed. Use the new one next time you sign in.");

    await page.getByRole("button", { name: "Sign out" }).click();
    await signIn(page, { username: SUPER_ADMIN.username, password: "Hangar-2026" });
  });
});
