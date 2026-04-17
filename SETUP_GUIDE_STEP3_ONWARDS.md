# 🔧 COMPLETE SETUP GUIDE - Step 3 Onwards
## For Local Development & Testing

---

## ✅ PREREQUISITES (Already Done if you see these)

```bash
# Location: C:\Users\Admin\Desktop\PrinterAssetWeb
# You should be in this directory
cd C:\Users\Admin\Desktop\PrinterAssetWeb

# Verify directory structure
dir backend
dir frontend
dir
```

**Expected**: You see `backend/`, `frontend/`, and package.json files.

---

# 🚀 STEP 3: DATABASE SETUP

## 3.1 - Verify PostgreSQL is Running

Open **Services** (Windows):
1. Press `Win + R`
2. Type `services.msc`
3. Look for **postgresql-x64-16** (or similar)
4. Status should be **Running** (green arrow)

If **stopped**, right-click → **Start**

**OR** in PowerShell as **Administrator**:
```powershell
# Check PostgreSQL service
Get-Service "postgresql-x64-16" | Select-Object -Property @{n='Service Name';e={$_.Name}}, @{n='Status';e={$_.Status}}
```

---

## 3.2 - Create Database & User

Open **PowerShell as Administrator** in `C:\Users\Admin\Desktop\PrinterAssetWeb`:

```powershell
# Login to PostgreSQL
psql -U postgres

# Then run these commands inside psql prompt:
```

Once you see `postgres=#` prompt, paste:

```sql
-- Create database
CREATE DATABASE printer_ms;

-- Create user
CREATE USER printer_user WITH PASSWORD 'Admin@1212';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE printer_ms TO printer_user;

-- Connect to new database
\c printer_ms

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO printer_user;

-- Exit
\q
```

**Expected output**:
```
CREATE DATABASE
CREATE ROLE
GRANT
You are now connected to database "printer_ms" as user "postgres".
GRANT
```

---

## 3.3 - Initialize Database Schema

Still in PowerShell, run:

```powershell
cd C:\Users\Admin\Desktop\PrinterAssetWeb\backend

# Check schema file exists
dir schema.sql

# Load schema into database
psql -U printer_user -d printer_ms -f schema.sql
```

**Expected**: You'll see many `CREATE TABLE` statements and `NOTICE` messages.

**Verify all tables created**:
```powershell
psql -U printer_user -d printer_ms -c "\dt"
```

Should show **14 tables**:
```
                    List of relations
 Schema |            Name            | Type  |     Owner      
--------+----------------------------+-------+----------------
 public | cartridge_usage_log        | table | printer_user
 public | cartridges                 | table | printer_user
 public | health_checkup_activity_log | table | printer_user
 public | health_checkups            | table | printer_user
 public | hp_printers                | table | printer_user
 public | issues                     | table | printer_user
 public | parts_usage_log            | table | printer_user
 public | pm_pasted_log              | table | printer_user
 public | printer_live_state         | table | printer_user
 public | printer_status_logs        | table | printer_user
 public | printers                   | table | printer_user
 public | recipes                    | table | printer_user
 public | spare_parts                | table | printer_user
 public | vlan                       | table | printer_user
(14 rows)
```

---

## 3.4 - Create Default Admin User

```powershell
# Still in backend directory
cd C:\Users\Admin\Desktop\PrinterAssetWeb\backend

# Run setup script (if exists) or SQL directly
node setup-admin.js
```

If that doesn't exist, run this SQL:

```powershell
psql -U printer_user -d printer_ms -c "
INSERT INTO users (email, password, role, created_at) 
VALUES ('admin@gmail.com', 'hashed_password_here', 'admin', NOW());
"
```

---

# 🖥️ STEP 4: BACKEND SETUP & START

## 4.1 - Create .env File

```powershell
cd C:\Users\Admin\Desktop\PrinterAssetWeb\backend

# Create .env file with this content
@"
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=printer_user
DB_PASSWORD=Admin@1212
DB_NAME=printer_ms
DB_PORT=5432
EMAIL_USER=your_email@gmail.com
APP_PASSWORD=your_app_password
JWT_SECRET=your_jwt_secret_key_here
"@ | Set-Content -Path .env
```

**Verify .env created**:
```powershell
cat .env
```

---

## 4.2 - Install Backend Dependencies

```powershell
cd C:\Users\Admin\Desktop\PrinterAssetWeb\backend

# Clear old installations
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path package-lock.json -Force -ErrorAction SilentlyContinue

# Fresh install
npm install

# This should take 2-3 minutes
```

**Expected output ends with**:
```
added XXX packages
```

---

## 4.3 - Start Backend Server

```powershell
cd C:\Users\Admin\Desktop\PrinterAssetWeb\backend

npm start
```

**Expected output**:
```
Server running on port 5000
Connected to PostgreSQL database
Health check endpoint available at /health
```

**If you see errors**, let me know and we'll debug.

