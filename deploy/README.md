# Production deployment (Hostinger VPS)

Runs the site, API and database from `main` on one VPS with Docker Compose. Staging is separate and
unchanged: `develop` deploys to Vercel (web), Render (API) and Supabase (database). Server state and
history are in [ARLink28-VPS-Deployment-Handover.md](../docs/ARLink28-VPS-Deployment-Handover.md).

| File | Purpose |
| --- | --- |
| `web.Dockerfile` | Production image for `apps/web` (Next.js standalone, non-root) |
| `compose.yaml` | caddy, web, api, postgres, and the one-off `migrate` job |
| `Caddyfile` | `arlink28.com` to web, `www` redirects, `api.arlink28.com` to api, automatic HTTPS |
| `init-secrets.sh` | One time: writes the secret env files on the VPS and prompts for the first admin password |
| `deploy.sh` | Pulls both repos, builds, dumps the database, migrates, starts everything |

The API's Dockerfile is in the `arlink28-api` repo.

## How it fits together

- Only Caddy publishes ports (80, 443). `web` and `api` share the `arlink28-network` Docker network with Caddy.
- `postgres` is on its own `internal` network (`arlink28-db`) with the API and `migrate`. It has no published port and no route to the internet.
- The browser talks only to `arlink28.com`. The Next.js server proxies `/api/v1/*` to `http://api:8080`, and rewrites `/media/*` to the API, so CORS is not involved. `api.arlink28.com` is public for the admin tools and for testing.
- Photos live in the `arlink28-media` volume (`MediaStorage__Provider=LocalDisk`, `RootPath=/data/media`). The database stays in the existing `arlink28-postgres-data` volume (declared `external`, so compose never deletes it).
- The API never migrates on startup. `deploy.sh` runs `migrate` after taking a dump.

## One-time setup (on the VPS, as `deploy`)

1. Give the VPS read access to both repos (a read-only deploy key per repo), then:
   ```bash
   git clone <web repo url> /opt/arlink28/src/web
   git clone <api repo url> /opt/arlink28/src/api
   ```
2. `bash /opt/arlink28/src/web/deploy/init-secrets.sh`. Then fill in the `EmailSettings__*` and `EnquirySettings__NotifyTo` lines in `/opt/arlink28/secrets/api.env`.
3. Point DNS at the VPS (A records for `@` and `api`, CNAME for `www`) and wait until it resolves. Caddy cannot get certificates before that.
4. `bash /opt/arlink28/src/web/deploy/deploy.sh`

After the first admin signs in, set `AdminBootstrap__Enabled=false` in `api.env` and run `deploy.sh` again. Bootstrap only creates an admin when the staff table is empty, so leaving it on is harmless, but there is no reason to.

## Deploying and rolling back

```bash
/opt/arlink28/src/web/deploy/deploy.sh                  # origin/main of both repos
/opt/arlink28/src/web/deploy/deploy.sh <web-sha> <api-sha>   # a specific release, e.g. to roll back
tail /opt/arlink28/releases.log
```

Migrations only go forward. Rolling the code back does not undo them, so a migration that old code cannot
live with needs a restore from the pre-deploy dump in `/opt/arlink28/backups/` (last 10 kept).

## Checks

```bash
cd /opt/arlink28/app && sudo docker compose ps
curl -fsS https://api.arlink28.com/health
sudo docker compose logs --tail=100 api
```

Do not run `docker compose down -v`, `docker volume prune` or `docker system prune --volumes`.

## Staged cutover from the old site

`arlink28.com` currently serves the old site from another server, with mail on Google Workspace. DNS is
managed outside Hostinger (Google Domains / Squarespace nameservers). Never touch the MX, SPF, DKIM or
DMARC records.

1. **Preview.** Add A records `api` and `new` pointing at `69.62.107.166`. The Caddyfile serves only
   those two names (`new.arlink28.com` is the preview, marked noindex). Check certificates, the admin
   login, the seeded content and the enquiry flow there.
2. **Prepare.** A day before, lower the TTL of the `@` record to 300 seconds.
3. **Cut over.** In the Caddyfile, uncomment the `arlink28.com` and `www` sites and delete the `new`
   site, merge to `main`, run `deploy.sh`. Then point `@` and `www` (A or CNAME) at the VPS. Caddy gets
   the certificates once DNS resolves.
4. **Roll back** by pointing `@` back at the old server. Leave the old server running until you are sure.

Links in emails (invites, password resets) use `https://arlink28.com`, so they point at the old site until
the cutover.
