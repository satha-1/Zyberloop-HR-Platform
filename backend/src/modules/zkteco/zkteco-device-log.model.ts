import mongoose, { Schema, Document } from 'mongoose';

export interface IZKTecoDeviceLog extends Document {
  deviceId: string;
  deviceSn?: string;
  logType: 'ATTLOG' | 'OPERLOG' | 'USERINFO' | 'FINGERPRINT' | 'FACE' | 'OTHER';
  rawData: string;
  parsedData?: {
    userId?: string;
    timestamp?: Date;
    status?: number;
    verifyMode?: number;
    workCode?: number;
    reserved?: string;
  };
  employeeId?: mongoose.Types.ObjectId;
  processed: boolean;
  processedAt?: Date;
  error?: string;
  ipAddress?: string;
  userAgent?: string;
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
      enum: ['ATTLOG', 'OPERLOG', 'USERINFO', 'FINGERPRINT', 'FACE', 'OTHER'],
      required: true,
      index: true,
    },
    rawData: {
      type: String,
      required: true,
    },
    parsedData: {
      userId: String,
      timestamp: Date,
      status: Number,
      verifyMode: Number,
      workCode: Number,
      reserved: String,
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
