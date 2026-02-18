#!/bin/bash
# Restore MongoDB from database-dump/ (created from original project or export-database.sh).
# Requires: MongoDB running, backend/.env with MONGODB_URI, database-dump/ folder present.
# Usage: ./scripts/restore-database.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DUMP_DIR="${PROJECT_ROOT}/database-dump"
ENV_FILE="${PROJECT_ROOT}/backend/.env"

if [ ! -d "$DUMP_DIR" ]; then
  echo "No database-dump/ folder found."
  echo "To copy the database from the original project, run from the ORIGINAL project root:"
  echo "  mongodump --uri=\"\$(grep MONGODB_URI backend/.env | cut -d= -f2-)\" --out=/absolute/path/to/PesaWindsurf/database-dump"
  echo "Then run this script again."
  exit 1
fi

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

if [ -z "$MONGODB_URI" ]; then
  echo "MONGODB_URI not set. Create backend/.env from backend/.env.example and set MONGODB_URI."
  exit 1
fi

echo "Restoring MongoDB from ${DUMP_DIR}..."
mongorestore --uri="$MONGODB_URI" --drop "$DUMP_DIR"
echo "Done."
