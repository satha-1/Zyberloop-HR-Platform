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

# Create .env file (see backend/README.md for details)
# Then seed admin user:
npm run seed

# Start backend server
npm run dev
```

Backend runs on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.local file:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1

# Start frontend server
npm run dev
```

Frontend runs on `http://localhost:3000`

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
