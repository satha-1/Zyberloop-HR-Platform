import mongoose, { Schema, Document } from 'mongoose';

export interface IZKTecoDeviceLog extends Document {
  deviceId: string;
  deviceSn?: string;
  logType: 'ATTLOG' | 'OPERLOG' | 'USERINFO' | 'FINGERPRINT' | 'FACE' | 'DEVICE_STATUS' | 'DEVICE_CONFIG' | 'USER_SYNC' | 'HEARTBEAT' | 'OTHER';
  rawData: string;
  parsedData?: {
    // Legacy ATTLOG format
    userId?: string;
    timestamp?: Date;
    status?: number;
    verifyMode?: number;
    workCode?: number;
    reserved?: string;
    // New SenseFace format - key-value pairs
    deviceStatus?: Record<string, any>;
    attendanceEvent?: {
      userId?: string;
      timestamp?: Date;
      verifyMode?: number;
      workCode?: number;
      [key: string]: any;
    };
  };
  employeeId?: mongoose.Types.ObjectId;
  processed: boolean;
  processedAt?: Date;
  error?: string;
  ipAddress?: string;
  userAgent?: string;
  payloadType?: 'attendance' | 'status' | 'config' | 'user_sync' | 'heartbeat' | 'unknown';
  createdAt: Date;
  updatedAt: Date;
}

const zktecoDeviceLogSchema = new Schema<IZKTecoDeviceLog>(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    deviceSn: {
      type: String,
      index: true,
    },
    logType: {
      type: String,
      enum: ['ATTLOG', 'OPERLOG', 'USERINFO', 'FINGERPRINT', 'FACE', 'DEVICE_STATUS', 'DEVICE_CONFIG', 'USER_SYNC', 'HEARTBEAT', 'OTHER'],
      required: true,
      index: true,
    },
    rawData: {
      type: String,
      required: true,
    },
    parsedData: {
      // Legacy ATTLOG format
      userId: String,
      timestamp: Date,
      status: Number,
      verifyMode: Number,
      workCode: Number,
      reserved: String,
      // New SenseFace format
      deviceStatus: mongoose.Schema.Types.Mixed,
      attendanceEvent: mongoose.Schema.Types.Mixed,
    },
    payloadType: {
      type: String,
      enum: ['attendance', 'status', 'config', 'user_sync', 'heartbeat', 'unknown'],
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      index: true,
    },
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
    processedAt: Date,
    error: String,
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
zktecoDeviceLogSchema.index({ deviceId: 1, createdAt: -1 });
zktecoDeviceLogSchema.index({ processed: 1, createdAt: -1 });
zktecoDeviceLogSchema.index({ employeeId: 1, 'parsedData.timestamp': -1 });

export const ZKTecoDeviceLog = mongoose.model<IZKTecoDeviceLog>(
  'ZKTecoDeviceLog',
  zktecoDeviceLogSchema
);
