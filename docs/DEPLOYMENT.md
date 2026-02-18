# Deployment Guide

## Prerequisites

- Ubuntu Server 20.04 or higher
- Node.js 16+ installed
- MongoDB installed
- Nginx installed
- Domain name configured
- SSL certificate (Let's Encrypt recommended)

## Backend Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2
sudo npm install -g pm2
```

### 2. Application Setup

```bash
# Create application directory
sudo mkdir -p /var/www/ecommerce-api
cd /var/www/ecommerce-api

# Clone repository
git clone <your-repo-url> .

# Install dependencies
cd backend
npm install --production

# Create .env file
sudo nano .env
```

Example production .env:

```env
NODE_ENV=production
PORT=5000
API_URL=https://api.yourstore.com

MONGODB_URI=mongodb://localhost:27017/ecommerce_production

JWT_SECRET=<generate-secure-secret>
JWT_EXPIRE=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=<app-password>
EMAIL_FROM=noreply@yourstore.com

CURRENCY_API_URL=https://api.exchangerate-api.com/v4/latest/ZAR
CURRENCY_UPDATE_INTERVAL=6

STRIPE_SECRET_KEY=sk_live_<your-key>
PAYPAL_CLIENT_ID=<your-client-id>
PAYPAL_CLIENT_SECRET=<your-secret>
PAYPAL_MODE=live

ADMIN_URL=https://admin.yourstore.com
FRONTEND_URL=https://yourstore.com
```

### 3. Start Application with PM2

```bash
# Start application
pm2 start server.js --name ecommerce-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
```

### 4. Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/ecommerce-api
```

```nginx
server {
    listen 80;
    server_name api.yourstore.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourstore.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourstore.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourstore.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/ecommerce-api-access.log;
    error_log /var/log/nginx/ecommerce-api-error.log;

    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location /uploads {
        alias /var/www/ecommerce-api/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Client max body size
    client_max_body_size 10M;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/ecommerce-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourstore.com

# Auto-renewal is configured automatically
```

### 6. MongoDB Security

```bash
# Enable authentication
sudo mongo

use admin
db.createUser({
  user: "admin",
  pwd: "<secure-password>",
  roles: [ { role: "root", db: "admin" } ]
})

use ecommerce_production
db.createUser({
  user: "ecommerce_user",
  pwd: "<secure-password>",
  roles: [ { role: "readWrite", db: "ecommerce_production" } ]
})

exit
```

Update MongoDB configuration:

```bash
sudo nano /etc/mongod.conf
```

```yaml
security:
  authorization: enabled
```

Restart MongoDB:

```bash
sudo systemctl restart mongod
```

Update .env with authentication:

```env
MONGODB_URI=mongodb://ecommerce_user:<password>@localhost:27017/ecommerce_production
```

### 7. Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 8. Monitoring

```bash
# View PM2 logs
pm2 logs ecommerce-api

# View PM2 status
pm2 status

# View Nginx logs
sudo tail -f /var/log/nginx/ecommerce-api-error.log
```

## Admin Panel Deployment

### 1. Build Admin Panel

```bash
cd /var/www/ecommerce-admin
git clone <your-repo-url> .
cd admin-panel

# Create .env
echo "REACT_APP_API_URL=https://api.yourstore.com" > .env

# Install and build
npm install
npm run build
```

### 2. Configure Nginx for Admin Panel

```bash
sudo nano /etc/nginx/sites-available/ecommerce-admin
```

```nginx
server {
    listen 80;
    server_name admin.yourstore.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.yourstore.com;

    ssl_certificate /etc/letsencrypt/live/admin.yourstore.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourstore.com/privkey.pem;

    root /var/www/ecommerce-admin/admin-panel/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/ecommerce-admin /etc/nginx/sites-enabled/
sudo certbot --nginx -d admin.yourstore.com
sudo nginx -t
sudo systemctl reload nginx
```

## Database Backup

### Automated Backup Script

```bash
sudo nano /usr/local/bin/backup-ecommerce-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ecommerce"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mongodump --uri="mongodb://ecommerce_user:<password>@localhost:27017/ecommerce_production" \
  --out="$BACKUP_DIR/backup_$TIMESTAMP"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

```bash
sudo chmod +x /usr/local/bin/backup-ecommerce-db.sh
```

### Schedule Backup

```bash
sudo crontab -e
```

Add:

```cron
0 2 * * * /usr/local/bin/backup-ecommerce-db.sh
```

## Monitoring and Maintenance

### PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Log Management

```bash
# Nginx log rotation is automatic

# Application logs via PM2
pm2 flush  # Clear logs
pm2 reloadLogs  # Reload log files
```

### Health Monitoring

Create a simple monitoring script:

```bash
sudo nano /usr/local/bin/health-check.sh
```

```bash
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" https://api.yourstore.com/health)

if [ $response != "200" ]; then
    echo "API is down! Response code: $response" | mail -s "API Alert" admin@yourstore.com
    pm2 restart ecommerce-api
fi
```

```bash
sudo chmod +x /usr/local/bin/health-check.sh
```

Schedule health check:

```cron
*/5 * * * * /usr/local/bin/health-check.sh
```

## Scaling Considerations

### Load Balancing with Multiple Instances

```bash
# Start multiple instances
pm2 start server.js -i max --name ecommerce-api
```

### Redis for Session Storage

```bash
# Install Redis
sudo apt install redis-server

# Configure in application
npm install connect-redis express-session redis
```

### CDN Setup

1. Create S3 bucket or use CDN service
2. Upload static assets
3. Update image URLs in application

## Security Checklist

- [ ] SSL certificates installed
- [ ] MongoDB authentication enabled
- [ ] Firewall configured
- [ ] Environment variables secured
- [ ] Regular backups scheduled
- [ ] Monitoring set up
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers added
- [ ] Keep dependencies updated

## Troubleshooting

### API not responding

```bash
pm2 status
pm2 logs ecommerce-api --lines 100
```

### MongoDB connection issues

```bash
sudo systemctl status mongod
sudo tail -f /var/log/mongodb/mongod.log
```

### Nginx issues

```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

## Updates and Deployment

### Deploy Updates

```bash
cd /var/www/ecommerce-api/backend
git pull origin main
npm install --production
pm2 restart ecommerce-api
```

### Zero-Downtime Deployment

```bash
pm2 reload ecommerce-api
```

This guide covers the essential deployment steps. Adjust based on your specific infrastructure and requirements.
