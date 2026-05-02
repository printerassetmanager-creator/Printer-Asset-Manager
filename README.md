# Printer Asset Manager

Printer Asset Manager is a full-stack web application for managing industrial printers, backup printers, printer health checks, preventive maintenance, issues, spare parts, cartridges, label recipes, and support knowledge. It is built for IT/application support teams that need a single place to monitor printer assets, track faults, assign work, and keep printer maintenance history auditable.

## Main Features

- Email OTP registration and password reset.
- Super admin approval workflow for new accounts.
- Role-based access for users, admins, and super admins.
- Printer master database with plant, PM number, serial, model, DPI, SAP, MES, location, Loftware, and PM schedule data.
- Live printer dashboard with online/offline state, condition, firmware, kilometer/head-run readings, and status history.
- HP printer cartridge monitoring and cartridge inventory.
- Backup printer inventory and compatible backup matching for issue handling.
- Issue tracker with unique IDs, severity deadlines, assignment rules, escalation/downgrade history, backup printer usage, and email notifications.
- Health checkup and PM pasted logs.
- Spare parts and cartridge inventory with usage logs.
- Label recipe management and push-to-printer support.
- I-Learn knowledge base for issue resolution steps.
- Plant filter support for B26, B1600, B1700, and B1800.

## Technology Stack

- Frontend: React 18, Vite, Axios, React Datepicker.
- Backend: Node.js, Express, PostgreSQL, pg, bcrypt, JWT, Nodemailer.
- Testing: Vitest for frontend, Jest/Supertest for backend.
- Database: PostgreSQL.
- Email: Gmail SMTP through Nodemailer app password.

## Project Structure

```text
PrinterAssetWeb/
|-- README.md
|-- package.json
|-- .gitignore
|-- AUTHENTICATION_SETUP.md
|-- AWS_DEPLOYMENT_GUIDE.md
|-- CHECK_AND_VERIFY.md
|-- DATABASE_FIX_GUIDE.md
|-- DATABASE_ISSUE_RESOLVED.md
|-- DEPLOYMENT_GUIDE.md
|-- EMAIL_OTP_FIX.md
|-- FINAL_DATABASE_SUMMARY.md
|-- FULL_TEST_ANALYSIS.md
|-- HEALTH_CHECKUP_REORGANIZATION.md
|-- IMPLEMENTATION_SUMMARY.md
|-- ISSUE_ASSIGNMENT_NOTIFICATIONS_GUIDE.md
|-- ISSUE_UNIQUE_ID_GUIDE.md
|-- PRINTER_FETCHER_SPEC.md
|-- PRINTER_STATUS_GUIDE.md
|-- QUICK_DEPLOYMENT.md
|-- SETUP_GUIDE_STEP3_ONWARDS.md
|-- SIDEBAR_REORGANIZATION.md
|-- SIMPLE_ASSIGNMENT_LOGIC.md
|-- TESTING_COMPLETE.md
|-- TEST_REPORT.md
|-- backend/
|   |-- package.json
|   |-- package-lock.json
|   |-- schema.sql
|   |-- init-db.js
|   |-- setup-db.js
|   |-- setup-admin.js
|   |-- recreate-admin.js
|   |-- runMigration.js
|   |-- verify-all-schemas.js
|   |-- check-admin.js
|   |-- check-user.js
|   |-- test-api-login.js
|   |-- test-db.js
|   |-- test-login.js
|   |-- run-tests.sh
|   |-- complete-db-setup.sh
|   |-- migrations/
|   |   |-- add_assignment_to_issues.sql
|   |   |-- add_assigned_to_activity_log.sql
|   |   |-- add_hp_printer_status.sql
|   |   |-- add_i_learn_system.sql
|   |   |-- add_issue_tracking.sql
|   |   |-- add_issue_unique_id.sql
|   |   |-- add_plant_location.sql
|   |   |-- add_printer_model_to_spare_parts.sql
|   |   |-- add_recipe_json_support.sql
|   |   |-- add_sapno_mesno_to_issues.sql
|   |   |-- enhance_cartridge_usage_log.sql
|   |   |-- make_dn_unique_cartridges.sql
|   |   |-- populate_resolution_deadline.sql
|   |   |-- update_issue_unique_id_format.sql
|   |-- src/
|   |   |-- app.js
|   |   |-- index.js
|   |   |-- db/
|   |   |   |-- pool.js
|   |   |-- middleware/
|   |   |   |-- auth.js
|   |   |-- routes/
|   |   |   |-- auth.js
|   |   |   |-- backupPrinters.js
|   |   |   |-- cartridges.js
|   |   |   |-- dashboard.js
|   |   |   |-- grammar.js
|   |   |   |-- healthCheckup.js
|   |   |   |-- hpPrinters.js
|   |   |   |-- iLearn.js
|   |   |   |-- issues.js
|   |   |   |-- pmPasted.js
|   |   |   |-- printers.js
|   |   |   |-- pushToPrinter.js
|   |   |   |-- recipes.js
|   |   |   |-- spareParts.js
|   |   |   |-- users.js
|   |   |-- services/
|   |   |   |-- emailService.js
|   |   |   |-- hpPrinterMonitor.js
|   |   |   |-- printerLocationSync.js
|   |   |   |-- printerMonitor.js
|   |   |   |-- recipeService.js
|   |   |-- utils/
|   |   |   |-- printerSocket.js
|   |-- tests/
|   |   |-- health.test.js
|-- frontend/
|   |-- index.html
|   |-- package.json
|   |-- package-lock.json
|   |-- vite.config.js
|   |-- public/
|   |   |-- favicon.svg
|   |   |-- jabil-logo.svg
|   |   |-- jabil-logo-auth.svg
|   |   |-- under-development.svg
|   |-- src/
|   |   |-- App.jsx
|   |   |-- App.test.jsx
|   |   |-- index.css
|   |   |-- main.jsx
|   |   |-- components/
|   |   |   |-- Sidebar.jsx
|   |   |   |-- Topbar.jsx
|   |   |   |-- UnderDevelopmentNotice.jsx
|   |   |-- context/
|   |   |   |-- AppContext.jsx
|   |   |-- hooks/
|   |   |   |-- useSessionTimeout.js
|   |   |-- pages/
|   |   |   |-- BackupPrinters.jsx
|   |   |   |-- Dashboard.jsx
|   |   |   |-- DatePicker.jsx
|   |   |   |-- DueOverdue.jsx
|   |   |   |-- ForgotPassword.jsx
|   |   |   |-- HealthCheckup.jsx
|   |   |   |-- HpPrinters.jsx
|   |   |   |-- ILearn.jsx
|   |   |   |-- IssuesTracker.jsx
|   |   |   |-- LabelRecipes.jsx
|   |   |   |-- Login.jsx
|   |   |   |-- PmForm.jsx
|   |   |   |-- PrintMonitarBot.jsx
|   |   |   |-- PrinterDashboard.jsx
|   |   |   |-- PrinterMaster.jsx
|   |   |   |-- Register.jsx
|   |   |   |-- SpareParts.jsx
|   |   |   |-- UpcomingPM.jsx
|   |   |   |-- UserApprovals.jsx
|   |   |   |-- UserProfile.jsx
|   |   |   |-- ViewPrinters.jsx
|   |   |   |-- VlanActivity.jsx
|   |   |-- styles/
|   |   |   |-- auth.css
|   |   |-- utils/
|   |   |   |-- api.js
|   |   |   |-- loftware.js
|   |   |   |-- printerFetcher.js
|   |   |   |-- recipeConfig.js
|   |   |   |-- textFormat.js
|   |-- dist/
|       |-- Generated Vite production build files
|-- printer asset manager/
|   |-- .gitattributes
```

