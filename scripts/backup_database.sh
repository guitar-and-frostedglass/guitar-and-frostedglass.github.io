#!/bin/bash
# sync the database from the production server to local machine to create a backup

set -euo pipefail

REMOTE_HOST="g-f-backend-ubuntu"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/../backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
REMOTE_TMP_DIR="/tmp/gfg-db-backup-${TIMESTAMP}"

mkdir -p "${BACKUP_DIR}"

echo "==> Creating database dumps on remote server..."

ssh "${REMOTE_HOST}" bash -s -- "${REMOTE_TMP_DIR}" <<'REMOTE_EOF'
  set -euo pipefail
  REMOTE_TMP_DIR="$1"
  mkdir -p "${REMOTE_TMP_DIR}"

  cd ~/guitar-and-frostedglass-dev/backend

  echo "  Dumping gfg_prod..."
  docker compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U postgres --clean --if-exists gfg_prod > "${REMOTE_TMP_DIR}/gfg_prod.sql"

  echo "  Dumping gfg_dev..."
  docker compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U postgres --clean --if-exists gfg_dev > "${REMOTE_TMP_DIR}/gfg_dev.sql"

  echo "  Remote dumps complete."
REMOTE_EOF

echo "==> Downloading backups to ${BACKUP_DIR}/ ..."

scp "${REMOTE_HOST}:${REMOTE_TMP_DIR}/gfg_prod.sql" "${BACKUP_DIR}/gfg_prod_${TIMESTAMP}.sql"
scp "${REMOTE_HOST}:${REMOTE_TMP_DIR}/gfg_dev.sql"  "${BACKUP_DIR}/gfg_dev_${TIMESTAMP}.sql"

echo "==> Cleaning up remote temp files..."
ssh "${REMOTE_HOST}" "rm -rf ${REMOTE_TMP_DIR}"

PROD_SIZE="$(du -h "${BACKUP_DIR}/gfg_prod_${TIMESTAMP}.sql" | cut -f1)"
DEV_SIZE="$(du -h "${BACKUP_DIR}/gfg_dev_${TIMESTAMP}.sql" | cut -f1)"

echo "==> Backup complete!"
echo "    prod: ${BACKUP_DIR}/gfg_prod_${TIMESTAMP}.sql (${PROD_SIZE})"
echo "    dev:  ${BACKUP_DIR}/gfg_dev_${TIMESTAMP}.sql (${DEV_SIZE})"

# Retain only the 10 most recent backups per database to avoid filling up disk
echo "==> Pruning old backups (keeping last 10 per database)..."
for prefix in gfg_prod gfg_dev; do
  ls -t "${BACKUP_DIR}/${prefix}_"*.sql 2>/dev/null | tail -n +11 | while read -r old; do
    echo "    Removing ${old}"
    rm -f "${old}"
  done
done

echo "==> All done."
