# Nginx Configuration for ZKTeco Integration

## Problem Explanation

When you access `http://100.29.7.215/iclock/ping`, you're getting a Next.js 404 page instead of the Express backend response. This happens because:

1. **Port 80 is handled by Nginx** - All HTTP traffic on port 80 goes through Nginx first
2. **Nginx routes to Next.js by default** - If `/iclock/*` isn't explicitly configured, Nginx forwards to Next.js
3. **Next.js catches all unmatched routes** - Next.js returns its 404 page for routes it doesn't recognize
4. **Express is on port 3001** - Your Express backend is running on port 3001, but Nginx isn't routing `/iclock/*` to it

## Solution: Nginx Configuration

You need to configure Nginx to route `/iclock/*` requests to your Express backend (port 3001) while keeping other routes going to Next.js.

## Complete Nginx Configuration

Create or edit `/etc/nginx/sites-available/zyberhr`:

```nginx
# Upstream for Express backend
upstream express_backend {
    server localhost:3001;
    keepalive 32;
}

# Upstream for Next.js frontend
upstream nextjs_frontend {
    server localhost:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name 100.29.7.215;  # Your server IP or domain

    # CRITICAL: ZKTeco device endpoints MUST be routed to Express backend
    # This must come BEFORE the general location blocks
    location /iclock/ {
        proxy_pass http://express_backend;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        # Important: Allow larger request bodies for device data
        client_max_body_size 10M;
        
        # Timeout settings for device communication
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Disable buffering for real-time communication
        proxy_buffering off;
    }

    # API endpoints - route to Express backend
    location /api/ {
        proxy_pass http://express_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }

    # Health check - route to Express backend
    location /health {
        proxy_pass http://express_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # All other routes go to Next.js frontend
    location / {
        proxy_pass http://nextjs_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Installation Steps

### 1. Install Nginx (if not installed)

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

**Note:** The deployment guide had a typo (`-g` instead of `-y`). Use `-y` for apt-get.

### 2. Create Configuration File

```bash
sudo nano /etc/nginx/sites-available/zyberhr
```

Paste the configuration above, then save and exit (Ctrl+X, Y, Enter).

### 3. Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/zyberhr /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default
```

### 4. Test Configuration

```bash
# Test Nginx configuration syntax
sudo nginx -t
```

You should see:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5. Restart Nginx

```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

### 6. Verify Routes

Test that `/iclock/ping` now goes to Express:

```bash
# Test Express directly (should return "OK")
curl http://localhost:3001/iclock/ping

# Test through Nginx (should also return "OK")
curl http://100.29.7.215/iclock/ping
```

Both commands should return plain text: `OK`

## Troubleshooting

### Still Getting 404 from Next.js

1. **Check Nginx is running:**
   ```bash
   sudo systemctl status nginx
   ```

2. **Check Nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Verify Express is running on port 3001:**
   ```bash
   curl http://localhost:3001/iclock/ping
   # Should return: OK
   ```

4. **Check Nginx access logs:**
   ```bash
   sudo tail -f /var/log/nginx/access.log
   ```

5. **Verify route order in Nginx config:**
   - `/iclock/` location block MUST come before the general `/` location block
   - Location blocks are matched in order, first match wins

### Express Not Receiving Requests

1. **Check Express is listening:**
   ```bash
   netstat -tulpn | grep :3001
   # or
   ss -tulpn | grep :3001
   ```

2. **Check Express logs:**
   ```bash
   pm2 logs zyberhr-backend
   ```

3. **Test direct connection:**
   ```bash
   curl -v http://localhost:3001/iclock/ping
   ```

### Next.js Not Receiving Other Routes

If your frontend stops working:

1. **Check Next.js is running:**
   ```bash
   curl http://localhost:3000
   ```

2. **Verify upstream configuration:**
   - Check Next.js port (default 3000)
   - Update `nextjs_frontend` upstream if different

## Route Priority Explanation

Nginx matches location blocks in this order:

1. **Exact match** (`location = /path`)
2. **Prefix match** (`location /path/`)
3. **Regex match** (`location ~ /path`)
4. **General match** (`location /`)

For ZKTeco to work:
- `/iclock/` must be a prefix match BEFORE the general `/` location
- This ensures `/iclock/ping` goes to Express, not Next.js

## Testing Checklist

- [ ] `curl http://localhost:3001/iclock/ping` returns `OK`
- [ ] `curl http://100.29.7.215/iclock/ping` returns `OK` (not 404)
- [ ] `curl http://100.29.7.215/health` returns JSON from Express
- [ ] `curl http://100.29.7.215/api/v1/health` returns JSON from Express
- [ ] `curl http://100.29.7.215/` returns HTML from Next.js
- [ ] Device can connect and send data to `/iclock/cdata`

## SSL/HTTPS Configuration (Optional)

If you want HTTPS, add this after the HTTP server block:

```nginx
server {
    listen 443 ssl http2;
    server_name 100.29.7.215;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Same location blocks as HTTP config above
    location /iclock/ {
        proxy_pass http://express_backend;
        # ... same config as above
    }
    
    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name 100.29.7.215;
    return 301 https://$server_name$request_uri;
}
```

**Important:** If using HTTPS, update your ZKTeco device configuration to use `https://` instead of `http://`.

## Summary

The key fix is:
1. **Express routes are mounted at `/iclock`** ✓ (already done)
2. **Nginx must route `/iclock/*` to Express on port 3001** ← This was missing
3. **Route order matters** - `/iclock/` must come before `/` in Nginx config
4. **Use `express.text()` not `express.raw()`** ✓ (already fixed)

Once Nginx is configured correctly, `http://100.29.7.215/iclock/ping` will return `OK` from Express instead of a 404 from Next.js.
