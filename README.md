# Printer Asset Management System
## Jabil Circuit Pvt Ltd

Full-stack rebuild of the original single-file HTML app.

**Stack:** React + Vite (Frontend) · Node.js + Express (Backend) · PostgreSQL (Database)

---

## Project Structure

```
printer-ms/
├── backend/
│   ├── src/
│   │   ├── index.js          ← Express server entry point
│   │   ├── db/pool.js        ← PostgreSQL connection pool
│   │   └── routes/           ← All API route handlers
│   │       ├── printers.js
│   │       ├── vlan.js
│   │       ├── spareParts.js
│   │       ├── hpPrinters.js
│   │       ├── cartridges.js
│   │       ├── recipes.js
│   │       ├── issues.js
│   │       ├── healthCheckup.js
│   │       ├── pmPasted.js
│   │       └── dashboard.js
│   ├── schema.sql            ← Full DB schema
│   ├── .env.example          ← Copy to .env and fill in DB creds
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx           ← Root component + screen router
    │   ├── main.jsx          ← React entry point
    │   ├── index.css         ← Global styles (exact design tokens)
    │   ├── context/
    │   │   └── AppContext.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   └── Topbar.jsx
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── HealthCheckup.jsx
    │   │   ├── PmForm.jsx
    │   │   ├── ViewPrinters.jsx
    │   │   ├── VlanActivity.jsx
    │   │   ├── SpareParts.jsx
    │   │   ├── HpPrinters.jsx
    │   │   ├── LabelRecipes.jsx
    │   │   ├── UpcomingPM.jsx
    │   │   ├── DueOverdue.jsx
    │   │   ├── IssuesTracker.jsx
    │   │   └── PrinterMaster.jsx
    │   └── utils/
    │       └── api.js        ← Axios API helper functions
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Setup Instructions

### 1. PostgreSQL Database

Make sure PostgreSQL is installed and running.

```bash
# Create the database, connect to it, and run schema
createdb -U postgres printer_ms
psql -U postgres -d printer_ms -f backend/schema.sql
```

Or manually:
```sql
CREATE DATABASE printer_ms;
\c printer_ms
-- then paste contents of schema.sql
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Edit .env with your PostgreSQL credentials:
# DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/printer_ms
# DB_SSL=false
# OR set individual values:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=printer_ms
# DB_USER=postgres
# DB_PASSWORD=yourpassword
# PORT=5000

# Start the backend
npm run dev        # with nodemon (hot reload)
# OR
npm start          # production
```

Backend runs at: **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at: **http://localhost:3000**

The Vite dev server proxies `/api/*` requests to `http://localhost:5000`.

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST/PUT/DELETE | `/api/printers` | Printer master CRUD |
| GET/POST/PUT/DELETE | `/api/vlan` | VLAN port CRUD |
| GET/POST/PUT/DELETE | `/api/spare-parts` | Spare parts CRUD |
| POST | `/api/spare-parts/use` | Log part usage |
| GET/POST/PUT/DELETE | `/api/hp-printers` | HP printer CRUD |
| GET/POST/PUT/DELETE | `/api/cartridges` | Cartridge CRUD |
| POST | `/api/cartridges/use` | Log cartridge usage |
| GET/POST/PUT/DELETE | `/api/recipes` | Label recipes CRUD |
| GET/POST/PUT/DELETE | `/api/issues` | Issues tracker CRUD |
| PUT | `/api/issues/:id/resolve` | Resolve an issue |
| GET/POST | `/api/health-checkup` | Health checkup log |
| GET/POST | `/api/pm-pasted` | PM pasted log |
| GET | `/api/dashboard/stats` | Dashboard KPI stats |
| GET | `/api/dashboard/due-overdue` | PM due/overdue/upcoming list |

---

## Features

- **Dashboard** — Live KPIs, PM due/overdue table, engineer performance bars, active issues widget
- **Health Checkup** — PM lookup, auto-fill from DB, VLAN cross-check, ping simulation, health toggle, damaged parts, spare parts used
- **PM Pasted Form** — PM lookup, auto-fill, locked timestamp, engineer info, VLAN match indicator
- **View Printers** — Searchable/filterable table with online/offline status, CSV export
- **VLAN Activity** — Add/edit/delete port-IP-MAC-switch mappings
- **Spare Parts** — Inventory CRUD, use part modal (deducts stock), usage log
- **HP Printers** — 3-tab view: overview table, cartridge inventory, cartridge dashboard with gauges
- **Label Recipes** — Searchable cards, Honeywell-specific fields, DPI/make filters
- **Upcoming PM** — PMs due in next 5 days
- **PM Due / Overdue** — Overdue + due tables with days counter
- **Issues Tracker** — Log/edit/resolve issues, auto-delete after 10 days, severity/status filters, stats row
- **Printer Master** — Admin-only full CRUD on printer master database

---

## Notes

- Issues are auto-deleted from DB after 10 days (`expires_at` column, enforced on GET)
- Admin flag is set in `frontend/src/context/AppContext.jsx` — change `CURRENT_USER`
- For production, add authentication (JWT recommended)
- Ping simulation is client-side; real ICMP ping requires a network agent or backend socket
