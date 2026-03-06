import { Request, Response, NextFunction } from 'express';
import { ZKTecoService } from './zkteco.service';
import { ZKTecoDeviceLog, IZKTecoDeviceLog } from './zkteco-device-log.model';
import { 
  ZKTecoParserService, 
  PayloadType 
} from './zkteco-parser.service';
import { config } from '../../config';
import { deviceTracker } from './zkteco-device-tracker.service';

/**
 * GET /iclock/ping
 * Health check endpoint for ZKTeco devices
 * Must return plain text "OK"
 */
export const ping = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId, deviceSn } = ZKTecoService.extractDeviceInfo(req);
    const timestamp = new Date();
    
    console.log(`[ZKTeco] [HANDSHAKE] GET /iclock/ping from device: ${deviceId} (SN: ${deviceSn || 'N/A'})`);
    console.log(`[ZKTeco] [HANDSHAKE] IP: ${req.ip || req.socket.remoteAddress}, Time: ${timestamp.toISOString()}`);
    console.log(`[ZKTeco] [HANDSHAKE] Query params:`, JSON.stringify(req.query, null, 2));
    console.log(`[ZKTeco] [HANDSHAKE] Headers:`, JSON.stringify(req.headers, null, 2));
    
    // Return plain text "OK" as required by ZKTeco protocol
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send('OK');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /iclock/cdata
 * Handshake/query endpoint for ZKTeco devices
 * Devices call this to check server availability and send query parameters
 * Must return plain text "OK"
 */
export const cdataGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId, deviceSn } = ZKTecoService.extractDeviceInfo(req);
    const queryParams = req.query;
    const timestamp = new Date();
    
    console.log(`[ZKTeco] [HANDSHAKE] GET /iclock/cdata from device: ${deviceId} (SN: ${deviceSn || 'N/A'})`);
    console.log(`[ZKTeco] [HANDSHAKE] IP: ${req.ip || req.socket.remoteAddress}, Time: ${timestamp.toISOString()}`);
    console.log(`[ZKTeco] [HANDSHAKE] Query parameters:`, JSON.stringify(queryParams, null, 2));
    console.log(`[ZKTeco] [HANDSHAKE] Headers:`, JSON.stringify(req.headers, null, 2));
    
    // Log device state if available
    const deviceState = deviceTracker.getDeviceState(deviceId);
    if (deviceState) {
      console.log(`[ZKTeco] [HANDSHAKE] Device state: ${deviceState.statusUpdateCount} status updates, ${deviceState.attendanceReceivedCount} attendance events`);
      if (deviceState.lastTransactionCount !== undefined) {
        console.log(`[ZKTeco] [HANDSHAKE] Last known transaction count: ${deviceState.lastTransactionCount}`);
        const timeSinceLastAttendance = deviceState.lastAttendanceReceived 
          ? Math.round((timestamp.getTime() - deviceState.lastAttendanceReceived.getTime()) / 1000)
          : null;
        if (timeSinceLastAttendance === null || timeSinceLastAttendance > 300) {
          console.warn(`[ZKTeco] [HANDSHAKE] ⚠️  No attendance received in ${timeSinceLastAttendance ? `${timeSinceLastAttendance}s` : 'device lifetime'}`);
        }
      }
    }
    
    // Return plain text "OK" as required by ZKTeco protocol
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send('OK');
  } catch (error) {
    console.error('[ZKTeco] Error processing GET cdata:', error);
    next(error);
  }
};

