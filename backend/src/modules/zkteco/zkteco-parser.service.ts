/**
 * ZKTeco Payload Parser Service
 * Handles parsing of different ZKTeco device payload formats
 */

export interface ParsedKeyValue {
  [key: string]: string | number | boolean;
}

export interface DeviceStatusPayload {
  deviceName?: string;
  mac?: string;
  transactionCount?: number;
  maxAttLogCount?: number;
  userCount?: number;
  maxUserCount?: number;
  photoFunOn?: boolean;
  maxUserPhotoCount?: number;
  fingerFunOn?: boolean;
  fpVersion?: number;
  [key: string]: any;
}

export interface AttendanceEventPayload {
  userId?: string;
  timestamp?: Date;
  verifyMode?: number;
  workCode?: number;
  [key: string]: any;
}

export type PayloadType = 'attendance' | 'status' | 'config' | 'user_sync' | 'heartbeat' | 'unknown';

export class ZKTecoParserService {
  /**
   * Detect payload type based on content
   */
  static detectPayloadType(rawData: string): PayloadType {
    const trimmed = rawData.trim();

    // Legacy ATTLOG format
    if (trimmed.includes('ATTLOG:') || trimmed.match(/^\d+\s+\d+\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/)) {
      return 'attendance';
    }

    // Comma-separated key=value format (SenseFace devices)
    if (trimmed.includes('=') && trimmed.includes(',')) {
      // Check for device status/config indicators
      if (trimmed.includes('DeviceName=') || trimmed.includes('~DeviceName=') || 
          trimmed.includes('TransactionCount=') || trimmed.includes('UserCount=')) {
        // Could be status or attendance event
        if (trimmed.includes('PIN=') || trimmed.includes('Time=') || trimmed.includes('Verify=')) {
          return 'attendance';
        }
        return 'status';
      }

      // Check for user sync indicators
      if (trimmed.includes('PIN=') && (trimmed.includes('Name=') || trimmed.includes('Card='))) {
        return 'user_sync';
      }

      // Check for heartbeat (usually minimal data)
      if (trimmed.length < 100 && (trimmed.includes('SN=') || trimmed.includes('Status='))) {
        return 'heartbeat';
      }

      // Default for key=value format
      return 'status';
    }

    // OPERLOG format
    if (trimmed.includes('OPERLOG:')) {
      return 'status';
    }

    // USERINFO format
    if (trimmed.includes('USERINFO:')) {
      return 'user_sync';
    }

    return 'unknown';
  }

  /**
   * Parse comma-separated key=value format
   * Example: ~DeviceName=SenseFace 2A,MAC=00:17:61:13:23:42,TransactionCount=5634
   */
  static parseKeyValuePayload(rawData: string): ParsedKeyValue {
    const result: ParsedKeyValue = {};
    const pairs = rawData.split(',');

    for (const pair of pairs) {
      const trimmed = pair.trim();
      if (!trimmed) continue;

      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) continue;

      const key = trimmed.substring(0, equalIndex).trim().replace(/^~/, ''); // Remove ~ prefix
      const value = trimmed.substring(equalIndex + 1).trim();

      // Try to parse as number
      if (/^-?\d+$/.test(value)) {
        result[key] = parseInt(value, 10);
      } else if (/^-?\d*\.\d+$/.test(value)) {
        result[key] = parseFloat(value);
      } else if (value === 'true' || value === '1') {
        result[key] = true;
      } else if (value === 'false' || value === '0') {
        result[key] = false;
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Extract attendance event from SenseFace key=value payload
   */
  static parseAttendanceEvent(payload: ParsedKeyValue): AttendanceEventPayload | null {
    // Common SenseFace attendance event fields
    const userId = payload.PIN || payload.UserID || payload.UserId || payload.userId;
    const timeStr = payload.Time || payload.DateTime || payload.Timestamp;
    const verifyMode = payload.Verify || payload.VerifyMode || payload.VerifyType;
    const workCode = payload.WorkCode || payload.Workcode || payload.Work;

    if (!userId || !timeStr) {
      return null;
    }

    // Parse timestamp - try different formats
    let timestamp: Date | undefined;
    try {
      // Try ISO format first
      timestamp = new Date(timeStr);
      if (isNaN(timestamp.getTime())) {
        // Try YYYY-MM-DD HH:mm:ss
        timestamp = new Date(timeStr.replace(' ', 'T'));
      }
      if (isNaN(timestamp.getTime())) {
        // Try Unix timestamp
        const unixTime = parseInt(timeStr, 10);
        if (!isNaN(unixTime)) {
          timestamp = new Date(unixTime * 1000);
        }
      }
    } catch (e) {
      console.warn(`[ZKTeco] Failed to parse timestamp: ${timeStr}`, e);
    }

    if (!timestamp || isNaN(timestamp.getTime())) {
      return null;
    }

    return {
      userId: String(userId),
      timestamp,
      verifyMode: verifyMode ? parseInt(String(verifyMode), 10) : undefined,
      workCode: workCode ? parseInt(String(workCode), 10) : undefined,
      ...payload, // Include all other fields
    };
  }

  /**
   * Extract device status from key=value payload
   */
  static parseDeviceStatus(payload: ParsedKeyValue): DeviceStatusPayload {
    return {
      deviceName: payload.DeviceName as string,
      mac: payload.MAC as string,
      transactionCount: payload.TransactionCount as number,
      maxAttLogCount: payload.MaxAttLogCount as number,
      userCount: payload.UserCount as number,
      maxUserCount: payload.MaxUserCount as number,
      photoFunOn: payload.PhotoFunOn === true || payload.PhotoFunOn === 1,
      maxUserPhotoCount: payload.MaxUserPhotoCount as number,
      fingerFunOn: payload.FingerFunOn === true || payload.FingerFunOn === 1,
      fpVersion: payload.FPVersion as number,
      ...payload, // Include all other fields
    };
  }

  /**
   * Determine log type from payload type
   */
  static getLogTypeFromPayloadType(payloadType: PayloadType, rawData: string): 'ATTLOG' | 'OPERLOG' | 'USERINFO' | 'FINGERPRINT' | 'FACE' | 'DEVICE_STATUS' | 'DEVICE_CONFIG' | 'USER_SYNC' | 'HEARTBEAT' | 'OTHER' {
    switch (payloadType) {
      case 'attendance':
        if (rawData.includes('ATTLOG:')) return 'ATTLOG';
        if (rawData.includes('FACE') || rawData.includes('Face')) return 'FACE';
        if (rawData.includes('Finger') || rawData.includes('FP')) return 'FINGERPRINT';
        return 'ATTLOG';
      case 'status':
        if (rawData.includes('OPERLOG:')) return 'OPERLOG';
        return 'DEVICE_STATUS';
      case 'config':
        return 'DEVICE_CONFIG';
      case 'user_sync':
        if (rawData.includes('USERINFO:')) return 'USERINFO';
        return 'USER_SYNC';
      case 'heartbeat':
        return 'HEARTBEAT';
      default:
        return 'OTHER';
    }
  }
}
