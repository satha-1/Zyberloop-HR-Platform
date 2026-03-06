# ZKTeco Device Integration - Deployment Guide

This guide explains how to deploy the ZKTeco device integration on a VPS (Virtual Private Server).

## Prerequisites

- VPS with Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+ installed
- MongoDB installed and running
- Domain name or static IP address (e.g., `100.29.7.215`)
- Firewall access to port 3001 (or your configured port)

## Step 1: Server Setup

### Install Node.js (if not already installed)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install MongoDB (if not already installed)

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Step 2: Deploy Application

### Clone/Upload Code

```bash
# Navigate to your application directory
cd /path/to/your/app

# If using git
git clone <your-repo-url>
cd Zyberloop-HR-Platform
```

### Install Dependencies

```bash
cd backend
npm install
```

### Configure Environment Variables

Create or update `.env` file in the `backend` directory:

```bash
cd backend
nano .env
```

Add the following (adjust values as needed):

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb://localhost:27017/zyberhr

# CORS (your frontend URL)
FRONTEND_URL=http://your-frontend-domain.com

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Admin Seed (optional, for initial admin user)
ADMIN_SEED_EMAIL=admin@example.com
ADMIN_SEED_PASSWORD=SecurePassword123!
```

### Build the Application

```bash
cd backend
npm run build
```

## Step 3: Configure Firewall

Allow traffic on your server port:

```bash
# If using UFW
sudo ufw allow 3001/tcp
sudo ufw reload

# If using iptables
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
sudo iptables-save
```

## Step 4: Set Up Process Manager (PM2)

PM2 keeps your application running and restarts it if it crashes.

### Install PM2

```bash
sudo npm install -g pm2
```

### Start Application with PM2

```bash
cd backend
pm2 start dist/index.js --name zyberhr-backend
```

### Configure PM2 to Start on Boot

```bash
pm2 startup
# Follow the instructions shown
pm2 save
```

### Useful PM2 Commands

```bash
# View logs
pm2 logs zyberhr-backend

# Restart application
pm2 restart zyberhr-backend

# Stop application
pm2 stop zyberhr-backend

# View status
pm2 status
```

## Step 5: Set Up Reverse Proxy (Nginx)

Nginx will handle HTTP requests and forward them to your Node.js application.

### Install Nginx

```bash
sudo apt-get update
sudo apt-get install -g nginx
```

### Configure Nginx

Create/edit Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/zyberhr
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name 100.29.7.215;  # Replace with your domain or IP

    # ZKTeco device endpoints (must be at root level)
    location /iclock/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Important: Allow larger request bodies for device data
        client_max_body_size 10M;
        
        # Timeout settings for device communication
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/zyberhr /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

## Step 6: Configure ZKTeco Device

1. Access your ZKTeco device web interface (usually `http://<device-ip>`)
2. Navigate to **Communication** or **Network** settings
3. Enable **ADMS** or **Push SDK** mode
4. Set **Server URL** to: `http://100.29.7.215` (your server IP/domain)
5. Set **Server Port** to: `80` (or `443` if using HTTPS)
6. Configure **Push Interval** (e.g., every 1 minute)
7. Save and restart the device

### Device Configuration Checklist

- [ ] ADMS/Push SDK mode enabled
- [ ] Server URL: `http://100.29.7.215`
- [ ] Server Port: `80`
- [ ] Push Interval configured
- [ ] Device time synchronized
- [ ] User IDs match employee codes in your system

## Step 7: Verify Installation

### Test Endpoints

```bash
# Test ping endpoint
curl http://100.29.7.215/iclock/ping
# Expected: OK

# Test health endpoint
curl http://100.29.7.215/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Monitor Logs

```bash
# View application logs
pm2 logs zyberhr-backend

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check Database

Connect to MongoDB and verify logs are being saved:

```bash
mongo
use zyberhr
db.zktecodevicelogs.find().sort({createdAt: -1}).limit(5)
```

## Step 8: SSL/HTTPS Setup (Optional but Recommended)

For production, set up SSL certificates using Let's Encrypt:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

Update Nginx configuration to redirect HTTP to HTTPS and update device URL to use `https://`.

## Troubleshooting

### Device Cannot Connect

1. **Check firewall:**
   ```bash
   sudo ufw status
   sudo netstat -tulpn | grep :80
   ```

2. **Check Nginx is running:**
   ```bash
   sudo systemctl status nginx
   ```

3. **Check application is running:**
   ```bash
   pm2 status
   pm2 logs zyberhr-backend
   ```

4. **Test connectivity from device network:**
   ```bash
   # From device network, test:
   curl http://100.29.7.215/iclock/ping
   ```

### 404 Errors

- Verify routes are registered at `/iclock/*` (not `/api/v1/iclock/*`)
- Check Nginx configuration matches the route structure
- Verify application is listening on correct port

### Data Not Being Saved

1. **Check application logs:**
   ```bash
   pm2 logs zyberhr-backend --lines 100
   ```

2. **Check MongoDB connection:**
   ```bash
   mongo
   use zyberhr
   show collections
   ```

3. **Verify employee codes match:**
   - Check device user IDs
   - Check employee codes in database
   - Ensure case matching (system converts to uppercase)

### Performance Issues

1. **Monitor resource usage:**
   ```bash
   pm2 monit
   ```

2. **Check MongoDB indexes:**
   ```bash
   mongo
   use zyberhr
   db.zktecodevicelogs.getIndexes()
   ```

3. **Optimize Nginx:**
   - Adjust `client_max_body_size` if needed
   - Configure caching if appropriate

## Maintenance

### Update Application

```bash
cd /path/to/your/app
git pull  # or upload new files
cd backend
npm install
npm run build
pm2 restart zyberhr-backend
```

### Backup Database

```bash
# Create backup
mongodump --db zyberhr --out /backup/zyberhr-$(date +%Y%m%d)

# Restore backup
mongorestore --db zyberhr /backup/zyberhr-YYYYMMDD/zyberhr
```

### Monitor Logs

Set up log rotation for PM2:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Security Considerations

1. **Firewall:** Only expose necessary ports (80, 443)
2. **MongoDB:** Enable authentication and restrict network access
3. **Environment Variables:** Never commit `.env` files
4. **HTTPS:** Use SSL/TLS in production
5. **Rate Limiting:** Consider adding rate limiting for device endpoints
6. **IP Whitelisting:** Optionally restrict `/iclock/*` endpoints to known device IPs

## Support

For issues or questions:
- Check application logs: `pm2 logs zyberhr-backend`
- Check Nginx logs: `/var/log/nginx/error.log`
- Review ZKTeco device logs in web interface
- Check MongoDB for saved device logs

## Additional Resources

- [ZKTeco Push SDK Documentation](https://www.zkteco.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
