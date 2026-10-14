# ARLink28 VPS Deployment Handover

**Last updated:** 12 October 2026\
**Status:** VPS prepared; DNS and application deployment have not
started.

## Purpose

This file is a handover for Claude Code to continue ARLink28 production
deployment. Treat completed items as verified current state; do not
assume planned work has happened.

## Target architecture

-   Next.js frontend: `https://arlink28.com`
-   ASP.NET Core / C# API: `https://api.arlink28.com`
-   PostgreSQL: private Docker networking only; no public port
-   Caddy: reverse proxy on public ports 80 and 443, automatic TLS
-   Docker Compose for service orchestration

## VPS details

  Item              Value
  ----------------- ----------------------------
  Provider          Hostinger
  Public IPv4       `69.62.107.166`
  Hostname          `srv2048608`
  OS                Ubuntu 26.04.1 LTS, x86_64
  RAM               Approximately 15 GiB
  Disk              Approximately 193 GB
  Docker Engine     `29.9.0`
  Docker Compose    `v5.6.0`
  Deployment user   `deploy`
  Deployment root   `/opt/arlink28`

Do not put credentials, private keys, passwords, or production
connection strings in this document or source control.

## Completed work

### SSH and account

-   Created non-root account `deploy`.

-   Added SSH authorized key and verified key-based login from Windows
    PowerShell:

    ``` powershell
    ssh deploy@69.62.107.166
    ```

-   Verified `sudo whoami` returns `root`.

-   Verified effective SSH configuration:

    ``` bash
    sudo sshd -T | grep -E '^(permitrootlogin|passwordauthentication|pubkeyauthentication|kbdinteractiveauthentication)'
    ```

    Output:

    ``` text
    permitrootlogin no
    pubkeyauthentication yes
    passwordauthentication no
    kbdinteractiveauthentication no
    ```

Keep key-based access working. Do not re-enable root SSH login or
password-based SSH authentication. Before changing SSH configuration,
run `sudo sshd -t` and keep an existing session open until a new
connection is verified.

### Firewall

UFW is active. Inbound rules allow OpenSSH (22), HTTP (80), and HTTPS
(443), for IPv4 and IPv6. Default incoming policy is deny.

Check with:

``` bash
sudo ufw status verbose
```

Do not expose PostgreSQL port `5432` or application ports publicly.

### Docker and directories

Docker Engine and Docker Compose are installed. The `deploy` account
currently runs Docker commands with `sudo`, for example
`sudo docker ps`.

**Security note:** Do not add `deploy` to the `docker` group casually;
Docker group access can effectively grant root-level control. Continue
using `sudo docker ...` unless this is deliberately reviewed.

Created directory structure:

``` text
/opt/arlink28/
├── app/
├── backups/
├── caddy/
└── secrets/
```

`/opt/arlink28` is owned by `deploy:deploy` with mode `750`.
`/opt/arlink28/secrets` is owned by `deploy:deploy` with mode `700`.

Created Docker resources:

-   Network: `arlink28-network`
-   Volume: `arlink28-postgres-data`

Verify with:

``` bash
ls -la /opt/arlink28
sudo docker network ls
sudo docker volume ls
sudo docker ps
```

At last check, there were no application containers running. PostgreSQL
has not been deployed yet.

## DNS status

DNS has **not** been configured, and the DNS provider/registrar has not
yet been confirmed.

Desired hostnames:

-   `arlink28.com` --- frontend
-   `api.arlink28.com` --- API
-   Optional `www.arlink28.com` alias/redirect

After confirming the provider and reviewing existing records, configure:

  Type    Name    Value
  ------- ------- -----------------
  A       `@`     `69.62.107.166`
  A       `api`   `69.62.107.166`
  CNAME   `www`   `arlink28.com`

