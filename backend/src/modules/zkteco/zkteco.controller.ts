import { Request, Response, NextFunction } from 'express';
import { ZKTecoService } from './zkteco.service';
import { ZKTecoDeviceLog } from './zkteco-device-log.model';
import { 
  ZKTecoParserService, 
  PayloadType 
} from './zkteco-parser.service';
import { config } from '../../config';

/**
 * GET /iclock/ping
 * Health check endpoint for ZKTeco devices
 * Must return plain text "OK"
 */
export const ping = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = ZKTecoService.extractDeviceInfo(req);
    console.log(`[ZKTeco] Ping received from device: ${deviceId} at ${new Date().toISOString()}`);
    
    // Return plain text "OK" as required by ZKTeco protocol
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send('OK');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /iclock/cdata
 * Receives attendance data from ZKTeco device
 * Accepts raw body data in ATTLOG format
 */
export const cdata = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId, deviceSn } = ZKTecoService.extractDeviceInfo(req);
    
    // Handle raw body data - express.text() provides string body
    // Fallback to Buffer.toString() if middleware didn't parse it
    let rawData: string;
    if (typeof req.body === 'string') {
      rawData = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      rawData = req.body.toString('utf8');
    } else {
      rawData = String(req.body || '');
    }
    
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');
    
    console.log(`[ZKTeco] CData received from device: ${deviceId} (SN: ${deviceSn || 'N/A'})`);
    console.log(`[ZKTeco] Raw data length: ${rawData.length} bytes`);
    console.log(`[ZKTeco] Raw data preview: ${rawData.substring(0, 200)}`);

    // Detect payload type
    const payloadType: PayloadType = ZKTecoParserService.detectPayloadType(rawData);
    const logType = ZKTecoParserService.getLogTypeFromPayloadType(payloadType, rawData);

    // Log payload classification
    if (payloadType === 'status' || payloadType === 'config') {
      console.log(`[ZKTeco] Detected device ${payloadType} payload, log type: ${logType}`);
    } else if (payloadType === 'attendance') {
      console.log(`[ZKTeco] Detected attendance payload, log type: ${logType}`);
    } else if (payloadType === 'heartbeat') {
      console.log(`[ZKTeco] Detected heartbeat payload`);
    } else {
      console.warn(`[ZKTeco] Unknown payload type detected: ${payloadType}, log type: ${logType}`);
    }

    // Debug mode: print full payload for attendance events
    if (config.zkteco.debugMode && payloadType === 'attendance') {
      console.log(`[ZKTeco] [DEBUG] Full attendance payload:`);
      console.log(rawData);
    }

    let savedLog: ZKTecoDeviceLog | null = null;

    // Handle different payload types
    if (payloadType === 'attendance') {
      // Try legacy ATTLOG format first
      if (rawData.includes('ATTLOG:')) {
        const parsedLogs = ZKTecoService.parseAttLog(rawData);
        if (parsedLogs.length > 0) {
          console.log(`[ZKTeco] Parsed ${parsedLogs.length} legacy ATTLOG attendance logs`);
          const savedLogs = await ZKTecoService.saveDeviceLog(
            deviceId,
            deviceSn,
            logType,
            rawData,
            parsedLogs,
            ipAddress,
            userAgent
          );
          console.log(`[ZKTeco] Saved ${savedLogs.length} legacy ATTLOG logs to database`);
          savedLog = savedLogs[0];
        }
      } else {
        // Try SenseFace key=value format
        const keyValuePayload = ZKTecoParserService.parseKeyValuePayload(rawData);
        const attendanceEvent = ZKTecoParserService.parseAttendanceEvent(keyValuePayload);
        
        if (attendanceEvent && attendanceEvent.userId && attendanceEvent.timestamp) {
          console.log(`[ZKTeco] Parsed SenseFace attendance event: User ${attendanceEvent.userId} at ${attendanceEvent.timestamp.toISOString()}`);
          savedLog = await ZKTecoService.saveAttendanceEvent(
            deviceId,
            deviceSn,
            logType,
            rawData,
            attendanceEvent,
            ipAddress,
            userAgent
          );
          console.log(`[ZKTeco] Saved SenseFace attendance event to database`);
          
          // Debug mode: print details
          if (config.zkteco.debugMode) {
            console.log(`[ZKTeco] [DEBUG] Attendance event details:`, JSON.stringify(attendanceEvent, null, 2));
          }
        } else {
          console.warn(`[ZKTeco] Could not parse attendance event from payload`);
          savedLog = await ZKTecoService.saveUnknownLog(
            deviceId,
            deviceSn,
            logType,
            rawData,
            'attendance',
            ipAddress,
            userAgent
          );
          console.log(`[ZKTeco] Saved unparsed attendance payload to database`);
        }
      }
    } else if (payloadType === 'status' || payloadType === 'config') {
      // Device status/config payload
      const keyValuePayload = ZKTecoParserService.parseKeyValuePayload(rawData);
      const deviceStatus = ZKTecoParserService.parseDeviceStatus(keyValuePayload);
      
      console.log(`[ZKTeco] Parsed device ${payloadType}:`, {
        deviceName: deviceStatus.deviceName,
        mac: deviceStatus.mac,
        transactionCount: deviceStatus.transactionCount,
        userCount: deviceStatus.userCount,
      });
      
      savedLog = await ZKTecoService.saveDeviceStatusLog(
        deviceId,
        deviceSn,
        logType,
        rawData,
        deviceStatus,
        payloadType,
        ipAddress,
        userAgent
      );
      console.log(`[ZKTeco] Saved device ${payloadType} to database`);
    } else if (payloadType === 'user_sync') {
      // User sync payload
      const keyValuePayload = ZKTecoParserService.parseKeyValuePayload(rawData);
      console.log(`[ZKTeco] Parsed user sync payload with ${Object.keys(keyValuePayload).length} fields`);
      
      savedLog = await ZKTecoService.saveUnknownLog(
        deviceId,
        deviceSn,
        logType,
        rawData,
        'user_sync',
        ipAddress,
        userAgent
      );
      console.log(`[ZKTeco] Saved user sync payload to database`);
    } else if (payloadType === 'heartbeat') {
      // Heartbeat payload
      console.log(`[ZKTeco] Received heartbeat from device`);
      
      savedLog = await ZKTecoService.saveUnknownLog(
        deviceId,
        deviceSn,
        logType,
        rawData,
        'heartbeat',
        ipAddress,
        userAgent
      );
      console.log(`[ZKTeco] Saved heartbeat to database`);
    } else {
      // Unknown payload type
      console.warn(`[ZKTeco] Unknown payload type, saving as-is`);
      
      savedLog = await ZKTecoService.saveUnknownLog(
        deviceId,
        deviceSn,
        logType,
        rawData,
        'unknown',
        ipAddress,
        userAgent
      );
      console.log(`[ZKTeco] Saved unknown payload to database`);
    }

    // Return plain text "OK" as required by ZKTeco protocol
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send('OK');
  } catch (error) {
    console.error('[ZKTeco] Error processing cdata:', error);
    next(error);
  }
};

/**
 * GET /iclock/getrequest
 * Device requests commands/data from server
 * Returns commands in ZKTeco format
 */
export const getrequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId, deviceSn } = ZKTecoService.extractDeviceInfo(req);
    console.log(`[ZKTeco] GetRequest from device: ${deviceId} (SN: ${deviceSn || 'N/A'}) at ${new Date().toISOString()}`);

    // ZKTeco devices expect specific format for commands
    // For now, return empty response (no pending commands)
    // You can extend this to send commands like:
    // - Update user data
    // - Update device settings
    // - Clear logs
    // Format: CMD:COMMAND_NAME\nPARAM1\nPARAM2\n...
    
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send('');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /iclock/devicecmd
 * Device command endpoint
 * Used for device management commands
 */
export const devicecmd = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId, deviceSn } = ZKTecoService.extractDeviceInfo(req);
    const cmd = req.query.cmd || req.query.CMD;
    
    console.log(`[ZKTeco] DeviceCmd from device: ${deviceId} (SN: ${deviceSn || 'N/A'}), command: ${cmd || 'N/A'}`);

    // Handle different commands
    // For now, return OK for all commands
    // You can extend this to handle specific commands
    
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send('OK');
  } catch (error) {
    next(error);
  }
};
