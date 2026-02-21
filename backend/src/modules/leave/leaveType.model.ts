import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaveType extends Document {
  code: string;
  name: string;
  entitlementDays: number;
  accrualRule: {
    perMonth: number;
  };
  carryForwardRule: {
    maxDays: number;
  };
  encashmentRule: {
    allowed: boolean;
    factor: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const leaveTypeSchema = new Schema<ILeaveType>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    entitlementDays: {
      type: Number,
      required: true,
    },
    accrualRule: {
      perMonth: { type: Number, default: 0 },
    },
    carryForwardRule: {
      maxDays: { type: Number, default: 0 },
    },
    encashmentRule: {
      allowed: { type: Boolean, default: false },
      factor: { type: Number, default: 1 },
    },
  },
  {
    timestamps: true,
  }
);

export const LeaveType = mongoose.model<ILeaveType>('LeaveType', leaveTypeSchema);
