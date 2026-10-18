# ໂຫຼດຄ່າຕົວປ່ຽນສະພາບແວດລ້ອມຈາກຟາຍ .env
if (Test-Path ".env") {
    Get-Content ".env" | Where-Object { $_ -notmatch "^#" -and $_ -match "=" } | ForEach-Object {
        $name, $value = $_.Split('=', 2)
        [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim())
    }
}

$PostgresUser = $env:POSTGRES_USER
$PostgresDb = $env:POSTGRES_DB

if (-not $PostgresUser) { $PostgresUser = "parko" }
if (-not $PostgresDb) { $PostgresDb = "parko_db" }

$BackupDir = "infra/database/backup"
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Filename = "$BackupDir/backup_$Timestamp.sql"

Write-Host "[BACKUP] Backing up database to $Filename..." -ForegroundColor Cyan

# ສັ່ງ run ຄຳສັ່ງ pg_dump ພາຍໃນ PostgreSQL container ເພື່ອ export ຂໍ້ມູນທັງໝົດລົງຟາຍ .sql
docker compose exec -T postgres pg_dump -U $PostgresUser -d $PostgresDb > $Filename

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Backup successfully created at $Filename" -ForegroundColor Green
} else {
    Write-Warning "[ERROR] Database backup failed!"
    exit 1
}
