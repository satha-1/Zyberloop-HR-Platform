#!/bin/bash

# ZyberHR Backend EC2 Setup Script
# Run this script on a fresh Ubuntu 22.04 EC2 instance

set -e

echo "🚀 Starting ZyberHR Backend Setup..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install Git
echo "📦 Installing Git..."
sudo apt install -y git

# Install build tools
echo "📦 Installing build tools..."
sudo apt install -y build-essential

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/zyberhr
sudo chown $USER:$USER /opt/zyberhr

# Setup PM2 startup
echo "⚙️  Configuring PM2 startup..."
pm2 startup systemd -u $USER --hp /home/$USER

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Clone your repository: cd /opt/zyberhr && git clone <your-repo-url> ."
echo "2. Install dependencies: cd backend && npm install"
echo "3. Create .env file with your configuration"
echo "4. Build: npm run build"
echo "5. Start: pm2 start dist/index.js --name zyberhr-backend"
echo "6. Save: pm2 save"
echo ""
echo "For Nginx configuration, see AWS_DEPLOYMENT_GUIDE.md"
