# Deployment Guide

This guide covers deploying the Business Management Application to production environments.

## Pre-Deployment Checklist

- [ ] Change default admin password
- [ ] Set secure JWT_SECRET in production
- [ ] Configure production database (PostgreSQL recommended)
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure CORS for production domain
- [ ] Set up backup strategy
- [ ] Configure logging
- [ ] Set up monitoring

## Environment Configuration

### Production Environment Variables

Create a `.env` file with production settings:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Configuration (CHANGE THIS!)
JWT_SECRET=your-super-secure-random-string-min-32-characters
JWT_EXPIRES_IN=24h

# Database Configuration
DATABASE_PATH=./database/business_management.db

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Admin Credentials (CHANGE THIS!)
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=your-secure-password
```

## Deployment Options

### Option 1: Traditional Server (VPS/Dedicated)

#### Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+
- Nginx (for reverse proxy)
- PM2 (for process management)

#### Steps

1. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Install PM2**
```bash
sudo npm install -g pm2
```

3. **Clone/Upload Application**
```bash
cd /var/www
# Upload your application files here
cd business-management-app
```

4. **Install Dependencies**
```bash
npm install --production
```

5. **Configure Environment**
```bash
cp .env.example .env
nano .env  # Edit with production values
```

6. **Initialize Database**
```bash
npm run init-db
```

7. **Start with PM2**
```bash
pm2 start backend/server.js --name business-management
pm2 save
pm2 startup  # Follow the instructions
```

8. **Configure Nginx**

Create `/etc/nginx/sites-available/business-management`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/business-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

9. **Set Up SSL with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Option 2: Docker Deployment

#### Dockerfile

Create a `Dockerfile`:

```dockerfile
FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    poppler-utils \
    wkhtmltopdf \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p database uploads

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_PATH=/app/data/business_management.db
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

#### Deploy with Docker

```bash
# Build and start
docker-compose up -d

# Initialize database
docker-compose exec app npm run init-db

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 3: Cloud Platforms

#### Heroku

1. **Create Heroku App**
```bash
heroku create your-app-name
```

2. **Set Environment Variables**
```bash
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production
```

3. **Deploy**
```bash
git push heroku main
```

4. **Initialize Database**
```bash
heroku run npm run init-db
```

#### AWS EC2

Follow the Traditional Server deployment steps on an EC2 instance.

#### DigitalOcean App Platform

1. Connect your repository
2. Configure environment variables
3. Deploy automatically

## Database Migration to PostgreSQL

For production, PostgreSQL is recommended over SQLite.

### Install PostgreSQL

```bash
sudo apt-get install postgresql postgresql-contrib
```

### Update Dependencies

```bash
npm install pg
```

### Modify database.js

Replace SQLite with PostgreSQL connection:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

### Update Schema

Convert SQLite schema to PostgreSQL syntax (mainly AUTOINCREMENT → SERIAL).

## Backup Strategy

### Automated Backups

Create a backup script `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/business-management"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp database/business_management.db $BACKUP_DIR/db_$DATE.db

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

Add to crontab:
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

## Monitoring

### PM2 Monitoring

```bash
pm2 monit
pm2 logs business-management
```

### Health Check Endpoint

The application includes a health check at `/api/health`:

```bash
curl http://localhost:3000/api/health
```

### Log Management

Configure log rotation in `/etc/logrotate.d/business-management`:

```
/var/www/business-management-app/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

## Security Hardening

### 1. Firewall Configuration

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2Ban

```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
```

### 3. Regular Updates

```bash
sudo apt-get update
sudo apt-get upgrade
```

### 4. Secure Headers

Add to Nginx configuration:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

## Performance Optimization

### 1. Enable Gzip Compression

In Nginx:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### 2. Static File Caching

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Database Optimization

For SQLite:
```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
```

## Troubleshooting

### Application Won't Start

1. Check logs: `pm2 logs business-management`
2. Verify environment variables: `pm2 env 0`
3. Check port availability: `sudo netstat -tulpn | grep 3000`

### Database Errors

1. Check file permissions: `ls -la database/`
2. Verify database exists: `ls database/business_management.db`
3. Reinitialize if needed: `npm run init-db`

### Socket.io Connection Issues

1. Verify WebSocket support in Nginx
2. Check firewall rules
3. Ensure CORS is properly configured

## Maintenance

### Update Application

```bash
# Backup first
./backup.sh

# Pull updates
git pull

# Install dependencies
npm install --production

# Restart
pm2 restart business-management
```

### Database Maintenance

```bash
# Vacuum database (SQLite)
sqlite3 database/business_management.db "VACUUM;"

# Check integrity
sqlite3 database/business_management.db "PRAGMA integrity_check;"
```

## Scaling Considerations

### Horizontal Scaling

For multiple instances:
1. Use PostgreSQL instead of SQLite
2. Implement Redis for session storage
3. Use a load balancer (Nginx, HAProxy)
4. Configure Socket.io with Redis adapter

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching strategies

## Support

For deployment issues:
- Check application logs
- Review Nginx error logs: `/var/log/nginx/error.log`
- Monitor system resources: `htop`
- Check PM2 status: `pm2 status`

## Rollback Procedure

If deployment fails:

```bash
# Stop application
pm2 stop business-management

# Restore database backup
cp /var/backups/business-management/db_YYYYMMDD.db database/business_management.db

# Restore previous version
git checkout previous-version

# Restart
pm2 restart business-management
```