# AWS Deployment Guide for ZyberHR Platform

This guide covers deploying the ZyberHR platform (Next.js frontend + Node.js/Express backend) to AWS.

## Architecture Overview

```
┌─────────────────┐
│   CloudFront    │  (Optional: CDN for frontend)
└────────┬────────┘
         │
┌────────▼────────┐
│  Next.js App    │  (AWS Amplify / EC2 / ECS)
│   (Frontend)    │
└────────┬────────┘
         │
┌────────▼────────┐
│ Express API     │  (EC2 / ECS / Elastic Beanstalk)
│   (Backend)     │
└────────┬────────┘
         │
┌────────▼────────┐
│  MongoDB Atlas  │  (or EC2 MongoDB)
└─────────────────┘
```

## Deployment Options

### Option 1: AWS Amplify (Frontend) + EC2 (Backend) - **Recommended for Quick Start**

### Option 2: ECS Fargate (Both) - **Recommended for Production**

### Option 3: Elastic Beanstalk (Both) - **Easiest for Beginners**

---

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. MongoDB Atlas account (or EC2 MongoDB instance)
4. Domain name (optional but recommended)

---

## Step 1: Set Up MongoDB

### Option A: MongoDB Atlas (Recommended)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (Free tier available)
3. Create database user
4. Whitelist AWS IP ranges or `0.0.0.0/0` for development
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/zyberhr?retryWrites=true&w=majority`

### Option B: MongoDB on EC2

1. Launch EC2 instance (Ubuntu 22.04)
2. Install MongoDB:
   ```bash
   sudo apt update
   sudo apt install -y mongodb
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```
3. Configure security group to allow port 27017 from backend

---

## Step 2: Deploy Backend (Express API)

### Option A: Deploy to EC2

#### 2.1 Launch EC2 Instance

1. Go to EC2 Console → Launch Instance
2. Choose: **Ubuntu Server 22.04 LTS**
3. Instance type: **t3.medium** (or larger for production)
4. Configure security group:
   - SSH (22): Your IP
   - HTTP (80): 0.0.0.0/0
   - HTTPS (443): 0.0.0.0/0
   - Custom TCP (3001): 0.0.0.0/0 (or your frontend IP)
5. Create/select key pair
6. Launch instance

#### 2.2 Connect and Setup

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

#### 2.3 Deploy Application

```bash
# Clone repository (or upload files)
git clone <your-repo-url> zyberhr
cd zyberhr/backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Create .env file
nano .env
```

#### 2.4 Environment Variables (.env)

```env
# Server
NODE_ENV=production
PORT=3001

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zyberhr?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://your-frontend-domain.com

# AWS S3 (if using file uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=zyberhr-uploads

# Redis (if using BullMQ)
REDIS_HOST=your-redis-endpoint
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

#### 2.5 Start Application with PM2

```bash
# Start application
pm2 start dist/index.js --name zyberhr-backend

# Save PM2 configuration
pm2 save
pm2 startup  # Follow instructions to enable auto-start

# Check status
pm2 status
pm2 logs zyberhr-backend
```