## Important Folders

- `backend/src/app.js`: Creates the Express app, adds middleware, mounts API route modules, and exposes `/health`.
- `backend/src/index.js`: Starts the HTTP server, checks database connectivity/schema, and starts printer monitoring services.
- `backend/src/routes`: API route modules grouped by feature.
- `backend/src/services`: Reusable backend services for email, monitoring, printer location sync, and recipe scripts.
- `backend/src/db/pool.js`: PostgreSQL connection pool.
- `backend/schema.sql`: Main database schema.
- `backend/migrations`: Incremental database changes used after the initial schema.
- `frontend/src/App.jsx`: Main React shell, authentication screen routing, and page rendering.
- `frontend/src/context/AppContext.jsx`: Shared app state, selected plants, session data, issue counts, login/logout helpers.
- `frontend/src/pages`: Main screens shown in the sidebar.
- `frontend/src/utils/api.js`: Central Axios client and API wrappers.
- `frontend/public`: Static images and icons.
- `frontend/dist`: Generated production build. Do not edit manually.

## Setup Guide

### 1. Install prerequisites

- Node.js 18 or newer.
- PostgreSQL.
- Gmail account with an app password if OTP emails are required.

### 2. Install dependencies

```bash
npm run install:all
```

Or install separately:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Configure backend environment

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/printer_ms
DB_SSL=false
JWT_SECRET=change-this-secret
EMAIL_USER=your.gmail.address@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
PRINTER_MONITOR_INTERVAL_MS=60000
PRINTER_MONITOR_CONCURRENCY=6
```

You can also use individual database fields instead of `DATABASE_URL` if supported by `backend/src/db/pool.js`.

### 4. Create database

```bash
createdb -U postgres printer_ms
psql -U postgres -d printer_ms -f backend/schema.sql
```

Or from the backend folder:

```bash
cd backend
node setup-db.js
```

### 5. Start backend

```bash
cd backend
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

### 6. Start frontend

```bash
cd frontend
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

The Vite dev server proxies `/api` requests to the backend.

Note: API tables below describe the route modules and frontend API wrappers in this repository. `backend/src/app.js` currently does not mount `backupPrinters.js`, so `/api/backup-printers` must be mounted before those backup-printer endpoints are reachable.

## Root Scripts

| Command | Purpose |
|---|---|
| `npm run install:all` | Installs backend and frontend dependencies. |
| `npm run dev:backend` | Starts backend with nodemon. |
| `npm run dev:frontend` | Starts frontend with Vite. |
| `npm run start:backend` | Starts backend in normal Node mode. |

## Backend Scripts

| Command | Purpose |
|---|---|
| `npm start` | Runs `src/index.js`. |
| `npm run dev` | Runs backend with nodemon. |
| `npm test` | Runs Jest tests. |

## Frontend Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts Vite development server. |
| `npm run build` | Creates production build in `frontend/dist`. |
| `npm run preview` | Serves the production build locally. |
| `npm test` | Runs Vitest tests. |

## User Guide

### Register a new account

1. Open the frontend.
2. Click create account from the login screen.
3. Enter email, full name, password, support type, and request OTP.
4. Check email for the OTP.
5. Submit the OTP to create the account.
6. Wait for super admin approval.

### Login

1. Enter approved email and password.
2. The frontend stores the JWT token and user profile in local storage.
3. The token is sent automatically on protected API calls.

### Reset password

1. Open forgot password.
2. Enter email.
3. Enter OTP received by email.
4. Set and confirm the new password.

### Manage users

Super admins can:

- View all users.
- View pending approvals.
- Approve a user and assign a role.
- Reject a user with a reason.
- Change user role.
- Delete users.

Admins can use protected maintenance functions such as printer master, spare part, cartridge, HP printer, and recipe management.

### Use plant filters

The app supports `B26`, `B1600`, `B1700`, and `B1800`. Plant selections are stored in local storage and affect dashboards and plant-aware lists.

### Dashboard

Use the dashboard to view overall KPIs, printer totals, open issue counts, PM status, and maintenance summaries.

### Printer Dashboard

Use Printer Dashboard to:

- View printer online/offline status.
- See current condition and reason.
- Check firmware and kilometer/head-run data.
- Refresh live status.
- View status logs and location logs.
- Filter by plant and search printer details.

### Printer Master

Admins use Printer Master to maintain the master printer list:

- Add PM number, serial, make, model, DPI, IP, work center, stage, bay, PM date, SAP number, MES number, Loftware mode, remarks, maintenance type, and plant.
- Edit existing printer records.
- Delete old records.

### Backup Printers

Use Backup Printers to register spare printer assets kept ready for replacement. A backup printer is linked to an existing printer master PM number so serial, make, DPI, and plant stay consistent. During issue creation, the app can find matching backup printers by DPI and plant.

### Issues Tracker

Use Issues Tracker to:

- Create issues against a printer or equipment.
- Add title, description, severity, category, reporter, SAP/MES, plant, and location.
- Assign Medium/Low issues during creation.
- Send high severity alerts to all active users.
- Send assignment emails when assigning issues.
- Resolve issues with mandatory action taken.
- Upgrade or downgrade severity with mandatory reason.
- View activity history.
- Use a compatible backup printer for Medium/Low cases.

Severity deadlines:

| Severity | Resolution target |
|---|---|
| High | 1 day |
| Medium | 3 days |
| Low | 7 days |

### Health Checkup

Use Health Checkup to record printer health activity, spare parts used, checkup status, engineer notes, and activity logs.

### PM Pasted Form

Use PM Pasted Form to log PM pasted records with printer lookup, engineer details, timestamp, and related status information.

### Spare Parts

Use Spare Parts to:

- Add and edit spare part inventory.
- Track part condition, location, compatibility, plant, model, and category.
- Consume parts through the use-part flow.
- Review usage logs and requirements.

### HP Printers and Cartridges

Use HP Printers to maintain HP printer records and sync cartridge status. Use Cartridges to manage cartridge inventory, usage logs, stock, and DN uniqueness.

### Label Recipes

Use Label Recipes to store Zebra and Honeywell printer settings. Recipes can be validated, summarized, and pushed to printers through TCP port 9100.

### I-Learn

Use I-Learn as a searchable knowledge base:

- Create issue guides.
- Add ordered resolution steps.
- Add optional images.
- Filter by category and search text.

### User Profile

Use Profile to view current user details, change password, or logout.

### Session behavior

The frontend auto-logs out when the browser/tab stays hidden for the configured timeout. It does not log out just because the user is inactive while the app is visible.

## API Endpoints

### Auth

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/send-registration-otp` | Sends OTP for new account verification. |
| POST | `/api/auth/register` | Creates a pending account after OTP verification. |
| POST | `/api/auth/login` | Logs in approved users and returns JWT. |
| POST | `/api/auth/forgot-password` | Sends password reset OTP. |
| POST | `/api/auth/reset-password` | Resets password using OTP. |
| GET | `/api/auth/me` | Returns current user from JWT. |
| POST | `/api/auth/change-password` | Changes password for logged-in user. |

