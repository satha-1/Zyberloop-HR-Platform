import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaveRequest extends Document {
  employeeId: mongoose.Types.ObjectId;
  leaveTypeId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  days: number;
  status: 'PENDING' | 'MANAGER_APPROVED' | 'HR_APPROVED' | 'REJECTED' | 'CANCELLED';
  reason?: string;
  approverChain: Array<{
    role: string;
    userId?: mongoose.Types.ObjectId;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedAt?: Date;
  }>;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    leaveTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    days: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'MANAGER_APPROVED', 'HR_APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    reason: String,
    approverChain: [
      {
        role: String,
        userId: Schema.Types.ObjectId,
        status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
        approvedAt: Date,
      },
    ],
    balance: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', leaveRequestSchema);