#### 2.6 Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/zyberhr-backend
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # or your EC2 IP

    location / {
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

    # Increase upload size for file uploads
    client_max_body_size 50M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/zyberhr-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 2.7 Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

### Option B: Deploy to ECS Fargate (Containerized)

#### 2.1 Create Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/index.js"]
```

#### 2.2 Create .dockerignore

```dockerignore
node_modules
dist
.env
*.log
.git
```

#### 2.3 Build and Push to ECR

```bash
# Install AWS CLI if not installed
# Configure AWS credentials
aws configure

# Create ECR repository
aws ecr create-repository --repository-name zyberhr-backend --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
cd backend
docker build -t zyberhr-backend .

# Tag image
docker tag zyberhr-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/zyberhr-backend:latest

# Push image
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/zyberhr-backend:latest
```

#### 2.4 Create ECS Task Definition

Create `backend/ecs-task-definition.json`:

```json
{
  "family": "zyberhr-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "zyberhr-backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/zyberhr-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:zyberhr/mongodb-uri"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:zyberhr/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/zyberhr-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 2.5 Create ECS Service

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create ECS cluster
aws ecs create-cluster --cluster-name zyberhr-cluster

# Create service
aws ecs create-service \
  --cluster zyberhr-cluster \
  --service-name zyberhr-backend \
  --task-definition zyberhr-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

---

## Step 3: Deploy Frontend (Next.js)

### Option A: AWS Amplify (Recommended for Next.js)

#### 3.1 Prepare Frontend

1. Update `frontend/src/app/lib/api.ts`:
   ```typescript
   const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.yourdomain.com/api/v1';
   ```

2. Create `frontend/amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

#### 3.2 Deploy via Amplify Console

1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Connect repository (GitHub/GitLab/Bitbucket) or deploy without Git
4. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `.next`
5. Add environment variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
   ```
6. Deploy

#### 3.3 Custom Domain (Optional)

1. In Amplify Console → App Settings → Domain
2. Add custom domain
3. Follow DNS configuration instructions

---

### Option B: Deploy to EC2

#### 3.1 Setup Next.js on EC2

```bash
# SSH into EC2 instance (can be same or different from backend)
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone <your-repo-url> zyberhr
cd zyberhr/frontend

# Install dependencies
npm install

# Build application
npm run build

# Start with PM2
pm2 start npm --name zyberhr-frontend -- start
pm2 save
```

#### 3.2 Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/zyberhr-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
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

```bash
sudo ln -s /etc/nginx/sites-available/zyberhr-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Step 4: Setup AWS Services

### 4.1 AWS S3 for File Uploads

```bash
# Create S3 bucket
aws s3 mb s3://zyberhr-uploads --region us-east-1

# Enable CORS
aws s3api put-bucket-cors --bucket zyberhr-uploads --cors-configuration file://cors.json
```

`cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 4.2 AWS Secrets Manager (for sensitive data)

```bash
# Store MongoDB URI
aws secretsmanager create-secret \
  --name zyberhr/mongodb-uri \
  --secret-string "mongodb+srv://..."

# Store JWT Secret
aws secretsmanager create-secret \
  --name zyberhr/jwt-secret \
  --secret-string "your-jwt-secret"
```

### 4.3 AWS RDS for Redis (if using BullMQ)

1. Go to ElastiCache Console
2. Create Redis cluster
3. Update backend environment variables with Redis endpoint

---

## Step 5: Environment Variables Summary

### Backend (.env)

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://yourdomain.com
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=zyberhr-uploads
REDIS_HOST=...
REDIS_PORT=6379
```

### Frontend (Amplify Environment Variables)

```
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
```

---

## Step 6: Post-Deployment

### 6.1 Run Database Migrations

```bash
# SSH into backend server
cd zyberhr/backend
npm run migrate:enterprise-payroll
```

### 6.2 Seed Initial Data (Optional)

```bash
npm run seed
```

### 6.3 Verify Deployment

1. Check backend health: `https://api.yourdomain.com/health`
2. Check frontend: `https://yourdomain.com`
3. Test login and API calls

---

## Step 7: Monitoring & Logging

### 7.1 CloudWatch Logs

- ECS: Automatic log streaming to CloudWatch
- EC2: Install CloudWatch agent or use PM2 logs

### 7.2 Application Monitoring

- AWS X-Ray for distributed tracing
- CloudWatch Metrics for performance
- Set up alarms for errors and high latency

---

## Step 8: CI/CD Pipeline (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd zyberhr/backend
            git pull
            npm install
            npm run build
            pm2 restart zyberhr-backend

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Amplify
        # Amplify auto-deploys on git push if connected
```

---

## Cost Estimation (Monthly)

- **EC2 (t3.medium)**: ~$30/month
- **MongoDB Atlas (M10)**: ~$57/month (or free tier)
- **AWS Amplify**: Free tier (then ~$0.15/GB)
- **S3 Storage**: ~$0.023/GB
- **Data Transfer**: ~$0.09/GB
- **Total (estimated)**: ~$100-150/month for small-medium usage

---

## Security Checklist

- [ ] Use HTTPS (SSL certificates)
- [ ] Store secrets in AWS Secrets Manager
- [ ] Configure security groups properly
- [ ] Enable CloudWatch logging
- [ ] Set up backup for MongoDB
- [ ] Use IAM roles instead of access keys where possible
- [ ] Enable MFA for AWS account
- [ ] Regular security updates on EC2 instances

---

## Troubleshooting

### Backend not starting
- Check PM2 logs: `pm2 logs zyberhr-backend`
- Verify environment variables
- Check MongoDB connection
- Verify port 3001 is open

### Frontend can't connect to backend
- Check CORS settings
- Verify API_BASE_URL environment variable
- Check security groups allow traffic
- Verify backend is running

### File uploads not working
- Check S3 bucket permissions
- Verify AWS credentials
- Check CORS configuration on S3 bucket

---

## Quick Start Script

Save as `deploy.sh`:

```bash
#!/bin/bash

# Backend deployment
echo "Deploying backend..."
cd backend
npm install
npm run build
pm2 restart zyberhr-backend || pm2 start dist/index.js --name zyberhr-backend
pm2 save

# Frontend deployment (if on same server)
echo "Deploying frontend..."
cd ../frontend
npm install
npm run build
pm2 restart zyberhr-frontend || pm2 start npm --name zyberhr-frontend -- start
pm2 save

echo "Deployment complete!"
```

Make executable: `chmod +x deploy.sh`

---

## Support

For issues:
1. Check CloudWatch logs
2. Check PM2 logs: `pm2 logs`
3. Verify environment variables
4. Check security groups and network configuration
