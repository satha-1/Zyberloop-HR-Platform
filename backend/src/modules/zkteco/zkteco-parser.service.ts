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
  maxFingerCount?: number;
  fpCount?: number;
  faceFunOn?: boolean;
  faceVersion?: number;
  maxFaceCount?: number;
  faceCount?: number;
  fvFunOn?: boolean;
  fvVersion?: number;
  maxFvCount?: number;
  fvCount?: number;
  pvFunOn?: boolean;
  pvVersion?: number;
  maxPvCount?: number;
  pvCount?: number;
  language?: number;
  ipAddress?: string;
  platform?: string;
  oemVendor?: string;
  firmwareVersion?: string;
  pushVersion?: string;
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
      // First, check for attendance event indicators (must have user ID and timestamp)
      const hasAttendanceIndicators = (trimmed.includes('PIN=') || trimmed.includes('UserID=') || trimmed.includes('UserId=')) &&
                                      (trimmed.includes('Time=') || trimmed.includes('DateTime=') || trimmed.includes('Timestamp='));
      
      if (hasAttendanceIndicators) {
        return 'attendance';
      }

      // Check for device status/config indicators (device info without attendance data)
      const hasDeviceStatusIndicators = 
        trimmed.includes('DeviceName=') || trimmed.includes('~DeviceName=') ||
        trimmed.includes('TransactionCount=') || trimmed.includes('~TransactionCount=') ||
        trimmed.includes('UserCount=') || trimmed.includes('~UserCount=') ||
        trimmed.includes('MAC=') || trimmed.includes('IPAddress=') ||
        trimmed.includes('FWVersion=') || trimmed.includes('FirmwareVersion=') ||
        trimmed.includes('PushVersion=') || trimmed.includes('Platform=') ||
        trimmed.includes('FPVersion=') || trimmed.includes('FaceVersion=') ||
        trimmed.includes('FPCount=') || trimmed.includes('FaceCount=');

      if (hasDeviceStatusIndicators) {
        // Distinguish between status and config
        // Config usually has more static info, status has dynamic counts
        if (trimmed.includes('TransactionCount=') || trimmed.includes('UserCount=') || 
            trimmed.includes('FPCount=') || trimmed.includes('FaceCount=')) {
          return 'status';
        }
        return 'config';
      }

      // Check for user sync indicators
      if (trimmed.includes('PIN=') && (trimmed.includes('Name=') || trimmed.includes('Card='))) {
        return 'user_sync';
      }

      // Check for heartbeat (usually minimal data, just device identifier)
      if (trimmed.length < 100 && (trimmed.includes('SN=') || trimmed.includes('Status=') || trimmed.includes('DeviceID='))) {
        return 'heartbeat';
      }

      // If it's key=value format but we can't classify it, default to status
      // (most key=value payloads from ZKTeco devices are status/config)
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

      // Normalize key: remove ~ prefix and trim
      let key = trimmed.substring(0, equalIndex).trim().replace(/^~+/, ''); // Remove one or more ~ prefixes
      const value = trimmed.substring(equalIndex + 1).trim();

      // Skip empty values
      if (value === '' || value === 'undefined' || value === 'null') {
        continue;
      }

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
    const timeValue = payload.Time || payload.DateTime || payload.Timestamp;
    const verifyMode = payload.Verify || payload.VerifyMode || payload.VerifyType;
    const workCode = payload.WorkCode || payload.Workcode || payload.Work;

    if (!userId || !timeValue) {
      return null;
    }

    // Ensure timeValue is a string for parsing
    const timeStr = typeof timeValue === 'string' ? timeValue : String(timeValue);

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
      deviceName: (payload.DeviceName || payload.deviceName) as string,
      mac: (payload.MAC || payload.mac) as string,
      transactionCount: (payload.TransactionCount || payload.transactionCount) as number,
      maxAttLogCount: (payload.MaxAttLogCount || payload.maxAttLogCount) as number,
      userCount: (payload.UserCount || payload.userCount) as number,
      maxUserCount: (payload.MaxUserCount || payload.maxUserCount) as number,
      photoFunOn: payload.PhotoFunOn === true || payload.PhotoFunOn === 1 || payload.photoFunOn === true || payload.photoFunOn === 1,
      maxUserPhotoCount: (payload.MaxUserPhotoCount || payload.maxUserPhotoCount) as number,
      fingerFunOn: payload.FingerFunOn === true || payload.FingerFunOn === 1 || payload.fingerFunOn === true || payload.fingerFunOn === 1,
      fpVersion: (payload.FPVersion || payload.fpVersion) as number,
      maxFingerCount: (payload.MaxFingerCount || payload.maxFingerCount) as number,
      fpCount: (payload.FPCount || payload.fpCount) as number,
      faceFunOn: payload.FaceFunOn === true || payload.FaceFunOn === 1 || payload.faceFunOn === true || payload.faceFunOn === 1,
      faceVersion: (payload.FaceVersion || payload.faceVersion) as number,
      maxFaceCount: (payload.MaxFaceCount || payload.maxFaceCount) as number,
      faceCount: (payload.FaceCount || payload.faceCount) as number,
      fvFunOn: payload.FvFunOn === true || payload.FvFunOn === 1 || payload.fvFunOn === true || payload.fvFunOn === 1,
      fvVersion: (payload.FvVersion || payload.fvVersion) as number,
      maxFvCount: (payload.MaxFvCount || payload.maxFvCount) as number,
      fvCount: (payload.FvCount || payload.fvCount) as number,
      pvFunOn: payload.PvFunOn === true || payload.PvFunOn === 1 || payload.pvFunOn === true || payload.pvFunOn === 1,
      pvVersion: (payload.PvVersion || payload.pvVersion) as number,
      maxPvCount: (payload.MaxPvCount || payload.maxPvCount) as number,
      pvCount: (payload.PvCount || payload.pvCount) as number,
      language: (payload.Language || payload.language) as number,
      ipAddress: (payload.IPAddress || payload.ipAddress) as string,
      platform: (payload.Platform || payload.platform) as string,
      oemVendor: (payload.OEMVendor || payload.oemVendor) as string,
      firmwareVersion: (payload.FWVersion || payload.firmwareVersion || payload.FirmwareVersion) as string,
      pushVersion: (payload.PushVersion || payload.pushVersion) as string,
      ...payload, // Include all other fields for completeness
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
