#!/bin/bash

# ZKTeco Route Testing Script
# This script helps verify that ZKTeco endpoints are correctly configured

echo "=========================================="
echo "ZKTeco Route Testing Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EXPRESS_PORT=${EXPRESS_PORT:-3001}
SERVER_IP=${SERVER_IP:-"100.29.7.215"}

echo "Configuration:"
echo "  Express Port: $EXPRESS_PORT"
echo "  Server IP: $SERVER_IP"
echo ""

# Test 1: Direct Express connection
echo "Test 1: Direct Express Connection (localhost:$EXPRESS_PORT)"
echo "------------------------------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:$EXPRESS_PORT/iclock/ping)
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ] && [ "$BODY" = "OK" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Express is running and /iclock/ping returns OK"
    echo "  Response: $BODY"
    echo "  HTTP Code: $HTTP_CODE"
else
    echo -e "${RED}✗ FAIL${NC} - Express connection failed"
    echo "  Response: $BODY"
    echo "  HTTP Code: $HTTP_CODE"
    echo -e "${YELLOW}  → Check if Express is running: pm2 status${NC}"
    echo -e "${YELLOW}  → Check Express logs: pm2 logs zyberhr-backend${NC}"
fi
echo ""

# Test 2: Through Nginx (if server IP is provided)
if [ "$SERVER_IP" != "localhost" ] && [ "$SERVER_IP" != "127.0.0.1" ]; then
    echo "Test 2: Through Nginx (http://$SERVER_IP/iclock/ping)"
    echo "------------------------------------------------------------"
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://$SERVER_IP/iclock/ping)
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

    if [ "$HTTP_CODE" = "200" ] && [ "$BODY" = "OK" ]; then
        echo -e "${GREEN}✓ PASS${NC} - Nginx is routing /iclock/ping to Express"
        echo "  Response: $BODY"
        echo "  HTTP Code: $HTTP_CODE"
    elif [ "$HTTP_CODE" = "404" ]; then
        echo -e "${RED}✗ FAIL${NC} - Getting 404 (likely routing to Next.js)"
        echo "  Response: $BODY"
        echo "  HTTP Code: $HTTP_CODE"
        echo -e "${YELLOW}  → Nginx is NOT routing /iclock/* to Express${NC}"
        echo -e "${YELLOW}  → Check Nginx config: sudo nano /etc/nginx/sites-available/zyberhr${NC}"
        echo -e "${YELLOW}  → Verify /iclock/ location block exists and comes before / location${NC}"
    else
        echo -e "${RED}✗ FAIL${NC} - Unexpected response"
        echo "  Response: $BODY"
        echo "  HTTP Code: $HTTP_CODE"
    fi
    echo ""
fi

# Test 3: Check Express health
echo "Test 3: Express Health Check"
echo "------------------------------------------------------------"
RESPONSE=$(curl -s http://localhost:$EXPRESS_PORT/health)
if echo "$RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✓ PASS${NC} - Express health check OK"
    echo "  Response: $RESPONSE"
else
    echo -e "${RED}✗ FAIL${NC} - Express health check failed"
    echo "  Response: $RESPONSE"
fi
echo ""

# Test 4: Check if Express is listening on correct port
echo "Test 4: Port Check"
echo "------------------------------------------------------------"
if netstat -tuln 2>/dev/null | grep -q ":$EXPRESS_PORT " || ss -tuln 2>/dev/null | grep -q ":$EXPRESS_PORT "; then
    echo -e "${GREEN}✓ PASS${NC} - Port $EXPRESS_PORT is listening"
    echo "  Process: $(lsof -i :$EXPRESS_PORT 2>/dev/null | tail -n 1 || echo 'Unable to determine')"
else
    echo -e "${RED}✗ FAIL${NC} - Port $EXPRESS_PORT is NOT listening"
    echo -e "${YELLOW}  → Express may not be running${NC}"
    echo -e "${YELLOW}  → Start with: cd backend && npm start${NC}"
    echo -e "${YELLOW}  → Or with PM2: pm2 start dist/index.js --name zyberhr-backend${NC}"
fi
echo ""

# Test 5: Check Nginx status (if on server)
echo "Test 5: Nginx Status"
echo "------------------------------------------------------------"
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} - Nginx is running"
    echo "  Status: $(systemctl is-active nginx)"
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Cannot check Nginx status (may not be installed or not accessible)"
    echo "  (This is OK if testing from a different machine)"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "If Test 1 passes but Test 2 fails:"
echo "  → Nginx configuration issue"
echo "  → See NGINX_ZKTECO_CONFIG.md for correct Nginx setup"
echo ""
echo "If both tests fail:"
echo "  → Express may not be running"
echo "  → Check: pm2 status or ps aux | grep node"
echo "  → Check logs: pm2 logs zyberhr-backend"
echo ""
echo "Next steps:"
echo "  1. Ensure Express is running on port $EXPRESS_PORT"
echo "  2. Configure Nginx to route /iclock/* to Express"
echo "  3. Test device connection: curl http://$SERVER_IP/iclock/ping"
echo ""
