param()
$migrations = Get-ChildItem -Path "backend/src/main/resources/db/migration/*.sql" | Sort-Object Name
foreach ($m in $migrations) {
    Write-Host "Migrating $($m.Name)..."
    Get-Content $m.FullName -Raw | docker exec -i voltflow-db mysql -uvoltflow_user -psecret voltflow_migration_verify
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Migration failed on $($m.Name)"
        exit 1
    }
}
Write-Host "All migrations successfully applied to voltflow_migration_verify!"
