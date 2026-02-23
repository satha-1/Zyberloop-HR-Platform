# ZyberHR - HR Management Platform

A comprehensive HR Management Platform built with Next.js (frontend) and Node.js + MongoDB (backend).

## Project Structure

```
HR Management Platform/
├── frontend/          # Next.js frontend application
│   ├── src/          # Source code
│   ├── package.json  # Frontend dependencies
│   └── ...
├── backend/          # Node.js + TypeScript + MongoDB backend
│   ├── src/         # Source code
│   ├── package.json # Backend dependencies
│   └── ...
└── README.md        # This file
```

## Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB installed and running

### Backend Setup

```bash
cd backend
npm install

# Copy environment variables template
cp .env.example .env.local

# Edit .env.local with your configuration (see ENV_SETUP.md for details)
# Then seed admin user:
npm run seed

# Start backend server
npm run dev
```

Backend runs on `http://localhost:3001` (or the port specified in `.env.local`)

### Frontend Setup

```bash
cd frontend
npm install

# Copy environment variables template
cp .env.example .env.local

# Edit .env.local with your configuration:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1

# Start frontend server
npm run dev
```

Frontend runs on `http://localhost:3000`

## Environment Variables

For detailed environment variable configuration, especially for AWS deployment, see [ENV_SETUP.md](./ENV_SETUP.md).

**Quick Setup:**
1. Copy `.env.example` to `.env.local` in both `backend/` and `frontend/` directories
2. Update the values in `.env.local` according to your environment
3. For AWS deployment, see the AWS Deployment section in `ENV_SETUP.md`

## Default Admin Credentials

- **Email:** `sathsarasoysa2089@gmail.com`
- **Password:** `Sath@Admin`

## Documentation

- **Backend API:** See `backend/README.md`
- **Setup Guide:** See `SETUP.md`
- **Frontend Integration:** See `FRONTEND_INTEGRATION.md`
- **Implementation Status:** See `IMPLEMENTATION_SUMMARY.md`

## Features

- ✅ Employee Management
- ✅ Payroll Processing (with EPF/ETF/Tax calculations)
- ✅ Leave Management
- ✅ Recruitment & Hiring
- ✅ Audit Logging
- ⚠️ Performance Management (in progress)
- ⚠️ Learning & Development (in progress)
- ⚠️ Workforce Planning (in progress)
- ⚠️ Engagement & Surveys (in progress)
- ⚠️ Compliance (in progress)

## Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Radix UI components

**Backend:**
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- bcrypt for password hashing

## Development

Both frontend and backend support hot-reload during development.

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

## License

Private project