### Admin

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/users` | Lists users for super admin. |
| GET | `/api/admin/pending-approvals` | Lists pending account approvals. |
| POST | `/api/admin/approve-user/:userId` | Approves user and assigns role. |
| POST | `/api/admin/reject-user/:userId` | Rejects account request. |
| POST | `/api/admin/change-user-role/:userId` | Changes user role. |
| DELETE | `/api/admin/users/:userId` | Deletes user. |
| GET | `/api/admin/all-users` | Lists active users for assignment selectors. |

### Printers

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/printers` | Lists printer master data. |
| POST | `/api/printers/dashboard-live/refresh` | Runs a monitor refresh cycle. |
| GET | `/api/printers/dashboard-live` | Returns live printer dashboard data. |
| GET | `/api/printers/status-logs/:pmno` | Returns printer status history. |
| GET | `/api/printers/location-logs/:pmno` | Returns location change history. |
| GET | `/api/printers/:pmno/live-web` | Reads live printer web data. |
| GET | `/api/printers/:pmno` | Gets one printer by PM number. |
| POST | `/api/printers` | Creates printer master record. |
| PUT | `/api/printers/:id` | Updates printer master record. |
| DELETE | `/api/printers/:id` | Deletes printer master record. |

### Backup Printers

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/backup-printers` | Lists backup printers. |
| GET | `/api/backup-printers/match-for-issue/:pmno` | Finds compatible backup printers for a source PM. |
| POST | `/api/backup-printers` | Creates backup printer record. |
| PUT | `/api/backup-printers/:id` | Updates backup printer record. |
| DELETE | `/api/backup-printers/:id` | Deletes backup printer record. |

### Spare Parts and Cartridges

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/spare-parts` | Lists spare parts. |
| GET | `/api/spare-parts/requirements` | Lists spare part requirements. |
| POST | `/api/spare-parts` | Creates spare part. |
| POST | `/api/spare-parts/use` | Deducts stock and logs usage. |
| PUT | `/api/spare-parts/:id` | Updates spare part. |
| DELETE | `/api/spare-parts/:id` | Deletes spare part. |
| GET | `/api/cartridges` | Lists cartridges. |
| GET | `/api/cartridges/usage-log` | Lists cartridge usage. |
| POST | `/api/cartridges` | Creates cartridge. |
| POST | `/api/cartridges/use` | Deducts cartridge stock and logs usage. |
| PUT | `/api/cartridges/:id` | Updates cartridge. |
| DELETE | `/api/cartridges/:id` | Deletes cartridge. |

### HP Printers

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/hp-printers/cartridge-info/:ip` | Fetches live cartridge data from printer web page. |
| GET | `/api/hp-printers` | Lists HP printers. |
| POST | `/api/hp-printers` | Creates HP printer. |
| PUT | `/api/hp-printers/:id` | Updates HP printer. |
| POST | `/api/hp-printers/sync/:id` | Syncs cartridge data for one HP printer. |
| DELETE | `/api/hp-printers/:id` | Deletes HP printer. |

### Recipes and Printer Push

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/recipes` | Lists label recipes. |
| POST | `/api/recipes` | Creates recipe. |
| PUT | `/api/recipes/:id` | Updates recipe. |
| DELETE | `/api/recipes/:id` | Deletes recipe. |
| POST | `/api/push-to-printer` | Builds and sends recipe command script to printer. |

### Issues

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/issues` | Lists issues and time remaining. |
| POST | `/api/issues` | Creates issue. |
| PUT | `/api/issues/:id` | Updates issue fields. |
| GET | `/api/issues/:id/history` | Lists issue activity history. |
| PUT | `/api/issues/:id/resolve` | Resolves issue with action taken. |
| PUT | `/api/issues/:id/downgrade` | Downgrades issue severity with reason. |
| PUT | `/api/issues/:id/upgrade` | Upgrades issue severity with reason. |
| GET | `/api/issues/users/list` | Lists active assignable users. |
| PUT | `/api/issues/:id/assign` | Assigns or reassigns issue. |
| DELETE | `/api/issues/:id` | Deletes issue. |

### Maintenance, Knowledge, and Dashboard

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health-checkup` | Lists health checkups. |
| GET | `/api/health-checkup/activity-log` | Lists health checkup activity logs. |
| POST | `/api/health-checkup` | Creates health checkup log. |
| GET | `/api/pm-pasted` | Lists PM pasted logs. |
| POST | `/api/pm-pasted` | Creates PM pasted log. |
| GET | `/api/i-learn/categories/list` | Lists I-Learn categories. |
| GET | `/api/i-learn` | Searches I-Learn issues. |
| POST | `/api/i-learn` | Creates I-Learn issue guide. |
| GET | `/api/i-learn/:id` | Gets one I-Learn guide with steps. |
| PUT | `/api/i-learn/:id` | Updates I-Learn guide. |
| DELETE | `/api/i-learn/:id` | Deletes I-Learn guide. |
| POST | `/api/i-learn/:id/steps` | Adds guide step. |
| PUT | `/api/i-learn/:id/steps/:stepId` | Updates guide step. |
| DELETE | `/api/i-learn/:id/steps/:stepId` | Deletes guide step. |
| POST | `/api/grammar` | Applies grammar/help text improvement through external service. |
| GET | `/api/dashboard/stats` | Returns dashboard KPIs. |
| GET | `/api/dashboard/due-overdue` | Returns due, overdue, and upcoming PM data. |

## Database Tables

| Table | Purpose |
|---|---|
| `users` | User account, role, support type, status, and password hash. |
| `password_reset_tokens` | OTP tokens for password reset. |
| `registration_otps` | OTP tokens for account registration. |
| `user_approvals` | Pending/approved/rejected account approval workflow. |
| `printers` | Master printer records. |
| `backup_printers` | Backup printer assets available for replacement. |
| `vlan` | VLAN/network mapping records. |
| `spare_parts` | Spare part inventory. |
| `parts_usage_log` | Spare part usage history. |
| `hp_printers` | HP printer master and cartridge status data. |
| `cartridges` | Cartridge inventory. |
| `cartridge_usage_log` | Cartridge usage history. |
| `recipes` | Label recipe configuration. |
| `issues` | Issue tracker records. |
| `issue_activity_log` | Issue history for creation, assignment, severity changes, and resolution. |
| `health_checkups` | Printer health checkup records. |
| `pm_pasted_log` | Preventive maintenance pasted records. |
| `printer_location_logs` | Printer location change history. |
| `health_checkup_activity_log` | Health checkup activity history. |
| `printer_live_state` | Current printer monitoring state. |
| `printer_status_logs` | Printer state and condition change history. |
| `i_learn_issues` | I-Learn knowledge base issues. |
| `i_learn_steps` | Ordered resolution steps for I-Learn issues. |