Do not delete or overwrite existing email records (MX, SPF, DKIM, DMARC)
or unrelated records. Check for conflicting A/AAAA/CNAME records. If an
AAAA record exists but IPv6 web traffic is not configured on the VPS,
investigate it before proceeding.

Verify DNS from PowerShell:

``` powershell
Resolve-DnsName arlink28.com
Resolve-DnsName api.arlink28.com
Resolve-DnsName www.arlink28.com
```

Wait until DNS points correctly before expecting Caddy to obtain public
TLS certificates.

## Required architecture and security

Use Docker Compose. Intended services:

-   `caddy`: the only service publishing host ports 80 and 443
-   `web`: Next.js; internal Docker networking only
-   `api`: ASP.NET Core; internal Docker networking only
-   `postgres`: PostgreSQL; internal/private networking only

Route `arlink28.com` (and optionally `www.arlink28.com`) to the Next.js
service and `api.arlink28.com` to the API service. Caddy should proxy to
Docker service names and internal container ports, not `localhost` on
the VPS.

Use the existing network and volume safely. Be careful about Compose
project naming so the deployment does not accidentally create duplicate
networks or volumes. Explicitly declare/reference existing resources
where appropriate. Prefer a separate internal database network: attach
the API to both the proxy-facing network and database network; Caddy
does not need database access.

Use the existing named volume `arlink28-postgres-data` for PostgreSQL
persistence. Do not run `docker compose down -v`, remove volumes, or
perform destructive database operations without explicit approval and a
verified backup.

Keep production `.env` files and secrets under `/opt/arlink28/secrets/`
or another protected location outside Git. Restrict permissions, use a
strong unique database password, and never commit secrets or bake them
into image layers/build arguments. Check `.gitignore`.

## Next steps for Claude Code

### Phase 1 --- Inspect application repositories

1.  Identify the frontend and API repositories and inspect their README
    files, package/project files, lockfiles, existing Dockerfiles,
    environment examples, and health endpoints.
2.  Confirm Next.js version, package manager, build/start commands,
    required environment variables, and which variables are safe for
    browser exposure.
3.  Confirm .NET target framework, API listening port, configuration
    keys, health endpoints, PostgreSQL provider, and migration approach.
4.  Establish whether the API already supports PostgreSQL. Do not assume
    or invent configuration keys or migration commands.
5.  Report findings and gaps before changing application architecture.

### Phase 2 --- Prepare production deployment files

1.  Create or refine production Dockerfiles for Next.js and ASP.NET
    Core. Use multi-stage builds where appropriate, keep images lean,
    and run containers as non-root where supported.

2.  Prepare a production Compose file under `/opt/arlink28/app/` (or
    document another chosen path).

3.  Prepare Caddy configuration and persistent storage for its
    configuration/certificates.

4.  Add sensible restart policies and meaningful health checks. Do not
    assume `depends_on` alone means a service is ready.

5.  Publish only Caddy ports 80 and 443. Do not publish PostgreSQL,
    frontend, or API ports directly.

6.  Reuse existing Docker network/volume safely.

7.  Keep secrets outside source control and image layers.

8.  Validate the Compose file before starting services:

    ``` bash
    cd /opt/arlink28/app
    sudo docker compose config
    ```

    Avoid printing interpolated secrets to shared logs or terminals.

### Phase 3 --- Configure DNS and HTTPS

1.  Ask which provider manages `arlink28.com`; this is not yet known.
2.  Review existing DNS records before editing them.
3.  Configure the root and API A records, and `www` if desired.
4.  Verify DNS publicly resolves to `69.62.107.166`.
5.  Validate Caddy configuration, then start/reload Caddy when service
    names and ports are correct.
6.  Verify certificates, HTTP-to-HTTPS redirects, frontend routing, and
    API routing from outside the VPS.
7.  Do not claim HTTPS is working until it has been tested.

### Phase 4 --- Deploy and verify

1.  Deploy PostgreSQL with persistent storage and no host-published
    database port.
