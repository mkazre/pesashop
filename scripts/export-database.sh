#!/bin/bash
# Export MongoDB to database-dump/ in this project (PesaWindsurf).
# Use this AFTER restoring once, to save your current DB state; or use from original project (see WINSURF_INSTRUCTIONS.md).
# Requires: MongoDB tools (mongodump), backend/.env with MONGODB_URI.
# Usage: ./scripts/export-database.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DUMP_DIR="${PROJECT_ROOT}/database-dump"
ENV_FILE="${PROJECT_ROOT}/backend/.env"

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

if [ -z "$MONGODB_URI" ]; then
  echo "MONGODB_URI not set. Create backend/.env from backend/.env.example and set MONGODB_URI."
  echo "Or run: MONGODB_URI='mongodb://localhost:27017/ecommerce_platform' $0"
  exit 1
fi

echo "Dumping MongoDB to ${DUMP_DIR}..."
rm -rf "$DUMP_DIR"
mongodump --uri="$MONGODB_URI" --out="$DUMP_DIR"
echo "Done. Restore with: ./scripts/restore-database.sh"
echo "Or: mongorestore --uri=\"\$MONGODB_URI\" database-dump/"
