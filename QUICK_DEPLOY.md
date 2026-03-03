# Quick AWS Deployment Guide

## Fastest Path to Production

### 1. MongoDB Setup (5 minutes)
- Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create free cluster
- Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/zyberhr`

### 2. Backend Deployment - EC2 (15 minutes)

```bash
# Launch EC2 instance (Ubuntu 22.04, t3.medium)
# SSH into instance
ssh -i key.pem ubuntu@your-ec2-ip

# Run setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/setup.sh | bash

# Or manual setup:
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2

# Clone and deploy
git clone <your-repo> zyberhr
cd zyberhr/backend
npm install
npm run build

# Create .env
cat > .env << EOF
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/zyberhr
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-domain.com
EOF

# Start with PM2
pm2 start dist/index.js --name backend
pm2 save
pm2 startup

# Setup Nginx
sudo nano /etc/nginx/sites-available/backend
# Paste nginx config (see full guide)
sudo ln -s /etc/nginx/sites-available/backend /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# SSL (optional)
sudo certbot --nginx -d api.yourdomain.com
```

### 3. Frontend Deployment - AWS Amplify (10 minutes)

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click "New app" → "Host web app"
3. Connect GitHub repository
4. Build settings (auto-detected):
   - Build command: `npm run build`
   - Output directory: `.next`
5. Environment variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
   ```
6. Deploy!

### 4. Update Backend CORS

```bash
# SSH into backend
nano .env
# Update: FRONTEND_URL=https://your-amplify-domain.amplifyapp.com
pm2 restart backend
```

## Done! 🎉

Your app should now be live at:
- Frontend: `https://your-amplify-domain.amplifyapp.com`
- Backend: `https://api.yourdomain.com`

## Next Steps

1. Run database migrations: `npm run migrate:enterprise-payroll`
2. Seed initial data (optional): `npm run seed`
3. Set up monitoring in CloudWatch
4. Configure backups for MongoDB

## Troubleshooting

- **502 Bad Gateway**: Check if backend is running: `pm2 status`
- **CORS errors**: Verify FRONTEND_URL matches your frontend domain
- **Database connection**: Check MongoDB Atlas network access settings
