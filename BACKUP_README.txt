App Backup - Restore instructions
==================================

This zip contains a copy of the ecommerce-platform app (code only).
Node_modules are excluded; run npm install in backend, frontend, and admin-panel after extracting.

Database (MongoDB):
- To backup: from project root run ./scripts/backup-database.sh (requires mongodump and backend/.env MONGODB_URI).
- To restore: mongorestore --uri="YOUR_MONGODB_URI" backup/db-dump-YYYYMMDD-HHMM
- If you did not run the backup script, your existing MongoDB data is unchanged; use your current connection.

After extract:
  cd backend && npm install
  cd ../frontend && npm install
  cd ../admin-panel && npm install
  cp backend/.env.example backend/.env  # then edit .env with your values
