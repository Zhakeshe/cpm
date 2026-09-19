#!/usr/bin/env bash
set -euo pipefail

# Creates a production .env on the server if it does not exist.
# WABA and SIP tokens stay empty until filled in Meta / PBX.

ROOT="${1:-.}"
ENV_FILE="$ROOT/.env"
APP_URL="${APP_URL:-http://$(hostname -I | awk '{print $1}')}"

if [[ -f "$ENV_FILE" ]]; then
  echo "Using existing $ENV_FILE"
  exit 0
fi

rand() { openssl rand -hex 24; }

POSTGRES_PASSWORD="$(rand)"
SESSION_SECRET="$(rand)$(rand)"
S3_SECRET_KEY="$(rand)"
WHATSAPP_VERIFY_TOKEN="$(rand)"
SIP_WEBHOOK_SECRET="$(rand)"
META_LEADS_VERIFY_TOKEN="$(rand)"

cat > "$ENV_FILE" <<EOF
NODE_ENV=production
APP_URL=${APP_URL}
COOKIE_SECURE=false
API_RATE_LIMIT=600

POSTGRES_USER=crm
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=crm
DATABASE_URL=postgresql://crm:${POSTGRES_PASSWORD}@postgres:5432/crm?schema=public
REDIS_URL=redis://redis:6379
SESSION_SECRET=${SESSION_SECRET}

WHATSAPP_VERIFY_TOKEN=${WHATSAPP_VERIFY_TOKEN}
WHATSAPP_APP_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_GRAPH_VERSION=v21.0

META_LEADS_ACCESS_TOKEN=
META_LEADS_VERIFY_TOKEN=${META_LEADS_VERIFY_TOKEN}

SIP_WEBHOOK_SECRET=${SIP_WEBHOOK_SECRET}
SIP_ORIGINATE_URL=
SIP_API_TOKEN=
SIP_CORPORATE_NUMBER=
SIP_WS_URL=
SIP_DOMAIN=

S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minio
S3_SECRET_KEY=${S3_SECRET_KEY}
S3_BUCKET=crm-media
S3_REGION=us-east-1

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@example.com

BACKUP_RETENTION_DAYS=14
EOF

chmod 600 "$ENV_FILE"
echo "Wrote $ENV_FILE (WABA/SIP tokens empty — fill after Meta/PBX setup)"
