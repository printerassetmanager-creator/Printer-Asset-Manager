# 🚀 AWS DEPLOYMENT GUIDE
## Printer Asset Management System

### ✅ Prerequisites
- AWS Account (free tier available)
- Domain name (optional, but recommended for SSL)
- GitHub repository access

---

## ⚡ QUICK DEPLOYMENT (30 minutes)

### Step 1: Launch AWS EC2 Instance
1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click "Launch Instance"
3. Choose AMI: **Ubuntu Server 22.04 LTS**
4. Instance Type: **t3.medium** (2 vCPU, 4GB RAM) - $0.0416/hour
5. Storage: **50 GB** (gp3)
6. Security Group:
   - SSH (22) - Source: Your IP
   - HTTP (80) - Source: 0.0.0.0/0
   - HTTPS (443) - Source: 0.0.0.0/0
7. Launch and download the `.pem` key file

### Step 2: Connect to Your Instance
```bash
# Replace with your instance's public IP and key file
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP
```

### Step 3: Run Deployment Script
```bash
# Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/printerassetmanager-creator/Printer-Asset-Manager/main/aws-deploy.sh | bash
```

### Step 4: Verify Deployment
```bash
# Check services
pm2 status

# Test backend
curl http://localhost:5000/health

# Test frontend
curl http://localhost:3000
```

### Step 5: Access Your Application
- **Frontend:** `http://YOUR_PUBLIC_IP`
- **API:** `http://YOUR_PUBLIC_IP/api`
- **Health Check:** `http://YOUR_PUBLIC_IP/api/health`

---

## 🔒 SSL & Domain Setup (Optional)

### Point Domain to EC2
1. Go to your domain registrar
2. Create A record pointing to your EC2 Public IP
3. Wait 15-30 minutes for DNS propagation

### Install SSL Certificate
```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot certonly --nginx -d yourdomain.com

# Update Nginx config for SSL
sudo nano /etc/nginx/sites-available/printer-manager
```

Add this to your Nginx config:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # ... rest of your config
}
```

```bash
# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔧 ADMIN ACCESS

**Default Admin Credentials:**
- Email: `admin@gmail.com`
- Password: `password`

**Change password after first login!**

---

## 📊 MONITORING & MAINTENANCE

### Check Service Status
```bash
pm2 status
pm2 logs printer-backend
pm2 logs printer-frontend
```

### Restart Services
```bash
pm2 restart all
```

### View Logs
```bash
pm2 logs --lines 100
```

### Backup Database
```bash
/home/ubuntu/backup.sh
```

### Update Application
```bash
cd /home/ubuntu/Printer-Asset-Manager
git pull origin main
cd backend && npm install && pm2 restart printer-backend
cd ../frontend && npm install && npm run build && pm2 restart printer-frontend
```

---

## 🆘 TROUBLESHOOTING

### Application Not Loading
```bash
# Check if services are running
pm2 status

# Check Nginx
sudo systemctl status nginx

# Check ports
netstat -tlnp | grep :5000
netstat -tlnp | grep :3000
```

### Database Connection Issues
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -h localhost -U printer_user -d printer_ms
```

### SSL Issues
```bash
# Renew certificate
sudo certbot renew

# Check certificate
sudo certbot certificates
```

---

## 💰 COST ESTIMATION

**Free Tier (12 months):**
- EC2 t3.micro: 750 hours/month
- PostgreSQL: 20 GB storage
- Data Transfer: 15 GB/month

**After Free Tier:**
- t3.medium: ~$30/month
- 50GB Storage: ~$5/month
- Data Transfer: ~$0.09/GB

**Total Monthly Cost:** ~$35/month

---

## 🔄 CI/CD Setup (Optional)

For automatic deployments on code changes:

1. Install GitHub Actions
2. Configure AWS credentials in repository secrets
3. Use the deployment script in your workflow

---

## 📞 SUPPORT

If you encounter issues:
1. Check the logs: `pm2 logs`
2. Verify services: `pm2 status`
3. Test endpoints: `curl http://localhost:5000/health`
4. Check this guide or create an issue on GitHub

**Happy Deploying! 🚀**