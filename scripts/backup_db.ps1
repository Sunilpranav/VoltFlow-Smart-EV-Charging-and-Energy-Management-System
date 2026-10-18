<#
.SYNOPSIS
    Automated MySQL Database Backup Script for VoltFlow on Windows.
.PARAMETER ContainerName
    Target MySQL Docker container name (default: voltflow-db or voltflow-db-prod).
.PARAMETER BackupDir
    Output directory for SQL dumps (default: .\backups).
#>
param (
    [string]$ContainerName = "voltflow-db",
    [string]$BackupDir = ".\backups"
)

$ErrorActionPreference = "Stop"

# Detect running container
$runningContainers = docker ps --format '{{.Names}}'
if ($runningContainers -notcontains $ContainerName) {
    if ($runningContainers -contains "voltflow-db-prod") {
        $ContainerName = "voltflow-db-prod"
    } else {
        Write-Warning "Neither $ContainerName nor voltflow-db-prod is running."
    }
}

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$rawDumpFile = Join-Path $BackupDir "voltflow_backup_${timestamp}.sql"
$containerDumpFile = "/tmp/voltflow_backup_${timestamp}.sql"

# Read .env if present
$dbUser = if ($env:MYSQL_USER) { $env:MYSQL_USER } else { "voltflow_user" }
$dbPass = if ($env:MYSQL_PASSWORD) { $env:MYSQL_PASSWORD } else { "secret" }
$dbName = if ($env:MYSQL_DATABASE) { $env:MYSQL_DATABASE } else { "voltflow" }

Write-Host "[INFO] Starting database backup from container: $ContainerName..." -ForegroundColor Cyan

# Write the dump inside the container first, then copy its raw bytes to Windows.
# Avoid PowerShell stdout redirection, which can encode native command output as UTF-16.
docker exec $ContainerName mysqldump -u $dbUser "-p$dbPass" --single-transaction --quick --routines --triggers --no-tablespaces "--result-file=$containerDumpFile" $dbName
if ($LASTEXITCODE -ne 0) {
    throw "mysqldump failed with exit code $LASTEXITCODE"
}

docker cp "${ContainerName}:$containerDumpFile" $rawDumpFile
if ($LASTEXITCODE -ne 0) {
    throw "docker cp failed with exit code $LASTEXITCODE"
}

docker exec $ContainerName rm -f $containerDumpFile | Out-Null

if ((Test-Path $rawDumpFile) -and ((Get-Item $rawDumpFile).Length -gt 0)) {
    $sizeKb = [math]::Round(((Get-Item $rawDumpFile).Length / 1KB), 2)
    Write-Host "[SUCCESS] Backup created successfully: $rawDumpFile ($sizeKb KB)" -ForegroundColor Green
} else {
    Write-Error "[ERROR] Backup failed or generated an empty file."
}
