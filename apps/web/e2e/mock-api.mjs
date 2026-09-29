// Stateful stand-in for arlink28-api, used by the Playwright suite.
//
// It serves the endpoints the admin portal calls, in the real API's shapes:
// plain JSON on success, 204 where the API has no body, and RFC 9457 Problem
// Details (with `code`) for every error. Tokens are JWT-shaped so the web app's
// middleware can decode them; the mock "verifies" a token by looking it up.
//
// POST /__reset restores the seed data between tests.
import http from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 5399);
const HOUR = 3600_000;
const DAY = 24 * HOUR;

// Test-only accounts; e2e/fixtures.ts holds the same values for the specs.
const PASSWORDS = { anna_bello: "Runway-2026", kwame_mensah: "Taxiway-2026" };

function seed() {
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  return {
    passwords: { ...PASSWORDS },
    tokens: new Map(),
    users: [
      {
        id: "u1",
        username: "anna_bello",
        email: "anna.bello@arlink28.test",
        role: "SuperAdmin",
        isActive: true,
        lastLoginAt: iso(now - 5 * 60_000),
        createdAt: iso(now - 90 * DAY),
      },
      {
        id: "u2",
        username: "kwame_mensah",
        email: "kwame.mensah@arlink28.test",
        role: "Operator",
        isActive: true,
        lastLoginAt: iso(now - 3 * HOUR),
        createdAt: iso(now - 60 * DAY),
      },
      {
        id: "u3",
        username: "fatima_diallo",
        email: "fatima.diallo@arlink28.test",
        role: "Operator",
        isActive: true,
        lastLoginAt: iso(now - 2 * DAY),
        createdAt: iso(now - 40 * DAY),
      },
      {
        id: "u4",
        username: "tunde_okafor",
        email: "tunde.okafor@arlink28.test",
        role: "SuperAdmin",
        isActive: true,
        lastLoginAt: iso(now - 6 * DAY),
        createdAt: iso(now - 30 * DAY),
      },
      {
        id: "u5",
        username: "grace_wanjiru",
        email: "grace.wanjiru@arlink28.test",
        role: "Operator",
        isActive: false,
        lastLoginAt: iso(now - 45 * DAY),
        createdAt: iso(now - 80 * DAY),
      },
      {
        id: "u6",
        username: "yusuf_bakare",
        email: "yusuf.bakare@arlink28.test",
        role: "Operator",
        isActive: true,
        lastLoginAt: null,
        createdAt: iso(now - DAY),
      },
    ],
    invites: new Map([["valid-invite", { email: "new.hire@arlink28.test", role: "Operator" }]]),
    resets: new Set(["valid-reset"]),
  };
}
let db = seed();

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

function issue(user) {
  const expiresAt = new Date(Date.now() + 8 * HOUR).toISOString();
  const payload = {
    nameid: user.id,
    unique_name: user.username,
    role: user.role,
    exp: Math.floor(Date.parse(expiresAt) / 1000),
  };
  const accessToken = `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.mock-${user.id}-${Date.now()}`;
  db.tokens.set(accessToken, user.id);
  return { accessToken, role: user.role, username: user.username, expiresAt };
}

function send(res, status, body) {
  if (body === undefined) {
    res.writeHead(status);
    return res.end();
  }
  const problem = status >= 400;
  res.writeHead(status, { "Content-Type": problem ? "application/problem+json" : "application/json" });
  res.end(JSON.stringify(body));
}