2.  Configure the API connection string to use the PostgreSQL Compose
    service name, not a public IP or `localhost`.
3.  Apply migrations using the repository's established, reviewed
    process.
4.  Verify API-to-database connectivity and health checks.
5.  Verify the frontend calls `https://api.arlink28.com`; check CORS,
    auth callbacks, cookies, and environment-specific URLs.
6.  Test important user flows and review container logs.
7.  Check that credentials are not exposed in browser bundles,
    responses, logs, or Git.

### Phase 5 --- Operations

1.  Create and test a PostgreSQL backup and restore process. Prefer a
    secure off-server copy; a Docker volume is not a backup.
2.  Document safe deployment and rollback steps for app releases and
    database migrations.
3.  Use pinned image versions or a documented image-tagging approach;
    avoid uncontrolled production upgrades.
4.  Monitor disk, memory, container health, and TLS renewal.
5.  Review security updates and provider-level firewall controls.
6.  Update this handover with actual paths, DNS records,
    environment-variable names (never values), commands, decisions, and
    verification results.

## Useful diagnostic commands

``` bash
hostnamectl
sudo ufw status verbose
sudo docker ps
sudo docker network ls
sudo docker volume ls
sudo docker compose version
df -h
free -h
```

When deployment files exist:

``` bash
cd /opt/arlink28/app
sudo docker compose config
sudo docker compose ps
sudo docker compose logs --tail=100
```

Specify `-f` if the Compose file has another name. Avoid printing
environment files or secrets. Do not use
`docker system prune --volumes`, `docker volume prune`, or
`docker compose down -v` as routine cleanup.

## Current checklist

-   [x] VPS provisioned and accessible
-   [x] Non-root `deploy` account and SSH key login verified
-   [x] SSH root/password login disabled and effective settings verified
-   [x] `sudo` access verified
-   [x] UFW active with SSH/HTTP/HTTPS allowed
-   [x] Docker Engine and Compose installed
-   [x] Deployment directories created
-   [x] `arlink28-network` created
-   [x] `arlink28-postgres-data` created
-   [ ] DNS provider confirmed
-   [ ] DNS records configured and verified
-   [ ] Repositories inspected
-   [ ] Production Dockerfiles and Compose file prepared
-   [ ] Caddy configured
-   [ ] PostgreSQL deployed and secured
-   [ ] API deployed and connected to database
-   [ ] Frontend deployed
-   [ ] HTTPS and routing verified externally
-   [ ] Backup/restore tested
-   [ ] Rollback procedure documented

## Instructions to Claude Code

Treat this document as the verified current state, not proof that future
work is complete.

Before changing anything, inspect the relevant repository and server
configuration. Prefer small, reversible changes. Explain changes that
affect SSH, firewall rules, persistent data, or production services
before applying them. Never expose secrets or perform destructive
production operations without explicit approval. After each phase,
report what changed, what was verified, what remains, and the next
concrete action.

**Immediate next action:** Confirm the DNS provider for `arlink28.com`,
then inspect the frontend and API repositories and prepare the
production Docker/Caddy configuration. DNS is not configured and no
application containers are deployed.


//prompt
Read `docs/DEPLOYMENT-HANDOVER.md` completely before making any changes.

You are taking over the ARLink28 VPS deployment. Use the document as the source of truth for the verified server state, architecture, security requirements, and outstanding work.

Start by inspecting the existing frontend and ASP.NET Core API repositories. Identify the current project structure, frameworks, environment variables, database configuration, Docker files, and health endpoints.

Do not assume DNS is configured or that any application containers are running. Do not repeat completed infrastructure setup unnecessarily.

Report your findings and propose the next concrete step before making potentially disruptive production changes. Preserve existing work, never expose secrets, and never delete persistent database data without my explicit approval.

As deployment progresses, update `docs/DEPLOYMENT-HANDOVER.md` with verified changes and remaining tasks.