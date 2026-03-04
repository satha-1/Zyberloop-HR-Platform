# ZyberHR - Enterprise HR Management Platform

A comprehensive, enterprise-grade HR Management Platform built with **Next.js 15** (frontend) and **Node.js + Express + TypeScript + MongoDB** (backend). Designed for Sri Lankan payroll compliance with EPF/ETF/APIT calculations, employee lifecycle management, recruitment workflows, and document generation.

---

## 🏗️ Project Architecture

```
Zyberloop-HR-Platform/
├── backend/                          # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/                   # Configuration management
│   │   │   └── index.ts              # Environment config
│   │   ├── database/                  # Database setup & migrations
│   │   │   ├── connection.ts          # MongoDB connection
│   │   │   ├── migrations/            # Database migrations
│   │   │   │   └── 20260303-enterprise-payroll.ts
│   │   │   └── seed.ts                # Database seeding
│   │   ├── middlewares/               # Express middlewares
│   │   │   ├── auth.ts               # JWT authentication
│   │   │   ├── errorHandler.ts       # Error handling
│   │   │   ├── upload.ts             # File upload (Multer)
│   │   │   └── validator.ts          # Request validation
│   │   ├── modules/                   # Feature modules
│   │   │   ├── auth/                 # Authentication & authorization
│   │   │   ├── users/                # User management
│   │   │   ├── employees/             # Employee master & lifecycle
│   │   │   │   ├── employee.model.ts
│   │   │   │   ├── employees.controller.ts
│   │   │   │   ├── employees.routes.ts
│   │   │   │   ├── employeeCode.service.ts      # Auto-generate employee codes
│   │   │   │   ├── employeeNumber.service.ts   # Auto-generate EMPNO
│   │   │   │   ├── sequenceGenerator.model.ts  # Sequential ID generation
│   │   │   │   ├── employeeProfile.controller.ts  # 360 profile APIs
│   │   │   │   ├── employeeCompensation.controller.ts  # Salary & compensation
│   │   │   │   ├── jobHistory.service.ts       # Job advancement tracking
│   │   │   │   └── employeeJobAdvancement.model.ts
│   │   │   ├── departments/          # Department management
│   │   │   │   ├── department.model.ts
│   │   │   │   ├── departments.controller.ts
│   │   │   │   ├── departments.routes.ts
│   │   │   │   └── departmentCode.service.ts    # Auto-generate dept codes
│   │   │   ├── recruitment/           # Recruitment & hiring
│   │   │   │   ├── requisition.model.ts
│   │   │   │   ├── candidate.model.ts
│   │   │   │   ├── candidateApplication.model.ts
│   │   │   │   ├── recruitment.controller.ts
│   │   │   │   ├── recruitment.routes.ts
│   │   │   │   └── budgetCode.service.ts       # Auto-generate budget codes
│   │   │   ├── payroll/              # Payroll processing
│   │   │   │   ├── payroll.controller.ts
│   │   │   │   ├── payrollTemplate.controller.ts
│   │   │   │   ├── enterprisePayroll.controller.ts
│   │   │   │   ├── salaryComponent.model.ts
│   │   │   │   ├── employeeSalaryComponent.model.ts
│   │   │   │   ├── employeeBankAccount.model.ts
│   │   │   │   ├── apitTaxTable.model.ts
│   │   │   │   ├── payslip.model.ts
│   │   │   │   └── statutoryCalculator.service.ts  # EPF/ETF/APIT calculations
│   │   │   ├── leave/                 # Leave management
│   │   │   │   ├── leaveRequest.model.ts
│   │   │   │   ├── leaveType.model.ts
│   │   │   │   ├── leave.controller.ts
│   │   │   │   ├── leave.routes.ts
│   │   │   │   └── leaveBalance.service.ts     # Centralized leave balance logic
│   │   │   ├── documents/             # Document generation & management
│   │   │   │   ├── document.model.ts
│   │   │   │   ├── template.model.ts
│   │   │   │   ├── documents.controller.ts
│   │   │   │   ├── templates.controller.ts
│   │   │   │   ├── services/          # Document services
│   │   │   │   └── workers/           # Background workers
│   │   │   ├── attendance/            # Attendance tracking
│   │   │   ├── performance/            # Performance management
│   │   │   ├── learning/              # Learning & development
│   │   │   ├── workforce/             # Workforce planning
│   │   │   ├── engagement/            # Employee engagement
│   │   │   ├── compliance/           # Compliance management
│   │   │   ├── logs/                 # Audit logging
│   │   │   ├── notifications/        # Notification system
│   │   │   └── tasks/                # Task management
│   │   └── index.ts                   # Application entry point
│   ├── dist/                          # Compiled JavaScript (generated)
│   ├── uploads/                       # File uploads directory
│   ├── Dockerfile                     # Docker containerization
│   ├── .dockerignore                  # Docker ignore patterns
│   ├── setup-ec2.sh                   # EC2 setup automation script
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md                      # Backend-specific documentation
│
├── frontend/                          # Next.js 15 Frontend Application
│   ├── src/
│   │   ├── app/                       # Next.js App Router
│   │   │   ├── (main)/                # Main application routes (protected)
│   │   │   │   ├── layout.tsx         # Main layout with navigation
│   │   │   │   ├── page.tsx           # Dashboard
│   │   │   │   ├── employees/         # Employee management
│   │   │   │   │   ├── page.tsx      # Employee list table
│   │   │   │   │   └── [id]/         # Employee detail pages
│   │   │   │   │       ├── page.tsx  # Employee master (tabs: Overview, Compensation, Bank, Personal, Job Timeline, Documents)
│   │   │   │   │       └── profile/
│   │   │   │   │           └── page.tsx  # 360 Profile view
│   │   │   │   ├── departments/      # Department management
│   │   │   │   │   └── page.tsx      # Department list & CRUD
│   │   │   │   ├── recruitment/       # Recruitment module
│   │   │   │   │   ├── page.tsx      # Main recruitment page (tabs: Requisitions, Approvals, Candidates, Pipeline)
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── RequisitionsTab.tsx
│   │   │   │   │   │   └── RequisitionApprovalsTab.tsx  # Job requisition approvals
│   │   │   │   │   └── requisitions/
│   │   │   │   │       └── [id]/
│   │   │   │   │           └── page.tsx  # Requisition detail
│   │   │   │   ├── payroll/          # Payroll processing
│   │   │   │   │   ├── page.tsx      # Payroll runs list
│   │   │   │   │   ├── runs/         # Payroll run management
│   │   │   │   │   └── templates/    # Payroll templates
│   │   │   │   ├── leave/            # Leave management
│   │   │   │   ├── attendance/       # Attendance tracking
│   │   │   │   ├── performance/      # Performance management
│   │   │   │   ├── learning/        # Learning & development
│   │   │   │   ├── workforce-planning/  # Workforce planning
│   │   │   │   ├── engagement/      # Employee engagement
│   │   │   │   ├── compliance/      # Compliance
│   │   │   │   ├── tasks/           # Task management
│   │   │   │   ├── notifications/  # Notifications
│   │   │   │   └── admin/          # Admin panel
│   │   │   │       ├── documents/  # Document management
│   │   │   │       ├── templates/  # Template management
│   │   │   │       └── logs/       # Audit logs
│   │   │   ├── portal/             # Public candidate portal
│   │   │   │   └── jobs/
│   │   │   │       └── [requisitionId]/
│   │   │   │           └── page.tsx  # Public job posting & application
│   │   │   ├── components/          # Reusable React components
│   │   │   │   ├── ui/              # UI component library
│   │   │   │   │   ├── EnterpriseTable.tsx  # Advanced table (sorting, filtering, pagination, CSV export, expand)
│   │   │   │   │   ├── WorkdayTable.tsx    # Alternative table component
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   └── ... (50+ UI components)
│   │   │   │   ├── AddEmployeeDialog.tsx      # Employee creation form
│   │   │   │   ├── EditEmployeeDialog.tsx      # Employee editing
│   │   │   │   ├── DepartmentDialog.tsx        # Department CRUD
│   │   │   │   ├── CreateRequisitionDialog.tsx # Job requisition creation
│   │   │   │   ├── ViewRequisitionDialog.tsx   # Requisition details
│   │   │   │   ├── JobAdvancementDialog.tsx    # Job advancement/promotion
│   │   │   │   ├── TemplateEditor/            # Document template editor
│   │   │   │   ├── MainLayout.tsx             # Main app layout
│   │   │   │   └── ...
│   │   │   ├── lib/                  # Utilities & helpers
│   │   │   │   ├── api.ts            # API client (all endpoints)
│   │   │   │   └── hooks.ts          # Custom React hooks (useDebounce, etc.)
│   │   │   ├── layout.tsx            # Root layout
│   │   │   └── not-found.tsx         # 404 page
│   │   └── styles/                    # Global styles
│   ├── public/                        # Static assets
│   ├── amplify.yml                    # AWS Amplify configuration
│   ├── next.config.js                 # Next.js configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── postcss.config.mjs
│
├── AWS_DEPLOYMENT_GUIDE.md            # Comprehensive AWS deployment guide
├── QUICK_DEPLOY.md                    # Quick deployment reference
├── DEPLOYMENT_CHECKLIST.md            # Deployment checklist
├── ENV_SETUP.md                       # Environment variables guide
├── deploy.sh                          # Deployment automation script
└── README.md                          # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x or higher
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn**

### Backend Setup

```bash
cd backend
npm install

