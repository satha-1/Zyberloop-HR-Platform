import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkforceScenario extends Document {
  name: string;
  description: string;
  scenarioType: 'HIRING' | 'DOWNSIZING' | 'RESTRUCTURING' | 'EXPANSION';
  departmentId?: mongoose.Types.ObjectId;
  targetHeadcount: number;
  currentHeadcount: number;
  budgetImpact: number;
  timeline: {
    startDate: Date;
    endDate: Date;
  };
  status: 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const workforceScenarioSchema = new Schema<IWorkforceScenario>(
  {
    name: { type: String, required: true },
    description: String,
    scenarioType: {
      type: String,
      enum: ['HIRING', 'DOWNSIZING', 'RESTRUCTURING', 'EXPANSION'],
      required: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    targetHeadcount: { type: Number, required: true },
    currentHeadcount: { type: Number, required: true },
    budgetImpact: { type: Number, default: 0 },
    timeline: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'DRAFT',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const WorkforceScenario = mongoose.model<IWorkforceScenario>('WorkforceScenario', workforceScenarioSchema);
