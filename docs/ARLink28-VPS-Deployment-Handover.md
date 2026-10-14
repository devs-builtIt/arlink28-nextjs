# ARLink28 VPS Deployment Handover

**Last updated:** 15 October 2026\
**Status:** Production stack is deployed and healthy on the VPS, reachable
only through an SSH tunnel. **DNS and HTTPS are the next step**; nothing is
public yet and the old site still serves `arlink28.com`.

## Read this first

This file lets you (or Claude Code) resume the production deployment cold.
Treat "Done and verified" as fact, "Not done" as work, and the **Resume here**
section as the next concrete steps. Do not put credentials, keys, passwords or
connection strings in this file or in Git.

| Question | Answer |
| --- | --- |
| What is left before the site is public? | DNS records, Caddy up (HTTPS), seed content, mail login, cutover of `arlink28.com` |
| What is the next action? | Add the DNS records in **Resume here, step 1** |
| Is anything public today? | No. Only SSH (22) listens on the VPS. The old site on another server still serves `arlink28.com` |
| Where do I test the new stack? | Through an SSH tunnel (see **Testing without DNS**) |

## Environments and branches

| | Staging | Production |
| --- | --- | --- |
| Branch | `develop` | `main` |
| Web | Vercel | Docker on the VPS |
| API | Render | Docker on the VPS |
| Database | Supabase | PostgreSQL 17 in Docker, private network |
| Media (photos) | Supabase Storage (`ArlinkBucket`) | VPS Docker volume `arlink28-media` |

Flow: `feature/*` → PR → `develop` → PR → `main`. The server deploys `main` of
both repos. GitHub repos (owner `devs-builtIt`): `arlink28-nextjs` (web, monorepo)
and `arlink28-api`. `shifttechgs` has push access but not admin, so only the owner
can change repo settings (deploy keys, branch protection). Merges are done by the
owner on GitHub.

Vercel's production site currently builds `main` too. Once the VPS is live, point
Vercel's production branch at `develop` so staging stays staging.

## Architecture

```text
Internet ─▶ Caddy (80/443, automatic HTTPS) ─▶ web (Next.js :3000)   ┐ network arlink28-network
                                              └▶ api (ASP.NET :8080)  ┘
                                                      │
                                    network arlink28-db (internal, no internet)
                                                      ▼
                                              postgres (17, no host port)
```

- The browser only talks to the web app. `apps/web` proxies `/api/v1/*` to
  `http://api:8080` server-side and rewrites `/media/*` to the API, so there is no
  CORS. `api.arlink28.com` is public for tools and tests.
- Postgres is on the internal `arlink28-db` network only. Only Caddy will publish
  ports.
- API never migrates on boot; `deploy.sh` runs `migrate` as a separate step after a
  database dump.
- Files: `deploy/` in the web repo (`web.Dockerfile`, `compose.yaml`, `Caddyfile`,
  `deploy.sh`, `init-secrets.sh`, `README.md`). The API Dockerfile is in the API repo.

## VPS

| Item | Value |
| --- | --- |
| Provider | Hostinger |
| Public IPv4 | `69.62.107.166` (no IPv6 records) |
| Hostname | `srv2048608` |
| OS | Ubuntu 26.04.1 LTS, x86_64 |
| Resources | about 15 GiB RAM, 193 GB disk (about 7 GB used) |
| Docker / Compose | `29.9.0` / `v5.6.0` |
| Account | `deploy` (key-only SSH, root login and passwords disabled) |

Layout under `/opt/arlink28/`:

| Path | What |
| --- | --- |
| `src/web`, `src/api` | git clones of the two repos (read-only deploy keys, detached at `origin/main`) |
| `app/` | `compose.yaml`, `Caddyfile`, `.env` (`ACME_EMAIL`, `RELEASE_TAG`), `test-ports.yaml` (temporary) |
| `secrets/` | `postgres.env`, `api.env` (mode 600, folder 700). **Never print or commit** |
| `backups/` | pre-deploy database dumps, last 10 kept |
| `releases.log`, `deploy.log` | release history and the last deploy's output |

Docker objects: network `arlink28-network` and volume `arlink28-postgres-data`
(both pre-existing, declared `external` so Compose can never delete them),
network `arlink28-db`, volumes `arlink28-media`, `arlink28-logs`,
`arlink28-caddy-data`, `arlink28-caddy-config`.

## How to get in (Claude Code or a person)

1. SSH key: `~/.ssh/id_ed25519` on the owner's Windows PC. It has a passphrase,
   so load it into the Windows agent once per login session (elevated PowerShell:
   `Start-Service ssh-agent`, then `ssh-add $env:USERPROFILE\.ssh\id_ed25519`).
