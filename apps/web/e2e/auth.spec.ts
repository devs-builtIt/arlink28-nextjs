import { test, expect, signIn, errorNotice, SUPER_ADMIN, OPERATOR } from "./fixtures";

test.describe("signing in and out", () => {
  test("a signed-out visitor is sent to sign in, then back to the page they wanted", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fusers$/);

    await page.getByLabel("Username").fill(SUPER_ADMIN.username);
    await page.getByLabel("Password").fill(SUPER_ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByRole("heading", { name: "Staff", level: 1 })).toBeVisible();
  });

  test("a wrong password shows the API's message and sets no session", async ({ page, context }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Username").fill(SUPER_ADMIN.username);
    await page.getByLabel("Password").fill("Wrong-pass1");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(errorNotice(page)).toHaveText("Invalid username or password.");
    await expect(page).toHaveURL(/\/admin\/login$/);
    expect((await context.cookies()).find((c) => c.name === "arlink28_session")).toBeUndefined();
  });

  test("the session token lives in an httpOnly cookie that scripts can't read", async ({ page, context }) => {
    await signIn(page, SUPER_ADMIN);

    const cookie = (await context.cookies()).find((c) => c.name === "arlink28_session");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");
    expect(await page.evaluate(() => document.cookie)).not.toContain("arlink28_session");
    expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain("eyJ");
  });

  test("a signed-in visitor opening the login page goes to the overview", async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
    await page.goto("/admin/login");
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
  });

  test("signing out clears the session and protects pages again", async ({ page, context }) => {
    await signIn(page, SUPER_ADMIN);
    await page.getByRole("button", { name: "Sign out" }).click();

    await expect(page).toHaveURL(/\/admin\/login$/);
    expect((await context.cookies()).find((c) => c.name === "arlink28_session")).toBeUndefined();
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("operators don't see staff management", async ({ page }) => {
    await signIn(page, OPERATOR);

    const nav = page.getByRole("navigation", { name: "Admin" });
    await expect(nav.getByRole("link", { name: "Overview" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Staff" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Invite staff" })).toHaveCount(0);

    await page.goto("/admin/users");
    await expect(page.getByText("Only super admins can open this page.")).toBeVisible();
  });
});

test.describe("password reset and invites", () => {
  test("requesting a reset always confirms, without revealing whether the email exists", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByRole("link", { name: "Forgot your password?" }).click();
    await page.getByLabel("Email").fill("someone@arlink28.test");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page.getByRole("status")).toContainText("If someone@arlink28.test belongs to a staff account");
  });

  test("a reset link without a token explains what to do", async ({ page }) => {
    await page.goto("/admin/reset-password/confirm");
    await expect(errorNotice(page)).toContainText("This reset link is incomplete");
    await expect(page.getByRole("link", { name: "Request a new link" })).toBeVisible();
  });

  test("a weak new password is rejected with the rule that failed", async ({ page }) => {
    await page.goto("/admin/reset-password/confirm?token=valid-reset");
    await page.getByLabel("New password").fill("short");
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(errorNotice(page)).toHaveText("Password must be at least 8 characters.");
  });

  test("a valid reset link saves the new password", async ({ page }) => {
    await page.goto("/admin/reset-password/confirm?token=valid-reset");
    await page.getByLabel("New password").fill("Hangar-2026");
    await page.getByRole("button", { name: "Save new password" }).click();

    await expect(page.getByRole("status")).toHaveText("Password saved. Sign in with your new password.");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("accepting an invite creates the account and signs the new person in", async ({ page }) => {
    await page.goto("/admin/invite/accept?token=valid-invite");
    await page.getByLabel("Username").fill("new_hire");
    await page.getByLabel("Password").fill("Boarding-2026");
    await page.getByRole("button", { name: "Create account and sign in" }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard$/);
    await expect(page.getByText("Signed in as new_hire.")).toBeVisible();
  });

  test("an invite link without a token explains what to do", async ({ page }) => {
    await page.goto("/admin/invite/accept");
    await expect(errorNotice(page)).toContainText("This invite link is incomplete");
  });
});