**Keep this terminal open** - the server should keep running.

---

# ⚛️ STEP 5: FRONTEND SETUP & START

## 5.1 - Open NEW PowerShell Window

**Don't close the backend terminal!** 

Open a **new PowerShell window** and navigate to:

```powershell
cd C:\Users\Admin\Desktop\PrinterAssetWeb\frontend

# Verify directory
dir package.json vite.config.js src/
```

---

## 5.2 - Install Frontend Dependencies

```powershell
cd C:\Users\Admin\Desktop\PrinterAssetWeb\frontend

# Clear cache
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path .vite -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path package-lock.json -Force -ErrorAction SilentlyContinue

# Fresh install
npm install

# This takes 1-2 minutes
```

---

## 5.3 - Start Frontend Development Server

```powershell
cd C:\Users\Admin\Desktop\PrinterAssetWeb\frontend

npm run dev
```

**Expected output**:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

**Keep this terminal open** - the dev server should keep running.

---

# 🌐 STEP 6: ACCESS & TEST

## 6.1 - Open in Browser

Open your web browser and go to:
```
http://localhost:5173/
```

You should see the **Login page** of Printer Asset Manager.

---

## 6.2 - Test Login

**Default credentials** (if you created them):
- Email: `admin@gmail.com`
- Password: `Admin@1212`

If login fails, we'll debug the authentication next.

---

## 6.3 - Test Backend API

Open **new PowerShell** and test:

```powershell
# Test health check
curl http://localhost:5000/api/health

# Test login endpoint
$body = @{email='admin@gmail.com'; password='Admin@1212'} | ConvertTo-Json
$response = curl -Uri 'http://localhost:5000/api/auth/login' -Method POST -ContentType 'application/json' -Body $body
$response | ConvertTo-Json
```

**Expected response**: JSON with token and user data, or success confirmation.

---

# ✅ STEP 7: VERIFY EVERYTHING IS WORKING

## Checklist

```
☐ PostgreSQL service running
☐ Database 'printer_ms' created
☐ 14 tables visible in database
☐ Backend running on http://localhost:5000
☐ Frontend running on http://localhost:5173
☐ Login page loads in browser
☐ Can see health check: http://localhost:5000/api/health
☐ API responds to requests
```

---

# 🆘 TROUBLESHOOTING

## Problem: Backend won't start - Port 5000 in use

```powershell
# Kill process on port 5000
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force
}

# Wait a moment
Start-Sleep -Milliseconds 500

# Try starting backend again
cd C:\Users\Admin\Desktop\PrinterAssetWeb\backend
npm start
```

---

## Problem: Database connection refused

**Check 1**: PostgreSQL is running
```powershell
Get-Service "postgresql-x64-16" | Select-Object Status
```

**Check 2**: Credentials in .env are correct
```powershell
cat C:\Users\Admin\Desktop\PrinterAssetWeb\backend\.env
```

**Check 3**: Database and user exist
```powershell
psql -U postgres

# In psql prompt:
\l                  # List databases
\du                 # List users
```

---

## Problem: Tables missing from database

```powershell
# Re-initialize schema
cd C:\Users\Admin\Desktop\PrinterAssetWeb\backend
psql -U printer_user -d printer_ms -f schema.sql

# Verify
psql -U printer_user -d printer_ms -c "\dt"
```

---

## Problem: Frontend page blank or won't load

**Check 1**: Frontend server is running
```
npm run dev output should show: ➜  Local:   http://localhost:5173/
```

**Check 2**: Clear browser cache
```
Ctrl + Shift + Delete → Clear all
```

**Check 3**: Check browser console for errors
```
F12 → Console tab → Look for red errors
```

---

## Problem: Login fails

**Check 1**: Backend is running
```
http://localhost:5000/api/health should return OK
```

**Check 2**: Admin user exists in database
```powershell
psql -U printer_user -d printer_ms -c "SELECT * FROM users;"
```

**Check 3**: Check backend logs for error messages
```
Look at terminal where npm start is running
```

---

# 📈 NEXT STEPS

Once everything is working locally:

1. **Test all features** (Dashboard, Printers, Issues, etc.)
2. **Verify database operations** working properly
3. **Then proceed to AWS deployment** using QUICK_DEPLOYMENT.md

---

## 💡 Commands Reference

### Quick Start (when everything is already installed)

**Terminal 1 - Backend:**
```powershell
cd C:\Users\Admin\Desktop\PrinterAssetWeb\backend
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\Admin\Desktop\PrinterAssetWeb\frontend
npm run dev
```

**Then access**: http://localhost:5173/

### Database Access
```powershell
# Connect to database
psql -U printer_user -d printer_ms

# Common commands in psql:
\dt               # List all tables
\d table_name     # Describe table
SELECT * FROM users;  # Query users
\q               # Quit
```

---

**Now follow these steps in order and let me know if you hit any issues!** ✅

