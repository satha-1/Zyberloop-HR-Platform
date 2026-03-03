#!/bin/bash

# ZyberHR Deployment Script
# Usage: ./deploy.sh [backend|frontend|all]

set -e

DEPLOY_TARGET=${1:-all}

echo "🚀 Starting deployment..."

if [ "$DEPLOY_TARGET" = "backend" ] || [ "$DEPLOY_TARGET" = "all" ]; then
  echo "📦 Deploying backend..."
  cd backend
  
  echo "Installing dependencies..."
  npm install
  
  echo "Building TypeScript..."
  npm run build
  
  echo "Restarting application..."
  pm2 restart zyberhr-backend || pm2 start dist/index.js --name zyberhr-backend
  pm2 save
  
  echo "✅ Backend deployed successfully!"
  cd ..
fi

if [ "$DEPLOY_TARGET" = "frontend" ] || [ "$DEPLOY_TARGET" = "all" ]; then
  echo "📦 Deploying frontend..."
  cd frontend
  
  echo "Installing dependencies..."
  npm install
  
  echo "Building Next.js application..."
  npm run build
  
  echo "Restarting application..."
  pm2 restart zyberhr-frontend || pm2 start npm --name zyberhr-frontend -- start
  pm2 save
  
  echo "✅ Frontend deployed successfully!"
  cd ..
fi

echo "🎉 Deployment complete!"
pm2 status
