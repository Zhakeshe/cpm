#!/usr/bin/env bash
# Run on the VPS as root after cloning the repo.
# Usage:
#   DOMAIN=scrimmage.example.kz \
#   GIT_REPO=https://github.com/Zhakeshe/cpm.git \
#   GIT_BRANCH=cursor/kern-ftc-scrimmage-1b06 \
#   ADMIN_PASSWORD='...' \
#   bash deploy/setup-vps.sh

set -euo pipefail

DOMAIN="${DOMAIN:?set DOMAIN}"
GIT_REPO="${GIT_REPO:-https://github.com/Zhakeshe/cpm.git}"
GIT_BRANCH="${GIT_BRANCH:-cursor/kern-ftc-scrimmage-1b06}"
APP_DIR="${APP_DIR:-/var/www/kern-ftc-scrimmage}"
DB_NAME="${DB_NAME:-kern_scrimmage}"
DB_USER="${DB_USER:-kern}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

if [[ -z "${ADMIN_PASSWORD}" ]]; then
  ADMIN_PASSWORD="$(openssl rand -base64 18)"
fi
DB_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
SESSION_SECRET="$(openssl rand -hex 32)"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y curl ca-certificates gnupg git nginx certbot python3-certbot-nginx postgresql postgresql-contrib

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

mkdir -p "$(dirname "${APP_DIR}")"
if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "${APP_DIR}" fetch origin
  git -C "${APP_DIR}" checkout "${GIT_BRANCH}"
  git -C "${APP_DIR}" pull --ff-only origin "${GIT_BRANCH}"
else
  git clone --branch "${GIT_BRANCH}" "${GIT_REPO}" "${APP_DIR}"
fi

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

cat > "${APP_DIR}/.env" <<ENV
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}?schema=public"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
ADMIN_SESSION_SECRET="${SESSION_SECRET}"
NEXT_PUBLIC_SITE_URL="https://${DOMAIN}"
NEXT_PUBLIC_INSTAGRAM_URL="https://www.instagram.com/kern.school.kz/"
NEXT_PUBLIC_WHATSAPP_URL="https://wa.me/77775888030"
ENV
chmod 600 "${APP_DIR}/.env"

cd "${APP_DIR}"
npm ci
npx prisma migrate deploy
npm run build

sed "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" "${APP_DIR}/deploy/nginx.conf.tpl" > /etc/nginx/sites-available/kern-ftc-scrimmage
ln -sfn /etc/nginx/sites-available/kern-ftc-scrimmage /etc/nginx/sites-enabled/kern-ftc-scrimmage
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

pm2 start "${APP_DIR}/ecosystem.config.cjs"
pm2 save
env PATH="$PATH" pm2 startup systemd -u root --hp /root >/dev/null || true

certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email --redirect || \
  echo "Certbot skipped — point DNS to this server and rerun: certbot --nginx -d ${DOMAIN}"

echo
echo "Site: https://${DOMAIN}"
echo "Admin: https://${DOMAIN}/admin"
echo "ADMIN_PASSWORD=${ADMIN_PASSWORD}"
