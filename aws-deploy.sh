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
sudo -u postgres psql << EOF
CREATE DATABASE printer_ms;
CREATE USER printer_user WITH PASSWORD 'PrinterAsset2024!';
ALTER ROLE printer_user SET client_encoding TO 'utf8';
ALTER ROLE printer_user SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE printer_ms TO printer_user;
\c printer_ms
GRANT ALL ON SCHEMA public TO printer_user;
\q
EOF

log "Cloning repository..."
cd /home/ubuntu
git clone https://github.com/printerassetmanager-creator/Printer-Asset-Manager.git
cd Printer-Asset-Manager

log "Setting up backend..."
cd backend
npm install

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

log "Initializing database..."
node setup-db.js
node runMigration.js

log "Creating admin user..."
node setup-admin.js

log "Setting up frontend..."
cd ../frontend
npm install
npm run build

log "Starting services with PM2..."
cd ../backend
pm2 start "npm start" --name "printer-backend"

cd ../frontend
pm2 start "npx serve dist -p 3000" --name "printer-frontend"

pm2 startup
pm2 save

log "Configuring Nginx..."
sudo cat > /etc/nginx/sites-available/printer-manager << 'EOF'
upstream backend {
    server localhost:5000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name _;

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
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