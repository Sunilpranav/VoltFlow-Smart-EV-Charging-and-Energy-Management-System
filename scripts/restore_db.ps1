<#
.SYNOPSIS
    MySQL Database Restore Script for VoltFlow on Windows.
.PARAMETER BackupFile
    Path to the .sql dump file.
.PARAMETER ContainerName
    Target MySQL Docker container name (default: voltflow-db).
#>
param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,

    [string]$ContainerName = "voltflow-db"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

# Detect running container
$runningContainers = docker ps --format '{{.Names}}'
if ($runningContainers -notcontains $ContainerName) {
    if ($runningContainers -contains "voltflow-db-prod") {
        $ContainerName = "voltflow-db-prod"
    }
}

$dbUser = if ($env:MYSQL_USER) { $env:MYSQL_USER } else { "voltflow_user" }
$dbPass = if ($env:MYSQL_PASSWORD) { $env:MYSQL_PASSWORD } else { "secret" }
$dbName = if ($env:MYSQL_DATABASE) { $env:MYSQL_DATABASE } else { "voltflow" }

Write-Host "==============================================================================" -ForegroundColor Yellow
Write-Host "WARNING: Restoring will overwrite existing data in database '$dbName'" -ForegroundColor Yellow
Write-Host "Target Container: $ContainerName" -ForegroundColor Yellow
Write-Host "Backup Source:    $BackupFile" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Yellow

$confirm = Read-Host "Are you sure you want to proceed with restore? (yes/NO)"
if ($confirm -ne "yes") {
    Write-Host "[INFO] Restore aborted by user." -ForegroundColor Gray
    exit 0
}

Write-Host "[INFO] Restoring database..." -ForegroundColor Cyan
Get-Content $BackupFile | docker exec -i $ContainerName mysql -u $dbUser "-p$dbPass" $dbName

Write-Host "[SUCCESS] Database restored successfully from: $BackupFile" -ForegroundColor Green
