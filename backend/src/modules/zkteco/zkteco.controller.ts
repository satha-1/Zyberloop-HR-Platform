import { Request, Response, NextFunction } from 'express';
import { ZKTecoService } from './zkteco.service';
import { ZKTecoDeviceLog } from './zkteco-device-log.model';

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
    
    console.log(`[ZKTeco] CData received from device: ${deviceId} (SN: ${deviceSn || 'N/A'})`);
    console.log(`[ZKTeco] Raw data length: ${rawData.length} bytes`);
    console.log(`[ZKTeco] Raw data preview: ${rawData.substring(0, 200)}`);

    // Determine log type
    let logType: 'ATTLOG' | 'OPERLOG' | 'USERINFO' | 'FINGERPRINT' | 'FACE' | 'OTHER' = 'OTHER';
    if (rawData.includes('ATTLOG:')) {
      logType = 'ATTLOG';
    } else if (rawData.includes('OPERLOG:')) {
      logType = 'OPERLOG';
    } else if (rawData.includes('USERINFO:')) {
      logType = 'USERINFO';
    }

    // Parse ATTLOG data
    let parsedLogs: any[] = [];
    if (logType === 'ATTLOG') {
      parsedLogs = ZKTecoService.parseAttLog(rawData);
      console.log(`[ZKTeco] Parsed ${parsedLogs.length} attendance logs`);
    }

    // Save to database
    if (parsedLogs.length > 0) {
      const savedLogs = await ZKTecoService.saveDeviceLog(
        deviceId,
        deviceSn,
        logType,
        rawData,
        parsedLogs,
        req.ip || req.socket.remoteAddress,
        req.get('user-agent')
      );
      console.log(`[ZKTeco] Saved ${savedLogs.length} device logs to database`);
    } else {
      // Save raw log even if we can't parse it
      const deviceLog = new ZKTecoDeviceLog({
        deviceId,
        deviceSn,
        logType,
        rawData,
        processed: false,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      });
      await deviceLog.save();
      console.log(`[ZKTeco] Saved raw log (unparsed) to database`);
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
