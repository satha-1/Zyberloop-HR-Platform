import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/zyberhr',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  admin: {
    seedEmail: process.env.ADMIN_SEED_EMAIL || 'sathsarasoysa2089@gmail.com',
    seedPassword: process.env.ADMIN_SEED_PASSWORD || 'Sath@Admin',
  },
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  },
  s3: {
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'zyberhr-documents',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    endpoint: process.env.S3_ENDPOINT, // For S3-compatible storage (e.g., MinIO)
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  documents: {
    presignedUrlTTL: parseInt(process.env.DOCUMENT_PRESIGNED_URL_TTL || '900', 10), // 15 minutes
    pdfGenerationTimeout: parseInt(process.env.PDF_GENERATION_TIMEOUT || '30000', 10), // 30 seconds
    bulkBatchSize: parseInt(process.env.DOCUMENT_BULK_BATCH_SIZE || '250', 10),
  },
  signing: {
    providers: {
      docusign: {
        enabled: process.env.DOCUSIGN_ENABLED === 'true',
        clientId: process.env.DOCUSIGN_CLIENT_ID || '',
        clientSecret: process.env.DOCUSIGN_CLIENT_SECRET || '',
        accountId: process.env.DOCUSIGN_ACCOUNT_ID || '',
        baseUrl: process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net',
      },
    },
  },
};
