#!/bin/bash
set -e

echo "=================================================="
echo "      PARKO SYSTEM             "
echo "      Production Deployment Script (Linux)        "
echo "=================================================="
echo

# 1. Environment File Check
if [ ! -f .env ]; then
  echo "⚠️  .env file not found! Copying from .env.example..."
  cp .env.example .env
  echo "✅ Created .env with default template values."
  echo "👉 Please verify secrets and passwords inside .env file."
  echo
fi

# Load variables
export $(grep -v '^#' .env | xargs)

# 2. Directory Structure Check
echo "📁 Ensuring required mount directories exist..."
mkdir -p infra/database/backup \
         infra/nginx/certs \
         infra/nginx/logs \
         logs/backend \
         backend/uploads
echo "✅ Directories verified."
echo

# 3. Pull Base Images & Build
echo "🐳 Pulling latest base images and building services..."
docker compose pull
docker compose build --pull
echo "✅ Services build completed."
echo

# 4. Start Containers
echo "🚀 Launching PARKO services in background..."
docker compose up -d
echo "✅ Containers started."
echo

# 5. Health Check Loop
echo "⏳ Waiting for all services to become healthy..."
TIMEOUT=90
ELAPSED=0
HEALTHY=false

while [ $ELAPSED -lt $TIMEOUT ]; do
  # Check if any container is unhealthy or starting
  UNHEALTHY_COUNT=$(docker compose ps --format json | grep -c '"HealthStatus":"unhealthy"' || true)
  STARTING_COUNT=$(docker compose ps --format json | grep -c '"HealthStatus":"starting"' || true)
  TOTAL_COUNT=$(docker compose ps --format json | grep -c '"State":"running"' || true)
  
  # Check if there are exited containers
  EXITED_COUNT=$(docker compose ps --format json | grep -v '"State":"running"' | grep -c '"State":' || true)

  if [ "$EXITED_COUNT" -gt 0 ]; then
    echo "❌ Some containers exited or failed to start!"
    docker compose ps
    exit 1
  fi

  if [ "$STARTING_COUNT" -eq 0 ] && [ "$UNHEALTHY_COUNT" -eq 0 ] && [ "$TOTAL_COUNT" -gt 0 ]; then
    HEALTHY=true
    break
  fi

  sleep 3
  ELAPSED=$((ELAPSED + 3))
  echo -n "."
done

echo
if [ "$HEALTHY" = true ]; then
  echo "🎉 Success! All PARKO services are healthy and running."
  echo "--------------------------------------------------"
  echo "Access Gateways:"
  echo "  - HTTP Proxy:  http://localhost:${PARKO_PORT:-39741}"
  echo "  - HTTPS Proxy: https://localhost:${PARKO_SSL_PORT:-39742} (Self-Signed)"
  echo "--------------------------------------------------"
else
  echo "⚠️  Timeout waiting for services to become healthy."
  echo "Please check the logs using: docker compose logs"
  docker compose ps
  exit 1
fi
