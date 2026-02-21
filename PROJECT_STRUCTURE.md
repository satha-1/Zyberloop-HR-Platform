# Project Structure

## Overview

The project is now organized into two main directories:

```
HR Management Platform/
├── frontend/     # Next.js frontend application
├── backend/      # Node.js + TypeScript + MongoDB backend
└── [docs]       # Documentation files
```

## Frontend Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (main)/       # Main application routes (with layout)
│   │   │   ├── page.tsx           # Dashboard
│   │   │   ├── employees/         # Employee management
│   │   │   ├── payroll/           # Payroll management
│   │   │   ├── leave/              # Leave management
│   │   │   ├── recruitment/       # Recruitment
│   │   │   ├── performance/       # Performance management
│   │   │   ├── learning/          # Learning & Development
│   │   │   ├── workforce-planning/# Workforce planning
│   │   │   ├── engagement/        # Engagement & Surveys
│   │   │   ├── compliance/        # Compliance
│   │   │   └── admin/            # Admin logs
│   │   ├── components/           # React components
│   │   │   ├── MainLayout.tsx    # Main layout component
│   │   │   └── ui/               # UI component library
│   │   ├── lib/                  # Utilities
│   │   │   ├── api.ts           # API client
│   │   │   └── hooks.ts         # React hooks
│   │   ├── data/                 # Mock data (to be removed)
│   │   ├── portal/               # Public candidate portal
│   │   ├── layout.tsx           # Root layout
│   │   └── not-found.tsx        # 404 page
│   └── styles/                   # CSS files
├── package.json                  # Frontend dependencies
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── postcss.config.mjs            # PostCSS configuration
```

## Backend Structure

```
backend/
├── src/
│   ├── config/                   # Configuration
│   │   └── index.ts             # Config loader
│   ├── database/                 # Database setup
│   │   ├── connection.ts        # MongoDB connection
│   │   └── seed.ts              # Admin user seeding
│   ├── modules/                 # Feature modules
│   │   ├── auth/                # Authentication
│   │   ├── users/               # User management
│   │   ├── employees/           # Employee management
│   │   ├── departments/         # Department management
│   │   ├── recruitment/         # Recruitment & hiring
│   │   ├── payroll/             # Payroll processing
│   │   ├── leave/               # Leave management
│   │   ├── attendance/          # Attendance tracking
│   │   ├── performance/         # Performance management
│   │   ├── learning/            # Learning & Development
│   │   ├── workforce/           # Workforce planning
│   │   ├── engagement/          # Engagement & Surveys
│   │   ├── compliance/          # Compliance
│   │   └── logs/                # Audit logs
│   ├── middlewares/             # Express middlewares
│   │   ├── auth.ts              # Authentication middleware
│   │   ├── errorHandler.ts      # Error handling
│   │   └── validator.ts         # Request validation
│   └── index.ts                  # Application entry point
├── package.json                  # Backend dependencies
└── tsconfig.json                 # TypeScript configuration
```

## Running the Project

### Backend
```bash
cd backend
npm install
npm run seed    # Seed admin user
npm run dev     # Start on port 3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev     # Start on port 3000
```

## Environment Variables

### Backend (.env in backend/)
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/zyberhr
JWT_SECRET=your-secret-key
ADMIN_SEED_EMAIL=sathsarasoysa2089@gmail.com
ADMIN_SEED_PASSWORD=Sath@Admin
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local in frontend/)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

## Key Files

- **Backend Entry:** `backend/src/index.ts`
- **Frontend Entry:** `frontend/src/app/layout.tsx`
- **API Client:** `frontend/src/app/lib/api.ts`
- **Database Config:** `backend/src/config/index.ts`
