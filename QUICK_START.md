# Quick Start Guide

## Starting the Backend Server

1. **Open a terminal in the `backend` directory:**
   ```bash
   cd backend
   ```

2. **Make sure MongoDB is running:**
   - If you have MongoDB installed locally, start it:
     ```bash
     # Windows (if installed as service, it should auto-start)
     # Or use MongoDB Compass to start it
     ```
   - Or use MongoDB Atlas (cloud) and update `MONGODB_URI` in `.env`

3. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   ✅ MongoDB connected successfully
   🚀 Server running on http://localhost:3001
   📝 Environment: development
   ```

## Starting the Frontend

1. **Open a NEW terminal in the project root:**
   ```bash
   cd frontend
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## Troubleshooting

### Connection Refused Error
- **Backend not running**: Make sure the backend server is started (see above)
- **Wrong port**: Check that backend is on port 3001 and frontend is on port 3000
- **MongoDB not running**: Start MongoDB or check connection string

### MongoDB Connection Error
- Check if MongoDB is installed and running
- Verify the connection string in `backend/src/config/index.ts` (default: `mongodb://localhost:27017/zyberhr`)
- If using MongoDB Atlas, update `MONGODB_URI` in `.env` file

### Port Already in Use
- Change the port in `backend/src/config/index.ts` or set `PORT` environment variable
- Or stop the process using port 3001

## Environment Variables

Create a `.env` file in the `backend` directory (optional - defaults are provided):

```env
MONGODB_URI=mongodb://localhost:27017/zyberhr
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ADMIN_SEED_EMAIL=sathsarasoysa2089@gmail.com
ADMIN_SEED_PASSWORD=Sath@Admin
FRONTEND_URL=http://localhost:3000
```

## Default Admin Credentials

- **Email**: sathsarasoysa2089@gmail.com
- **Password**: Sath@Admin

These are auto-created on first server start.
