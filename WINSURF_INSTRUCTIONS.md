# PesaWindsurf – Project Information & Instructions for Windsurf IDE

**Purpose:** Instruct Windsurf IDE (and developers) on what this project is, how it works, and how to continue development. Read this file first when opening the project in Windsurf.

---

## 1. What This Project Is

- **Name:** Pesa E‑commerce Platform (PesaWindsurf copy)
- **Stack:** **MERN** – MongoDB, Express.js, React, Node.js (plus a separate React admin panel and a customer-facing React frontend).
- **Type:** Full-stack e‑commerce platform (monorepo with backend, admin panel, and storefront).

This folder is a **clean copy** of the original project (without `node_modules`, build artifacts, or `.env`). It was created so you can continue development in **Windsurf IDE** without carrying over IDE-specific or machine-specific files. The copy excludes anything that would prevent the project from running after a fresh install (e.g. `node_modules`); you only need to install dependencies and set up environment and database.

---

## 2. Repository Layout (Monorepo)

```
PesaWindsurf/
├── backend/           # Node.js + Express API (MongoDB)
├── admin-panel/       # React (Vite) – admin dashboard & page builder
├── frontend/          # React (Vite) – customer storefront
├── docs/              # Project docs (deployment, quick start, etc.)
├── scripts/           # DB export/restore, backups
├── package.json       # Root scripts (backend + admin only; frontend is separate)
├── WINSURF_INSTRUCTIONS.md   # This file
└── database-dump/      # Optional: MongoDB dump (see Database section)
```

- **Backend:** REST API, auth, products, orders, categories, B2B pricing, laybyes, loyalty, coupons, gift cards, page templates, menus, etc.
- **Admin panel:** Products, orders, customers, page builder (Craft.js), B2B settings, menus, templates.
- **Frontend:** Shop, product pages, cart, checkout, account, dynamic pages, page-builder-rendered homepage.

---

## 3. Technology Summary

| Layer        | Tech |
|-------------|------|
| Database    | **MongoDB** |
| Backend API | **Node.js**, **Express**, Mongoose, JWT, Multer, Sharp, etc. |
| Admin UI    | **React 18**, Vite, Tailwind, Craft.js (page builder), React Query, Zustand |
| Storefront  | **React 18**, Vite, Tailwind, React Router, React Query, Zustand |
| Auth        | JWT (HTTP-only or header), role-based (admin, manager, customer) |

---

## 4. What You Need to Run the Project

- **Node.js** (v16+; v18 or v20 LTS recommended)
- **npm** (or yarn)
- **MongoDB** (v5+) running locally or a `MONGODB_URI` to a remote instance
- **MongoDB tools** (optional): `mongodump` / `mongorestore` for database copy (see below)

No other runtimes (e.g. Python, Java) are required for the main app.

---

## 5. First-Time Setup (Windsurf / Any IDE)

### 5.1 Install dependencies

From **PesaWindsurf** root:

```bash
# Root (concurrently for backend + admin)
npm install

# Backend
cd backend && npm install && cd ..

# Admin panel
cd admin-panel && npm install && cd ..

# Frontend (storefront)
cd frontend && npm install && cd ..
```

Or use the root helper (installs root + backend + admin only; frontend still needs its own `npm install`):

```bash
npm run install:all
cd frontend && npm install && cd ..
```

### 5.2 Environment files

- **Backend:**  
  `cp backend/.env.example backend/.env`  
  Edit `backend/.env`: set `MONGODB_URI`, `JWT_SECRET`, and optionally `PORT`, `ADMIN_URL`, `FRONTEND_URL`, email, payment keys.

- **Admin panel:**  
  `cp admin-panel/.env.example admin-panel/.env`  
  Set `VITE_API_URL` (or equivalent) to your backend URL (e.g. `http://localhost:5000`).

- **Frontend:**  
  `cp frontend/.env.example frontend/.env`  
  Set API base URL (e.g. `VITE_API_URL=http://localhost:5000`).

### 5.3 Database

- **Option A – Restore from dump (if you have `database-dump/`):**  
  Ensure MongoDB is running and `backend/.env` has `MONGODB_URI`. Then:
  ```bash
  ./scripts/restore-database.sh
  ```
  If `database-dump/` is missing, see “Copying the database from the original project” below.

- **Option B – Fresh database:**  
  Run the seed script:
  ```bash
  cd backend && npm run seed && cd ..
  ```
  This creates an admin user, sample products/categories, and other seed data (see `backend/seeders/index.js`).

### 5.4 Start development servers

- **Backend (API):**  
  `cd backend && npm run dev`  
  Default: **http://localhost:5000**

- **Admin panel:**  
  `cd admin-panel && npm run dev`  
  Default: **http://localhost:3000** (or the port Vite shows)

