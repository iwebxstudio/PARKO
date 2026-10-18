# ==============================================================================
#      PARKO SYSTEM             
#      ສະຄຣິບສຳລັບ Deploy ລະບົບຂຶ້ນ Production (Windows PowerShell)
#      ເຮັດໜ້າທີ່ກວດສອບຄວາມພ້ອມ, Build Docker Images ແລະ ເລີ່ມຕົ້ນ Services ທັງໝົດ
# ==============================================================================

# 1. ກວດສອບຟາຍສະພາບແວດລ້ອມ (.env) ຖ້າຍັງບໍ່ມີແມ່ນຈະທຳການສຳເນົາຈາກ .env.example ມາສ້າງໃຫ້ອັດຕະໂນມັດ
if (-not (Test-Path ".env")) {
    Write-Host "[!] .env file not found! Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "[OK] Created .env with default template values." -ForegroundColor Green
    Write-Host "[INFO] Please verify secrets and passwords inside .env file." -ForegroundColor Green
    Write-Host ""
}

# ອ່ານ ແລະ ໂຫຼດຄ່າຕົວປ່ຽນຕ່າງໆຈາກຟາຍ .env ເຂົ້າສູ່ຕົວປ່ຽນສະພາບແວດລ້ອມ (Environment Variables) ຂອງ PowerShell
Get-Content ".env" | Where-Object { $_ -notmatch "^#" -and $_ -match "=" } | ForEach-Object {
    $name, $value = $_.Split('=', 2)
    [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim())
}

$ParkoPort = $env:PARKO_PORT
$ParkoSslPort = $env:PARKO_SSL_PORT
if (-not $ParkoPort) { $ParkoPort = "39741" }
if (-not $ParkoSslPort) { $ParkoSslPort = "39742" }

# 2. ກວດສອບ ແລະ ສ້າງໂຄງສ້າງໂຟນເດີທີ່ຈຳເປັນສຳລັບການ Mount Volume ຂອງ Docker ຖ້າຍັງບໍ່ທັນມີຢູ່ໃນເຄື່ອງ
Write-Host "[DIR] Ensuring required mount directories exist..." -ForegroundColor Cyan
$Dirs = @(
    "infra/database/backup",
    "infra/nginx/certs",
    "infra/nginx/logs",
    "logs/backend",
    "backend/uploads"
)
foreach ($dir in $Dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
}
Write-Host "[OK] Directories verified." -ForegroundColor Green
Write-Host ""

# 3. ດາວໂຫຼດ Base Images ລ່າສຸດ ແລະ ທຳການ Build ທຸກໆ Services ຂອງລະບົບ PARKO ໃຫ້ພ້ອມໃຊ້ງານ
Write-Host "[DOCKER] Pulling latest base images and building services..." -ForegroundColor Cyan
docker compose pull
docker compose build --pull
Write-Host "[OK] Services build completed." -ForegroundColor Green
Write-Host ""

# 4. ສັ່ງເລີ່ມຕົ້ນການເຮັດວຽກຂອງ Docker Containers ທັງໝົດໃນແບບ Background Daemon
Write-Host "[START] Launching PARKO services in background..." -ForegroundColor Cyan
docker compose up -d
Write-Host "[OK] Containers started." -ForegroundColor Green
Write-Host ""

# 5. ກວດສອບສະຖານະຄວາມພ້ອມໃຊ້ງານ (Health Check Loop) ເພື່ອຮັບປະກັນວ່າທຸກ Service ເຮັດວຽກໄດ້ຢ່າງສົມບູນ
Write-Host "[WAIT] Waiting for all services to become healthy..." -ForegroundColor Cyan
$Timeout = 90
$Elapsed = 0
$Healthy = $false

while ($Elapsed -lt $Timeout) {
    $psJson = @(docker compose ps --format json)
    
    if ($psJson.Length -eq 0 -or ($psJson.Length -eq 1 -and $psJson[0] -eq "")) {
        Start-Sleep -Seconds 3
        $Elapsed += 3
        Write-Host -NoNewline "."
        continue
    }

    $unhealthyCount = @($psJson | Select-String '"HealthStatus":"unhealthy"').Count
    $startingCount = @($psJson | Select-String '"HealthStatus":"starting"').Count
    $runningCount = @($psJson | Select-String '"State":"running"').Count
    $exitedCount = @($psJson | Where-Object { $_ -match '"State":' -and $_ -notmatch '"State":"running"' }).Count

    if ($exitedCount -gt 0) {
        Write-Host ""
        Write-Host "[ERROR] Some containers exited or failed to start!" -ForegroundColor Red
        docker compose ps
        exit 1
    }

    if ($startingCount -eq 0 -and $unhealthyCount -eq 0 -and $runningCount -gt 0) {
        $Healthy = $true
        break
    }

    Start-Sleep -Seconds 3
    $Elapsed += 3
    Write-Host -NoNewline "."
}

Write-Host ""
if ($Healthy) {
    Write-Host "[SUCCESS] All PARKO services are healthy and running." -ForegroundColor Green
    Write-Host "--------------------------------------------------"
    Write-Host "Access Gateways:"
    Write-Host "  - HTTP Proxy:  http://localhost:$ParkoPort"
    Write-Host "  - HTTPS Proxy: https://localhost:$ParkoSslPort (Self-Signed)"
    Write-Host "--------------------------------------------------"
} else {
    Write-Host "[WARNING] Timeout waiting for services to become healthy." -ForegroundColor Red
    Write-Host "Please check the logs using: docker compose logs" -ForegroundColor Red
    docker compose ps
    exit 1
}
