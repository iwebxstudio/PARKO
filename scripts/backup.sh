#!/bin/bash
set -e

# ໂຫຼດຄ່າຕົວປ່ຽນສະພາບແວດລ້ອມຈາກຟາຍ .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

POSTGRES_USER=${POSTGRES_USER:-parko}
POSTGRES_DB=${POSTGRES_DB:-parko_db}

BACKUP_DIR="infra/database/backup"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo "📂 Backing up database to $FILENAME..."

# ສັ່ງ run ຄຳສັ່ງ pg_dump ພາຍໃນ PostgreSQL container ເພື່ອ export ຂໍ້ມູນທັງໝົດອອກມາຍັງຟາຍໃນ Host
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$FILENAME"

if [ $? -eq 0 ]; then
  echo "✅ Backup successfully created at $FILENAME"
else
  echo "❌ Error: Database backup failed!"
  exit 1
fi
