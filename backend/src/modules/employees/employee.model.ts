import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  empNo?: string;
  employeeNumber: string;
  employeeCode: string;
  userId?: mongoose.Types.ObjectId;
  initials?: string;
  preferredName?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone: string;
  dob?: Date;
  address?: string;
  currentAddress?: string;
  permanentAddress?: string;
  profilePicture?: string;
  grade?: string;
  jobTitle?: string;
  employmentType?: 'permanent' | 'contract' | 'intern' | 'casual';
  workLocation?: string;
  departmentId?: mongoose.Types.ObjectId;
  managerId?: mongoose.Types.ObjectId;
  hireDate: Date;
  terminationDate?: Date;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  salary: number;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  };
  bankDetails?: {
    bankName?: string;
    branchName?: string;
    branchCode?: string;
    accountHolderName?: string;
    accountNumber?: string;
    accountType?: string;
    paymentMethod?: string;
  };
  compensationHistory: Array<{
    effectiveDate: Date;
    salary: number;
    allowances: Array<{ name: string; amount: number }>;
    reason: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    empNo: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    employeeNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    initials: {
      type: String,
      trim: true,
    },
    preferredName: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      index: true,
    },
    lastName: {
      type: String,
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
    },
    dob: Date,
    address: String,
    currentAddress: String,
    permanentAddress: String,
    profilePicture: String,
    grade: {
      type: String,
      index: true,
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    employmentType: {
      type: String,
      enum: ['permanent', 'contract', 'intern', 'casual'],
      default: 'permanent',
      index: true,
    },
    workLocation: String,
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      index: true,
    },
    hireDate: {
      type: Date,
      required: true,
      index: true,
    },
    terminationDate: Date,
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave', 'terminated'],
      default: 'active',
      index: true,
    },
    salary: {
      type: Number,
      default: 0,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
    },
    bankDetails: {
      bankName: String,
      branchName: String,
      branchCode: String,
      accountHolderName: String,
      accountNumber: String,
      accountType: String,
      paymentMethod: String,
    },
    compensationHistory: [
      {
        effectiveDate: Date,
        salary: Number,
        allowances: [
          {
            name: String,
            amount: Number,
          },
        ],
        reason: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

employeeSchema.pre('validate', function setEmpNo(next) {
  if (!this.empNo && this.employeeNumber) {
    this.empNo = this.employeeNumber;
  }
  if (!this.employeeNumber && this.empNo) {
    this.employeeNumber = this.empNo;
  }
  next();
});

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
