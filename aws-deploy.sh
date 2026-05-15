#!/bin/bash

# 🚀 AWS DEPLOYMENT SCRIPT FOR PRINTER ASSET MANAGER
# Run this script on your EC2 instance after launching it

set -e  # Exit on any error

echo "🚀 Starting Printer Asset Manager AWS Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   error "This script should NOT be run as root. Run as ubuntu user."
   exit 1
fi

log "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

log "Installing required packages..."
sudo apt-get install -y curl wget git postgresql postgresql-contrib nginx

log "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

log "Installing PM2..."
sudo npm install -g pm2

log "Starting PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

log "Creating database and user..."
sudo -u postgres psql << 'EOF'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'printer_ms') THEN
    CREATE DATABASE printer_ms;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'printer_user') THEN
    CREATE USER printer_user WITH PASSWORD 'PrinterAsset2024!';
  ELSE
    ALTER USER printer_user WITH PASSWORD 'PrinterAsset2024!';
  END IF;
END
$$;

ALTER ROLE printer_user SET client_encoding TO 'utf8';
ALTER ROLE printer_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE printer_user SET timezone TO 'Asia/Kolkata';
ALTER DATABASE printer_ms SET timezone TO 'Asia/Kolkata';
GRANT ALL PRIVILEGES ON DATABASE printer_ms TO printer_user;
\c printer_ms
GRANT ALL ON SCHEMA public TO printer_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO printer_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO printer_user;
\q
EOF

log "Reassigning ownership of existing public schema objects to printer_user..."
sudo -u postgres psql -d printer_ms << 'EOF'
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO printer_user', t.tablename);
  END LOOP;
  FOR t IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public' LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO printer_user', t.sequence_name);
  END LOOP;
END
$$;
EOF

repo_dir="/home/ubuntu/Printer-Asset-Manager"
if [ -d "${repo_dir}" ]; then
  log "Repository already exists, updating existing checkout..."
  cd "${repo_dir}"
  git fetch origin
  git reset --hard origin/main
  git clean -fd
else
  log "Cloning repository..."
  cd /home/ubuntu
  git clone https://github.com/printerassetmanager-creator/Printer-Asset-Manager.git
  cd Printer-Asset-Manager
fi

log "Setting up backend..."
cd backend
npm install

existing_env="/home/ubuntu/Printer-Asset-Manager/backend/.env"
existing_email_user=""
existing_email_password=""
existing_app_password=""
if [ -f "${existing_env}" ]; then
  existing_email_user=$(grep -E '^EMAIL_USER=' "${existing_env}" | tail -n 1 | cut -d= -f2- || true)
  existing_email_password=$(grep -E '^EMAIL_PASSWORD=' "${existing_env}" | tail -n 1 | cut -d= -f2- || true)
  existing_app_password=$(grep -E '^APP_PASSWORD=' "${existing_env}" | tail -n 1 | cut -d= -f2- || true)
fi

# Generate JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Create .env file
cat > .env << EOF
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=printer_ms
DB_USER=printer_user
DB_PASSWORD=PrinterAsset2024!
JWT_SECRET=${JWT_SECRET}
LOG_LEVEL=info
ALLOWED_ORIGINS=*
EOF

if [ -n "${existing_email_user}" ]; then
  {
    echo "EMAIL_USER=${existing_email_user}"
    if [ -n "${existing_email_password}" ]; then
      echo "EMAIL_PASSWORD=${existing_email_password}"
    elif [ -n "${existing_app_password}" ]; then
      echo "APP_PASSWORD=${existing_app_password}"
    fi
  } >> .env
else
  warn "Email is not configured on AWS. Add EMAIL_USER and EMAIL_PASSWORD or APP_PASSWORD to backend/.env, then run: pm2 restart printer-backend --update-env"
fi

log "Initializing database..."
node setup-db.js
node runMigration.js

log "Creating admin user..."
node setup-admin.js

log "Setting up frontend..."
cd ../frontend
npm install
npm run build

log "Publishing frontend build to Nginx web root..."
sudo mkdir -p /var/www/printer-manager
sudo rm -rf /var/www/printer-manager/*
sudo cp -a dist/. /var/www/printer-manager/
sudo chown -R www-data:www-data /var/www/printer-manager

log "Starting services with PM2..."
cd ../backend
pm2 delete backend frontend printer-backend printer-frontend || true
pm2 start "npm start" --name "printer-backend" --cwd /home/ubuntu/Printer-Asset-Manager/backend

cd ../frontend
pm2 start "npx serve dist -p 3000" --name "printer-frontend" --cwd /home/ubuntu/Printer-Asset-Manager/frontend

pm2 startup
pm2 save

log "Configuring Nginx..."
sudo cat > /etc/nginx/sites-available/printer-manager << 'EOF'
upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    server_name _;
    root /var/www/printer-manager;
    index index.html;
    client_max_body_size 25m;

    location = /api/health {
        proxy_pass http://backend/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /health {
        proxy_pass http://backend/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/printer-manager /etc/nginx/sites-enabled/ 2>/dev/null || true
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

log "Setting up SSL certificate..."
sudo apt-get install -y certbot python3-certbot-nginx

# Note: SSL setup requires domain name, so we'll skip this for now
# User can run: sudo certbot certonly --nginx -d yourdomain.com

log "Creating backup script..."
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump printer_ms > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x /home/ubuntu/backup.sh

# Setup daily backup at 2 AM
(crontab -l ; echo "0 2 * * * /home/ubuntu/backup.sh") | crontab -

log "Deployment completed successfully!"
echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo "📊 SERVICE STATUS:"
pm2 status
echo ""
echo "🌐 ACCESS YOUR APPLICATION:"
echo "   Frontend: http://YOUR_EC2_PUBLIC_IP"
echo "   API:      http://YOUR_EC2_PUBLIC_IP/api"
echo "   Health:   http://YOUR_EC2_PUBLIC_IP/api/health"
echo ""
echo "🔒 NEXT STEPS:"
echo "1. Point your domain to EC2 Public IP"
echo "2. Setup SSL: sudo certbot certonly --nginx -d yourdomain.com"
echo "3. Update ALLOWED_ORIGINS in backend/.env"
echo "4. Test login with admin@gmail.com / password"
echo ""
echo "📝 ADMIN CREDENTIALS:"
echo "   Email: admin@gmail.com"
echo "   Password: password"
echo ""
echo "🔧 USEFUL COMMANDS:"
echo "   pm2 status          # Check service status"
echo "   pm2 logs            # View logs"
echo "   pm2 restart all     # Restart services"
echo "   sudo systemctl status nginx  # Check nginx"
