import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  relatedEntityType:
    | "REQUISITION"
    | "CANDIDATE"
    | "LEARNING"
    | "PROFILE"
    | "SYSTEM";
  relatedEntityId: mongoose.Types.ObjectId | null;
  status: "NEW" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: Date | null;
  assignedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    relatedEntityType: {
      type: String,
      enum: ["REQUISITION", "CANDIDATE", "LEARNING", "PROFILE", "SYSTEM"],
      required: true,
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    status: {
      type: String,
      enum: ["NEW", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "NEW",
      index: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for efficient queries
taskSchema.index({ userId: 1, status: 1, dueDate: 1 });
taskSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const Task = mongoose.model<ITask>("Task", taskSchema);
