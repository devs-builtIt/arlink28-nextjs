import { test, expect, signIn, SUPER_ADMIN } from "./fixtures";

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const forgedToken = () =>
  `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ unique_name: "mallory", role: "SuperAdmin", exp: Math.floor(Date.now() / 1000) + 3600 })}.forged`;

test.describe("session and proxy safeguards", () => {
  test("a forged cookie is rejected by the API and cleared", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "arlink28_session", value: forgedToken(), url: baseURL!, httpOnly: true }]);

    const res = await page.request.get("/api/session");
    expect(await res.json()).toBeNull();

    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("routes that hand out tokens can't be called through the proxy", async ({ request }) => {
    for (const path of ["/api/v1/auth/login", "/api/v1/users/invite/accept", "/api/v1/auth/logout"]) {
      const res = await request.post(path, { data: {} });
      expect(res.status(), path).toBe(404);
      expect((await res.json()).code).toBe("NOT_FOUND");
    }
  });

  test("cross-site state changes are refused", async ({ request }) => {
    const res = await request.post("/api/session", {
      headers: { Origin: "https://evil.example" },
      data: SUPER_ADMIN,
    });
    expect(res.status()).toBe(403);
    expect((await res.json()).code).toBe("FORBIDDEN");
  });

  test("the proxy doesn't forward requests signed-out", async ({ request }) => {
    const res = await request.get("/api/v1/users");
    expect(res.status()).toBe(401);
    expect(res.headers()["content-type"]).toContain("application/problem+json");
  });

  test("a signed-in proxy call reaches the API", async ({ page }) => {
    await signIn(page, SUPER_ADMIN);
    const res = await page.request.get("/api/v1/users");
    expect(res.status()).toBe(200);
    expect(await res.json()).toHaveLength(6);
  });

  test("the admin isn't indexed by search engines", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});
