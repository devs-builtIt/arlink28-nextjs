# Staging environment

Staging is three hosted services. Nothing here is the VPS production setup from [ADR 0004](./adr/0004-single-vps-hosting.md).

| Layer | Host | Identifier |
| --- | --- | --- |
| Web (this repo, `apps/web`) | Vercel | `https://arlink28website.vercel.app` (stable Production alias; the `...-lkmxfs503-...` URLs are per-deployment and keep the env vars they were built with, so don't use them). Project ID `prj_JFrzlov7oK2klcRNF08bwJ9mTSJl` |
| API (`arlink28-api`, Docker) | Render | service `srv-daumsmvlk1mc73dglcdg`, `https://arlink28-api.onrender.com` |
| Database | Supabase (Postgres) | the same remote database the API uses in development |

```
Browser ──► Vercel (Next.js) ──/api/v1/*──► Render (ASP.NET Core) ──► Supabase Postgres
                 └──/media/*────────────────┘
```

The browser never calls Render. `apps/web/app/api/v1/[...path]/route.ts` proxies `/api/v1/*` server-side, and `next.config.mjs` rewrites `/media/*` to the API. So **CORS is not involved**, and the only link between Vercel and Render is one variable.

## State on 2026-10-05 (checked with curl)

| Check | Result | Meaning |
| --- | --- | --- |
| `GET onrender.com/health` | 503, `Failed to connect to 127.0.0.1:5432` | Render has no database connection string, so the API fell back to localhost. |
| `GET onrender.com/api/v1/packages` | 500 `INTERNAL` | Same cause. |
| `GET <vercel>/api/v1/packages` | 502 `API_UNREACHABLE` | The proxy's `fetch` threw. `apiUrl()` throws when `API_URL` is unset, and the proxy catches that as 502, so this is consistent with `API_URL` missing on Vercel. It is not proof: the Vercel dashboard wasn't inspected. |

Two separate fixes are needed, one per host. Fixing Vercel alone still leaves the API returning 500.

## 1. Render (API)

Environment tab of `srv-daumsmvlk1mc73dglcdg`. ASP.NET Core reads `Section__Key` as `Section:Key`.

| Variable | Value |
| --- | --- |
| `ConnectionStrings__DefaultConnection` | Supabase **connection pooler** string in Npgsql form: `Host=<pooler-host>;Port=5432;Database=postgres;Username=postgres.<project-ref>;Password=<db-password>;SSL Mode=Require;Trust Server Certificate=true`. Use the pooler (session mode), not the direct host: the direct host is IPv6-only and Render connects over IPv4. |
| `AppSettings__Secret` | A random string of 32+ characters. Signs the admin tokens. Never reuse the dev value. |
| `AppSettings__ValidIssuer` / `AppSettings__ValidAudience` | `https://arlink28-api.onrender.com` |
| `AppSettings__WebUrl` | `https://arlink28-api.onrender.com` |
| `AppSettings__FrontendBaseUrl` | `https://arlink28website.vercel.app` (used in links and the CORS policy). |
| `AdminBootstrap__Enabled` | `true` for the first deploy only, then `false`. Also set `AdminBootstrap__Email`, `AdminBootstrap__Username`, `AdminBootstrap__Password`. |
| `MediaStorage__Provider` | `Supabase` (photos go to Supabase Storage; see below) |
| `MediaStorage__SupabaseUrl` | `https://zpyacljkgrgadwgnsqyc.supabase.co` |
| `MediaStorage__SupabaseBucket` | `ArlinkBucket` (case-sensitive; must be a public bucket) |
| `MediaStorage__SupabaseServiceKey` | The project's `service_role` key (Project Settings > API). Secret: Render only, never Vercel or git. |
| `EmailSettings__*`, `EnquirySettings__NotifyTo` | Only when enquiry email is wanted on staging. |

`PORT` is injected by Render and the Dockerfile already binds to it. After saving, Render redeploys.

**Check:** `curl https://arlink28-api.onrender.com/health` must return 200 `Healthy`.

Caveats:

- **Free instances sleep.** The first request after idle takes ~30-60 s and can time out the Vercel proxy, which shows up as one-off 502s. Open `/health` first.
- **Photos live in Supabase Storage.** Render's disk is wiped on every deploy, so staging uses `MediaStorage__Provider=Supabase`. Create the bucket first: Storage > New bucket > name `ArlinkBucket` > **Public bucket on**. The database keeps `/media/...` paths; the API redirects `/media/*` to the bucket, so Vercel's `/media` rewrite needs no change. The Free plan covers this (1 GB storage, 5 GB egress a month, 50 MB per file) at no charge. Images already in the database from local development are not in the bucket and will 404 until re-uploaded.
- **Schema is applied by hand.** The API has no migrations. Run `docs/migrations/001`-`003` (in `arlink28-api`) against the Supabase database if they aren't applied. Dev notes say 002 and 003 are applied to the dev database; if staging uses a different Supabase project, apply them there.
- **Seeding** runs from a laptop, not on Render: `dotnet run -- seed-catalogue --allow-production` with the connection string set in the environment.

## 2. Vercel (web)

Project settings:

| Setting | Value |
| --- | --- |
| Root Directory | `apps/web` (with "Include source files outside of the Root Directory" on, so the workspace packages build) |
| Framework Preset | Next.js |
| Install Command | `pnpm install` |
| Build Command | `pnpm turbo run build --filter=@arlink28/web` (or the default; `turbo.json` builds `^build` first) |

Environment variables. Set them for **Production** (the "Development" environment is only used by `vercel dev` locally and no deployment reads it) and for **Preview** so branch deployments work:

| Variable | Value | Notes |
| --- | --- | --- |
| `API_URL` | `https://arlink28-api.onrender.com` | No trailing slash, no `/api/v1`. Server-only, so it must **not** be named `NEXT_PUBLIC_*`. |
| `NEXT_PUBLIC_SITE_URL` | `https://arlink28website.vercel.app` | Canonical URLs and metadata on package pages. Falls back to `http://localhost:3000` if unset. |
| `TEST_PHOTOS` | `true` (optional) | Stock photos for packages without any. Off in production builds by default. |

`API_URL` is also read **when the app is built** (the `/media` rewrite in `next.config.mjs`). Editing it in Vercel does nothing until you **redeploy**, and a redeploy must be a fresh build, not a reused cache of the old one.

**Check, after redeploying:**

```bash
curl -i https://<vercel-url>/api/v1/packages      # 200 JSON, not 502 API_UNREACHABLE
curl -I https://<vercel-url>/media/<a-known-path> # proxied from Render
```

## 3. Supabase

- Use the project's pooler connection string (Project Settings > Database > Connection string > Session pooler).
- Keep the DB password in Render only. Do not put it in Vercel, in git, or in `.env.example`.
- Staging data is shared with whatever else points at this database. Treat it as non-production but not disposable.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Vercel `/api/v1/*` returns 502 `API_UNREACHABLE` | `API_URL` unset or wrong on Vercel, or Render asleep | Set `API_URL`, redeploy; hit Render `/health` to wake it |
| Render returns 500/503, `Failed to connect to 127.0.0.1:5432` | `ConnectionStrings__DefaultConnection` unset on Render | Section 1 |
| Render connection error mentioning IPv6 or timeout | Direct Supabase host used | Switch to the pooler host |
| Admin login fails everywhere | No admin user | Enable `AdminBootstrap` once, then disable it |
| Site loads but images 404 | Photo isn't in the bucket (uploaded before the Supabase switch), or the bucket isn't public | Re-upload in the admin; make the bucket public |
| Admin upload fails with `Supabase Storage rejected the upload` | Wrong service key, URL or bucket name | Recheck the three `MediaStorage__Supabase*` variables |
| Preview deployments have no data | `API_URL` only set for Production | Add it for Preview too |
