#!/bin/bash
# MongoDB backup for "app backup" - run from project root when MONGODB_URI is set in backend/.env
# Usage: ./scripts/backup-database.sh
# Output: backup/db-dump-YYYYMMDD-HHMM (mongodump format)

set -e
BACKUP_DIR="backup"
TIMESTAMP=$(date +%Y%m%d-%H%M)
DUMP_DIR="${BACKUP_DIR}/db-dump-${TIMESTAMP}"

mkdir -p "${BACKUP_DIR}"

if [ -f backend/.env ]; then
  export $(grep -v '^#' backend/.env | xargs)
fi

if [ -z "$MONGODB_URI" ]; then
  echo "MONGODB_URI not set. Add to backend/.env or run: MONGODB_URI='mongodb://...' $0"
  exit 1
fi

echo "Dumping MongoDB to ${DUMP_DIR}..."
mongodump --uri="$MONGODB_URI" --out="${DUMP_DIR}"
echo "Done. Restore with: mongorestore --uri=\"\$MONGODB_URI\" ${DUMP_DIR}"
