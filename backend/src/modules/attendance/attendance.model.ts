import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceRecord extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HOLIDAY';
  checkIn?: Date;
  checkOut?: Date;
  lateMinutes?: number;
  overTimeMinutes?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LEAVE', 'HOLIDAY'],
      required: true,
      default: 'PRESENT',
    },
    checkIn: Date,
    checkOut: Date,
    lateMinutes: {
      type: Number,
      default: 0,
    },
    overTimeMinutes: {
      type: Number,
      default: 0,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

attendanceRecordSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceRecordSchema);
