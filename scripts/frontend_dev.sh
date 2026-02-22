#!/bin/bash
# start the frontend development on local machine

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="${SCRIPT_DIR}/../frontend"

cd "${FRONTEND_DIR}"

if [ ! -d "node_modules" ]; then
  echo "==> Installing dependencies..."
  npm install
fi

echo "==> Starting frontend dev server on http://localhost:3000 ..."
npm run dev
