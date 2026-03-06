import express from 'express';
import cors from 'cors';
import path from 'path';
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
import { documentsRouter } from './modules/documents/documents.routes';
import { notificationRouter } from './modules/notifications/notification.routes';
import { taskRouter } from './modules/tasks/task.routes';
import { esignRouter } from './modules/esign/esign.routes';
import { esignReminderService } from './modules/esign/services/esignReminder.service';
import { errorHandler } from './middlewares/errorHandler';
import { zktecoRouter } from './modules/zkteco/zkteco.routes';
import { zktecoLogsRouter } from './modules/zkteco/zkteco-logs.routes';

const app = express();

// Middleware
app.use(cors({
  origin: config.cors.frontendUrl,
  credentials: true,
}));

// ZKTeco device routes need raw text body parsing (before JSON middleware)
// CRITICAL: Must use express.text() not express.raw() for ZKTeco devices
// This must be registered BEFORE express.json() to handle raw text data
app.use('/iclock/cdata', express.text({ type: '*/*', limit: '10mb' }));

// Standard JSON and URL-encoded parsing for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Health check (matches frontend API path structure)
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'zyberhr-backend' });
});

// ZKTeco Device Integration Routes (must be at root level for device compatibility)
// These routes handle communication with ZKTeco biometric devices in ADMS mode
app.use('/iclock', zktecoRouter);

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
app.use('/api/v1/documents', documentsRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/tasks', taskRouter);
app.use('/api/v1/esign', esignRouter);
app.use('/api/v1/zkteco', zktecoLogsRouter);

// Error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await connectDatabase();
    esignReminderService.start();
    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log('\n📋 Mounted Routes:');
      console.log('  ✓ GET  /health');
      console.log('  ✓ GET  /api/v1/health');
      console.log('  ✓ GET  /iclock/ping          → ZKTeco health check');
      console.log('  ✓ GET  /iclock/cdata         → ZKTeco handshake/query');
      console.log('  ✓ POST /iclock/cdata         → ZKTeco attendance data');
      console.log('  ✓ GET  /iclock/getrequest     → ZKTeco command requests');
      console.log('  ✓ GET  /iclock/devicecmd      → ZKTeco device commands');
      console.log('  ✓ All /api/v1/* routes');
      console.log('\n🔧 ZKTeco Integration:');
      console.log(`  Device endpoints available at: http://YOUR_SERVER_IP/iclock/*`);
      console.log(`  Ensure Nginx routes /iclock/* to this Express server (port ${config.port})`);
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
