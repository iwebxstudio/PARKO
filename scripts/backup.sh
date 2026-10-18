#!/bin/bash
set -e

# Load environment variables
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

# Execute pg_dump inside postgres container and write output to host file
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$FILENAME"

if [ $? -eq 0 ]; then
  echo "✅ Backup successfully created at $FILENAME"
else
  echo "❌ Error: Database backup failed!"
  exit 1
fi
