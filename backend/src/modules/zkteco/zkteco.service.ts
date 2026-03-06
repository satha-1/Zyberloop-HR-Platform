import { ZKTecoDeviceLog, IZKTecoDeviceLog } from './zkteco-device-log.model';
import { Employee, IEmployee } from '../employees/employee.model';
import { AttendanceRecord } from '../attendance/attendance.model';

export interface ParsedAttLog {
  userId: string;
  timestamp: Date;
  status: number;
  verifyMode: number;
  workCode: number;
  reserved: string;
}

export class ZKTecoService {
  /**
   * Parse ATTLOG format from ZKTeco device
   * Format: ATTLOG:\n<line_number> <user_id> <date> <time> <status> <verify_mode> <work_code>
   * Example: ATTLOG:\n1 102 2026-03-06 09:12:21 0 0 0
   */
  static parseAttLog(rawData: string): ParsedAttLog[] {
    const logs: ParsedAttLog[] = [];
    const lines = rawData.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and header lines
      if (!trimmed || trimmed.startsWith('ATTLOG:') || trimmed.startsWith('OPERLOG:')) {
        continue;
      }

      // Parse line: <line_number> <user_id> <date> <time> <status> <verify_mode> <work_code>
      const parts = trimmed.split(/\s+/);
      
      if (parts.length >= 7) {
        try {
          const userId = parts[1];
          const dateStr = parts[2];
          const timeStr = parts[3];
          const status = parseInt(parts[4], 10);
          const verifyMode = parseInt(parts[5], 10);
          const workCode = parseInt(parts[6], 10);
          const reserved = parts.slice(7).join(' ') || '';

          // Parse timestamp
          const timestamp = new Date(`${dateStr} ${timeStr}`);

          if (!isNaN(timestamp.getTime())) {
            logs.push({
              userId,
              timestamp,
              status,
              verifyMode,
              workCode,
              reserved,
            });
          }
        } catch (error) {
          console.error(`Error parsing ATTLOG line: ${line}`, error);
        }
      }
    }

    return logs;
  }

  /**
   * Find employee by user ID from device
   * Tries to match by employeeCode, employeeNumber, or empNo
   */
  static async findEmployeeByDeviceUserId(userId: string): Promise<IEmployee | null> {
    try {
      // Try to find by employeeCode first (most common)
      let employee = await Employee.findOne({ employeeCode: userId.toUpperCase() });
      
      if (!employee) {
        // Try employeeNumber
        employee = await Employee.findOne({ employeeNumber: userId.toUpperCase() });
      }
      
      if (!employee) {
        // Try empNo
        employee = await Employee.findOne({ empNo: userId.toUpperCase() });
      }

      return employee;
    } catch (error) {
      console.error(`Error finding employee for userId: ${userId}`, error);
      return null;
    }
  }

  /**
   * Save device log to database
   */
  static async saveDeviceLog(
    deviceId: string,
    deviceSn: string | undefined,
    logType: IZKTecoDeviceLog['logType'],
    rawData: string,
    parsedData: ParsedAttLog[],
    ipAddress?: string,
    userAgent?: string
  ): Promise<IZKTecoDeviceLog[]> {
    const savedLogs: IZKTecoDeviceLog[] = [];

    for (const parsed of parsedData) {
      try {
        // Find employee
        const employee = await this.findEmployeeByDeviceUserId(parsed.userId);

        // Save device log
        const deviceLog = new ZKTecoDeviceLog({
          deviceId,
          deviceSn,
          logType,
          rawData: `${parsed.userId} ${parsed.timestamp.toISOString()} ${parsed.status} ${parsed.verifyMode} ${parsed.workCode}`,
          parsedData: {
            userId: parsed.userId,
            timestamp: parsed.timestamp,
            status: parsed.status,
            verifyMode: parsed.verifyMode,
            workCode: parsed.workCode,
            reserved: parsed.reserved,
          },
          employeeId: employee?._id,
          processed: false,
          ipAddress,
          userAgent,
        });

        await deviceLog.save();
        savedLogs.push(deviceLog);

        // Process attendance record if employee found
        if (employee) {
          await this.processAttendanceRecord(deviceLog, employee._id.toString());
        }
      } catch (error) {
        console.error(`Error saving device log for userId: ${parsed.userId}`, error);
      }
    }

    return savedLogs;
  }

  /**
   * Process attendance record from device log
   */
  static async processAttendanceRecord(
    deviceLog: IZKTecoDeviceLog,
    employeeId: string
  ): Promise<void> {
    try {
      if (!deviceLog.parsedData?.timestamp) {
        return;
      }

      const timestamp = deviceLog.parsedData.timestamp;
      const date = new Date(timestamp);
      date.setHours(0, 0, 0, 0);

      // Find or create attendance record for this date
      let attendanceRecord = await AttendanceRecord.findOne({
        employeeId,
        date,
      });

      if (!attendanceRecord) {
        // Create new attendance record
        attendanceRecord = new AttendanceRecord({
          employeeId,
          date,
          status: 'PRESENT',
          checkIn: timestamp,
        });
      } else {
        // Update existing record
        // If this is earlier than current checkIn, update checkIn
        if (!attendanceRecord.checkIn || timestamp < attendanceRecord.checkIn) {
          attendanceRecord.checkIn = timestamp;
        }
        // If this is later than current checkOut, update checkOut
        if (!attendanceRecord.checkOut || timestamp > attendanceRecord.checkOut) {
          attendanceRecord.checkOut = timestamp;
        }
      }

      await attendanceRecord.save();

      // Mark device log as processed
      deviceLog.processed = true;
      deviceLog.processedAt = new Date();
      await deviceLog.save();
    } catch (error: any) {
      console.error('Error processing attendance record:', error);
      deviceLog.error = error.message;
      deviceLog.processed = false;
      await deviceLog.save();
    }
  }

  /**
   * Extract device information from request
   */
  static extractDeviceInfo(req: any): { deviceId: string; deviceSn?: string } {
    // ZKTeco devices typically send device info in query params or headers
    const deviceId = req.query.SN || req.query.sn || req.headers['x-device-sn'] || 'UNKNOWN';
    const deviceSn = req.query.SN || req.query.sn || req.headers['x-device-sn'];

    return { deviceId: String(deviceId), deviceSn: deviceSn ? String(deviceSn) : undefined };
  }
}
