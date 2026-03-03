# ZyberHR Backend

Complete Node.js + TypeScript + MongoDB backend for the HR Management Platform.

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/zyberhr
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   ADMIN_SEED_EMAIL=sathsarasoysa2089@gmail.com
   ADMIN_SEED_PASSWORD=Sath@Admin
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start MongoDB:**
   Make sure MongoDB is running on your system.

4. **Seed admin user:**
   ```bash
   npm run seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:3001`

## Enterprise Payroll & Employee Identifiers

### Employee identifiers

- `emp_no` (`empNo` in API/model): manual HR-entered ID, unique.
- `emp_code` (`employeeCode`): auto-generated, read-only in UI, unique, never reused.
- Current generator format: `EMP-000001-AB` (sequential number + random suffix, transactionally generated via `sequence_generators` collection).
  - Format: `{PREFIX}-{SEQUENTIAL}-{RANDOM}`
  - Sequential part: 6-digit zero-padded number (e.g., `000001`, `000125`)
  - Random suffix: 2 alphanumeric characters (e.g., `AB`, `X7`, `9Z`) - randomly generated for each code
  - Example codes: `EMP-000001-AB`, `EMP-000002-XY`, `EMP-000125-7K`
- You can configure prefix, digits, random length, and random type in `employeeCode.service.ts` (`EmployeeCodeConfig`).

### New payroll data model (Mongoose equivalents of migration tables)

- `employees` (extended with `empNo`)
- `salary_components` -> `SalaryComponent`
- `employee_salary_components` -> `EmployeeSalaryComponent` (effective-dated assignments)
- `employee_bank_accounts` -> `EmployeeBankAccount` (effective-dated)
- `payroll_runs` -> existing `PayrollRun`
- `payroll_run_items` -> existing `PayrollEntry`
- `payslips` -> new `Payslip`
- `apit_tax_tables` -> `ApitTaxTable`

### Sri Lanka statutory logic

- EPF employee: `8%` of EPF/ETF eligible earnings
- EPF employer: `12%` of EPF/ETF eligible earnings
- ETF employer: `3%` of EPF/ETF eligible earnings
- APIT: table-driven using `ApitTaxTable` slabs (Table 01 seeded first)

EPF/ETF inclusion/exclusion is controlled by component flags:

- Include via `epfEtfEligible: true` (e.g., salary/wages, COLA, food allowance, commission, piece-rate/contract pay)
- Exclude via `epfEtfEligible: false` (e.g., overtime, reimbursements, incentives/bonuses)

### Run migration/seed for enterprise payroll

```bash
cd backend
npm run migrate:enterprise-payroll
```

### APIT table extension (Tables 02-08)

1. Insert/Upsert a new row in `ApitTaxTable` with:
   - `tableCode` (e.g. `TABLE_02`)
   - `effectiveFrom` / optional `effectiveTo`
   - `slabs` array (`minMonthlyIncome`, `maxMonthlyIncome`, `fixedTax`, `ratePercent`)
2. Keep old tables with `effectiveTo` for historical calculation integrity.
3. Pass `apitTableCode` to enterprise payslip calculation endpoint.

### Enterprise endpoints

- `GET /api/v1/payroll/components`
- `POST /api/v1/payroll/components`
- `GET /api/v1/payroll/apit/:tableCode`
- `POST /api/v1/payroll/enterprise/calculate-payslip`
- `GET /api/v1/employees/:employeeId/compensation/components`
- `POST /api/v1/employees/:employeeId/compensation/components`
- `PATCH /api/v1/employees/compensation/components/:assignmentId`
- `GET /api/v1/employees/:employeeId/bank-accounts`
- `POST /api/v1/employees/:employeeId/bank-accounts`
- `PATCH /api/v1/employees/bank-accounts/:bankAccountId`

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login with email and password

### Employees
- `GET /api/v1/employees` - Get all employees (with filters)
- `GET /api/v1/employees/:id` - Get employee by ID
- `POST /api/v1/employees` - Create new employee
- `PATCH /api/v1/employees/:id` - Update employee

### Payroll
- `GET /api/v1/payroll/runs` - Get all payroll runs
- `GET /api/v1/payroll/runs/:id` - Get payroll run by ID
- `POST /api/v1/payroll/runs` - Create new payroll run
- `POST /api/v1/payroll/runs/:id/calculate` - Calculate payroll
- `POST /api/v1/payroll/runs/:id/approve/hr` - HR approval
- `POST /api/v1/payroll/runs/:id/approve/finance` - Finance approval
- `POST /api/v1/payroll/runs/:id/finalize` - Finalize payroll
- `GET /api/v1/payroll/runs/:id/entries` - Get payroll entries

### Leave
- `GET /api/v1/leave/requests` - Get all leave requests
- `GET /api/v1/leave/requests/:id` - Get leave request by ID
- `POST /api/v1/leave/requests` - Create leave request
- `POST /api/v1/leave/requests/:id/approve` - Approve leave
- `POST /api/v1/leave/requests/:id/reject` - Reject leave

### Recruitment
- `GET /api/v1/recruitment/requisitions` - Get all requisitions
- `GET /api/v1/recruitment/requisitions/:id` - Get requisition by ID
- `GET /api/v1/recruitment/public/requisitions/:id` - Public job posting
- `POST /api/v1/recruitment/requisitions` - Create requisition
- `PATCH /api/v1/recruitment/requisitions/:id/status` - Update status
- `GET /api/v1/recruitment/candidates` - Get candidates
- `POST /api/v1/recruitment/public/applications` - Submit application

### Logs
- `GET /api/v1/logs` - Get audit logs (Admin only)
- `POST /api/v1/logs/export` - Export logs

## Architecture

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Module Structure

Each module follows this structure:
- `*.model.ts` - Mongoose schema
- `*.controller.ts` - Request handlers
- `*.routes.ts` - Route definitions
- `*.service.ts` - Business logic (where applicable)

## Business Logic

### Payroll Calculations
- EPF: Employee 8%, Employer 12%
- ETF: Employer 3%
- Tax: Progressive brackets (Sri Lanka)
- Configurable rates (should be moved to system_config)

### Leave Accrual
- Monthly accrual based on entitlement
- Balance = accruals - taken + carryForward - encashed

### Recruitment Workflow
- DRAFT → MANAGER_APPROVED → FINANCE_APPROVED → HR_APPROVED → PUBLISHED
- Budget hold flag set on manager approval

## Next Steps

1. Implement remaining modules (Performance, Learning, Workforce, Engagement, Compliance)
2. Add comprehensive validation
3. Implement file uploads for resumes/documents
4. Add background jobs for payroll processing
5. Implement export functionality
6. Add comprehensive error handling
7. Add unit and integration tests
