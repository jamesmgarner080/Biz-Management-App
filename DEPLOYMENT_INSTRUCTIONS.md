# Deployment Instructions

## Server Issue Fix

The web app was showing "Waiting for process on port 3000..." because the server had stopped running. This has been fixed by restarting the server.

## Current Status
✅ **Server is now running and accessible**

**Live URL:** https://3000-57d4bf9f-821c-4f35-b589-c76ce01d13fd.h1115.daytona.work

## Login Credentials

### Admin Access
- **Username:** `admin`
- **Password:** `admin123`

### Test Users
- **Manager:** `sarah.manager` / `password123`
- **Supervisor:** `mike.super` / `password123`
- **Bar Staff:** `Kerry` / `password123`

## How to Deploy Locally

### Prerequisites
- Node.js 20.x or higher
- npm

### Installation Steps

1. **Clone the repository:**
```bash
git clone https://github.com/jamesmgarner080/Biz-Management-App.git
cd Biz-Management-App
```

2. **Install dependencies:**
```bash
npm install
```

3. **Initialize the database:**
```bash
node backend/init-database.js
```

4. **Load test data (optional):**
```bash
sqlite3 database/business_management.db < database/test_data.sql
sqlite3 database/business_management.db < database/sample_stock_data.sql
```

5. **Start the server:**
```bash
node backend/server.js
```

6. **Access the application:**
Open your browser and navigate to `http://localhost:3000`

## Keeping the Server Running

### Option 1: Using tmux (Recommended for development)
```bash
# Start a new tmux session
tmux new-session -d -s bizapp "node backend/server.js"

# Check if it's running
tmux list-sessions

# View server output
tmux attach -t bizapp

# Detach from session (Ctrl+B, then D)

# Kill the session when done
tmux kill-session -t bizapp
```

### Option 2: Using PM2 (Recommended for production)
```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start backend/server.js --name "bizapp"

# View status
pm2 status

# View logs
pm2 logs bizapp

# Restart
pm2 restart bizapp

# Stop
pm2 stop bizapp

# Start on system boot
pm2 startup
pm2 save
```

### Option 3: Using systemd (Linux production)
Create a service file `/etc/systemd/system/bizapp.service`:

```ini
[Unit]
Description=Business Management App
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/Biz-Management-App
ExecStart=/usr/bin/node backend/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=bizapp

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable bizapp
sudo systemctl start bizapp
sudo systemctl status bizapp
```

## Environment Variables

Create a `.env` file in the root directory (optional):

```env
PORT=3000
NODE_ENV=production
DATABASE_PATH=./database/business_management.db
JWT_SECRET=your-secret-key-here
```

## Troubleshooting

### Server Won't Start
1. Check if port 3000 is already in use:
```bash
lsof -i :3000
# or
netstat -tulpn | grep 3000
```

2. Kill the process if needed:
```bash
kill -9 <PID>
```

3. Check database file permissions:
```bash
ls -la database/business_management.db
chmod 644 database/business_management.db
```

### Database Issues
1. Reinitialize the database:
```bash
rm database/business_management.db
node backend/init-database.js
```

2. Reload test data:
```bash
sqlite3 database/business_management.db < database/test_data.sql
sqlite3 database/business_management.db < database/sample_stock_data.sql
```

### Server Crashes
1. Check logs:
```bash
# If using PM2
pm2 logs bizapp

# If using systemd
journalctl -u bizapp -f

# If using tmux
tmux attach -t bizapp
```

2. Common issues:
   - Missing dependencies: Run `npm install`
   - Database locked: Close other connections
   - Port in use: Change port or kill process

## Production Deployment

### Using Docker (Recommended)

Create `Dockerfile`:
```dockerfile
FROM node:20-slim

# Install SQLite
RUN apt-get update && apt-get install -y sqlite3

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Initialize database
RUN node backend/init-database.js

EXPOSE 3000

CMD ["node", "backend/server.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  bizapp:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./database:/app/database
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

Deploy:
```bash
docker-compose up -d
```

### Using Cloud Platforms

#### Heroku
```bash
# Install Heroku CLI
heroku login
heroku create your-app-name
git push heroku main
```

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Select Node.js as the environment
3. Set build command: `npm install`
4. Set run command: `node backend/server.js`
5. Deploy

#### AWS EC2
1. Launch an EC2 instance (Ubuntu recommended)
2. SSH into the instance
3. Install Node.js and git
4. Clone the repository
5. Follow local installation steps
6. Use PM2 or systemd to keep it running
7. Configure nginx as reverse proxy (optional)

## Monitoring

### Health Check Endpoint
The server provides a health check at:
```
GET http://localhost:3000/health
```

### Monitoring with PM2
```bash
pm2 monit
```

### Log Rotation
Configure PM2 log rotation:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Backup

### Database Backup
```bash
# Manual backup
cp database/business_management.db database/backup_$(date +%Y%m%d_%H%M%S).db

# Automated daily backup (cron)
0 2 * * * cp /path/to/database/business_management.db /path/to/backups/backup_$(date +\%Y\%m\%d).db
```

### Full Application Backup
```bash
tar -czf bizapp_backup_$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  /path/to/Biz-Management-App
```

## Security Recommendations

1. **Change default passwords** immediately after deployment
2. **Use HTTPS** in production (configure nginx/Apache with SSL)
3. **Set strong JWT_SECRET** in environment variables
4. **Enable firewall** and only allow necessary ports
5. **Regular updates**: Keep Node.js and dependencies updated
6. **Database backups**: Implement automated backup strategy
7. **Monitor logs**: Set up log monitoring and alerts

## Support

For issues or questions:
- Check the documentation in the repository
- Review the troubleshooting section above
- Check server logs for error messages

---

**Last Updated:** 2025-10-03  
**Version:** 2.3