# 🔧 COMPLETE DATABASE FIX - STEP BY STEP

**Issue:** Database tables missing (printers, vlan, health_checkups, etc.)  
**Cause:** setup-db.js not run completely or schema.sql not fully executed  
**Status:** Can be fixed in 5 minutes

---

## 🚀 QUICK FIX (RUN ON SERVER)

### Step 1: SSH to Server
```bash
ssh -i Printer-key.pem ubuntu@172.31.40.179
cd ~/Printer-Asset-Manager/backend
```

### Step 2: Run Complete Database Setup
```bash
# First, verify the database connection
node test-db.js

# Then run the COMPLETE initialization
node setup-db.js

# Then run migrations
node runMigration.js

# Finally, verify all schemas are created
node verify-all-schemas.js
```

### Step 3: Check Results
You should see ALL these tables:
```
✅ users
✅ printers              ← (Currently missing)
✅ vlan                  ← (Currently missing)
✅ spare_parts
✅ hp_printers
✅ cartridges
✅ recipes
✅ issues
✅ health_checkups       ← (Currently missing)
✅ printer_status_logs   ✅ (Created)
✅ printer_live_state    ✅ (Created)
✅ pm_pasted
... and 10+ more
```

### Step 4: Start Backend
```bash
npm start

# Should see:
# Server running on port 5000
# Printer monitor started
# No more "relation does not exist" errors
```

---

## 📊 WHAT IF SOMETHING FAILS?

### Issue: "relation 'printers' does not exist"
**Solution:**
```bash
# Run setup again with verbose output
node setup-db.js
# If it says "already exists", the problem is the schema wasn't fully loaded

# Nuclear option - recreate database:
psql -U postgres -c "DROP DATABASE printer_ms;"
psql -U postgres -c "CREATE DATABASE printer_ms;"

# Then re-initialize:
node setup-db.js
node runMigration.js
```

### Issue: "ECONNREFUSED - connect ECONNREFUSED 127.0.0.1:5432"
**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# If not running, start it:
sudo systemctl start postgresql

# Verify it's listening:
sudo netstat -tlnp | grep postgres
```

### Issue: "role 'postgres' does not exist"
**Solution:**
```bash
# Check current user
whoami

# If not postgres, run with sudo:
sudo -u postgres psql -c "CREATE DATABASE printer_ms;"

# Then run setup as ubuntu user:
node setup-db.js
```

---

## 🔍 DIAGNOSTIC COMMANDS

### Check PostgreSQL Status
```bash
# Is PostgreSQL running?
sudo systemctl status postgresql

# Who's the current user?
whoami

# Can we connect?
psql -U postgres -c "SELECT version();"
```

### List All Database Tables
```bash
# Show all tables in printer_ms database
psql -U postgres -d printer_ms -c "\dt"

# More detailed view:
psql -U postgres -d printer_ms -c "
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
"
```

### Check Table Row Counts
```bash
psql -U postgres -d printer_ms -c "
  SELECT 
    tablename,
    (SELECT COUNT(*) FROM QUOTE_IDENT(tablename)) as row_count
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
"
```

### View Specific Table Schema
```bash
# Check printers table structure
psql -U postgres -d printer_ms -c "\d printers"

# In detail:
psql -U postgres -d printer_ms -c "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'printers'
  ORDER BY ordinal_position;
"
```

---

## ✅ COMPLETE VERIFICATION CHECKLIST

After running setup, verify each of these:

### 1. Check Connection ✅
```bash
node test-db.js
# Should show: ✓ Connection successful
```

### 2. Check Admin User ✅
```bash
node check-admin.js
# Should show admin user details

# If no admin, create one:
node setup-admin.js
```

### 3. Check All Tables ✅
```bash
node verify-all-schemas.js
# Should show all 15+ tables with ✅
```

### 4. Start Backend ✅
```bash
npm start
# Watch for:
# ✓ Server running on port 5000
# ✓ Printer monitor started
# ✓ HP Printer monitor started
# (No "relation does not exist" errors)
```

### 5. Login Test ✅
```bash
# In a new terminal, test the API
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"password"}'

# Should get: {"token":"JWT_TOKEN_HERE"}
```

---

## 📝 ENVIRONMENT SETUP

Make sure your `.env` file has these:

```bash
# backend/.env

# Database connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=printer_ms
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Application
PORT=5000
NODE_ENV=production

# Email (Gmail with app password)
EMAIL_USER=your_email@gmail.com
APP_PASSWORD=your_app_specific_password

# Security (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_random_secret_here

# Optional
DB_SSL=false
DATABASE_URL=      # Only if using connection string instead of individual params
```

---

## 🔄 COMPLETE SETUP FROM SCRATCH

If you need to reset everything:

```bash
# 1. Stop backend
Ctrl+C

# 2. Reset database
psql -U postgres -c "DROP DATABASE IF EXISTS printer_ms CASCADE;"
psql -U postgres -c "CREATE DATABASE printer_ms;"

# 3. Initialize
node setup-db.js
node runMigration.js

# 4. Create admin user
node setup-admin.js

# 5. Verify
node verify-all-schemas.js

# 6. Start
npm start
```

---

## 📞 WHAT EACH SCRIPT DOES

| Script | Purpose | When to Run |
|--------|---------|------------|
| `setup-db.js` | Creates schema (all tables) | First time setup |
| `runMigration.js` | Applies schema updates | After initial setup |
| `verify-all-schemas.js` | Shows current state | Anytime to verify |
| `test-db.js` | Tests connection | Troubleshooting |
| `check-admin.js` | Lists admin users | User management |
| `setup-admin.js` | Creates admin user | First run after DB init |

---

## ✨ EXPECTED FINAL OUTPUT

```
✅ Database Connection: OK
✅ PostgreSQL Version: 12.x or higher
✅ Total Tables: 15+
✅ Users Table: READY
✅ Printers Table: READY
✅ VLAN Table: READY
✅ Health Checkups: READY
✅ Printer Status Logs: READY
✅ Connection Pool: OK

Server Status:
✅ Backend started on port 5000
✅ Printer monitor running
✅ HP Printer monitor running
✅ Ready for API calls
```

---

## 🎯 WHAT'S NEXT

Once database is fully initialized:

1. **Start Services**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm start
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

2. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

3. **Create Test Data**
   - Use admin dashboard to add printers
   - Test all API endpoints

4. **Monitor Logs**
   - Watch for any errors in backend console
   - Check database connections

---

## 📋 QUICK REFERENCE

**To fix the current issue:**
```bash
cd ~/Printer-Asset-Manager/backend
node setup-db.js && node runMigration.js && node verify-all-schemas.js
npm start
```

**If that doesn't work:**
```bash
# Reset everything
psql -U postgres -c "DROP DATABASE printer_ms;"
psql -U postgres -c "CREATE DATABASE printer_ms;"

# Setup fresh
node setup-db.js
node runMigration.js
node setup-admin.js

# Verify
node verify-all-schemas.js

# Start
npm start
```

---

**Document Version:** April 17, 2026  
**Status:** Ready for database recovery
