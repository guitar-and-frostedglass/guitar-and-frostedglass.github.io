#!/bin/bash
# Generate a new Prisma migration locally.
# Starts a temporary local PostgreSQL, runs prisma migrate dev, then stops it.
# Supports macOS (Homebrew) and Linux (systemd).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/../backend"

cd "${BACKEND_DIR}"

MIGRATION_NAME="${1:-}"
if [ -z "${MIGRATION_NAME}" ]; then
  read -rp "Migration name: " MIGRATION_NAME
fi

OS="$(uname -s)"

pg_start() {
  echo "==> Starting local PostgreSQL..."
  case "${OS}" in
    Darwin)
      brew services start postgresql@16 2>/dev/null
      sleep 1
      ;;
    Linux)
      sudo systemctl start postgresql
      sleep 1
      ;;
    *)
      echo "ERROR: Unsupported OS '${OS}'. Use macOS or Linux (including WSL)." >&2
      exit 1
      ;;
  esac
}

pg_stop() {
  echo "==> Stopping local PostgreSQL..."
  case "${OS}" in
    Darwin)
      brew services stop postgresql@16 2>/dev/null
      ;;
    Linux)
      sudo systemctl stop postgresql
      ;;
  esac
}

pg_create_db() {
  local db_name="$1"
  case "${OS}" in
    Darwin)
      /opt/homebrew/opt/postgresql@16/bin/createdb "${db_name}" 2>/dev/null || true
      ;;
    Linux)
      sudo -u postgres createdb "${db_name}" 2>/dev/null || true
      ;;
  esac
}

build_database_url() {
  case "${OS}" in
    Darwin)
      echo "postgresql://$(whoami)@localhost:5432/guitar_frostedglass"
      ;;
    Linux)
      echo "postgresql://postgres:postgres@localhost:5432/guitar_frostedglass"
      ;;
  esac
}

pg_start
pg_create_db "guitar_frostedglass"

DATABASE_URL="$(build_database_url)"

echo "==> Running migration: ${MIGRATION_NAME} ..."
DATABASE_URL="${DATABASE_URL}" \
  npx --no-install prisma migrate dev --name "${MIGRATION_NAME}"

pg_stop

echo "==> Migration created. Don't forget to commit and push so it can be deployed."
