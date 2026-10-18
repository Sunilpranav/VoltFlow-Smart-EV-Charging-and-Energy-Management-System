#!/usr/bin/env bash
# ==============================================================================
# VoltFlow MySQL Automated Database Backup Script
#
# Usage:
#   ./scripts/backup_db.sh [container_name] [backup_dir]
# Default container: voltflow-db (or voltflow-db-prod)
# Default backup directory: ./backups
# ==============================================================================

set -euo pipefail

CONTAINER_NAME="${1:-voltflow-db}"
# If dev container is not running, check for prod container
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  if docker ps --format '{{.Names}}' | grep -q "^voltflow-db-prod$"; then
    CONTAINER_NAME="voltflow-db-prod"
  fi
fi

BACKUP_DIR="${2:-./backups}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/voltflow_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=14

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "[INFO] Starting database backup from container: ${CONTAINER_NAME}..."

# Source environment variables if .env exists
if [[ -f ".env" ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env | xargs -0)
fi

DB_USER="${MYSQL_USER:-voltflow_user}"
DB_PASS="${MYSQL_PASSWORD:-secret}"
DB_NAME="${MYSQL_DATABASE:-voltflow}"

# Execute mysqldump with atomic transaction locking and compression
docker exec "${CONTAINER_NAME}" mysqldump \
  -u "${DB_USER}" \
  "-p${DB_PASS}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --no-tablespaces \
  "${DB_NAME}" | gzip > "${BACKUP_FILE}"

# Verify file was created and is non-empty
if [[ -s "${BACKUP_FILE}" ]]; then
  FILE_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
  echo "[SUCCESS] Backup created successfully: ${BACKUP_FILE} (${FILE_SIZE})"
else
  echo "[ERROR] Backup failed or generated an empty file!" >&2
  rm -f "${BACKUP_FILE}"
  exit 1
fi

# Prune older backups beyond retention window
echo "[INFO] Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "voltflow_backup_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -delete || true

echo "[INFO] Backup process finished."
