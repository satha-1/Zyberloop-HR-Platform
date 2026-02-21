# ZyberHR Complete Setup Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB installed and running
- npm or yarn package manager

## Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   # Copy from .env.example or create manually
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/zyberhr
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   ADMIN_SEED_EMAIL=sathsarasoysa2089@gmail.com
   ADMIN_SEED_PASSWORD=Sath@Admin
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB:**
   Make sure MongoDB is running:
   ```bash
   # On Windows (if installed as service, it should auto-start)
   # On Mac/Linux:
   mongod
   ```

5. **Seed admin user:**
   ```bash
   npm run seed
   ```
   This creates the initial admin user with the credentials from `.env`.

6. **Start backend server:**
   ```bash
   npm run dev
   ```
   Backend will run on `http://localhost:3001`

## Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env.local` file:**
   ```bash
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
   ```

4. **Start frontend:**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

## First Login

1. Open `http://localhost:3000` in your browser
2. Use the admin credentials:
   - Email: `sathsarasoysa2089@gmail.com`
   - Password: `Sath@Admin`

## API Testing

You can test the API directly using curl or Postman:

```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sathsarasoysa2089@gmail.com","password":"Sath@Admin"}'

# Get employees (replace TOKEN with actual token)
curl http://localhost:3001/api/v1/employees \
  -H "Authorization: Bearer TOKEN"
```

## Project Structure

```
HR Management Platform/
├── backend/                 # Node.js + TypeScript + MongoDB backend
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── database/       # MongoDB connection & seeding
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/       # Authentication
│   │   │   ├── users/      # User management
│   │   │   ├── employees/  # Employee management
│   │   │   ├── payroll/    # Payroll calculations
│   │   │   ├── leave/      # Leave management
│   │   │   ├── recruitment/# Recruitment & hiring
│   │   │   └── ...         # Other modules
│   │   ├── middlewares/    # Express middlewares
│   │   └── index.ts        # Entry point
│   └── package.json
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   │   ├── (main)/     # Main application routes
│   │   │   ├── components/ # React components
│   │   │   ├── lib/        # Utilities & API client
│   │   │   └── data/       # Mock data (to be removed)
│   │   └── styles/         # CSS files
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
└── README.md
```

## Next Steps

1. **Complete frontend integration:**
   - Update remaining pages to use API calls (see `FRONTEND_INTEGRATION.md`)
   - Remove all mock data files

2. **Implement missing features:**
   - Performance management
   - Learning & Development
   - Workforce Planning
   - Engagement & Surveys
   - Compliance & Administration

3. **Add authentication UI:**
   - Create login page
   - Add route protection
   - Handle token refresh

4. **Enhance backend:**
   - Add comprehensive validation
   - Implement file uploads
   - Add background jobs
   - Implement export functionality

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check service status
- Verify connection string in `.env`
- Check MongoDB logs for errors

### Port Already in Use
- Change `PORT` in backend `.env`
- Update `NEXT_PUBLIC_API_BASE_URL` in frontend `.env.local`

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches frontend URL
- Check that frontend is running on the correct port

### Authentication Issues
- Verify admin user was seeded: `npm run seed` in backend
- Check JWT_SECRET is set in backend `.env`
- Ensure token is being sent in Authorization header

## Development Workflow

1. Start MongoDB
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm run dev`
4. Make changes and see hot-reload in action
5. Check backend logs for API calls
6. Check browser console for frontend errors

## Production Deployment

1. Build backend: `cd backend && npm run build`
2. Build frontend: `cd frontend && npm run build`
3. Set production environment variables
4. Use process manager (PM2) for backend
5. Deploy frontend to Vercel/Netlify or similar
6. Configure CORS and security settings
