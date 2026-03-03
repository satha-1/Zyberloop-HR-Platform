import mongoose, { Document, Schema } from 'mongoose';

export interface ISequenceGenerator extends Document {
  key: string;
  value: number;
  updatedAt: Date;
  createdAt: Date;
}

const sequenceGeneratorSchema = new Schema<ISequenceGenerator>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const SequenceGenerator = mongoose.model<ISequenceGenerator>(
  'SequenceGenerator',
  sequenceGeneratorSchema
);