# Create .env file (see ENV_SETUP.md for all variables)
cat > .env << EOF
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/zyberhr
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
EOF

# Seed database (creates admin user + sample data)
npm run seed

# Start development server
npm run dev
```

Backend runs on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
EOF

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

### Default Admin Credentials

- **Email:** `sathsarasoysa2089@gmail.com`
- **Password:** `Sath@Admin`

---

## 📋 Core Features

### ✅ Employee Management
- **Employee Master**: Complete employee lifecycle management
  - Auto-generated Employee Code (`EMP-000001-AB` format)
  - Auto-generated Employee Number (`000234859` - 9-digit format)
  - Personal information, employment details, addresses
  - Emergency contacts, system access settings
- **Employee 360 Profile**: Comprehensive employee view
  - Job details, service dates, management chain
  - Assigned roles, support roles, leave balances
  - Career timeline (job advancements)
- **Job Advancement System**: Track promotions, transfers, salary revisions
  - Effective-dated records
  - Automatic timeline generation
  - Current job status denormalization
- **Compensation Management**: Separate tab for salary & benefits
- **Bank Details**: Effective-dated bank account management
- **Documents**: Upload and manage employee documents

### ✅ Department Management
- Auto-generated department codes (`HR-001`, `IT-002` format)
- Hierarchical structure (parent departments)
- Department head assignment
- Additional fields: description, location, cost center, status, email, phone

### ✅ Recruitment & Hiring
- **Job Requisitions**: Create and manage job postings
  - Auto-generated budget codes (`BUD-001` format)
  - Approval workflow: DRAFT → MANAGER_APPROVED → PUBLISHED
  - Job Requisition Approvals tab for managers/HR
- **Public Job Portal**: Candidates can view and apply for published jobs
- **Candidate Management**: Track applications through pipeline
- **Application Status**: Check application status by email

### ✅ Payroll Processing (Sri Lanka Compliant)
- **Enterprise Payroll System**:
  - EPF: Employee 8% + Employer 12%
  - ETF: Employer 3%
  - APIT: Table-driven tax calculation (Table 01-08 support)
- **Salary Components**: Flexible component system
  - Earnings, deductions, employer contributions
  - EPF/ETF eligibility flags
  - Taxable/non-taxable flags
- **Effective-Dated Assignments**: Historical salary tracking
- **Payslip Generation**: Complete payslip with statutory calculations

### ✅ Leave Management
- **Centralized Leave Balance Service**: Accurate balance calculation
  - Considers hire date, accrual rules, leave requests
  - Supports casual, annual, sick leave types
- **Leave Requests**: Create, approve, reject leave requests
- **Leave Balance Display**: Real-time balance in 360 profile

### ✅ Document Generation
- **Template Editor**: Visual document template creation
- **Document Generation**: Generate documents from templates
- **Document Management**: Upload, view, download documents
- **S3 Storage**: All documents stored in AWS S3 with metadata in MongoDB
- **Signature Support**: DocuSign integration ready

### ✅ File Storage & Media Management
- **S3 Integration**: All files (CVs, photos, documents) stored in AWS S3
- **Pre-signed URLs**: Secure, time-limited access to files (60-second expiry)
- **Metadata Tracking**: File metadata stored in MongoDB for fast queries
- **Candidate CV Management**: CV upload, view, and download via backend
- **Employee Documents**: Profile pictures and documents stored in S3
- **Export Functionality**: Candidate export with CV metadata (CSV/JSON)

### ✅ Advanced Table Features (Global)
- **Filtering**: Column-based filtering with dialog
- **CSV Export**: Download table data with proper filename (`module_userId_timestamp.csv`)
- **Expand View**: Full-screen table modal (99vw x 99vh)
- **Sorting**: Multi-column sorting
- **Pagination**: Internal table scrolling with pagination
- **Column Management**: Show/hide columns, resizable columns
- **Horizontal Scrolling**: For wide tables

### ✅ Audit & Logging
- Comprehensive audit trail
- User action tracking
- Module-based logging

---

## 🏛️ Backend Module Structure

Each module follows a consistent structure:

```
module-name/
├── *.model.ts           # Mongoose schema & model
├── *.controller.ts      # Request handlers (business logic)
├── *.routes.ts          # Express route definitions
├── *.service.ts         # Service layer (where applicable)
└── *.validator.ts       # Request validation (where applicable)
```

### Available Modules

| Module | Status | Description |
|--------|--------|-------------|
| **auth** | ✅ Complete | Authentication & JWT |
| **users** | ✅ Complete | User management |
| **employees** | ✅ Complete | Employee master, 360 profile, job advancement |
| **departments** | ✅ Complete | Department management with auto-codes |
| **recruitment** | ✅ Complete | Job requisitions, candidates, approvals, public portal, CV management, candidate export |
| **payroll** | ✅ Complete | Enterprise payroll with EPF/ETF/APIT |
| **leave** | ✅ Complete | Leave management with centralized balance service |
| **documents** | ✅ Complete | Document generation & management |
| **attendance** | 🚧 In Progress | Attendance tracking |
| **performance** | 🚧 In Progress | Performance management |
| **learning** | 🚧 In Progress | Learning & development |
| **workforce** | 🚧 In Progress | Workforce planning |
| **engagement** | 🚧 In Progress | Employee engagement |
| **compliance** | 🚧 In Progress | Compliance management |
| **logs** | ✅ Complete | Audit logging |
| **notifications** | ✅ Complete | Notification system |
| **tasks** | ✅ Complete | Task management |

---

## 🎨 Frontend Architecture

### Routing Structure (Next.js App Router)

- **`(main)/`**: Protected routes requiring authentication
  - Dashboard, Employees, Departments, Recruitment, Payroll, etc.
- **`portal/`**: Public routes (candidate job portal)
- **`components/`**: Reusable React components
  - **`ui/`**: Base UI component library (Radix UI + Tailwind)
  - Dialog components, table components, form components

### Key Frontend Features

- **Tab State Persistence**: URL query parameters maintain active tabs
- **Save/Edit State Management**: Smart button states (fade on save, enable on change)
- **Auto-Generation**: Real-time code generation for departments, employees, requisitions
- **Responsive Design**: Mobile-friendly layouts
- **Real-time Updates**: Polling and focus-based refresh

---

## 🔑 Key Identifiers & Auto-Generation

### Employee Identifiers

1. **Employee Number (`empNo`)**: 
   - Format: `000234859` (9 digits)
   - Auto-generated: `{department_code}{sequential}{random}`
   - Can be manually entered (must be unique)

2. **Employee Code (`employeeCode`)**:
   - Format: `EMP-000001-AB`
   - Auto-generated: `{PREFIX}-{SEQUENTIAL}-{RANDOM}`
   - Read-only, never changes after creation

### Department Codes

- Format: `HR-001`, `IT-002`, `SD-003`
- Auto-generated: `{PREFIX}-{GLOBAL_SEQUENCE}`
- Prefix from department name initials
- Globally unique sequence number

### Budget Codes (Requisitions)

- Format: `BUD-001`, `BUD-002`
- Auto-generated sequential codes
- Read-only after creation

---

## 📡 API Endpoints Overview

### Authentication
- `POST /api/v1/auth/login` - User login

### Employees
- `GET /api/v1/employees` - List employees (with filters)
- `GET /api/v1/employees/:id` - Get employee details
- `POST /api/v1/employees` - Create employee
- `PATCH /api/v1/employees/:id` - Update employee
- `GET /api/v1/employees/generate-code` - Generate employee code
- `GET /api/v1/employees/generate-number` - Generate EMPNO
- `GET /api/v1/employees/:id/profile/*` - 360 profile endpoints
- `POST /api/v1/employees/:id/job-advancement` - Create job advancement
- `GET /api/v1/employees/:id/job-timeline` - Get job timeline

### Departments
- `GET /api/v1/departments` - List departments
- `POST /api/v1/departments` - Create department
- `GET /api/v1/departments/generate-code` - Generate department code

### Recruitment
- `GET /api/v1/recruitment/requisitions` - List requisitions
- `POST /api/v1/recruitment/requisitions` - Create requisition
- `GET /api/v1/recruitment/approvals/pending` - Get pending approvals
- `POST /api/v1/recruitment/requisitions/:id/approve` - Manager approval
- `POST /api/v1/recruitment/requisitions/:id/publish` - HR publish
- `GET /api/v1/recruitment/public/requisitions/:id` - Public job posting
- `GET /api/v1/recruitment/generate-budget-code` - Generate budget code
- `GET /api/v1/recruitment/candidates` - List candidates (includes position, CV metadata)
- `GET /api/v1/recruitment/candidates/:id` - Get candidate details
- `GET /api/v1/recruitment/candidates/:id/cv-url` - Get pre-signed CV URL
- `GET /api/v1/recruitment/candidates/export` - Export candidates with CV metadata (CSV/JSON)

### Payroll
- `GET /api/v1/payroll/runs` - List payroll runs
- `POST /api/v1/payroll/runs` - Create payroll run
- `POST /api/v1/payroll/enterprise/calculate-payslip` - Calculate payslip
- `GET /api/v1/payroll/components` - List salary components
- `GET /api/v1/payroll/apit/:tableCode` - Get APIT tax table

### Leave
- `GET /api/v1/leave/requests` - List leave requests
- `POST /api/v1/leave/requests` - Create leave request
- `GET /api/v1/leave/balance/:employeeId/:leaveType` - Get leave balance

See `backend/README.md` for complete API documentation.

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first CSS
- **Radix UI** - Accessible component primitives
- **Sonner** - Toast notifications
- **Lucide React** - Icons

### Backend
- **Node.js 20** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB + Mongoose** - Database & ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **BullMQ** - Job queue (Redis)
- **Puppeteer** - PDF generation
- **AWS SDK** - S3 integration

---

## 📦 Development

### Running Locally

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Building for Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

### Database Migrations

```bash
cd backend
npm run migrate:enterprise-payroll
```

### Seeding Database

```bash
cd backend
npm run seed  # Creates admin user + sample departments/employees
```

---

## ☁️ Deployment

### AWS Deployment

Comprehensive deployment guides available:

- **`AWS_DEPLOYMENT_GUIDE.md`** - Complete step-by-step AWS deployment
- **`QUICK_DEPLOY.md`** - Fast deployment path (~30 minutes)
- **`DEPLOYMENT_CHECKLIST.md`** - Pre-deployment checklist

### Recommended Architecture

- **Frontend**: AWS Amplify (auto-deploys from Git)
- **Backend**: EC2 (Ubuntu) or ECS Fargate (containerized)
- **Database**: MongoDB Atlas (managed)
- **File Storage**: AWS S3 (private bucket with IAM role-based access)
- **Caching**: ElastiCache (Redis) for BullMQ

### File Storage Architecture (S3)

The platform uses **AWS S3** for all file storage (CVs, photos, documents) with the following architecture:

#### Storage Strategy

1. **All Files Stored in S3**:
   - Candidate CVs/Resumes
   - Employee profile pictures
   - Employee documents (NIC, contracts, certificates, etc.)
   - Generated documents (payslips, letters, etc.)

2. **Metadata in MongoDB**:
   - File metadata (filename, size, mimeType, storage key)
   - Owner information (employeeId, candidateId, etc.)
   - Upload timestamps and audit trail

3. **Access Pattern**:
   - **Upload**: Frontend → Backend → S3 (backend handles upload)
   - **View/Download**: Frontend → Backend → Pre-signed S3 URL (60-second expiry)
   - **No Direct S3 Access**: Frontend never talks to S3 directly

#### S3 Configuration

**Environment Variables** (Backend `.env`):
```bash
S3_BUCKET=zyberhr-prod-documents
AWS_REGION=us-east-1
# Optional (for S3-compatible storage like MinIO):
# S3_ENDPOINT=https://s3.amazonaws.com
# S3_FORCE_PATH_STYLE=false
```

**IAM Permissions** (EC2 Instance Role):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::zyberhr-prod-documents/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::zyberhr-prod-documents"
    }
  ]
}
```

**S3 Bucket Settings**:
- **Block Public Access**: ON (all files private)
- **Encryption**: SSE-S3 (server-side encryption)
- **Versioning**: Optional (recommended for compliance)
- **Lifecycle Rules**: Optional (e.g., delete temp files after 90 days)

#### File Path Structure

Files are stored with organized prefixes:
```
prod/
├── candidates/
│   └── {candidateId}/
│       └── cv/
│           └── {timestamp}-{filename}
├── employees/
│   └── {employeeId}/
│       ├── photos/
│       │   └── {timestamp}-{filename}
│       └── documents/
│           └── {documentType}/
│               └── {timestamp}-{filename}
└── documents/
    └── {documentId}/
        └── {artefactKind}.pdf
```

#### Fallback Behavior

- **Development**: If `S3_BUCKET` is not configured, files are stored locally in `backend/uploads/`
- **Production**: Always uses S3 (configured via environment variables)

### Quick Deploy Commands

```bash
# Backend on EC2
ssh ubuntu@your-ec2-ip
cd /opt/zyberhr/backend
git pull
npm install
npm run build
pm2 restart zyberhr-backend

# Frontend: Auto-deploys via AWS Amplify on git push
```

---

## 📚 Documentation

- **`ENV_SETUP.md`** - Environment variables configuration
- **`backend/README.md`** - Backend API documentation
- **`AWS_DEPLOYMENT_GUIDE.md`** - Complete AWS deployment guide
- **`QUICK_DEPLOY.md`** - Quick deployment reference
- **`DEPLOYMENT_CHECKLIST.md`** - Deployment verification checklist

---

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation
- Audit logging
- Environment variable management
- AWS Secrets Manager integration ready

---

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test
```

Test files:
- `backend/src/modules/employees/employeeCode.service.test.ts`
- `backend/src/modules/payroll/statutoryCalculator.service.test.ts`

---

## 📝 License

Private project - All rights reserved

---

## 🤝 Contributing

This is a private enterprise project. For internal development guidelines, see team documentation.

---

## 📞 Support

For deployment issues, see:
- `AWS_DEPLOYMENT_GUIDE.md` - Troubleshooting section
- `DEPLOYMENT_CHECKLIST.md` - Verification steps
- CloudWatch logs (AWS)
- PM2 logs (EC2): `pm2 logs`

---

## 🎯 Roadmap

- [ ] Complete Performance Management module
- [ ] Complete Learning & Development module
- [ ] Complete Workforce Planning module
- [ ] Complete Engagement & Surveys module
- [ ] Complete Compliance module
- [ ] Mobile app (React Native)
- [ ] Advanced analytics & reporting
- [ ] Multi-tenant support
- [ ] API rate limiting
- [ ] WebSocket for real-time updates

---

**Last Updated**: 2024
**Version**: 1.0.0
