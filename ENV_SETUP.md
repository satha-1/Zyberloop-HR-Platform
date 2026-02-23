# Environment Variables Setup Guide

This guide explains how to configure environment variables for the HR Management Platform, especially for AWS deployment.

## Quick Start

1. **Backend Setup:**
   ```bash
   cd backend
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

## Backend Environment Variables

Create a `.env.local` file in the `backend/` directory with the following variables:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `3001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/zyberhr` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-jwt-key` |
| `FRONTEND_URL` | Frontend application URL (for CORS) | `http://localhost:3000` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `ADMIN_SEED_EMAIL` | Admin user email for seeding | `sathsarasoysa2089@gmail.com` |
| `ADMIN_SEED_PASSWORD` | Admin user password for seeding | `Sath@Admin` |
| `UPLOAD_DIR` | Directory for file uploads | `./uploads` |
| `MAX_FILE_SIZE` | Maximum file size in bytes | `5242880` (5MB) |

### AWS S3 Configuration (for Production)

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_REGION` | AWS region | `us-east-1` |
| `S3_BUCKET` | S3 bucket name | `zyberhr-documents` |
| `AWS_ACCESS_KEY_ID` | AWS access key | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Your AWS secret key |
| `S3_ENDPOINT` | S3 endpoint (for S3-compatible storage) | Leave empty for AWS |
| `S3_FORCE_PATH_STYLE` | Force path-style URLs | `false` |

### Redis Configuration (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | (empty) |

### Document Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DOCUMENT_PRESIGNED_URL_TTL` | Presigned URL TTL in seconds | `900` (15 min) |
| `PDF_GENERATION_TIMEOUT` | PDF generation timeout in ms | `30000` (30 sec) |
| `DOCUMENT_BULK_BATCH_SIZE` | Bulk document batch size | `250` |

### DocuSign Configuration (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `DOCUSIGN_ENABLED` | Enable DocuSign integration | `false` |
| `DOCUSIGN_CLIENT_ID` | DocuSign client ID | (empty) |
| `DOCUSIGN_CLIENT_SECRET` | DocuSign client secret | (empty) |
| `DOCUSIGN_ACCOUNT_ID` | DocuSign account ID | (empty) |
| `DOCUSIGN_BASE_URL` | DocuSign API base URL | `https://demo.docusign.net` |

## Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory with the following variables:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL | `http://localhost:3001/api/v1` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Frontend application URL | `http://localhost:3000` |

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Do not put sensitive data in these variables.

## AWS Deployment Configuration

### Backend (EC2/ECS/Lambda)

For AWS deployment, set these environment variables in your deployment configuration:

```bash
# Production MongoDB (use MongoDB Atlas or DocumentDB)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zyberhr

# Production JWT Secret (use a strong random string)
JWT_SECRET=your-production-jwt-secret-here

# Frontend URL (your deployed frontend URL)
FRONTEND_URL=https://your-frontend-domain.com

# AWS S3 Configuration
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Server Port (for ECS/EC2)
PORT=3001

# Environment
NODE_ENV=production
```

### Frontend (Vercel/Amplify/CloudFront)

For frontend deployment, set these environment variables:

```bash
# Backend API URL (your deployed backend URL)
NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.com/api/v1

# Frontend URL
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
```

## Security Best Practices

1. **Never commit `.env.local` files** - They are already in `.gitignore`
2. **Use strong JWT secrets** - Generate a random string for production
3. **Rotate secrets regularly** - Change JWT secrets periodically
4. **Use environment-specific configs** - Different values for dev/staging/prod
5. **Use AWS Secrets Manager** - For production deployments on AWS
6. **Restrict CORS origins** - Only allow your frontend domain in production

## Example Production Configuration

### Backend `.env.local` (Production)
```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/zyberhr-prod
JWT_SECRET=super-secure-random-string-here
JWT_EXPIRES_IN=1d
FRONTEND_URL=https://hr-platform.yourcompany.com
AWS_REGION=us-east-1
S3_BUCKET=zyberhr-prod-documents
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

### Frontend `.env.local` (Production)
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.yourcompany.com/api/v1
NEXT_PUBLIC_APP_URL=https://hr-platform.yourcompany.com
```

## Troubleshooting

1. **API calls failing**: Check that `NEXT_PUBLIC_API_BASE_URL` matches your backend URL
2. **CORS errors**: Ensure `FRONTEND_URL` in backend matches your frontend URL
3. **Database connection issues**: Verify `MONGODB_URI` is correct and accessible
4. **File uploads failing**: Check `UPLOAD_DIR` permissions and `MAX_FILE_SIZE` limits
5. **S3 uploads failing**: Verify AWS credentials and bucket permissions

## Next Steps

After setting up environment variables:

1. Restart your development servers
2. Verify API connectivity
3. Test file uploads
4. Check authentication flow
5. Deploy to AWS with production values
