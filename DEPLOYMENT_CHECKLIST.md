# AWS Deployment Checklist

Use this checklist to ensure a smooth deployment.

## Pre-Deployment

- [ ] AWS account created and configured
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] MongoDB Atlas account created (or EC2 MongoDB planned)
- [ ] Domain name purchased (optional but recommended)
- [ ] Environment variables documented
- [ ] Secrets generated (JWT secret, etc.)

## MongoDB Setup

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] Network access configured (whitelist AWS IPs)
- [ ] Connection string saved securely
- [ ] Backup strategy configured

## Backend Deployment

- [ ] EC2 instance launched (or ECS cluster created)
- [ ] Security groups configured (ports 22, 80, 443, 3001)
- [ ] SSH key pair created and saved securely
- [ ] Node.js 20.x installed
- [ ] PM2 installed globally
- [ ] Application code deployed
- [ ] Environment variables set (.env file)
- [ ] Application built (`npm run build`)
- [ ] Application started with PM2
- [ ] PM2 startup script configured
- [ ] Nginx installed and configured
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Health check endpoint tested (`/health`)
- [ ] API endpoints tested

## Frontend Deployment

- [ ] AWS Amplify app created
- [ ] Repository connected (or manual upload)
- [ ] Build settings configured
- [ ] Environment variables set (`NEXT_PUBLIC_API_BASE_URL`)
- [ ] Build successful
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active

## AWS Services Setup

- [ ] S3 bucket created for file uploads
- [ ] S3 CORS configuration set
- [ ] IAM user/role created for S3 access
- [ ] AWS Secrets Manager configured (optional)
- [ ] CloudWatch log groups created
- [ ] Alarms configured (optional)

## Post-Deployment

- [ ] Database migrations run
- [ ] Initial data seeded (if needed)
- [ ] Backend health check: `https://api.yourdomain.com/health`
- [ ] Frontend accessible: `https://yourdomain.com`
- [ ] Login functionality tested
- [ ] API calls working from frontend
- [ ] File uploads working (if applicable)
- [ ] CORS errors resolved
- [ ] SSL certificates valid
- [ ] Monitoring and logging active

## Security Checklist

- [ ] Strong JWT secret set
- [ ] MongoDB credentials secure
- [ ] AWS credentials stored securely (not in code)
- [ ] Security groups restrictive (only necessary ports)
- [ ] HTTPS enabled everywhere
- [ ] Environment variables not committed to Git
- [ ] Regular backups scheduled
- [ ] MFA enabled on AWS account

## Performance & Monitoring

- [ ] CloudWatch logs accessible
- [ ] Application metrics visible
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Backup strategy tested

## Documentation

- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Rollback procedure documented
- [ ] Team access configured
- [ ] Runbooks created

## Testing

- [ ] All API endpoints tested
- [ ] Authentication flow tested
- [ ] File uploads tested
- [ ] Database operations tested
- [ ] Error handling verified
- [ ] Performance acceptable

---

## Quick Verification Commands

```bash
# Backend health
curl https://api.yourdomain.com/health

# Check PM2 status (on EC2)
pm2 status
pm2 logs

# Check Nginx status
sudo systemctl status nginx

# Check application logs
pm2 logs zyberhr-backend

# Test MongoDB connection (from backend server)
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(e => console.error(e))"
```

---

## Rollback Procedure

If deployment fails:

1. **Backend Rollback:**
   ```bash
   cd zyberhr/backend
   git checkout <previous-commit>
   npm install
   npm run build
   pm2 restart zyberhr-backend
   ```

2. **Frontend Rollback:**
   - In Amplify Console → App → Deployments
   - Select previous successful deployment
   - Click "Redeploy this version"

---

## Support Contacts

- AWS Support: [AWS Support Center](https://console.aws.amazon.com/support)
- MongoDB Support: [MongoDB Support](https://support.mongodb.com)
- Application Issues: Check CloudWatch logs
