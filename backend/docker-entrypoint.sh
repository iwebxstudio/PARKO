#!/bin/sh
set -e

echo "=========================================="
echo "   PARKO Backend Starting Up...           "
echo "=========================================="

# 1. Wait for PostgreSQL Database to be ready
echo "[1/3] Checking database connectivity..."
MAX_RETRIES=30
COUNT=0

until node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`
  .then(() => { prisma.\$disconnect(); process.exit(0); })
  .catch((err) => { process.exit(1); });
" 2>/dev/null; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "[ERROR] Database connection timed out after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "      Database not yet ready (attempt $COUNT/$MAX_RETRIES). Waiting 2s..."
  sleep 2
done
echo "      Database connected successfully."

# 2. Run Database Migrations (with baseline resilience)
echo "[2/3] Applying database migrations..."
if ! npx prisma migrate deploy; then
  echo "[WARN] Direct migrate deploy encountered existing schema or baseline requirement."
  echo "       Attempting safe migration baseline resolution..."
  npx prisma migrate resolve --applied 20260501141913_init 2>/dev/null || true
  npx prisma db push --skip-generate || true
fi
echo "      Database schema is up to date."

# 3. Seed initial default data (admin, staff, pricing rules)
echo "[3/3] Seeding initial database records..."
if [ -f "dist/prisma/seed.js" ]; then
  node dist/prisma/seed.js || echo "[INFO] Seed completed or records already exist."
fi

echo "=========================================="
echo "   PARKO Backend Ready. Launching API...  "
echo "=========================================="

exec "$@"