2. Use the **Windows** `ssh.exe` (it sees that agent). From Git Bash call
   `/c/Windows/System32/OpenSSH/ssh.exe`; Git Bash's own `ssh` does not.
3. `sudo` asks for a password except for Docker: `/etc/sudoers.d/arlink28-deploy`
   allows `deploy` to run only the Docker binary without one (`sudo -n docker …`).
   Everything else needs the owner at a terminal.
4. Run multi-line work as a script piped over SSH (`ssh … 'bash -s' < script.sh`),
   not as a quoted one-liner, and add `< /dev/null` to `docker compose exec` inside
   such scripts or it swallows the rest of the script from stdin.
5. Do not use root SSH or password login. Do not add `deploy` to the `docker` group.

## Done and verified

- [x] VPS, `deploy` user, key-only SSH, UFW (22/80/443), Docker + Compose
- [x] EF Core migrations (`InitialCreate`) in the API; fresh database builds from them; CI checks this
- [x] Production Dockerfiles (web and API, both run as non-root); CI builds both
- [x] `compose.yaml`, `Caddyfile`, `deploy.sh`, `init-secrets.sh`
- [x] Deploy keys created on the server and added (read-only) to both repos
- [x] Secrets created on the server via `init-secrets.sh` (first admin `developers@arlink28.com`)
- [x] Two deploys done (`releases.log`): `ba4ce6ee4-c2bd18191`, then `8f31d76bc-3d7cb01ce`
- [x] postgres, api, web healthy; 19 tables; admin `developers` seeded on first boot
- [x] API `/health` 200; web `/`, `/packages`, `/admin/login`, `/api/v1/packages` 200 from inside the server
- [x] Enquiry emails routed: see below (code merged, addresses live in the API container)
- [x] Staging cutover plan written (below)

### Enquiry email routing (live in the container)

Every enquiry is saved to the database first; the email is sent afterwards.

| Enquiry | Emailed to |
| --- | --- |
| Package, flight, hotel, visa, charter, quote (types `Package`, `Booking`) | `developers@`, `reservations@arlink28.com` |
| General contact form (`General`, `Partnership`, `Career`, `Investor`) | `developers@`, `info@arlink28.com` |

Set in `compose.yaml` as `EnquirySettings__NotifyTo`, `__ReservationsTo`,
`__ContactTo`. Test sends via Gmail SMTP worked from a laptop with a Google app
password (both routes delivered without error).

## Not done

- [ ] **DNS records** for `api` and `new` (then `@`/`www` at cutover)
- [ ] **Caddy not started** (so no HTTPS yet)
- [ ] **Mail login on the server**: `EmailSettings__SmtpHost/User/Pass` in `api.env` are empty, so no enquiry email is sent from production yet
- [ ] Production content not seeded (the package list is empty)
- [ ] Nightly backups to an off-server location, and a tested restore
- [ ] Hostinger panel firewall: confirm ports 80/443 are open to the internet
- [ ] Supabase baseline SQL run on the staging database (see Open items)
- [ ] Point Vercel production at `develop` after cutover

## DNS situation (checked 14 Oct 2026)

| | |
| --- | --- |
| Nameservers | `ns-cloud-e1…e4.googledomains.com` (Google Domains / Squarespace Domains or Google Cloud DNS). **Not Hostinger**, so the Hostinger plugin cannot edit DNS. The owner edits records in that provider's panel |
| `arlink28.com` A | `65.21.29.43` (Hetzner, LiteSpeed). A **live site** "ARLinks - Premium African Aviation" |
| Mail | Google Workspace: MX `smtp.google.com`, SPF `v=spf1 include:_spf.google.com ~all`. No DMARC or DKIM found at the names checked |
| `www`, `api`, `new` | no records |

**Never edit or delete the MX, SPF, DKIM or DMARC records.** Do not point
`arlink28.com` at the VPS until content is seeded and reviewed: the production
database starts empty.

## Resume here: DNS and HTTPS (staged cutover)

Check state first:

```bash
# on your PC
nslookup -type=A api.arlink28.com 1.1.1.1
nslookup -type=A new.arlink28.com 1.1.1.1
```

### Step 1: add two records (no effect on the live site)

| Type | Name | Value |
| --- | --- | --- |
| A | `api` | `69.62.107.166` |
| A | `new` | `69.62.107.166` |

Wait until both resolve to `69.62.107.166`. Do not start Caddy before they do:
it requests certificates for every site in the Caddyfile at startup, and repeated
failures hit Let's Encrypt's failed-validation limit.

### Step 2: start Caddy (certificates for `api` and `new`)

Caddy is the only service that publishes ports. The Caddyfile on `main` serves just
`api.arlink28.com` and `new.arlink28.com` (the main-domain sites are commented out).

