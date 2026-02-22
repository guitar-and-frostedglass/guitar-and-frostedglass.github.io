#!/bin/bash
# start the backend on production server

set -euo pipefail

cd ~/guitar-and-frostedglass-dev/backend

echo "==> Pulling latest code..."
cd .. && git pull && cd backend

echo "==> Building and (re)starting containers..."
docker compose -f docker-compose.prod.yml up -d --build --force-recreate

echo "==> Applying migrations..."
docker compose -f docker-compose.prod.yml run --rm api-prod npx prisma migrate deploy
docker compose -f docker-compose.prod.yml run --rm api-dev npx prisma migrate deploy

echo "==> Service status:"
docker compose -f docker-compose.prod.yml ps

echo "==> Done."
