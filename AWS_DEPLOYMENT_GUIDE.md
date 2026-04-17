# 🚀 COMPLETE AWS DEPLOYMENT GUIDE
## Printer Asset Management System

**Date:** April 17, 2026  
**Status:** Ready for AWS deployment  
**Estimated Time:** 30-45 minutes

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ Verify Before Deploying:
- [x] Database initialized (14 tables created)
- [x] Backend running on port 5000
- [x] Frontend builds successfully
- [x] Code pushed to GitHub
- [ ] AWS Account ready
- [ ] Domain purchased (optional but recommended)
- [ ] SSL Certificate ready (AWS provides free)

---

## 🏗️ AWS DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│                    USERS                             │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   ┌────▼────┐            ┌──────▼──────┐
   │ Nginx   │            │   CloudFront│
   │ (Port80)│            │   (CDN)     │
   └────┬────┘            └──────┬──────┘
        │                         │
   ┌────▼─────────────────────────▼────┐
   │  EC2 Instance (t3.medium)          │
   │  ├─ Frontend (port 3000)           │
   │  ├─ Backend (port 5000)            │
   │  └─ Node.js + npm                  │
   └────┬─────────────────────────┬─────┘
        │                         │
   ┌────▼──────────────┐  ┌──────▼──────────┐
   │ RDS PostgreSQL    │  │ EBS Volume      │
   │ (Database)        │  │ (Storage)       │
   └───────────────────┘  └─────────────────┘
```

---

## 📝 STEP 1: AWS ACCOUNT SETUP

### 1.1 Create AWS Account
```
1. Go to aws.amazon.com
2. Click "Create an AWS Account"
3. Enter email and password
4. Verify email
5. Add payment method
```

### 1.2 Create IAM User (Recommended)
```
Don't use root account for deployments!
1. Go to IAM Dashboard
2. Click "Users" → "Create User"
3. Username: deploy-user
4. Attach policies:
   - EC2FullAccess
   - RDSFullAccess
   - S3FullAccess
5. Generate Access Key & Secret
   (Save these securely!)
```

---

## 🖥️ STEP 2: SET UP EC2 INSTANCE

### 2.1 Launch EC2 Instance
```
1. Go to EC2 Dashboard
2. Click "Launch Instance"
3. Choose AMI: Ubuntu 22.04 LTS (free tier eligible)
4. Instance Type: t3.medium (or t2.micro for testing)
   - vCPU: 2
   - Memory: 4 GB RAM
   - Storage: 50 GB minimum
5. Click "Review and Launch"
```

### 2.2 Configure Security Group
```
Allow incoming traffic:
✅ SSH (Port 22):     0.0.0.0/0
✅ HTTP (Port 80):    0.0.0.0/0
✅ HTTPS (Port 443):  0.0.0.0/0
✅ Backend (5000):    0.0.0.0/0 (or restrict to your IP)

Allow outgoing: All
```

### 2.3 Create/Configure Key Pair
```
1. Create new key pair: "printer-asset-deployment.pem"
2. Download and save securely
3. Set permissions: chmod 400 printer-asset-deployment.pem
4. Connect to instance:
   ssh -i printer-asset-deployment.pem ubuntu@YOUR_PUBLIC_IP
```

---

## 🔧 STEP 3: INSTALL DEPENDENCIES ON EC2

### 3.1 Update System
```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y curl wget git
```

### 3.2 Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

### 3.3 Install PostgreSQL
```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
sudo -u postgres psql --version
```

### 3.4 Install Nginx
```bash
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
nginx -v
```

### 3.5 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
pm2 --version

# Enable PM2 startup
pm2 startup
pm2 save
```

---

## 🗄️ STEP 4: SET UP DATABASE ON EC2

### 4.1 Create PostgreSQL Database
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# In psql:
CREATE DATABASE printer_ms;
CREATE USER printer_user WITH PASSWORD 'strong_password_here';
ALTER ROLE printer_user SET client_encoding TO 'utf8';
ALTER ROLE printer_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE printer_user SET default_transaction_deferrable TO on;
ALTER ROLE printer_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE printer_ms TO printer_user;
\c printer_ms
GRANT ALL ON SCHEMA public TO printer_user;
\q
```

### 4.2 Initialize Database Schema
```bash
# Will cover this in Step 5
```

---

## 📦 STEP 5: DEPLOY APPLICATION

### 5.1 Clone Repository
```bash
cd /home/ubuntu
git clone https://github.com/printerassetmanager-creator/Printer-Asset-Manager.git
cd Printer-Asset-Manager
```

### 5.2 Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
# Server
PORT=5000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=printer_ms
DB_USER=printer_user
DB_PASSWORD=strong_password_here

# Email (Gmail with app password)
EMAIL_USER=your_email@gmail.com
APP_PASSWORD=your_app_password_16_chars

# Security
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# CORS
ALLOWED_ORIGINS=your_domain.com,www.your_domain.com
EOF

# Initialize database
node setup-db.js
node runMigration.js

# Verify schema
node verify-all-schemas.js

# Create admin user
node setup-admin.js

# Test it works
npm start
# Should see: "Server running on port 5000"
# (Ctrl+C to stop)
```

