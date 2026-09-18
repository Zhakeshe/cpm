#!/bin/sh
set -e
mkdir -p /backups
while true; do
  FILE="/backups/crm-$(date +%Y%m%d-%H%M%S).sql.gz"
  pg_dump -h postgres -U crm crm | gzip > "$FILE"
  find /backups -name "*.sql.gz" -mtime +"${BACKUP_RETENTION_DAYS:-14}" -delete
  sleep 86400
done
