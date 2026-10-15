#!/usr/bin/env bash
# Deploy (or roll back) production on the VPS. Run as the `deploy` user.
#
#   ./deploy.sh                          deploy origin/main of both repos
#   ./deploy.sh <web-ref> <api-ref>      deploy specific commits, tags or branches
#
# Rolling back is the same command with the previous refs; they are listed in /opt/arlink28/releases.log.
# Database migrations only move forward: a rollback of the code does not undo them, so a migration that
# is not backward compatible needs its own plan. A database dump is taken before every migration.
#
# Layout on the VPS:
#   /opt/arlink28/src/web, /opt/arlink28/src/api   git clones (read-only deploy keys)
#   /opt/arlink28/app                              compose.yaml, Caddyfile, .env (copied from src/web/deploy)
#   /opt/arlink28/secrets                          postgres.env, api.env (see init-secrets.sh)
#   /opt/arlink28/backups                          pre-deploy database dumps (last 10 kept)
set -euo pipefail
umask 077

ROOT=/opt/arlink28
SRC=$ROOT/src
APP=$ROOT/app
WEB_REF=${1:-origin/main}
API_REF=${2:-origin/main}

dc() { (cd "$APP" && sudo docker compose "$@"); }

checkout() { # <repo dir> <ref> -> short sha
  git -C "$SRC/$1" fetch --prune --tags origin >&2
  git -C "$SRC/$1" checkout --detach --quiet "$2"
  git -C "$SRC/$1" rev-parse --short=9 HEAD
}

WEB_SHA=$(checkout web "$WEB_REF")
API_SHA=$(checkout api "$API_REF")
export RELEASE_TAG="$WEB_SHA-$API_SHA"
echo "Releasing web $WEB_SHA + api $API_SHA"

install -d -m 750 "$APP"
# sudo resets the environment, so the tag cannot reach `sudo docker compose` as a variable. Compose
# reads $APP/.env, so keep it there (ACME_EMAIL stays).
{ grep -v '^RELEASE_TAG=' "$APP/.env" 2>/dev/null || true; echo "RELEASE_TAG=$RELEASE_TAG"; } > "$APP/.env.new"
mv "$APP/.env.new" "$APP/.env"
install -m 644 "$SRC/web/deploy/compose.yaml" "$APP/compose.yaml"
# Write the Caddyfile in place (same inode). `install` would replace the file, and a single-file bind mount
# keeps pointing at the old one, so Caddy would never see the change.
touch "$APP/Caddyfile" && chmod 644 "$APP/Caddyfile"
cat "$SRC/web/deploy/Caddyfile" > "$APP/Caddyfile"

dc config --quiet            # validates the file and that the secret files exist; prints nothing
dc build

dc up -d --wait postgres

install -d -m 700 "$ROOT/backups"
DUMP="$ROOT/backups/pre-$RELEASE_TAG-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
dc exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$DUMP"
echo "Database dump: $DUMP"
(cd "$ROOT/backups" && ls -1t pre-*.sql.gz | tail -n +11 | xargs -r rm --)

dc run --rm -T migrate

dc up -d --wait api web caddy
# A running Caddy keeps the old config until told to reload; recreating it is not needed for that.
dc exec -T caddy caddy reload --config /etc/caddy/Caddyfile < /dev/null
# A single-file bind mount follows the inode it was created with. If the container still sees an older
# Caddyfile than the one on disk (a past `install` replaced the file), the reload above did nothing, so
# recreate Caddy. Certificates live in a volume and survive.
HOST_SUM=$(sha256sum "$APP/Caddyfile" | cut -d' ' -f1)
SEEN_SUM=$(dc exec -T caddy sha256sum /etc/caddy/Caddyfile < /dev/null | cut -d' ' -f1)
if [ "$HOST_SUM" != "$SEEN_SUM" ]; then
  echo "Caddy sees a stale Caddyfile; recreating the container"
  dc up -d --force-recreate --no-deps --wait caddy
fi
dc ps

echo "$(date -u +%FT%TZ) $RELEASE_TAG web=$WEB_REF api=$API_REF" >> "$ROOT/releases.log"
echo "Done. Check: curl -fsS https://api.arlink28.com/health"
