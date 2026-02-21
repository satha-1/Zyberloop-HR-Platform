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
};