## Function and Module Reference

### Backend core

| File | Function/module | Explanation |
|---|---|---|
| `backend/src/app.js` | Express app module | Configures CORS, JSON parsing, request logging, all `/api/*` route modules, and `/health`. |
| `backend/src/index.js` | `startServer()` | Tests database connection, verifies critical tables, starts Express, starts printer monitors, and exits on fatal startup errors. |
| `backend/src/db/pool.js` | `pool` | Shared PostgreSQL pool used by every route and service. |
| `backend/src/middleware/auth.js` | `isAdminRole(role)` | Returns true for `admin` or `super_admin`. |
| `backend/src/middleware/auth.js` | `isSuperAdminRole(role)` | Returns true only for `super_admin`. |
| `backend/src/middleware/auth.js` | `authMiddleware(req,res,next)` | Verifies JWT bearer token and attaches decoded user to `req.user`. |
| `backend/src/middleware/auth.js` | `adminMiddleware(req,res,next)` | Requires authenticated admin or super admin. |
| `backend/src/middleware/auth.js` | `superAdminMiddleware(req,res,next)` | Requires authenticated super admin. |

### Backend auth and users

| File | Function/endpoint | Explanation |
|---|---|---|
| `backend/src/routes/auth.js` | `generateOTP()` | Creates a six-digit OTP string. |
| `backend/src/routes/auth.js` | `ensureRegistrationOtpsTable()` | Creates registration OTP table and index if missing. |
| `backend/src/routes/auth.js` | `POST /send-registration-otp` | Validates email uniqueness, stores OTP, and emails it. |
| `backend/src/routes/auth.js` | `POST /register` | Validates OTP/password, hashes password, creates pending user and approval record. |
| `backend/src/routes/auth.js` | `POST /login` | Checks account status/password and returns JWT plus user profile. |
| `backend/src/routes/auth.js` | `POST /forgot-password` | Creates password reset OTP and emails it without exposing whether the user exists. |
| `backend/src/routes/auth.js` | `POST /reset-password` | Verifies reset OTP and stores a new password hash. |
| `backend/src/routes/auth.js` | `GET /me` | Returns the current authenticated user. |
| `backend/src/routes/auth.js` | `POST /change-password` | Verifies current password and updates password hash. |
| `backend/src/routes/users.js` | User admin routes | Provide user listing, pending approvals, approve/reject, role change, delete, and active-user selection endpoints. |

### Backend inventory and issue routes

| File | Function/endpoint | Explanation |
|---|---|---|
| `backend/src/routes/backupPrinters.js` | `ensureBackupPrintersTable()` | Creates backup printer table and lookup index. |
| `backend/src/routes/backupPrinters.js` | Backup printer routes | List, match, create, update, and delete backup printers. |
| `backend/src/routes/issues.js` | `generateIssueUniqueId(issueId)` | Formats issue IDs like `ISSU01`. |
| `backend/src/routes/issues.js` | `getResolutionDeadline(severity)` | Calculates severity deadline: High 1 day, Medium 3 days, Low 7 days. |
| `backend/src/routes/issues.js` | `getTimeRemaining(deadline)` | Converts deadline into display text and breach flag. |
| `backend/src/routes/issues.js` | `ensureIssueBackupColumns()` | Adds backup printer columns to issues if missing. |
| `backend/src/routes/issues.js` | `ensureBackupPrintersTable()` | Ensures backup printer table exists for issue validation. |
| `backend/src/routes/issues.js` | Issue routes | Create, update, resolve, upgrade, downgrade, assign, delete, and read issue history. |
| `backend/src/routes/spareParts.js` | Spare part routes | Manage spare parts, requirements, stock deduction, and usage logs. |
| `backend/src/routes/cartridges.js` | Cartridge routes | Manage cartridges and cartridge usage logs. |
| `backend/src/routes/hpPrinters.js` | `fetchHPCartridgeData(ip)` | Downloads HP printer web page data for cartridge extraction. |
| `backend/src/routes/hpPrinters.js` | `extractCartridgeModel(html)` | Parses cartridge model from HP printer HTML. |
| `backend/src/routes/hpPrinters.js` | `extractBlackLevel(html)` | Parses black cartridge level. |
| `backend/src/routes/hpPrinters.js` | `extractColorLevel(html)` | Parses color cartridge level. |
| `backend/src/routes/hpPrinters.js` | `extractErrorStatus(html)` | Parses HP printer error/status text. |
| `backend/src/routes/hpPrinters.js` | HP printer routes | List, create, update, sync, delete, and fetch cartridge info. |

### Backend printer and maintenance routes

| File | Function/endpoint | Explanation |
|---|---|---|
| `backend/src/routes/printers.js` | Printer routes | Manage printer master, dashboard live data, status logs, location logs, and live web reads. |
| `backend/src/routes/healthCheckup.js` | `ensureActivityLogTable()` | Creates health checkup activity table if missing. |
| `backend/src/routes/healthCheckup.js` | `cleanupOldActivityLogs(db)` | Deletes old health activity logs. |
| `backend/src/routes/healthCheckup.js` | Health checkup routes | List checkups, list activity logs, and create health checkup entries. |
| `backend/src/routes/pmPasted.js` | PM pasted routes | List and create PM pasted log entries. |
| `backend/src/routes/dashboard.js` | `parseSimpleDate(dateStr)` | Converts simple date strings to Date objects. |
| `backend/src/routes/dashboard.js` | `dateToString(date)` | Formats Date values as date strings. |
| `backend/src/routes/dashboard.js` | `calculateEffectivePmDate(originalPmDate,today,maintenanceType)` | Calculates the current effective PM date based on maintenance cycle. |
| `backend/src/routes/dashboard.js` | `getPmStatusAndDate(printer,today,pmPastedMap)` | Calculates due/overdue/upcoming PM status for a printer. |
| `backend/src/routes/dashboard.js` | Dashboard routes | Return KPI stats and due/overdue PM data. |

### Backend recipe and printer TCP services

