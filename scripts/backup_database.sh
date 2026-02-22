#!/bin/bash
# sync the database from the production server to local machine to create a backup

set -euo pipefail
trap 'echo "ERROR: backup failed at line ${LINENO}" >&2; exit 1' ERR

REMOTE_HOST="g-f-backend-ubuntu"
DATABASES="gfg_prod gfg_dev"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/../backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
REMOTE_TMP_DIR="/tmp/gfg-db-backup-${TIMESTAMP}"

mkdir -p "${BACKUP_DIR}"

echo "==> Creating database dumps on remote server..."

ssh "${REMOTE_HOST}" bash -s -- "${REMOTE_TMP_DIR}" ${DATABASES} <<'REMOTE_EOF'
  set -euo pipefail
  REMOTE_TMP_DIR="$1"; shift
  mkdir -p "${REMOTE_TMP_DIR}"

  cd ~/guitar-and-frostedglass-dev/backend

  for db in "$@"; do
    echo "  Dumping ${db}..."
    docker compose -f docker-compose.prod.yml exec -T postgres \
      pg_dump -U postgres --clean --if-exists "${db}" > "${REMOTE_TMP_DIR}/${db}.sql"
  done

  echo "  Remote dumps complete."
REMOTE_EOF

echo "==> Downloading backups to ${BACKUP_DIR}/ ..."

for db in ${DATABASES}; do
  scp "${REMOTE_HOST}:${REMOTE_TMP_DIR}/${db}.sql" "${BACKUP_DIR}/${db}_${TIMESTAMP}.sql"
done

echo "==> Cleaning up remote temp files..."
ssh "${REMOTE_HOST}" "rm -rf ${REMOTE_TMP_DIR}"

echo "==> Backup complete!"
for db in ${DATABASES}; do
  SIZE="$(du -h "${BACKUP_DIR}/${db}_${TIMESTAMP}.sql" | cut -f1)"
  echo "    ${db}: ${BACKUP_DIR}/${db}_${TIMESTAMP}.sql (${SIZE})"
done

echo "==> Pruning old backups (keeping last 10 per database)..."
for db in ${DATABASES}; do
  ls -t "${BACKUP_DIR}/${db}_"*.sql 2>/dev/null | tail -n +11 | while read -r old; do
    echo "    Removing ${old}"
    rm -f "${old}"
  done
done

echo "==> All done."
