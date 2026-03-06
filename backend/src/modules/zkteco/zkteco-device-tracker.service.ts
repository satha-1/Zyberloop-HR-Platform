/**
 * ZKTeco Device Tracker Service
 * Tracks device state and transaction counts to detect missing attendance uploads
 */

import { ZKTecoDeviceLog } from './zkteco-device-log.model';

export interface DeviceState {
  deviceId: string;
  deviceSn?: string;
  lastTransactionCount?: number;
  lastStatusUpdate?: Date;
  lastAttendanceReceived?: Date;
  statusUpdateCount: number;
  attendanceReceivedCount: number;
}

class DeviceTrackerService {
  private deviceStates: Map<string, DeviceState> = new Map();

  /**
   * Track device status update and detect transaction count changes
   */
  async trackDeviceStatus(
    deviceId: string,
    deviceSn: string | undefined,
    transactionCount: number | undefined,
    timestamp: Date = new Date()
  ): Promise<void> {
    const state = this.getOrCreateState(deviceId, deviceSn);
    const previousCount = state.lastTransactionCount;
    
    state.lastStatusUpdate = timestamp;
    state.statusUpdateCount++;
    
    if (transactionCount !== undefined) {
      if (previousCount !== undefined && transactionCount > previousCount) {
        const newTransactions = transactionCount - previousCount;
        const timeSinceLastAttendance = state.lastAttendanceReceived 
          ? Math.round((timestamp.getTime() - state.lastAttendanceReceived.getTime()) / 1000)
          : null;
        
        console.log(`[ZKTeco] [TRACKER] Device ${deviceId}: Transaction count increased from ${previousCount} to ${transactionCount} (+${newTransactions})`);
        console.log(`[ZKTeco] [TRACKER] Last attendance received: ${state.lastAttendanceReceived?.toISOString() || 'NEVER'}${timeSinceLastAttendance ? ` (${timeSinceLastAttendance}s ago)` : ''}`);
        
        // Warn if no attendance received in last 2 minutes or never
        const warningThreshold = 120000; // 2 minutes in milliseconds
        if (!state.lastAttendanceReceived || 
            (state.lastAttendanceReceived && timestamp.getTime() - state.lastAttendanceReceived.getTime() > warningThreshold)) {
          console.warn(`[ZKTeco] [TRACKER] ⚠️  ⚠️  ⚠️  CRITICAL WARNING: Device ${deviceId} transaction count increased by ${newTransactions} but no attendance payload received!`);
          console.warn(`[ZKTeco] [TRACKER] Device is recording punches locally (count: ${transactionCount}) but NOT uploading to server.`);
          console.warn(`[ZKTeco] [TRACKER] Last attendance upload: ${state.lastAttendanceReceived?.toISOString() || 'NEVER'}`);
          console.warn(`[ZKTeco] [TRACKER] ⚠️  ACTION REQUIRED: Check device configuration:`);
          console.warn(`[ZKTeco] [TRACKER]   1. Enable "Push Attendance" or "Transaction Upload" in device settings`);
          console.warn(`[ZKTeco] [TRACKER]   2. Enable "Real-time Upload" or "Upload Immediately"`);
          console.warn(`[ZKTeco] [TRACKER]   3. Verify "Push Options Flag" is enabled`);
          console.warn(`[ZKTeco] [TRACKER]   4. Check device firmware supports real-time uploads`);
        }
      }
      state.lastTransactionCount = transactionCount;
    }
  }

  /**
   * Track attendance event received
   */
  trackAttendanceReceived(deviceId: string, timestamp: Date = new Date()): void {
    const state = this.getOrCreateState(deviceId);
    state.lastAttendanceReceived = timestamp;
    state.attendanceReceivedCount++;
  }

  /**
   * Get device state
   */
  getDeviceState(deviceId: string): DeviceState | undefined {
    return this.deviceStates.get(deviceId);
  }

  /**
   * Get or create device state
   */
  private getOrCreateState(deviceId: string, deviceSn?: string): DeviceState {
    if (!this.deviceStates.has(deviceId)) {
      this.deviceStates.set(deviceId, {
        deviceId,
        deviceSn,
        statusUpdateCount: 0,
        attendanceReceivedCount: 0,
      });
    }
    const state = this.deviceStates.get(deviceId)!;
    if (deviceSn && !state.deviceSn) {
      state.deviceSn = deviceSn;
    }
    return state;
  }

  /**
   * Get summary of all tracked devices
   */
  getSummary(): DeviceState[] {
    return Array.from(this.deviceStates.values());
  }

  /**
   * Load last known transaction count from database
   */
  async loadLastTransactionCount(deviceId: string): Promise<number | undefined> {
    try {
      const lastStatusLog = await ZKTecoDeviceLog.findOne({
        deviceId,
        payloadType: { $in: ['status', 'config'] },
        'parsedData.deviceStatus.transactionCount': { $exists: true },
      })
        .sort({ createdAt: -1 })
        .lean();

      if (lastStatusLog?.parsedData?.deviceStatus?.transactionCount) {
        return lastStatusLog.parsedData.deviceStatus.transactionCount as number;
      }
    } catch (error) {
      console.error(`[ZKTeco] [TRACKER] Error loading last transaction count for ${deviceId}:`, error);
    }
    return undefined;
  }
}

export const deviceTracker = new DeviceTrackerService();