| File | Function/module | Explanation |
|---|---|---|
| `backend/src/routes/recipes.js` | Recipe routes | List, create, update, and delete label recipes. |
| `backend/src/routes/pushToPrinter.js` | `loadRecipe(recipeId)` | Loads and normalizes one recipe from the database. |
| `backend/src/routes/pushToPrinter.js` | `POST /` | Builds recipe action script and sends it to the printer. |
| `backend/src/services/recipeService.js` | `toNumber(value)` | Converts values to numbers when possible. |
| `backend/src/services/recipeService.js` | `isValidIp(ip)` | Validates IPv4 address format. |
| `backend/src/services/recipeService.js` | `getModelMeta(brand,model)` | Returns model metadata for supported brands. |
| `backend/src/services/recipeService.js` | `buildRecipeName(body)` | Builds a display name for a recipe. |
| `backend/src/services/recipeService.js` | `normalizeConfig(brand,config)` | Merges brand defaults with submitted config. |
| `backend/src/services/recipeService.js` | `legacyConfigFromRow(row)` | Builds config from older database columns. |
| `backend/src/services/recipeService.js` | `normalizeRecipeRow(row)` | Converts database row into frontend-friendly recipe object. |
| `backend/src/services/recipeService.js` | `validateRange(value,min,max,label,errors)` | Adds validation error when a value is outside range. |
| `backend/src/services/recipeService.js` | `validateNumber(value,label,errors)` | Adds validation error when a value is not numeric. |
| `backend/src/services/recipeService.js` | `validateRequired(value,label,errors)` | Adds validation error for missing required value. |
| `backend/src/services/recipeService.js` | `validateRecipePayload(body)` | Validates complete recipe create/update payload. |
| `backend/src/services/recipeService.js` | `buildSummaryFields(recipe)` | Creates readable summary fields for recipe cards. |
| `backend/src/services/recipeService.js` | `buildZebraResetScript()` | Builds Zebra reset command script. |
| `backend/src/services/recipeService.js` | `zebraMediaTracking(mediaType)` | Converts media type to Zebra tracking command. |
| `backend/src/services/recipeService.js` | `printMethodCommand(printMethod)` | Converts print method to printer command. |
| `backend/src/services/recipeService.js` | `printModeCommand(printMode)` | Converts print mode to printer command. |
| `backend/src/services/recipeService.js` | `buildZebraConfigScript(recipe)` | Builds Zebra configuration script. |
| `backend/src/services/recipeService.js` | `honeywellMediaTracking(mediaType)` | Converts media type to Honeywell command. |
| `backend/src/services/recipeService.js` | `buildHoneywellConfigScript(recipe)` | Builds Honeywell configuration script. |
| `backend/src/services/recipeService.js` | `buildTestPrintScript(recipe)` | Builds test print command script. |
| `backend/src/services/recipeService.js` | `buildCalibrationScript(recipe)` | Builds calibration command script. |
| `backend/src/services/recipeService.js` | `buildScript(recipe,action)` | Selects the proper command script for push/test/calibrate. |
| `backend/src/services/recipeService.js` | `sendTcpScript({ip,script,timeoutMs})` | Sends command text to TCP port 9100. |
| `backend/src/services/recipeService.js` | `checkPrinterStatus(ip,timeoutMs)` | Checks whether printer TCP port is reachable. |
| `backend/src/services/recipeService.js` | `ensureRecipeSchema(pool)` | Adds recipe JSON/support columns/indexes when missing. |
| `backend/src/utils/printerSocket.js` | `sendScriptToPrinter(printerIp,script,timeout)` | Sends raw script to printer over TCP socket. |
| `backend/src/utils/printerSocket.js` | `isPrinterOnline(printerIp,timeout)` | Checks if printer TCP port 9100 accepts a connection. |

### Backend monitoring services

| File | Function/module | Explanation |
|---|---|---|
| `backend/src/services/printerMonitor.js` | `extractIpFromText(text)` | Extracts first IPv4 address from text. |
| `backend/src/services/printerMonitor.js` | `normalizeSerial(serial)` | Normalizes serial input for matching. |
| `backend/src/services/printerMonitor.js` | `isHoneywellMake(make)` | Detects Honeywell printers by make. |
| `backend/src/services/printerMonitor.js` | `uniq(values)` | Returns unique values. |
| `backend/src/services/printerMonitor.js` | `getLocalIpv4Addresses()` | Reads local machine IPv4 addresses. |
| `backend/src/services/printerMonitor.js` | `isLocalMachineIp(ip)` | Prevents treating the server machine as a printer. |
| `backend/src/services/printerMonitor.js` | `composeLocation(bay,stage,wc)` | Builds readable location string. |
| `backend/src/services/printerMonitor.js` | `parsePmDate(dateText)` | Parses PM date text. |
| `backend/src/services/printerMonitor.js` | `formatIsoDateUTC(dt)` | Formats date as UTC ISO date. |
| `backend/src/services/printerMonitor.js` | `addMonthsKeepDay(dt,months)` | Adds months while preserving day where possible. |
| `backend/src/services/printerMonitor.js` | `maybeAdvancePmDate(printer,client)` | Advances PM date after due cycle rules. |
| `backend/src/services/printerMonitor.js` | `mapWithConcurrency(items,limit,mapper)` | Runs async work with concurrency limit. |
| `backend/src/services/printerMonitor.js` | `hostTargetsForPrinter(make,serial)` | Builds host targets to probe for a printer. |
| `backend/src/services/printerMonitor.js` | `pingPrinterForIp(make,serial)` | Pings/resolves printer reachability. |
| `backend/src/services/printerMonitor.js` | `parseHtmlTitle(bodyText)` | Extracts HTML title. |
| `backend/src/services/printerMonitor.js` | `normalizeStatusText(value)` | Normalizes status text. |
| `backend/src/services/printerMonitor.js` | `stripStatusPrefix(value)` | Removes common status prefixes. |
| `backend/src/services/printerMonitor.js` | `roundToTwo(value)` | Rounds numeric readings to two decimals. |
| `backend/src/services/printerMonitor.js` | `parseHoneywellPrinterState(bodyText)` | Extracts Honeywell state. |
| `backend/src/services/printerMonitor.js` | `parseHoneywellFirmwareVersion(bodyText)` | Extracts Honeywell firmware. |
| `backend/src/services/printerMonitor.js` | `parseHoneywellMetersToKm(bodyText)` | Converts Honeywell meter values to kilometers. |
| `backend/src/services/printerMonitor.js` | `parseExplicitPrinterState(bodyText)` | Extracts explicit printer state text. |
| `backend/src/services/printerMonitor.js` | `parseErrorReasonFromBody(bodyText)` | Extracts detailed error reason. |
| `backend/src/services/printerMonitor.js` | `parseConditionFromBody(bodyText)` | Infers ready/error/maintenance condition. |
| `backend/src/services/printerMonitor.js` | `parseFirmwareFromBody(bodyText,make)` | Extracts firmware by printer make. |
| `backend/src/services/printerMonitor.js` | `parseKmFromBody(bodyText,make)` | Extracts kilometer/head-run reading by make. |
| `backend/src/services/printerMonitor.js` | `getWebCredentialsByMake(make)` | Returns web auth credentials for printer make. |
| `backend/src/services/printerMonitor.js` | `needsAuthenticatedRetry(status,bodyText)` | Decides whether to retry with basic auth. |
| `backend/src/services/printerMonitor.js` | `fetchPrinterPage(ip,authHeader,path)` | Fetches printer web page. |
| `backend/src/services/printerMonitor.js` | `readPrinterWebDetails(ip,make)` | Reads and parses live printer web details. |
| `backend/src/services/printerMonitor.js` | `ensurePrinterMonitorTables()` | Creates live state and status log tables/indexes. |
| `backend/src/services/printerMonitor.js` | `cleanupOldPrinterLogs(client)` | Deletes old printer status logs. |
| `backend/src/services/printerMonitor.js` | `ensureFreshPrinterLiveState(maxAgeMs)` | Runs monitor cycle if live data is stale. |
| `backend/src/services/printerMonitor.js` | `buildChangeLogs(prev,next)` | Creates status change log entries. |
| `backend/src/services/printerMonitor.js` | `runPrinterMonitorCycle()` | Reads printers, checks state, updates live state, writes logs. |
| `backend/src/services/printerMonitor.js` | `startPrinterMonitor()` | Starts recurring printer monitor interval. |
| `backend/src/services/hpPrinterMonitor.js` | `syncHPPrinterCartridges()` | Reads HP printer data and updates stored cartridge status. |
| `backend/src/services/hpPrinterMonitor.js` | `fetchHPCartridgeData(ip)` | Fetches HP printer cartridge HTML. |
| `backend/src/services/hpPrinterMonitor.js` | `extractCartridgeModel(html)` | Parses HP cartridge model. |
| `backend/src/services/hpPrinterMonitor.js` | `extractBlackLevel(html)` | Parses black cartridge level. |
| `backend/src/services/hpPrinterMonitor.js` | `extractColorLevel(html)` | Parses color cartridge level. |
| `backend/src/services/hpPrinterMonitor.js` | `extractErrorStatus(html)` | Parses HP error status. |
| `backend/src/services/hpPrinterMonitor.js` | `startHPPrinterMonitor()` | Starts recurring HP cartridge monitor. |
| `backend/src/services/printerLocationSync.js` | `cleanValue(value)` | Normalizes empty text values. |
| `backend/src/services/printerLocationSync.js` | `normalizePmno(value)` | Normalizes PM number. |
| `backend/src/services/printerLocationSync.js` | `composeLocation(parts)` | Builds location summary from bay/stage/work center. |
| `backend/src/services/printerLocationSync.js` | `parseTimestamp(value)` | Parses timestamps safely. |
| `backend/src/services/printerLocationSync.js` | `sameValue(a,b)` | Compares normalized values. |
| `backend/src/services/printerLocationSync.js` | `ensurePrinterLocationLogsTable(db)` | Creates printer location log table. |
| `backend/src/services/printerLocationSync.js` | `getPrinterSnapshotByPmno(pmno,db)` | Reads one printer snapshot by PM number. |
| `backend/src/services/printerLocationSync.js` | `syncPrinterMasterFromEvent(...)` | Updates printer master/location logs from related event data. |