### 5.3 Setup Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Create .env for frontend (if needed)
cat > .env << EOF
VITE_API_URL=https://your_domain.com/api
EOF

# Build for production
npm run build

# This creates 'dist' folder with static files
```

### 5.4 Start Services with PM2
```bash
# Start backend
cd ../backend
pm2 start "npm start" --name "printer-backend"

# Start frontend (serve dist files)
pm2 start "npx serve dist -p 3000" --name "printer-frontend" -f

# Save PM2 config
pm2 save

# Check status
pm2 status
pm2 logs
```

---

## 🌐 STEP 6: CONFIGURE NGINX (REVERSE PROXY)

### 6.1 Create Nginx Configuration
```bash
sudo cat > /etc/nginx/sites-available/printer-manager << 'EOF'
upstream backend {
    server localhost:5000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # API endpoints (backend)
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the configuration
sudo ln -s /etc/nginx/sites-available/printer-manager /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 6.2 Verify Setup
```bash
# Test backend
curl http://localhost:5000/health
# Should return: {"status":"OK",...}

# Test frontend
curl http://localhost:3000
# Should return HTML

# Test through Nginx
curl http://YOUR_PUBLIC_IP
# Should return frontend

curl http://YOUR_PUBLIC_IP/api/health
# Should return: {"status":"OK",...}
```

---

## 🔒 STEP 7: SETUP SSL/HTTPS (AWS Certificate Manager)

### 7.1 Use AWS Certificate Manager (Recommended)
```
1. Go to AWS Certificate Manager
2. Click "Request a certificate"
3. Request public certificate
4. Add domain names:
   - your_domain.com
   - www.your_domain.com
5. Validation method: DNS (easiest)
6. Click "Request"
7. Add CNAME records to your DNS provider
8. Wait for validation (usually 5-15 minutes)
9. Certificate will be issued
```

### 7.2 Configure Nginx with SSL
```bash
# Install Certbot (alternative - free SSL)
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot certonly --nginx -d your_domain.com -d www.your_domain.com

# Update Nginx configuration
sudo cat > /etc/nginx/sites-available/printer-manager << 'EOF'
upstream backend {
    server localhost:5000;
}

upstream frontend {
    server localhost:3000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name your_domain.com www.your_domain.com;

    ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # API endpoints
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Test and restart
sudo nginx -t
sudo systemctl restart nginx

# Auto-renewal for SSL
sudo certbot renew --dry-run
```

---

## 📊 STEP 8: DOMAIN & DNS CONFIGURATION

### 8.1 Point Domain to EC2
```
1. Get your EC2 Public IP Address
   (from AWS EC2 Dashboard)

2. Go to your domain registrar:
   - GoDaddy, Namecheap, Route53, etc.

3. Create A Record:
   Name: @ (or your_domain.com)
   Type: A
   Value: YOUR_EC2_PUBLIC_IP
   TTL: 3600

4. Create A Record for www:
   Name: www
   Type: A
   Value: YOUR_EC2_PUBLIC_IP
   TTL: 3600

5. Wait 15-30 minutes for DNS propagation

6. Test:
   ping your_domain.com
   curl https://your_domain.com
```

### 8.2 Using Route53 (AWS DNS)
```
1. Go to Route53
2. Create hosted zone with your domain
3. Create A records pointing to EC2
4. Update domain registrar nameservers
   to AWS nameservers
```

---

## 🔍 STEP 9: MONITORING & MAINTENANCE

### 9.1 Monitor Application
```bash
# Check PM2 processes
pm2 status
pm2 logs printer-backend
pm2 logs printer-frontend

# Monitor CPU/Memory
pm2 monit

# Check logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Check database
sudo -u postgres psql -d printer_ms -c "SELECT COUNT(*) FROM users;"
```

### 9.2 Setup CloudWatch Monitoring (AWS)
```
1. EC2 Dashboard → Instances → Select instance
2. Monitoring tab → Detailed monitoring
3. CloudWatch → Dashboards → Create dashboard
4. Add metrics:
   - CPU Utilization
   - Network In/Out
   - Disk Read/Write
   - RDS Database metrics
```

### 9.3 Database Backups
```bash
# Manual backup
sudo -u postgres pg_dump printer_ms > backup_$(date +%Y%m%d).sql

# automated backup (add to crontab)
# 0 2 * * * sudo -u postgres pg_dump printer_ms > /backups/backup_$(date +\%Y\%m\%d).sql

# Set crontab
sudo crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

### 9.4 SSL Certificate Renewal
```bash
# Automatic renewal is setup by certbot
# Verify auto-renewal works:
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
sudo systemctl status certbot.timer
```

---

## 🎯 STEP 10: POST-DEPLOYMENT VERIFICATION

### 10.1 Test Everything
```bash
# Test backend API
curl https://your_domain.com/api/health

# Test login
curl -X POST https://your_domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"password"}'

# Test frontend
curl -s https://your_domain.com | grep -o "<title>.*</title>"

# Check processes
pm2 status

# Check database
sudo -u postgres psql -d printer_ms -c "\dt"

# Check Nginx
sudo systemctl status nginx
```

### 10.2 Test from Browser
```
1. Go to https://your_domain.com
2. Should see login page
3. Try login with admin credentials
4. Should redirect to dashboard
5. Check browser console for errors
6. Check network tab for API calls
```

---

## 📝 ENVIRONMENT VARIABLES FOR PRODUCTION

### Backend .env (Full Example)
```bash
# Server Configuration
PORT=5000
NODE_ENV=production
LOG_LEVEL=info

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=printer_ms
DB_USER=printer_user
DB_PASSWORD=your_secure_password_here
DB_SSL=false

# Security
JWT_SECRET=your_256bit_hex_string_here
ALLOWED_ORIGINS=https://your_domain.com,https://www.your_domain.com

# Email Service
EMAIL_USER=your_email@gmail.com
APP_PASSWORD=your_16_char_app_password

# AWS (if using S3 for storage)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=printer-asset-uploads

# Monitoring
SENTRY_DSN=https://your_sentry_url

# Session
SESSION_SECRET=your_session_secret_here
```

### Frontend .env (if needed)
```bash
VITE_API_URL=https://your_domain.com/api
VITE_APP_NAME=Printer Asset Manager
VITE_APP_VERSION=1.0.0
```

---

## 🔐 SECURITY BEST PRACTICES

```
✅ DO:
  □ Use HTTPS/SSL (enforced)
  □ Restrict SSH to specific IPs
  □ Use strong passwords
  □ Regular backups
  □ Keep Node.js updated
  □ Use environment variables for secrets
  □ Close unused ports
  □ Enable CloudTrail logging
  □ Regular security audits
  □ Monitor PM2 logs

❌ DON'T:
  □ Use default passwords
  □ Commit .env to GitHub
  □ Expose API keys
  □ Allow SSH from 0.0.0.0
  □ Skip SSL/HTTPS
  □ Disable database backups
  □ Run as root
  □ Disable firewall
```

---

## 📞 TROUBLESHOOTING

### Issue: Port 5000 already in use
```bash
lsof -i :5000
kill -9 PID
```

### Issue: Database connection failed
```bash
sudo systemctl restart postgresql
sudo -u postgres psql -d printer_ms -c "SELECT 1"
```

### Issue: Nginx 502 Bad Gateway
```bash
# Check backend is running
pm2 status

# Check backend logs
pm2 logs printer-backend

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: SSL Certificate errors
```bash
# Renew certificate manually
sudo certbot renew

# Check Nginx SSL config
sudo nginx -t
```

### Issue: Frontend not loading
```bash
# Check PM2 process
pm2 status

# Check port 3000 open
lsof -i :3000

# Restart PM2
pm2 restart printer-frontend
```

---

## 🚀 QUICK REFERENCE - FULL DEPLOYMENT

```bash
# Full deployment from scratch
sudo apt-get update && sudo apt-get upgrade -y

# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib nginx pm2

# Clone and setup
cd /home/ubuntu
git clone https://github.com/printerassetmanager-creator/Printer-Asset-Manager.git
cd Printer-Asset-Manager/backend

# Database
sudo -u postgres psql << EOF
CREATE DATABASE printer_ms;
CREATE USER printer_user WITH PASSWORD 'password';
ALTER ROLE printer_user ... (see step 4.1)
EOF

# Environment
cat > .env << EOF
# (see environment variables section)
EOF

# Initialize
npm install
node setup-db.js
node setup-admin.js

# Deploy
pm2 start "npm start" --name "printer-backend"

# Status
pm2 status
pm2 logs
```

---

## ✅ DEPLOYMENT COMPLETE CHECKLIST

- [ ] AWS Account created
- [ ] EC2 instance launched (t3.medium, Ubuntu 22.04)
- [ ] Security groups configured
- [ ] SSH access verified
- [ ] Node.js installed (v18+)
- [ ] PostgreSQL installed
- [ ] Database created with schema
- [ ] Application cloned from GitHub
- [ ] Backend running with PM2
- [ ] Frontend built and running
- [ ] Nginx configured as reverse proxy
- [ ] Domain pointing to EC2
- [ ] SSL certificate installed
- [ ] HTTPS working
- [ ] API endpoints responding
- [ ] Database backups configured
- [ ] Monitoring setup complete
- [ ] All tests passing

**When all checked: ✅ PRODUCTION READY**

---

**Deployment is complete! Your application is now live on AWS.** 🎉

**Next:** Monitor logs, configure alerts, and plan backups.