While `test-ports.yaml` exists, every compose command must include it (see **Testing
without DNS**), so define a shortcut once per session:

```bash
ssh deploy@69.62.107.166
cd /opt/arlink28/app
DC="sudo docker compose -f compose.yaml -f test-ports.yaml"
$DC up -d --wait caddy
$DC logs --tail=50 caddy      # look for "certificate obtained"
```

Verify from outside the server (your PC):

```powershell
curl.exe -I https://api.arlink28.com/health      # 200
curl.exe -I https://new.arlink28.com/            # 200, header X-Robots-Tag: noindex
curl.exe -I http://new.arlink28.com/             # 308 redirect to https
curl.exe -I https://api.arlink28.com/swagger     # 404 (blocked on purpose)
```

If ports 80/443 do not answer, check the Hostinger VPS panel firewall (hPanel →
VPS → Firewall) and `sudo ufw status` (needs the sudo password).

### Step 3: finish the mail login

On the VPS, in `/opt/arlink28/secrets/api.env` (edit with `nano`, never print):

```text
EmailSettings__SmtpHost=smtp.gmail.com
EmailSettings__SmtpPort=587
EmailSettings__SmtpUser=developers@arlink28.com
EmailSettings__SmtpPass=<Google app password, no spaces>
```

Then `$DC up -d api` (recreates the API with the new env). Create the
app password in the Google account (Security → 2-Step Verification → App passwords).
Gmail may rewrite the sender to the login address unless `noreply@arlink28.com` is a
"send as" alias.

### Step 4: seed the production content (asks for confirmation first)

This writes real data to the production database. The seed commands refuse to run
in Production without `--allow-production`.

```bash
cd /opt/arlink28/app
DC="sudo docker compose -f compose.yaml -f test-ports.yaml"
$DC run --rm -T migrate seed-catalogue --allow-production
$DC run --rm -T migrate seed-destinations --allow-production
```

(`migrate` is the one-off service that runs the API image; arguments replace its
`migrate` command. These two invocations have **not been run yet**; run `--dry-run`
variants first where supported: `seed-products`, `seed-photos`, `seed-destinations`
accept `--dry-run`.) Destination hero photos need `--photos=<folder>` on the
server; copy the folder in first or add photos later in the admin. Everything
seeded is a Draft: review and publish in the admin.

### Step 5: review at `https://new.arlink28.com`

- Sign in at `/admin/login` as `developers@arlink28.com` (password was typed at the
  server prompt; if lost, reset it in the admin or re-seed, do not edit the DB by hand).
- Upload a photo to a package, open it on the site (proves `/media` on the VPS volume).
- Send a test enquiry from each form; check the database row and the three inboxes.
- Note: links in emails use `https://arlink28.com`, which is still the old site until cutover.

### Step 6: prepare, then cut over

1. A day before: lower the TTL of the `@` record to 300 seconds.
2. In `deploy/Caddyfile` (web repo): uncomment the `arlink28.com` and `www` sites,
   delete the `new` site. PR into `main` (and `develop`), owner merges.
3. At the DNS provider: point `@` to `69.62.107.166` (A) and `www` to `arlink28.com`
   (CNAME) or `69.62.107.166` (A). Leave all mail records alone. Wait until both
   resolve to the VPS (`nslookup … 1.1.1.1`).
4. **Only then** on the VPS: `bash /opt/arlink28/src/web/deploy/deploy.sh`. It copies
   the new Caddyfile in place and reloads Caddy, which then requests certificates for the
   main names. If you deploy before DNS points here, Caddy fails those certificates
   and can hit Let's Encrypt's failed-validation limit.
5. Verify `https://arlink28.com`, `https://www.arlink28.com` (redirects to apex), the
   admin, an enquiry, a photo.
6. Set `AdminBootstrap__Enabled=false` in `api.env`, `up -d api`.
7. Point Vercel's production branch at `develop`.
8. **Rollback:** change the `@` A record back to `65.21.29.43`. Keep the old server
   running until you are sure.

## Testing without DNS (SSH tunnel)

`test-ports.yaml` (kept on the server, not in Git) binds web and API to the
server's loopback only:

```text
web  127.0.0.1:13000      api  127.0.0.1:18080
```

From a PowerShell window on your PC (leave it open):

```powershell
ssh -N -L 23000:127.0.0.1:13000 -L 28080:127.0.0.1:18080 deploy@69.62.107.166
```

Then browse `http://localhost:23000` (site), `/admin/login`, and
`http://localhost:28080/health`. Use ports like 23000, not 3000: your local dev
server probably already uses 3000. While `test-ports.yaml` is in use, pass
`-f compose.yaml -f test-ports.yaml` to every compose command, or the ports vanish
on the next recreate. To remove the ports: `sudo docker compose up -d`
(without the override) and delete the file.