### Backend email service

| File | Function | Explanation |
|---|---|---|
| `backend/src/services/emailService.js` | `assertEmailConfig()` | Throws clear error when email credentials are missing. |
| `backend/src/services/emailService.js` | `sendOTP(email,otp)` | Sends password reset OTP email. |
| `backend/src/services/emailService.js` | `sendRegistrationOTP(email,otp)` | Sends registration verification OTP. |
| `backend/src/services/emailService.js` | `sendAccountApprovalNotification(email,fullName)` | Sends account approved email. |
| `backend/src/services/emailService.js` | `sendAccountRejectionNotification(email,fullName,reason)` | Sends account rejected email. |
| `backend/src/services/emailService.js` | `sendIssueAssignmentNotification(email,userName,issueDetails)` | Sends issue assignment email with issue details and remaining time. |
| `backend/src/services/emailService.js` | `sendHighSeverityIssueAlert(emails,issueDetails)` | Sends high severity issue alert to one or more users. |

### Frontend app and context

| File | Function/component | Explanation |
|---|---|---|
| `frontend/src/main.jsx` | Main renderer | Mounts React app into the HTML root. |
| `frontend/src/App.jsx` | `ProfileIcon()` | Renders inline profile icon. |
| `frontend/src/App.jsx` | `LogoutIcon()` | Renders inline logout icon. |
| `frontend/src/App.jsx` | `AppInner()` | Controls auth screens, session timeout, topbar/sidebar layout, page switching, profile modal, and logout. |
| `frontend/src/App.jsx` | `App()` | Wraps the app in `AppProvider`. |
| `frontend/src/context/AppContext.jsx` | `displayName(user)` | Converts user/email text into readable display name. |
| `frontend/src/context/AppContext.jsx` | `getInitialScreen()` | Reads URL query to choose initial screen. |
| `frontend/src/context/AppContext.jsx` | `AppProvider({children})` | Stores current screen, plants, user, token, auth state, issue count, login/logout helpers, and plant helpers. |
| `frontend/src/context/AppContext.jsx` | `refreshIssueCount()` | Fetches issues and counts open issues. |
| `frontend/src/context/AppContext.jsx` | `togglePlant(plant)` | Toggles plant selection while preventing zero selected plants. |
| `frontend/src/context/AppContext.jsx` | `selectAllPlants()` | Selects all known plant locations. |
| `frontend/src/context/AppContext.jsx` | `logout()` | Clears token/user local storage and resets auth state. |
| `frontend/src/context/AppContext.jsx` | `loginUser(userData,token)` | Saves user/token and marks session authenticated. |
| `frontend/src/context/AppContext.jsx` | `useApp()` | Hook for reading app context. |
| `frontend/src/hooks/useSessionTimeout.js` | `useSessionTimeout(onSessionExpire,timeoutMinutes,isAuthenticated)` | Logs out after the browser is hidden for the configured timeout. |

### Frontend components and pages

