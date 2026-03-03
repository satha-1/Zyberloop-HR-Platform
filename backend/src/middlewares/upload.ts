import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from './errorHandler';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const employeeDocsDir = path.join(uploadsDir, 'employee-documents');
if (!fs.existsSync(employeeDocsDir)) {
  fs.mkdirSync(employeeDocsDir, { recursive: true });
}

const profilePicturesDir = path.join(uploadsDir, 'profile-pictures');
if (!fs.existsSync(profilePicturesDir)) {
  fs.mkdirSync(profilePicturesDir, { recursive: true });
}

const generatedDocsDir = path.join(uploadsDir, 'generated-documents');
if (!fs.existsSync(generatedDocsDir)) {
  fs.mkdirSync(generatedDocsDir, { recursive: true });
}

const candidateResumesDir = path.join(uploadsDir, 'candidate-resumes');
if (!fs.existsSync(candidateResumesDir)) {
  fs.mkdirSync(candidateResumesDir, { recursive: true });
}

// Use memory storage for files that will be uploaded to S3 by controllers/services.
const memoryStorage = multer.memoryStorage();

// Configure storage for generated documents
const generatedDocStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, generatedDocsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `gen-doc-${uniqueSuffix}.pdf`);
  },
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, `Invalid file type. Allowed types: PDF, JPG, PNG, DOC, DOCX`));
  }
};

// Upload middleware for employee documents
export const uploadEmployeeDocuments = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Upload middleware for profile pictures
export const uploadProfilePicture = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only image files (JPG, PNG, WEBP) are allowed for profile pictures'));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

// Upload middleware for generated documents
export const uploadGeneratedDocument = multer({
  storage: generatedDocStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only PDF files are allowed for generated documents'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Upload middleware for candidate resumes
export const uploadCandidateResume = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only PDF, DOC, and DOCX files are allowed for resumes'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
