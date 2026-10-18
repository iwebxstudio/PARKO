#!/bin/bash
set -e

# ==============================================================================
#      PARKO SYSTEM             
#      ສະຄຣິບສຳລັບ Deploy ລະບົບຂຶ້ນ Production (Linux Bash)
#      ເຮັດໜ້າທີ່ກວດສອບຄວາມພ້ອມ, Build Docker Images ແລະ ເລີ່ມຕົ້ນ Services ທັງໝົດ
# ==============================================================================
echo

# 1. ກວດສອບຟາຍສະພາບແວດລ້ອມ (.env) ຖ້າຍັງບໍ່ມີແມ່ນຈະທຳການສຳເນົາຈາກ .env.example ມາສ້າງໃຫ້ອັດຕະໂນມັດ
if [ ! -f .env ]; then
  echo "⚠️  .env file not found! Copying from .env.example..."
  cp .env.example .env
  echo "✅ Created .env with default template values."
  echo "👉 Please verify secrets and passwords inside .env file."
  echo
fi

# ອ່ານ ແລະ ໂຫຼດຄ່າຕົວປ່ຽນຕ່າງໆຈາກຟາຍ .env ເຂົ້າສູ່ Shell Environment
export $(grep -v '^#' .env | xargs)

# 2. ກວດສອບ ແລະ ສ້າງໂຄງສ້າງໂຟນເດີທີ່ຈຳເປັນສຳລັບการ Mount Volume ຂອງ Docker ຖ້າຍັງບໍ່ທັນມີ
echo "📁 Ensuring required mount directories exist..."
mkdir -p infra/database/backup \
         infra/nginx/certs \
         infra/nginx/logs \
         logs/backend \
         backend/uploads
echo "✅ Directories verified."
echo

# 3. ດາວໂຫຼດ Base Images ລ່າສຸດ ແລະ ທຳການ Build ທຸກໆ Services ຂອງລະບົບ PARKO ໃຫ້ພ້ອມໃຊ້ງານ
echo "🐳 Pulling latest base images and building services..."
docker compose pull
docker compose build --pull
echo "✅ Services build completed."
echo

# 4. ສັ່ງເລີ່ມຕົ້ນການເຮັດວຽກຂອງ Docker Containers ທັງໝົດໃນແບບ Background Daemon
echo "🚀 Launching PARKO services in background..."
docker compose up -d
echo "✅ Containers started."
echo

# 5. ກວດສອບສະຖານະຄວາມພ້ອມໃຊ້ງານ (Health Check Loop) ເພື່ອຮັບປະກັນວ່າທຸກ Service ເຮັດວຽກໄດ້ຢ່າງສົມບູນ
echo "⏳ Waiting for all services to become healthy..."
TIMEOUT=90
ELAPSED=0
HEALTHY=false

while [ $ELAPSED -lt $TIMEOUT ]; do
  # ກວດສອບຈຳນວນ Container ທີ່ສະຖານະບໍ່ພ້ອມໃຊ້ງານ (unhealthy) ຫຼື ພວມຢູ່ໃນໄລຍະເລີ່ມຕົ້ນ (starting)
  UNHEALTHY_COUNT=$(docker compose ps --format json | grep -c '"HealthStatus":"unhealthy"' || true)
  STARTING_COUNT=$(docker compose ps --format json | grep -c '"HealthStatus":"starting"' || true)
  TOTAL_COUNT=$(docker compose ps --format json | grep -c '"State":"running"' || true)
  
  # ກວດສອບວ່າ Container ໃດໜຶ່ງດັບການເຮັດວຽກ ຫຼື ເກີດຂໍ້ຜິດພາດ (exited) ຫຼືບໍ່
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
