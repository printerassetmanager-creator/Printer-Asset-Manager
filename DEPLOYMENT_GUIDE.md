# DEPLOYMENT & QUICK START GUIDE

## 🚀 QUICK START - LOCAL DEVELOPMENT

### Prerequisites
```bash
Node.js 16+
PostgreSQL 12+
npm or yarn
```

### Step 1: Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2: Database Setup
```bash
# Create database
createdb printer_ms

# Initialize schema
cd backend
node setup-db.js

# Verify connection
node test-db.js
```

### Step 3: Configure Environment
```bash
# Backend .env
cp backend/.env.example backend/.env
nano backend/.env

# Set values:
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=printer_ms
DB_USER=postgres
DB_PASSWORD=yourpassword
EMAIL_USER=your_email@gmail.com
APP_PASSWORD=your_app_password
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### Step 4: Start Services
```bash
# Terminal 1: Backend
cd backend
npm start
# Should see: "Server running on port 5000"

# Terminal 2: Frontend
cd frontend
npm run dev
# Should see: "Local: http://localhost:3000"
```

### Step 5: Access Application
```
Frontend:  http://localhost:3000
Backend:   http://localhost:5000
```

---

## 🌐 PRODUCTION DEPLOYMENT (AWS EC2)

### Server Setup
```bash
# SSH into server
ssh -i Printer-key.pem ubuntu@13.60.252.127

# Install Node.js (if not present)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install PM2 globally
sudo npm install -g pm2
```

### Database Setup
```bash
# As postgres user
sudo -u postgres createdb printer_ms
sudo -u postgres psql -c "ALTER ROLE postgres WITH PASSWORD 'your_secure_password';"

# Test connection
psql -h localhost -U postgres -d printer_ms
```

### Deploy Project
```bash
cd ~
git clone https://github.com/printerassetmanager-creator/Printer-Asset-Manager.git
cd Printer-Asset-Manager

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Initialize database
cd ../backend
node setup-db.js

# Setup environment
cp .env.example .env
nano .env  # Configure all values

# Start with PM2
pm2 start "npm start" --name "printer-backend" --cwd /home/ubuntu/Printer-Asset-Manager/backend

# Start frontend
cd ../frontend
npm run build
pm2 serve dist 3000 --name "printer-frontend" --spa
```

### Nginx Reverse Proxy (Optional)
```nginx
# /etc/nginx/sites-available/printer-manager
upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    server_name your_domain.com;

    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

---

## ✅ TEST & VERIFY

### Backend Tests
```bash
cd backend

# Test database
node test-db.js

# Test login
node test-login.js

# Check admin user
node check-admin.js
```

### Security Check
```bash
npm audit                    # Should show 0 vulnerabilities
```

### Frontend Build
```bash
cd frontend
npm run build               # Should complete without errors
```

---

## 📝 ENVIRONMENT VARIABLES REFERENCE

### Backend (.env)
```
# Server
PORT=5000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=printer_ms
DB_USER=postgres
DB_PASSWORD=yourpassword

# Email (Gmail setup required)
EMAIL_USER=your_email@gmail.com
APP_PASSWORD=your_16_char_app_password

# Security
JWT_SECRET=generate_with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
DB_SSL=false

# Optional
DATABASE_URL=postgresql://user:pass@host:port/db
```

### Frontend (vite.config.js)
```javascript
// Already configured in vite.config.js
server: {
    port: 3000,
    proxy: {
        '/api': 'http://localhost:5000'
    }
}
```

---

## 🐛 COMMON ISSUES & FIXES

### Issue: "relation 'vlan' does not exist"
**Solution:**
```bash
cd backend
node setup-db.js
```

### Issue: "Email service not configured"
**Solution:**
```bash
# Generate Gmail app password
# 1. Go to https://myaccount.google.com/apppasswords
# 2. Generate password for "Mail" app
# 3. Add to backend/.env:
EMAIL_USER=your_email@gmail.com
APP_PASSWORD=generated_password
```

### Issue: "ECONNREFUSED - Cannot connect to database"
**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
psql -l | grep printer_ms

# Verify connection string in .env
```

### Issue: "JWT missing or invalid"
**Solution:**
1. Check Authorization header: `Authorization: Bearer YOUR_TOKEN`
2. Ensure token is valid (not expired)
3. Verify JWT_SECRET matches in .env

### Issue: Frontend shows blank page
**Solution:**
```bash
# Clear cache and rebuild
rm -rf node_modules .vite dist
npm install
npm run build
npm run dev
```

---

## 📊 MONITORING & LOGS

### View Backend Logs (PM2)
```bash
pm2 logs printer-backend
pm2 show printer-backend
```

### Database Logs
```bash
sudo tail -f /var/log/postgresql/postgresql.log
```

### Check Port Usage
```bash
# Check if port 5000 is in use
lsof -i :5000

# Kill process if needed
kill -9 <PID>
```

---

## 🔒 SECURITY CHECKLIST

- [ ] Change default PostgreSQL password
- [ ] Set strong JWT_SECRET
- [ ] Configure CORS origins
- [ ] Enable HTTPS/SSL
- [ ] Set NODE_ENV=production
- [ ] Hide .env files from git
- [ ] Disable debug mode in production
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Regular security updates

---

## 📱 API DOCUMENTATION

See [PRINTER_STATUS_GUIDE.md](./PRINTER_STATUS_GUIDE.md) for detailed API endpoints.

### Sample API Calls

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"password123"}'
```

**Get All Printers:**
```bash
curl -X GET http://localhost:5000/api/printers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📞 SUPPORT

For issues or questions:
1. Check FULL_TEST_ANALYSIS.md for detailed testing results
2. Review error logs
3. Check GitHub issues
4. Contact development team

---

**Last Updated:** April 16, 2026  
**Project:** Printer Asset Management System  
**Repo:** https://github.com/printerassetmanager-creator/Printer-Asset-Manager