- **Frontend (storefront):**  
  `cd frontend && npm run dev`  
  Default: **http://localhost:3001** (or the port Vite shows)

Root script (backend + admin only):

```bash
npm run dev
```

Then start the frontend in a separate terminal. Ensure `ADMIN_URL` and `FRONTEND_URL` in `backend/.env` match the URLs you use (for CORS).

---

## 6. Database Copy (Including the Database in PesaWindsurf)

The project copy does **not** include a live database; it can include a **dump** so you can restore the same data.

### 6.1 Copying the database from the original project

From the **original** project root (where `backend/.env` exists and MongoDB has the data):

```bash
# Replace /path/to/PesaWindsurf with the absolute path to this PesaWindsurf folder
mongodump --uri="$(grep MONGODB_URI backend/.env | cut -d= -f2-)" --out=/path/to/PesaWindsurf/database-dump
```

Then in **PesaWindsurf**:

```bash
./scripts/restore-database.sh
```

(Make sure `backend/.env` exists in PesaWindsurf and `MONGODB_URI` points to the DB you want to restore into.)

### 6.2 Exporting from PesaWindsurf (after you’ve been working here)

To save the current MongoDB state into this copy:

```bash
./scripts/export-database.sh
```

This creates/overwrites `database-dump/`. You can later run `./scripts/restore-database.sh` on another machine or after resetting the DB.

---

## 7. Ports and URLs

| Service   | Default port | Typical URL              |
|----------|--------------|---------------------------|
| Backend  | 5000         | http://localhost:5000     |
| Admin    | 3000         | http://localhost:3000     |
| Frontend | 3001         | http://localhost:3001     |

Set `ADMIN_URL` and `FRONTEND_URL` in `backend/.env` to match (for CORS). If you change ports in Vite or in `backend/.env`, keep these consistent.

---

## 8. Important Paths for Windsurf

- **API entry:** `backend/server.js`
- **API routes:** `backend/routes/`
- **MongoDB models:** `backend/models/`
- **Admin app entry:** `admin-panel/src/` (e.g. main App or router)
- **Storefront entry:** `frontend/src/App.jsx`, `frontend/src/main.jsx`
- **Page builder (admin):** `admin-panel/src/` (Craft.js components and page template logic)
- **Page builder (frontend):** `frontend/src/components/pagebuilder/` (e.g. `PageRenderer.jsx`)
- **Environment examples:** `backend/.env.example`, `admin-panel/.env.example`, `frontend/.env.example`

---

## 9. What Was Excluded from the Copy (So the Project Still Works)

The copy **excludes** (so the project runs after install and config):

- `node_modules/` (all apps) – reinstall with `npm install` in each package.
- `dist/`, `build/` – regenerated by `npm run build` or `npm run dev`.
- `.env`, `.env.local` – recreated from `.env.example` (see above).
- `.git/` – optional; you can init a new repo in PesaWindsurf if you want.
- Uploaded product images under `backend/uploads/products/`, etc. – folders exist (e.g. with `.gitkeep`); re-upload assets or copy them manually if needed.
- `database-dump/` – not included by default; create it using the original project’s DB (see Database section).
- Large/temporary/cache: `*.log`, `.DS_Store`, `coverage/`, `temp/`, `data/`, etc.

Included: all source code, configs, `.env.example` files, docs, and scripts. So after installing dependencies and setting `.env` (and optionally restoring the DB), the project should build and run.

---

## 10. Continuing Development in Windsurf

- Use this file as the single place Windsurf (or any dev) reads for “what is this repo and how do I run it.”
- When adding features, keep the same stack: MongoDB + Express (backend), React + Vite (admin + frontend).
- Backend and frontend share API contracts; keep `backend/routes` and `frontend/src/services/api.js` (and any other API clients) in sync.
- For page builder changes: admin defines structure and data; frontend `PageRenderer` and `frontend/src/components/pagebuilder/` consume it. Test both admin save and frontend load.
- If you add new env vars, document them in the relevant `.env.example` and, if important, in this file.

---

## 11. Quick Reference Commands

```bash
# Install everything
npm run install:all && cd frontend && npm install && cd ..

# Backend
cd backend && cp .env.example .env && npm run seed && npm run dev

# Admin (other terminal)
cd admin-panel && cp .env.example .env && npm run dev

# Frontend (other terminal)
cd frontend && cp .env.example .env && npm run dev

# Restore DB (if you have database-dump/)
./scripts/restore-database.sh

# Export DB from this project
./scripts/export-database.sh
```

---

**End of instructions.** For deployment, see `docs/DEPLOYMENT.md` and `DEPLOYMENT.md`. For feature overview, see `README.md` and `PROJECT_SUMMARY.md`.