## Open items and decisions

| Item | Notes |
| --- | --- |
| Supabase baseline | `docs/migrations/baseline-existing-database.sql` (API repo) must be run once on the staging Supabase database before anything runs `migrate` against it. Not run yet |
| Render staging | Had an open incident (builds/deploys not starting, 14 Oct) and `hibernate-wake-error`. Redeploy from the Render dashboard once the incident clears; check `/health` |
| PR #13 (web) | Same cutover change into `develop`; merge any time |
| API data-protection keys | Warning "keys not persisted" in API logs. Add a volume for `/home/app/.aspnet/DataProtection-Keys` (needs a Dockerfile `mkdir`+`chown`) if any feature depends on it. Harmless today |
| `libgssapi_krb5` message | Npgsql probing for Kerberos; harmless |
| Backups | `deploy.sh` dumps before each deploy only. Add a nightly `pg_dump` plus a `arlink28-media` archive, copied off the server, and rehearse a restore |
| DMARC | None published. Consider adding a DMARC record for `arlink28.com` once mail is stable (edit with care) |
| Media | Production photos live only in the `arlink28-media` volume: include it in backups |
| Postgres version | Running 17 (matches CI/Supabase); ADR 0005 said 18 |
| Compose commands | Always run from `/opt/arlink28/app`. Never `down -v`, `volume prune` or `system prune --volumes` |
| `deploy.sh` and the test ports | `deploy.sh` uses `compose.yaml` only, so a deploy removes the loopback test ports. Re-add by recreating with `-f test-ports.yaml`, or finish testing before the cutover |
| Caddyfile changes | `deploy.sh` now writes the file in place and runs `caddy reload`. (Fixed in this branch; an older `deploy.sh` replaced the file and Caddy kept the stale one) |

## Lessons learned (so you do not repeat them)

| Symptom | Cause | Fix |
| --- | --- | --- |
| `dotnet ef` hit the dev database | The design-time factory prefers `DirectConnection` from user secrets, and secrets beat env vars | Use `MIGRATION_CONNECTION` (now supported) or `--connection` |
| API repo "had no migrations" | `.gitignore` excluded `Migrations/` | Rule removed |
| `git checkout` on the server refused | `chmod +x` changed file modes | `core.fileMode false` set in both clones; run scripts with `bash script.sh` |
| `sudo docker compose` ignored `RELEASE_TAG` | `sudo` resets the environment | Tag is written to `app/.env` |
| `docker compose exec` ate the script | It reads stdin | Add `< /dev/null` |
| Background deploy never ran | `cmd1 && cmd2 &` backgrounds the whole chain | Upload first, then start with `(setsid nohup … &)` |
| Caddy and DNS | Caddy requests certificates for all sites at start | Keep un-pointed names commented out |
| Vercel site stale | Production builds `main`, work was only on `develop` | PR `develop` → `main` |
| Render 503 `hibernate-wake-error` | Free instance would not wake (Render incident) | Wait, then Manual Deploy |

## Security notes

- Secrets live only in `/opt/arlink28/secrets/` (mode 600) and the owner's own
  tools. They are not in Git, images or this file.
- Several secrets were pasted into the chat during setup: a proposed admin password,
  the Google account password, a Google app password and an unused Hostinger API
  token. **Treat them all as exposed:** make sure the admin password on the server
  is a different, fresh one (change it after first login), change the Google account
  password, revoke and recreate the Google app password, and revoke the Hostinger token.
- The `deploy` sudo rule covers only the Docker binary. Docker is root-equivalent,
  so protect the SSH key and its passphrase.
- Do not expose port 5432 or any app port. Only Caddy publishes 80/443.

## Useful commands

```bash
cd /opt/arlink28/app
sudo docker compose -f compose.yaml -f test-ports.yaml ps
sudo docker compose logs --tail=100 api        # also: web, caddy, postgres
tail /opt/arlink28/releases.log
bash /opt/arlink28/src/web/deploy/deploy.sh                       # origin/main of both
bash /opt/arlink28/src/web/deploy/deploy.sh <web-sha> <api-sha>   # roll back / pin
df -h /; free -h
```

## Instructions to Claude Code

Treat this document as the verified current state, not proof that future work is
complete. Before changing anything, inspect the relevant repository and server
configuration. Prefer small, reversible changes. Explain changes that affect SSH,
firewall rules, persistent data, DNS or production services before applying them.
Never expose secrets or perform destructive production operations without explicit
approval. After each step, report what changed, what was verified, what remains,
and the next concrete action. Update this file with verified facts only.

**Immediate next action:** confirm the owner has added the `api` and `new` A
records (Resume here, step 1), then start Caddy (step 2).