| File | Component/helper | Explanation |
|---|---|---|
| `frontend/src/components/Sidebar.jsx` | `initials(email)` | Builds initials for user badge. |
| `frontend/src/components/Sidebar.jsx` | `displayName(fullName)` | Displays user name fallback. |
| `frontend/src/components/Sidebar.jsx` | `roleLabel(role)` | Converts role key to label. |
| `frontend/src/components/Sidebar.jsx` | `Sidebar()` | Renders navigation and switches screens through context. |
| `frontend/src/components/Topbar.jsx` | `Topbar()` | Renders current screen title, metadata, and user action entry point. |
| `frontend/src/components/UnderDevelopmentNotice.jsx` | `UnderDevelopmentNotice()` | Displays placeholder notice for unfinished screens. |
| `frontend/src/pages/Dashboard.jsx` | `Dashboard()` | Main KPI and overview screen. |
| `frontend/src/pages/PrinterDashboard.jsx` | `includesText(value,query)` | Search helper. |
| `frontend/src/pages/PrinterDashboard.jsx` | `locationText(p)` | Builds location display text. |
| `frontend/src/pages/PrinterDashboard.jsx` | `onlineOfflineStatus(p)` | Converts live state to online/offline label. |
| `frontend/src/pages/PrinterDashboard.jsx` | `conditionLabel(p)` | Converts printer condition to display label. |
| `frontend/src/pages/PrinterDashboard.jsx` | `conditionClass(p)` | Returns CSS class for condition state. |
| `frontend/src/pages/PrinterDashboard.jsx` | `fmtDateTime(v)` | Formats dates/times for the dashboard. |
| `frontend/src/pages/PrinterDashboard.jsx` | `PrinterDashboard()` | Live printer monitoring UI. |
| `frontend/src/pages/PrinterMaster.jsx` | `PrinterMaster()` | Admin CRUD UI for printer master data. |
| `frontend/src/pages/ViewPrinters.jsx` | `fmtDateTime(value)` | Formats date/time values. |
| `frontend/src/pages/ViewPrinters.jsx` | `formatLocationSummary(parts)` | Builds readable location summary. |
| `frontend/src/pages/ViewPrinters.jsx` | `formatLocationLogEntry(log,prefix)` | Formats location history entries. |
| `frontend/src/pages/ViewPrinters.jsx` | `ViewPrinters()` | Searchable printer list and history view. |
| `frontend/src/pages/BackupPrinters.jsx` | `BackupPrinters()` | Backup printer inventory UI. |
| `frontend/src/pages/HealthCheckup.jsx` | `nowStr()` | Creates current timestamp string. |
| `frontend/src/pages/HealthCheckup.jsx` | `fmtDateTime(value)` | Formats health checkup dates. |
| `frontend/src/pages/HealthCheckup.jsx` | `calculateNextPMDate(pmdate)` | Calculates next PM date. |
| `frontend/src/pages/HealthCheckup.jsx` | `HealthCheckup()` | Health checkup entry and log screen. |
| `frontend/src/pages/PmForm.jsx` | `nowStr()` | Creates current timestamp string for PM form. |
| `frontend/src/pages/PmForm.jsx` | `PmForm()` | PM pasted form screen. |
| `frontend/src/pages/VlanActivity.jsx` | `VlanActivity()` | VLAN/network activity screen. |
| `frontend/src/pages/SpareParts.jsx` | `SpareParts()` | Spare part inventory and usage UI. |
| `frontend/src/pages/HpPrinters.jsx` | `CartGauge({pct})` | Renders cartridge level gauge. |
| `frontend/src/pages/HpPrinters.jsx` | `HpPrinters()` | HP printer and cartridge dashboard UI. |
| `frontend/src/pages/LabelRecipes.jsx` | `Field({label,hint,children,full})` | Shared form field wrapper. |
| `frontend/src/pages/LabelRecipes.jsx` | `HoneywellFields({config,onChange})` | Honeywell recipe inputs. |
| `frontend/src/pages/LabelRecipes.jsx` | `ZebraFields({config,onChange})` | Zebra recipe inputs. |
| `frontend/src/pages/LabelRecipes.jsx` | `LabelRecipes()` | Recipe list, editor, validation, and push UI. |
| `frontend/src/pages/IssuesTracker.jsx` | `displayName(value)` | Formats user names. |
| `frontend/src/pages/IssuesTracker.jsx` | `normalizeUserId(value)` | Normalizes assignee IDs/emails. |
| `frontend/src/pages/IssuesTracker.jsx` | `getIssueSearchParam()` | Reads issue search parameter from URL. |
| `frontend/src/pages/IssuesTracker.jsx` | `createUserOption(user)` | Converts user records to select options. |
| `frontend/src/pages/IssuesTracker.jsx` | `buildIssueFormState(issue)` | Maps issue row to editable form state. |
| `frontend/src/pages/IssuesTracker.jsx` | `getIssueNumber(issue)` | Returns unique issue ID or fallback ID. |
| `frontend/src/pages/IssuesTracker.jsx` | `IssuesTracker()` | Full issue tracker UI. |
| `frontend/src/pages/ILearn.jsx` | `applyIssueWritingSuggestions(issue)` | Normalizes issue guide title/category text. |
| `frontend/src/pages/ILearn.jsx` | `applyStepWritingSuggestions(step)` | Normalizes step title/description text. |
| `frontend/src/pages/ILearn.jsx` | `ILearn()` | Knowledge base list, guide editor, and step editor. |
| `frontend/src/pages/UpcomingPM.jsx` | `UpcomingPM()` | Upcoming PM list. |
| `frontend/src/pages/DueOverdue.jsx` | `DueOverdue()` | Due and overdue PM list. |
| `frontend/src/pages/Login.jsx` | `Login({onLoginSuccess})` | Login form and navigation to register/forgot password. |
| `frontend/src/pages/Register.jsx` | `Register({onBack})` | Registration and OTP verification UI. |
| `frontend/src/pages/ForgotPassword.jsx` | `ForgotPassword({onBack})` | Password reset OTP UI. |
| `frontend/src/pages/UserApprovals.jsx` | `getDisplayName(user)` | Resolves display name. |
| `frontend/src/pages/UserApprovals.jsx` | `roleLabel(role)` | Converts role to label. |
| `frontend/src/pages/UserApprovals.jsx` | `formatDate(dateString)` | Formats approval dates. |
| `frontend/src/pages/UserApprovals.jsx` | `UserApprovals()` | Super admin approval screen. |
| `frontend/src/pages/UserProfile.jsx` | `roleLabel(role)` | Converts role to profile label. |
| `frontend/src/pages/UserProfile.jsx` | `UserProfile({user,onClose,onLogout})` | Profile modal with password/account actions. |
| `frontend/src/pages/DatePicker.jsx` | `formatYmd(date)` | Formats date as `YYYY-MM-DD`. |
| `frontend/src/pages/DatePicker.jsx` | `CustomDatePicker(...)` | Wrapped date picker component. |
| `frontend/src/pages/PrintMonitarBot.jsx` | `PrintMonitarBot()` | Print monitor bot page. |

### Frontend utilities

