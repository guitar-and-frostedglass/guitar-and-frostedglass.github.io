#!/bin/bash
# restore a database on the production server from a local backup file

set -euo pipefail
trap 'echo "ERROR: recover failed at line ${LINENO}" >&2; exit 1' ERR

REMOTE_HOST="g-f-backend-ubuntu"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/../backups"

# ---------------------------------------------------------------------------
# Warning screen
# ---------------------------------------------------------------------------
clear
cat <<'BANNER'

    ██████████████████████████████████████████████████████████████████████
    █                                                                    █
    █   ██     ██  █████  ██████  ███    ██ ██ ███    ██  ██████  ██     █
    █   ██     ██ ██   ██ ██   ██ ████   ██ ██ ████   ██ ██       ██     █
    █   ██  █  ██ ███████ ██████  ██ ██  ██ ██ ██ ██  ██ ██   ███ ██     █
    █   ██ ███ ██ ██   ██ ██   ██ ██  ██ ██ ██ ██  ██ ██ ██    ██        █
    █    ███ ███  ██   ██ ██   ██ ██   ████ ██ ██   ████  ██████  ██     █
    █                                                                    █
    █            *** DATABASE RECOVERY ***                                █
    █                                                                    █
    █   This will OVERWRITE a database on the remote server.             █
    █   A safety backup will be created first, but please be careful.    █
    █                                                                    █
    █   gfg_prod = PRODUCTION   gfg_dev = DEVELOPMENT                    █
    █   Make sure you pick the right one!                                 █
    █                                                                    █
    ██████████████████████████████████████████████████████████████████████

BANNER

# ---------------------------------------------------------------------------
# List available backups
# ---------------------------------------------------------------------------
echo ""
echo "  Available backups:"
echo "  ─────────────────────────────────────────────────────────"

BACKUPS=()
while IFS= read -r f; do
  BACKUPS+=("$(basename "$f")")
