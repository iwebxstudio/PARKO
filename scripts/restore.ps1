# ໂຫຼດຄ່າຕົວປ່ຽນສະພາບແວດລ້ອມຈາກຟາຍ .env
if (Test-Path ".env") {
    Get-Content ".env" | Where-Object { $_ -notmatch "^#" -and $_ -match "=" } | ForEach-Object {
        $name, $value = $_.Split('=', 2)
        [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim())
    }
}

$PostgresUser = $env:POSTGRES_USER
$PostgresDb = $env:POSTGRES_DB
$BackupDir = "infra/database/backup"

if (-not $PostgresUser) { $PostgresUser = "parko" }
if (-not $PostgresDb) { $PostgresDb = "parko_db" }

# ຮັບຄ່າ Argument ຊື່ຟາຍສຳຮອງ ຫຼື ຄົ້ນຫາຟາຍສຳຮອງ .sql ທີ່ລ່າສຸດໂດຍອັດຕະໂນມັດ
$BackupFile = $args[0]

if (-not $BackupFile) {
    Write-Host "[SEARCH] Looking for the latest backup in $BackupDir..." -ForegroundColor Cyan
    if (Test-Path $BackupDir) {
        $LatestFile = Get-ChildItem -Path $BackupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($LatestFile) {
            $BackupFile = $LatestFile.FullName
        }
    }
    
    if (-not $BackupFile) {
        Write-Warning "[ERROR] No backup files (.sql) found in $BackupDir."
        exit 1
    }
}

Write-Host "[RESTORE] Restoring database from $BackupFile..." -ForegroundColor Cyan

# ລຶບ ແລະ ສ້າງ public schema ໃໝ່ ເພື່ອລ້າງຂໍ້ມູນເກົ່າອອກໃຫ້ສະອາດກ່ອນ Restore
docker compose exec -T postgres psql -U $PostgresUser -d $PostgresDb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# ສົ່ງຂໍ້ມູນຈາກຟາຍ .sql ເຂົ້າໄປ Execute ໃນ PostgreSQL ຜ່ານຄຳສັ່ງ psql
Get-Content $BackupFile | docker compose exec -T postgres psql -U $PostgresUser -d $PostgresDb

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database successfully restored from $BackupFile" -ForegroundColor Green
} else {
    Write-Warning "[ERROR] Database restore failed!"
    exit 1
}
