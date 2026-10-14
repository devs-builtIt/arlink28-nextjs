#!/usr/bin/env bash
# One-time: create the production secret files on the VPS. Run as the `deploy` user.
#
#   ./init-secrets.sh
#
# Writes /opt/arlink28/secrets/{postgres.env,api.env} (mode 600) and /opt/arlink28/app/.env. The database
# password and the token-signing secret are generated here and never printed. The first admin's password
# is typed at the prompt (not echoed). Refuses to overwrite existing files.
set -euo pipefail
umask 077

ROOT=/opt/arlink28
SECRETS=${SECRETS_DIR:-$ROOT/secrets}
APP=$ROOT/app

for f in "$SECRETS/postgres.env" "$SECRETS/api.env"; do
  [ ! -e "$f" ] || { echo "$f already exists; refusing to overwrite it." >&2; exit 1; }
done

read -rp "First admin email [developers@arlink28.com]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-developers@arlink28.com}
read -rp "First admin username [developers]: " ADMIN_USER
ADMIN_USER=${ADMIN_USER:-developers}
read -rsp "First admin password: " ADMIN_PASSWORD; echo
read -rsp "Repeat password: " CHECK; echo
[ "$ADMIN_PASSWORD" = "$CHECK" ] || { echo "Passwords differ." >&2; exit 1; }
[ "${#ADMIN_PASSWORD}" -ge 12 ] || { echo "Use at least 12 characters." >&2; exit 1; }
# env files are read literally by compose; these characters would be misread.
case "$ADMIN_PASSWORD" in *[\$\"\'\\\ \#]*) echo "Avoid \$ \" ' \\ # and spaces in the password." >&2; exit 1;; esac
read -rp "Email for certificate notices [$ADMIN_EMAIL]: " ACME_EMAIL
ACME_EMAIL=${ACME_EMAIL:-$ADMIN_EMAIL}

DB_PASSWORD=$(openssl rand -hex 24)
TOKEN_SECRET=$(openssl rand -hex 48)

install -d -m 700 "$SECRETS"
install -d -m 750 "$APP"

cat > "$SECRETS/postgres.env" <<EOF
POSTGRES_USER=arlink28
POSTGRES_DB=arlink28
POSTGRES_PASSWORD=$DB_PASSWORD
EOF

cat > "$SECRETS/api.env" <<EOF
ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=arlink28;Username=arlink28;Password=$DB_PASSWORD
AppSettings__Secret=$TOKEN_SECRET
# Creates the first admin on an empty database. Set to false after you have signed in once.
AdminBootstrap__Enabled=true
AdminBootstrap__Email=$ADMIN_EMAIL
AdminBootstrap__Username=$ADMIN_USER
AdminBootstrap__Password=$ADMIN_PASSWORD
# Outgoing mail (enquiry notifications, invites, password resets). Fill these in before launch.
EmailSettings__SmtpHost=
EmailSettings__SmtpPort=587
EmailSettings__SmtpUser=
EmailSettings__SmtpPass=
EmailSettings__EnableSsl=true
EmailSettings__FromName=ARLink28
EmailSettings__FromEmail=noreply@arlink28.com
EnquirySettings__NotifyTo=
EOF

echo "ACME_EMAIL=$ACME_EMAIL" > "$APP/.env"
chmod 600 "$SECRETS/postgres.env" "$SECRETS/api.env" "$APP/.env"
echo "Wrote $SECRETS/postgres.env, $SECRETS/api.env and $APP/.env (mode 600)."
echo "Next: set the EmailSettings__* and EnquirySettings__NotifyTo lines in api.env, then run deploy.sh."