const TITLES = { 400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found" };
const CODES = { 400: "BAD_REQUEST", 401: "UNAUTHENTICATED", 403: "FORBIDDEN", 404: "NOT_FOUND" };
const problem = (res, status, detail, extra = {}) =>
  send(res, status, {
    title: TITLES[status],
    status,
    ...(detail && { detail }),
    code: CODES[status],
    traceId: "mock",
    ...extra,
  });

function strongPassword(p) {
  if (typeof p !== "string" || p.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(p)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(p)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(p)) return "Password must contain at least one digit.";
  return null;
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://mock");
  const path = url.pathname;
  const method = req.method;

  if (method === "POST" && path === "/__reset") {
    db = seed();
    return send(res, 204);
  }

  const body = method === "GET" ? {} : await readJson(req);
  if (body === null)
    return problem(res, 400, undefined, {
      errors: { "": ["The request body isn't valid JSON."] },
      code: "VALIDATION_FAILED",
    });

  const auth = req.headers.authorization?.replace(/^Bearer /, "");
  const me = auth && db.tokens.has(auth) ? db.users.find((u) => u.id === db.tokens.get(auth)) : null;
  const requireUser = () => (me && me.isActive ? me : null);

  // ── Auth ──
  if (method === "POST" && path === "/api/v1/auth/login") {
    if (!body.username || !body.password) {
      return problem(res, 400, undefined, {
        title: "One or more validation errors occurred.",
        code: "VALIDATION_FAILED",
        errors: { Username: ["'Username' must not be empty."] },
      });
    }
    const user = db.users.find((u) => u.username === body.username);
    if (!user || !user.isActive || db.passwords[user.username] !== body.password) {
      return problem(res, 401, "Invalid username or password.");
    }
    user.lastLoginAt = new Date().toISOString();
    return send(res, 200, issue(user));
  }
  if (method === "GET" && path === "/api/v1/auth/me") {
    const u = requireUser();
    if (!u) return problem(res, 401);
    const exp = JSON.parse(Buffer.from(auth.split(".")[1], "base64url").toString()).exp;
    return send(res, 200, {
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      expiresAt: new Date(exp * 1000).toISOString(),
    });
  }
  if (method === "POST" && path === "/api/v1/auth/logout") {
    if (!requireUser()) return problem(res, 401);
    db.tokens.delete(auth);
    return send(res, 204);
  }
  if (method === "PATCH" && path === "/api/v1/auth/change-password") {
    const u = requireUser();
    if (!u) return problem(res, 401);
    if (db.passwords[u.username] !== body.currentPassword) return problem(res, 400, "Current password is incorrect.");
    const weak = strongPassword(body.newPassword);
    if (weak)
      return problem(res, 400, undefined, {
        title: "One or more validation errors occurred.",
        code: "VALIDATION_FAILED",
        errors: { NewPassword: [weak] },
      });
    db.passwords[u.username] = body.newPassword;
    return send(res, 204);
  }
  if (method === "POST" && path === "/api/v1/auth/reset-password/request") return send(res, 204);
  if (method === "POST" && path === "/api/v1/auth/reset-password/confirm") {
    if (!db.resets.has(body.token)) return problem(res, 400, "This reset link is invalid or has expired.");
    const weak = strongPassword(body.newPassword);
    if (weak)
      return problem(res, 400, undefined, {
        title: "One or more validation errors occurred.",
        code: "VALIDATION_FAILED",
        errors: { NewPassword: [weak] },
      });
    db.resets.delete(body.token);
    return send(res, 204);
  }

  // ── Users ──
  if (method === "POST" && path === "/api/v1/users/invite/accept") {
    const invite = db.invites.get(body.token);
    if (!invite) return problem(res, 400, "This invite is invalid or has expired.");
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(body.username ?? "")) {
      return problem(res, 400, undefined, {
        title: "One or more validation errors occurred.",
        code: "VALIDATION_FAILED",
        errors: { Username: ["Username may only contain letters, digits, and underscores."] },
      });
    }
    const weak = strongPassword(body.password);
    if (weak)
      return problem(res, 400, undefined, {
        title: "One or more validation errors occurred.",
        code: "VALIDATION_FAILED",
        errors: { Password: [weak] },
      });
    const user = {
      id: `u${db.users.length + 1}`,
      username: body.username,
      email: invite.email,
      role: invite.role,
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    db.passwords[user.username] = body.password;
    db.invites.delete(body.token);
    return send(res, 200, issue(user));
  }
  if (path.startsWith("/api/v1/users")) {
    const u = requireUser();
    if (!u) return problem(res, 401);
    if (u.role !== "SuperAdmin") return problem(res, 403);

    if (method === "GET" && path === "/api/v1/users") return send(res, 200, db.users);
    if (method === "POST" && path === "/api/v1/users/invite") {
      if (db.users.some((x) => x.email === body.email))
        return problem(res, 400, "A staff member with this email already exists.");
      db.invites.set(`invite-${Date.now()}`, { email: body.email, role: body.role });
      return send(res, 204);
    }
    const m = path.match(/^\/api\/v1\/users\/([^/]+)\/(role|deactivate)$/);
    const target = m && db.users.find((x) => x.id === m[1]);
    if (method === "PATCH" && m && !target) return problem(res, 404, "User not found.");
    if (method === "PATCH" && m?.[2] === "role") {
      target.role = body.role;
      return send(res, 204);
    }
    if (method === "PATCH" && m?.[2] === "deactivate") {
      if (target.id === u.id) return problem(res, 400, "You can't deactivate your own account.");
      target.isActive = false;
      return send(res, 204);
    }
  }

  return problem(res, 404);
});

server.listen(PORT, () => console.log(`mock arlink28-api on http://localhost:${PORT}`));
