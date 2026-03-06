# ZKTeco Integration Fix Summary

## Problem Identified

When accessing `http://100.29.7.215/iclock/ping`, you were getting a **Next.js 404 page** instead of the Express backend response (`OK`).

### Root Cause

The issue is **NOT** with the Express code or route mounting. The problem is that **Nginx is routing `/iclock/*` requests to Next.js instead of Express**.

Here's what happens:
1. Request comes to `http://100.29.7.215/iclock/ping` (port 80)
2. Nginx receives the request
3. Nginx doesn't have a specific rule for `/iclock/*`
4. Nginx forwards to Next.js (default behavior)
5. Next.js doesn't have this route, returns 404 page

## Fixes Applied

### 1. Express Code Fixes ✓

**File: `backend/src/index.ts`**

- ✅ Changed `express.raw()` to `express.text()` for `/iclock/cdata` endpoint
  - ZKTeco devices send text data, not binary
  - `express.text()` properly parses text payloads

- ✅ Added startup logging to show mounted routes
  - Helps verify routes are registered correctly
  - Shows ZKTeco endpoints on server start

**File: `backend/src/modules/zkteco/zkteco.controller.ts`**

- ✅ Improved body parsing to handle text format correctly
  - Works with `express.text()` middleware

### 2. Route Mounting ✓

**Already Correct:**
```typescript
app.use('/iclock', zktecoRouter);
```

This mounts the router at `/iclock`, creating:
- `GET /iclock/ping`
- `POST /iclock/cdata`
- `GET /iclock/getrequest`
- `GET /iclock/devicecmd`

### 3. Nginx Configuration (REQUIRED) ⚠️

**This is the critical missing piece!**

You need to configure Nginx to route `/iclock/*` to Express (port 3001) instead of Next.js.

**See: `NGINX_ZKTECO_CONFIG.md` for complete Nginx configuration**

Key points:
- `/iclock/` location block must come **BEFORE** the general `/` location block
- Route `/iclock/*` to `http://localhost:3001` (Express)
- Route everything else to `http://localhost:3000` (Next.js)

## Verification Steps

### Step 1: Test Express Directly

```bash
curl http://localhost:3001/iclock/ping
```

**Expected:** `OK` (plain text)

If this fails:
- Express is not running
- Check: `pm2 status` or `ps aux | grep node`
- Start: `cd backend && npm start`

### Step 2: Test Through Nginx

```bash
curl http://100.29.7.215/iclock/ping
```

**Expected:** `OK` (plain text)

**If you get 404:**
- Nginx is not routing to Express
- Configure Nginx (see `NGINX_ZKTECO_CONFIG.md`)

**If you get Next.js 404 page:**
- Nginx is routing to Next.js
- Fix Nginx configuration

### Step 3: Check Route Mounting

When Express starts, you should see:
```
📋 Mounted Routes:
  ✓ GET  /iclock/ping          → ZKTeco health check
  ✓ POST /iclock/cdata         → ZKTeco attendance data
  ✓ GET  /iclock/getrequest     → ZKTeco command requests
  ✓ GET  /iclock/devicecmd      → ZKTeco device commands
```

## Quick Fix Checklist

- [ ] Express is running on port 3001
- [ ] Routes are mounted at `/iclock` (check startup logs)
- [ ] `curl http://localhost:3001/iclock/ping` returns `OK`
- [ ] Nginx is configured to route `/iclock/*` to Express
- [ ] `/iclock/` location block comes before `/` in Nginx config
- [ ] `curl http://100.29.7.215/iclock/ping` returns `OK` (not 404)

## Files Changed

1. **`backend/src/index.ts`**
   - Changed `express.raw()` to `express.text()`
   - Added startup route logging

2. **`backend/src/modules/zkteco/zkteco.controller.ts`**
   - Improved body parsing for text format

3. **`NGINX_ZKTECO_CONFIG.md`** (NEW)
   - Complete Nginx configuration guide
   - Troubleshooting steps
   - Route priority explanation

4. **`ZKTECO_DEPLOYMENT.md`**
   - Fixed typo: `-g` → `-y` for apt-get install

5. **`backend/scripts/test-zkteco-routes.sh`** (NEW)
   - Testing script to verify setup
   - Run on server to check all components

## Why This Happens

### Request Flow (Current - Broken)

```
Device → http://100.29.7.215/iclock/ping
  ↓
Nginx (port 80)
  ↓ (no /iclock/ rule)
Next.js (port 3000)
  ↓ (route not found)
404 Page ❌
```

### Request Flow (Fixed)

```
Device → http://100.29.7.215/iclock/ping
  ↓
Nginx (port 80)
  ↓ (/iclock/ rule matches)
Express (port 3001)
  ↓ (route exists)
OK ✅
```

## Next Steps

1. **Configure Nginx** (see `NGINX_ZKTECO_CONFIG.md`)
   ```bash
   sudo nano /etc/nginx/sites-available/zyberhr
   # Paste configuration from NGINX_ZKTECO_CONFIG.md
   sudo nginx -t
   sudo systemctl restart nginx
   ```

2. **Test the fix:**
   ```bash
   curl http://100.29.7.215/iclock/ping
   # Should return: OK
   ```

3. **Configure ZKTeco device:**
   - Server URL: `http://100.29.7.215`
   - Enable ADMS/Push SDK mode
   - Test connection

4. **Monitor logs:**
   ```bash
   pm2 logs zyberhr-backend
   # Look for [ZKTeco] log entries
   ```

## Summary

The Express code is correct. The issue is **Nginx routing**. Once you configure Nginx to route `/iclock/*` to Express, everything will work.

**Key takeaway:** Port 80 traffic goes through Nginx first. Nginx must explicitly route `/iclock/*` to Express, otherwise it goes to Next.js by default.
