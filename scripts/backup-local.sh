#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
FILE="backups/crm-$(date +%Y%m%d-%H%M%S).sql.gz"
pg_dump "$DATABASE_URL" | gzip > "$FILE"
find backups -name "*.sql.gz" -mtime +"${BACKUP_RETENTION_DAYS:-14}" -delete || true
echo "wrote $FILE"