/**
 * POST /iclock/cdata
 * Receives attendance data from ZKTeco device
 * Accepts raw body data in ATTLOG format or SenseFace key=value format
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
    const timestamp = new Date();
    
    console.log(`[ZKTeco] [PAYLOAD] POST /iclock/cdata from device: ${deviceId} (SN: ${deviceSn || 'N/A'})`);
    console.log(`[ZKTeco] [PAYLOAD] IP: ${ipAddress}, Time: ${timestamp.toISOString()}`);
    console.log(`[ZKTeco] [PAYLOAD] Query params:`, JSON.stringify(req.query, null, 2));
    console.log(`[ZKTeco] [PAYLOAD] Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`[ZKTeco] [PAYLOAD] Raw data length: ${rawData.length} bytes`);
    console.log(`[ZKTeco] [PAYLOAD] Raw data preview: ${rawData.substring(0, 200)}`);
    if (rawData.length > 200) {
      console.log(`[ZKTeco] [PAYLOAD] Raw data (full):`, rawData);
    }

    // Detect payload type
    const payloadType: PayloadType = ZKTecoParserService.detectPayloadType(rawData);
    const logType = ZKTecoParserService.getLogTypeFromPayloadType(payloadType, rawData);

    // Log payload classification with clear prefixes
    if (payloadType === 'status' || payloadType === 'config') {
      console.log(`[ZKTeco] [STATUS/CONFIG] Detected device ${payloadType} payload, log type: ${logType}`);
    } else if (payloadType === 'attendance') {
      console.log(`[ZKTeco] [ATTENDANCE] ✅ Detected attendance payload, log type: ${logType}`);
    } else if (payloadType === 'heartbeat') {
      console.log(`[ZKTeco] [HEARTBEAT] Detected heartbeat payload`);
    } else {
      console.warn(`[ZKTeco] [UNKNOWN] ⚠️  Unknown payload type detected: ${payloadType}, log type: ${logType}`);
    }

    // Debug mode: print full payload for attendance events
    if (config.zkteco.debugMode && payloadType === 'attendance') {
      console.log(`[ZKTeco] [DEBUG] Full attendance payload:`);
      console.log(rawData);
    }

    let savedLog: IZKTecoDeviceLog | null = null;

    // Handle different payload types
    if (payloadType === 'attendance') {
      // Try legacy ATTLOG format first
      if (rawData.includes('ATTLOG:')) {
        const parsedLogs = ZKTecoService.parseAttLog(rawData);
        if (parsedLogs.length > 0) {
          console.log(`[ZKTeco] [ATTENDANCE] ✅ Parsed ${parsedLogs.length} legacy ATTLOG attendance logs`);
          
          // Track attendance received
          deviceTracker.trackAttendanceReceived(deviceId, timestamp);
          
          const savedLogs = await ZKTecoService.saveDeviceLog(
            deviceId,
            deviceSn,
            logType,
            rawData,
            parsedLogs,
            ipAddress,
            userAgent
          );
          console.log(`[ZKTeco] [ATTENDANCE] ✅ Saved ${savedLogs.length} legacy ATTLOG logs to database`);
          savedLog = savedLogs[0];
        }
      } else {
        // Try SenseFace key=value format
        const keyValuePayload = ZKTecoParserService.parseKeyValuePayload(rawData);
        const attendanceEvent = ZKTecoParserService.parseAttendanceEvent(keyValuePayload);
        
        if (attendanceEvent && attendanceEvent.userId && attendanceEvent.timestamp) {
          console.log(`[ZKTeco] [ATTENDANCE] ✅ Parsed SenseFace attendance event: User ${attendanceEvent.userId} at ${attendanceEvent.timestamp.toISOString()}`);
          
          // Track attendance received
          deviceTracker.trackAttendanceReceived(deviceId, timestamp);
          
          savedLog = await ZKTecoService.saveAttendanceEvent(
            deviceId,
            deviceSn,
            logType,
            rawData,
            attendanceEvent,
            ipAddress,
            userAgent
          );
          console.log(`[ZKTeco] [ATTENDANCE] ✅ Saved SenseFace attendance event to database`);
          
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
      
      console.log(`[ZKTeco] [STATUS/CONFIG] Parsed device ${payloadType}:`, {
        deviceName: deviceStatus.deviceName,
        mac: deviceStatus.mac,
        transactionCount: deviceStatus.transactionCount,
        userCount: deviceStatus.userCount,
        fpCount: deviceStatus.fpCount,
        faceCount: deviceStatus.faceCount,
        firmwareVersion: deviceStatus.firmwareVersion,
        pushVersion: deviceStatus.pushVersion,
      });
      
      // Track transaction count changes
      if (deviceStatus.transactionCount !== undefined) {
        await deviceTracker.trackDeviceStatus(
          deviceId,
          deviceSn,
          deviceStatus.transactionCount,
          timestamp
        );
      }
      
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
      console.log(`[ZKTeco] [STATUS/CONFIG] Saved device ${payloadType} to database`);
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
    const timestamp = new Date();
    
    console.log(`[ZKTeco] [COMMAND] GET /iclock/getrequest from device: ${deviceId} (SN: ${deviceSn || 'N/A'})`);
    console.log(`[ZKTeco] [COMMAND] IP: ${req.ip || req.socket.remoteAddress}, Time: ${timestamp.toISOString()}`);
    console.log(`[ZKTeco] [COMMAND] Query params:`, JSON.stringify(req.query, null, 2));
    console.log(`[ZKTeco] [COMMAND] Headers:`, JSON.stringify(req.headers, null, 2));

    // Parse INFO from query params (ZKTeco devices send device info in query params)
    const infoParam = req.query.INFO || req.query.info || req.query.Info;
    if (infoParam) {
      console.log(`[ZKTeco] [COMMAND] INFO received: ${infoParam}`);
      
      // Parse INFO format: key=value,key=value,...
      // Example: TransactionCount=5640,UserCount=24,...
      try {
        const infoPairs = String(infoParam).split(',');
        const infoData: Record<string, string> = {};
        
        for (const pair of infoPairs) {
          const [key, value] = pair.split('=');
          if (key && value) {
            infoData[key.trim()] = value.trim();
          }
        }
        
        console.log(`[ZKTeco] [COMMAND] Parsed INFO:`, JSON.stringify(infoData, null, 2));
        
        // Extract transaction count from INFO
        const transactionCountStr = infoData.TransactionCount || infoData.transactionCount || infoData.TRANSACTIONCOUNT;
        if (transactionCountStr) {
          const transactionCount = parseInt(transactionCountStr, 10);
          if (!isNaN(transactionCount)) {
            console.log(`[ZKTeco] [COMMAND] Transaction count from INFO: ${transactionCount}`);
            
            // Track transaction count change
            await deviceTracker.trackDeviceStatus(
              deviceId,
              deviceSn,
              transactionCount,
              timestamp
            );
          }
        }
      } catch (error) {
        console.warn(`[ZKTeco] [COMMAND] Failed to parse INFO:`, error);
      }
    }

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
    console.error('[ZKTeco] Error processing getrequest:', error);
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
    const timestamp = new Date();
    
    console.log(`[ZKTeco] [COMMAND] GET /iclock/devicecmd from device: ${deviceId} (SN: ${deviceSn || 'N/A'})`);
    console.log(`[ZKTeco] [COMMAND] Command: ${cmd || 'N/A'}, Query params:`, JSON.stringify(req.query, null, 2));
    console.log(`[ZKTeco] [COMMAND] Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`[ZKTeco] [COMMAND] IP: ${req.ip || req.socket.remoteAddress}, Time: ${timestamp.toISOString()}`);

    // Handle different commands
    // For now, return OK for all commands
    // You can extend this to handle specific commands
    
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send('OK');
  } catch (error) {
    console.error('[ZKTeco] Error processing devicecmd:', error);
    next(error);
  }
};