done < <(ls -t "${BACKUP_DIR}"/*.sql 2>/dev/null)

if [ ${#BACKUPS[@]} -eq 0 ]; then
  echo "  (none found in ${BACKUP_DIR})"
  echo ""
  echo "  Run backup_database.sh first."
  exit 1
fi

PREV_DB=""
for b in "${BACKUPS[@]}"; do
  CUR_DB="$(echo "${b}" | sed -E 's/_[0-9]{8}_[0-9]{6}\.sql$//' | sed -E 's/_pre-recover$//')"
  if [ "${CUR_DB}" != "${PREV_DB}" ]; then
    [ -n "${PREV_DB}" ] && echo ""
    if [ "${CUR_DB}" = "gfg_prod" ]; then
      echo "  [PROD] ${CUR_DB}:"
    elif [ "${CUR_DB}" = "gfg_dev" ]; then
      echo "  [DEV]  ${CUR_DB}:"
    else
      echo "  ${CUR_DB}:"
    fi
    PREV_DB="${CUR_DB}"
  fi
  SIZE="$(du -h "${BACKUP_DIR}/${b}" | cut -f1)"
  echo "    ${b}  (${SIZE})"
done

echo ""
echo "  ─────────────────────────────────────────────────────────"
echo ""

# ---------------------------------------------------------------------------
# Ask user to type the backup filename
# ---------------------------------------------------------------------------
read -rp "  Type the FULL backup filename to restore: " CHOSEN

CHOSEN="$(echo "${CHOSEN}" | xargs)"
if [ -z "${CHOSEN}" ]; then
  echo "  No filename entered. Aborting."
  exit 1
fi

BACKUP_FILE="${BACKUP_DIR}/${CHOSEN}"
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "  File not found: ${BACKUP_FILE}"
  echo "  Aborting."
  exit 1
fi

DB_NAME="$(echo "${CHOSEN}" | sed -E 's/_[0-9]{8}_[0-9]{6}\.sql$//')"
if [ -z "${DB_NAME}" ] || [ "${DB_NAME}" = "${CHOSEN}" ]; then
  echo "  Could not determine database name from filename."
  echo "  Expected format: <dbname>_YYYYMMDD_HHMMSS.sql"
  exit 1
fi

if [ "${DB_NAME}" = "gfg_prod" ]; then
  ENV_LABEL="PRODUCTION"
elif [ "${DB_NAME}" = "gfg_dev" ]; then
  ENV_LABEL="DEVELOPMENT"
else
  ENV_LABEL="UNKNOWN"
fi

echo ""
echo "  ┌──────────────────────────────────────────────────────┐"
echo "  │  Environment : ${ENV_LABEL}"
echo "  │  Database    : ${DB_NAME}"
echo "  │  File        : ${CHOSEN}"
echo "  │  Server      : ${REMOTE_HOST}"
echo "  └──────────────────────────────────────────────────────┘"
echo ""

if [ "${DB_NAME}" = "gfg_prod" ]; then
  echo "  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "  !!  YOU ARE ABOUT TO OVERWRITE THE PRODUCTION DB.   !!"
  echo "  !!  THIS AFFECTS REAL USERS AND LIVE DATA.          !!"
  echo "  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo ""
fi

# ---------------------------------------------------------------------------
# Final confirmation
# ---------------------------------------------------------------------------
echo "  *** This will OVERWRITE \"${DB_NAME}\" (${ENV_LABEL}) on ${REMOTE_HOST}. ***"
echo ""
read -rp "  Type \"continue\" to proceed: " CONFIRM

if [ "${CONFIRM}" != "continue" ]; then
  echo "  Aborted."
  exit 0
fi

echo ""

# ---------------------------------------------------------------------------
# Safety backup of the current database before overwriting
# ---------------------------------------------------------------------------
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
SAFETY_FILE="${BACKUP_DIR}/${DB_NAME}_pre-recover_${TIMESTAMP}.sql"
REMOTE_TMP="/tmp/gfg-pre-recover-${TIMESTAMP}"

echo "==> Creating safety backup of current ${DB_NAME} before recovery..."

ssh "${REMOTE_HOST}" bash -s -- "${REMOTE_TMP}" "${DB_NAME}" <<'REMOTE_EOF'
  set -euo pipefail
  REMOTE_TMP="$1"; DB="$2"
  mkdir -p "${REMOTE_TMP}"
  cd ~/guitar-and-frostedglass-dev/backend
  docker compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U postgres --clean --if-exists "${DB}" > "${REMOTE_TMP}/${DB}.sql"
REMOTE_EOF

scp "${REMOTE_HOST}:${REMOTE_TMP}/${DB_NAME}.sql" "${SAFETY_FILE}"
ssh "${REMOTE_HOST}" "rm -rf ${REMOTE_TMP}"

SAFETY_SIZE="$(du -h "${SAFETY_FILE}" | cut -f1)"
echo "    Saved: ${SAFETY_FILE} (${SAFETY_SIZE})"

# ---------------------------------------------------------------------------
# Upload and restore
# ---------------------------------------------------------------------------
REMOTE_RESTORE="/tmp/gfg-restore-${TIMESTAMP}"

echo "==> Uploading ${CHOSEN} to remote server..."
ssh "${REMOTE_HOST}" "mkdir -p ${REMOTE_RESTORE}"
scp "${BACKUP_FILE}" "${REMOTE_HOST}:${REMOTE_RESTORE}/restore.sql"

echo "==> Restoring ${DB_NAME} on ${REMOTE_HOST}..."

ssh "${REMOTE_HOST}" bash -s -- "${REMOTE_RESTORE}" "${DB_NAME}" <<'REMOTE_EOF'
  set -euo pipefail
  REMOTE_RESTORE="$1"; DB="$2"
  cd ~/guitar-and-frostedglass-dev/backend
  docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U postgres -d "${DB}" < "${REMOTE_RESTORE}/restore.sql"
REMOTE_EOF

echo "==> Cleaning up remote temp files..."
ssh "${REMOTE_HOST}" "rm -rf ${REMOTE_RESTORE}"

echo ""
echo "==> Recovery complete!"
echo "    Restored ${DB_NAME} from ${CHOSEN}"
echo "    Safety backup: ${SAFETY_FILE}"
