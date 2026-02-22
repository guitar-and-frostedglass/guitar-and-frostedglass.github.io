#!/bin/bash
# apply the migrations to the database

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/../backend"

cd "${BACKEND_DIR}"

MIGRATION_NAME="${1:-}"
if [ -z "${MIGRATION_NAME}" ]; then
  read -rp "Migration name: " MIGRATION_NAME
fi

echo "==> Starting local PostgreSQL..."
brew services start postgresql@16 2>/dev/null
sleep 1

echo "==> Running migration: ${MIGRATION_NAME} ..."
DATABASE_URL="postgresql://$(whoami)@localhost:5432/guitar_frostedglass" \
  npx --no-install prisma migrate dev --name "${MIGRATION_NAME}"

echo "==> Stopping local PostgreSQL..."
brew services stop postgresql@16 2>/dev/null

echo "==> Migration created. Don't forget to commit and push so it can be deployed."
