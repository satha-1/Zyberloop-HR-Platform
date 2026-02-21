import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId;
  actorName: string;
  actorRoles: string[];
  action: string;
  module: string;
  resourceType: string;
  resourceId: string;
  diff?: Record<string, any>;
  reason?: string;
  ipAddress: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorName: {
      type: String,
      required: true,
      index: true,
    },
    actorRoles: {
      type: [String],
      default: [],
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    module: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },
    diff: Schema.Types.Mixed,
    reason: String,
    ipAddress: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
auditLogSchema.index({ module: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
