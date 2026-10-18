#!/usr/bin/env bash
# ==============================================================================
# VoltFlow MySQL Database Restore Script
#
# Usage:
#   ./scripts/restore_db.sh <backup_file.sql.gz> [container_name]
# Example:
#   ./scripts/restore_db.sh ./backups/voltflow_backup_20261017_150000.sql.gz
# ==============================================================================

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz> [container_name]" >&2
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="${2:-voltflow-db}"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  if docker ps --format '{{.Names}}' | grep -q "^voltflow-db-prod$"; then
    CONTAINER_NAME="voltflow-db-prod"
  fi
fi

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "[ERROR] Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

# Source environment variables if .env exists
if [[ -f ".env" ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env | xargs -0)
fi

DB_USER="${MYSQL_USER:-voltflow_user}"
DB_PASS="${MYSQL_PASSWORD:-secret}"
DB_NAME="${MYSQL_DATABASE:-voltflow}"

echo "=============================================================================="
echo "WARNING: Restoring will overwrite existing data in database '${DB_NAME}'"
echo "Target Container: ${CONTAINER_NAME}"
echo "Backup Source:    ${BACKUP_FILE}"
echo "=============================================================================="

read -r -p "Are you sure you want to proceed with restore? (yes/NO): " CONFIRM
if [[ "${CONFIRM}" != "yes" ]]; then
  echo "[INFO] Restore aborted by user."
  exit 0
fi

echo "[INFO] Restoring database..."
gunzip < "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" mysql -u "${DB_USER}" "-p${DB_PASS}" "${DB_NAME}"

echo "[SUCCESS] Database restored successfully from: ${BACKUP_FILE}"
