import express from 'express';
import cors from 'cors';
import { config } from './config';
import { connectDatabase } from './database/connection';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { employeesRouter } from './modules/employees/employees.routes';
import { departmentsRouter } from './modules/departments/departments.routes';
import { recruitmentRouter } from './modules/recruitment/recruitment.routes';
import { payrollRouter } from './modules/payroll/payroll.routes';
import { leaveRouter } from './modules/leave/leave.routes';
import { attendanceRouter } from './modules/attendance/attendance.routes';
import { performanceRouter } from './modules/performance/performance.routes';
import { learningRouter } from './modules/learning/learning.routes';
import { workforceRouter } from './modules/workforce/workforce.routes';
import { engagementRouter } from './modules/engagement/engagement.routes';
import { complianceRouter } from './modules/compliance/compliance.routes';
import { logsRouter } from './modules/logs/logs.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Middleware
app.use(cors({
  origin: config.cors.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/employees', employeesRouter);
app.use('/api/v1/departments', departmentsRouter);
app.use('/api/v1/recruitment', recruitmentRouter);
app.use('/api/v1/payroll', payrollRouter);
app.use('/api/v1/leave', leaveRouter);
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/performance', performanceRouter);
app.use('/api/v1/learning', learningRouter);
app.use('/api/v1/workforce', workforceRouter);
app.use('/api/v1/engagement', engagementRouter);
app.use('/api/v1/compliance', complianceRouter);
app.use('/api/v1/logs', logsRouter);

// Error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await connectDatabase();
    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
