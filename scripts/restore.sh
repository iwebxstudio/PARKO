#!/bin/bash
set -e

# ໂຫຼດຄ່າຕົວປ່ຽນສະພາບແວດລ້ອມຈາກຟາຍ .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

POSTGRES_USER=${POSTGRES_USER:-parko}
POSTGRES_DB=${POSTGRES_DB:-parko_db}
BACKUP_DIR="infra/database/backup"

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "🔍 Looking for the latest backup in $BACKUP_DIR..."
  BACKUP_FILE=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | head -n 1)
  if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Error: No backup files (.sql) found in $BACKUP_DIR."
    exit 1
  fi
fi

echo "🔄 Restoring database from $BACKUP_FILE..."

# ລຶບ ແລະ ສ້າງ public schema ໃໝ່ ເພື່ອລ້າງຂໍ້ມູນເກົ່າອອກໃຫ້ສະອາດກ່ອນ Restore
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# ສົ່ງຂໍ້ມູນຈາກຟາຍ .sql ເຂົ້າໄປ Execute ໃນ PostgreSQL ຜ່ານຄຳສັ່ງ psql
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Database successfully restored from $BACKUP_FILE"
else
  echo "❌ Error: Database restore failed!"
  exit 1
fi