| File | Function/module | Explanation |
|---|---|---|
| `frontend/src/utils/api.js` | `api` | Axios instance with `/api` base URL. |
| `frontend/src/utils/api.js` | Request interceptor | Adds bearer token from local storage. |
| `frontend/src/utils/api.js` | `authAPI` | Auth API wrapper methods. |
| `frontend/src/utils/api.js` | `adminAPI` | Admin/user approval API wrapper methods. |
| `frontend/src/utils/api.js` | `printersAPI` | Printer master and live dashboard API wrapper methods. |
| `frontend/src/utils/api.js` | `backupPrintersAPI` | Backup printer API wrapper methods. |
| `frontend/src/utils/api.js` | `sparePartsAPI` | Spare part API wrapper methods. |
| `frontend/src/utils/api.js` | `hpPrintersAPI` | HP printer API wrapper methods. |
| `frontend/src/utils/api.js` | `cartridgesAPI` | Cartridge API wrapper methods. |
| `frontend/src/utils/api.js` | `recipesAPI` | Recipe API wrapper methods. |
| `frontend/src/utils/api.js` | `printerPushAPI` | Push-to-printer API wrapper. |
| `frontend/src/utils/api.js` | `issuesAPI` | Issue tracker API wrapper methods. |
| `frontend/src/utils/api.js` | `healthAPI` | Health checkup API wrapper methods. |
| `frontend/src/utils/api.js` | `pmPastedAPI` | PM pasted API wrapper methods. |
| `frontend/src/utils/api.js` | `dashboardAPI` | Dashboard API wrapper methods. |
| `frontend/src/utils/api.js` | `iLearnAPI` | I-Learn API wrapper methods. |
| `frontend/src/utils/recipeConfig.js` | `getBrandDefaults(brand)` | Returns default recipe config for a brand. |
| `frontend/src/utils/recipeConfig.js` | `getModelOptions(brand)` | Returns model choices for brand. |
| `frontend/src/utils/recipeConfig.js` | `getDpiRange(brand,model)` | Returns valid DPI range. |
| `frontend/src/utils/recipeConfig.js` | `createEmptyDraft(brand)` | Creates blank recipe draft. |
| `frontend/src/utils/recipeConfig.js` | `normalizeRecipeForForm(recipe)` | Converts API recipe into form state. |
| `frontend/src/utils/recipeConfig.js` | `requireValue(value,label,errors)` | Adds required-field error. |
| `frontend/src/utils/recipeConfig.js` | `requireRange(value,min,max,label,errors)` | Adds range validation error. |
| `frontend/src/utils/recipeConfig.js` | `requireNumber(value,label,errors)` | Adds numeric validation error. |
| `frontend/src/utils/recipeConfig.js` | `validateRecipeDraft(draft)` | Validates complete recipe draft. |
| `frontend/src/utils/recipeConfig.js` | `buildRecipeSummary(recipe)` | Creates readable recipe summary. |
| `frontend/src/utils/recipeConfig.js` | `filterRecipes(recipes,search,brand)` | Filters recipes by text and brand. |
| `frontend/src/utils/loftware.js` | `normalizeLoftwareOption(value)` | Normalizes Loftware option text. |
| `frontend/src/utils/loftware.js` | `parseLoftwareValue(value)` | Splits stored Loftware value into primary/secondary parts. |
| `frontend/src/utils/loftware.js` | `buildLoftwareValue(primary,secondary)` | Combines Loftware values for storage. |
| `frontend/src/utils/loftware.js` | `getDefaultLoftwareForSap(sapno)` | Selects default Loftware option from SAP number. |
| `frontend/src/utils/textFormat.js` | `normalizeSpacing(text)` | Cleans spacing. |
| `frontend/src/utils/textFormat.js` | `capitalizeSentences(text)` | Capitalizes sentence starts. |
| `frontend/src/utils/textFormat.js` | `capitalizeStandaloneI(text)` | Capitalizes standalone `i`. |
| `frontend/src/utils/textFormat.js` | `normalizeInstructionPhrases(text)` | Improves common instruction phrases. |
| `frontend/src/utils/textFormat.js` | `fixRepeatedWords(text)` | Removes duplicated adjacent words. |
| `frontend/src/utils/textFormat.js` | `normalizeTechnicalTerms(text)` | Normalizes known technical terms. |
| `frontend/src/utils/textFormat.js` | `improveInstructionGrammar(text)` | Applies grammar cleanup to instruction text. |
| `frontend/src/utils/textFormat.js` | `formatTitleText(text)` | Formats titles. |
| `frontend/src/utils/textFormat.js` | `formatSentenceText(text)` | Formats sentence/paragraph text. |
| `frontend/src/utils/printerFetcher.js` | `createBasicAuthHeader(username,password)` | Builds Basic Auth header. |
| `frontend/src/utils/printerFetcher.js` | `createFetchHeaders(printerType)` | Builds request headers by printer type. |
| `frontend/src/utils/printerFetcher.js` | `detectPrinterType(serial,htmlContent)` | Detects Zebra/Honeywell type. |
| `frontend/src/utils/printerFetcher.js` | `normalizePrinterText(value)` | Normalizes printer text. |
| `frontend/src/utils/printerFetcher.js` | `stripStatusPrefix(value)` | Removes status prefix. |
| `frontend/src/utils/printerFetcher.js` | `roundToTwo(value)` | Rounds readings. |
| `frontend/src/utils/printerFetcher.js` | `parseZebraFirmwareVersion(htmlContent)` | Parses Zebra firmware. |
| `frontend/src/utils/printerFetcher.js` | `parseZebraCmToKm(htmlContent)` | Converts Zebra centimeter values to kilometers. |
| `frontend/src/utils/printerFetcher.js` | `parseHoneywellFirmwareVersion(htmlContent)` | Parses Honeywell firmware. |
| `frontend/src/utils/printerFetcher.js` | `parseHoneywellMetersToKm(htmlContent)` | Converts Honeywell meter values to kilometers. |
| `frontend/src/utils/printerFetcher.js` | `parseHoneywellData(htmlContent)` | Parses Honeywell status data. |
| `frontend/src/utils/printerFetcher.js` | `parseHoneywellHeadRun(htmlContent)` | Parses Honeywell head-run reading. |
| `frontend/src/utils/printerFetcher.js` | `parseZebraData(htmlContent)` | Parses Zebra status data. |
| `frontend/src/utils/printerFetcher.js` | `parseZebraHeadRun(htmlContent)` | Parses Zebra head-run reading. |
| `frontend/src/utils/printerFetcher.js` | `formatHoneywellSerial(serial)` | Formats Honeywell serial strings. |
| `frontend/src/utils/printerFetcher.js` | `getPrinterStateDisplay(data)` | Converts parsed printer state into display label. |

## Security Notes

- Passwords are hashed with bcrypt.
- Authenticated requests use JWT bearer tokens.
- OTPs expire and are marked used after successful use.
- Admin and super admin actions are protected by middleware.
- Change the default `JWT_SECRET` before deployment.
- Use a Gmail app password for `EMAIL_PASSWORD`; do not use the regular Gmail password.
- Do not commit `backend/.env`.

## Testing

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm test
```

Build frontend:

```bash
cd frontend
npm run build
```

## Troubleshooting

### Backend cannot connect to database

- Confirm PostgreSQL is running.
- Confirm `printer_ms` exists.
- Confirm `DATABASE_URL` or individual DB values are correct.
- Run `backend/schema.sql` or `node backend/setup-db.js`.

### OTP emails fail

- Confirm `EMAIL_USER` and `EMAIL_PASSWORD` are set.
- Use Gmail app password, not the Gmail login password.
- Check network access to Gmail SMTP.

### User cannot login

- Confirm user status is `active`.
- Confirm password is correct.
- If account is pending, approve it from User Approvals with super admin access.

### Admin page redirects to dashboard

- Printer Master requires `admin`.
- User Approvals requires `super_admin`.

### Printer monitor data is stale

- Confirm backend is running.
- Confirm printer master records have correct IP/serial/make values.
- Check backend logs for monitor errors.
- Adjust `PRINTER_MONITOR_INTERVAL_MS` if needed.

## Related Documentation

See the project markdown guides in the repository root for focused setup, deployment, database, authentication, testing, and issue workflow notes.
