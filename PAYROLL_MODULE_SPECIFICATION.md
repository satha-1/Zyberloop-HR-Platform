# Payroll Management Module - Specification

## Overview

The Payroll Management Module is a comprehensive system for managing payroll templates and processing payroll runs. It provides a complete workflow from template creation to payroll execution, with full CRUD operations, validation, and reporting capabilities.

### Key Entities

1. **Payroll Template**: Defines how payroll is calculated, including pay items (earnings, deductions, benefits), tax configuration, and pay frequency settings.
2. **Payroll Run**: A specific instance of running payroll for a period using a template, containing employee lines with calculated amounts.
3. **Pay Item**: Individual components of payroll (e.g., Basic Salary, EPF, Tax) with calculation rules (flat amount or percentage).
4. **Tax Configuration**: Country-specific tax settings including tax year and progressive tax rules.

## Module Structure

### 1. Dashboard (`/payroll`)
- **Purpose**: Overview of payroll system status and quick actions
- **Features**:
  - Statistics cards: Active employees, template count, total runs, latest period net
  - Payroll run status summary (Draft, In Progress, Completed, Locked)
  - Quick action buttons
  - Latest period information alert
  - Empty state with CTAs when no data exists

### 2. Payroll Templates

#### 2.1 Template List (`/payroll/templates`)
- **Features**:
  - Table view with columns: Name, Pay Frequency, Currency, Active status, Effective dates, Last Updated
  - Search by template name
  - Filter by frequency (monthly/biweekly/weekly) and active status
  - Actions: View, Edit, Duplicate, Delete
  - Pagination support
  - Empty and error states

#### 2.2 Create Template (`/payroll/templates/new`)
- **Features**:
  - Multi-section form:
    - **Basic Info**: Name (required), Description, Currency (required), Pay Frequency (required), Effective dates (from required), Active toggle
    - **Default Pay Items**: Table with add/edit/delete functionality
      - Pay item dialog with fields: Code, Label, Type (earning/deduction/benefit), Calculation Type (flat/percentage), Amount/Percentage, Applies To, Taxable flag, Default flag
    - **Tax Settings**: Country, Tax Year, Progressive Tax checkbox, Notes
  - Validation:
    - Required fields validation
    - Pay item calculation validation (amount for flat, percentage for percentage)
    - Form submission validation
  - Success redirect to template list

#### 2.3 Edit Template (`/payroll/templates/:id/edit`)
- **Features**:
  - Same form as create, pre-filled with existing data
  - Update API call
  - Success redirect to template detail

#### 2.4 Template Detail (`/payroll/templates/:id`)
- **Features**:
  - Read-only view of all template information
  - Actions: Edit, Duplicate, Delete (with confirmation)
  - Display: Basic info, Pay items table, Tax config

### 3. Payroll Runs

#### 3.1 Run List (`/payroll/runs`)
- **Features**:
  - Table with columns: Run Name, Template Name, Period (Start/End), Payment Date, Status, Employee Count, Total Gross, Total Net
  - Filters: Status, Template, Date range
  - Search by run name
  - Actions: View, Edit (if allowed), Delete, Lock
  - Status badges with color coding

#### 3.2 Create Payroll Run (`/payroll/runs/new`)
- **Features**:
  - Multi-step wizard or single page:
    - **Step 1 - Basic Info**:
      - Template selection (dropdown)
      - Run Name (required)
      - Period Start/End (required)
      - Payment Date (required)
      - Notes (optional)
    - **Step 2 - Employees & Calculations**:
      - Table of employees with preview calculations
      - Columns: Employee Name, Base Salary, Gross, Deductions, Net
      - Option to edit pay items per employee (drawer/modal)
      - Preview totals
    - **Step 3 - Review & Confirm**:
      - Summary totals
      - Employee count
      - Total gross, deductions, net
      - Confirm button
  - Validation at each step
  - Preview API call before final submission
  - Success redirect to run detail

#### 3.3 Edit Payroll Run (`/payroll/runs/:id/edit`)
- **Features**:
  - Similar to create but pre-filled
  - Disabled fields if run is locked/completed
  - Update API call
  - Success redirect to run detail

#### 3.4 Payroll Run Detail (`/payroll/runs/:id`)
- **Features**:
  - Header: Run Name, Status badge, Template link, Period, Payment Date
  - Summary cards: Employee count, Total gross, Total deductions, Total net
  - Tabs:
    - **Employees Tab**: Table with employee lines, click to view breakdown
    - **Summary Tab**: Totals by pay item (aggregated)
  - Actions:
    - Edit (if status allows)
    - Recalculate
    - Lock (changes status to locked)
    - Export (PDF/CSV)

### 4. Shared Components

- **Layout**: Uses existing MainLayout with sidebar navigation
- **UI Components**: Buttons, Inputs, Selects, Tables, Cards, Dialogs, Badges, Alerts
- **State Management**: React hooks (useState, useEffect)
- **API Integration**: Centralized API client with error handling
- **Notifications**: Toast notifications for success/error states
- **Loading States**: Skeletons and spinners
- **Error States**: Retry buttons and error messages
- **Empty States**: CTAs and helpful messages

## API Endpoints

### Templates
- `GET /api/v1/payroll/templates` - List templates (with filters)
- `GET /api/v1/payroll/templates/:id` - Get template by ID
- `POST /api/v1/payroll/templates` - Create template
- `PUT /api/v1/payroll/templates/:id` - Update template
- `DELETE /api/v1/payroll/templates/:id` - Delete template
- `POST /api/v1/payroll/templates/:id/duplicate` - Duplicate template

### Runs
- `GET /api/v1/payroll/runs` - List runs (with filters)
- `GET /api/v1/payroll/runs/:id` - Get run by ID
- `POST /api/v1/payroll/runs` - Create run
- `PUT /api/v1/payroll/runs/:id` - Update run
- `DELETE /api/v1/payroll/runs/:id` - Delete run
- `POST /api/v1/payroll/runs/:id/lock` - Lock run
- `POST /api/v1/payroll/runs/:id/recalculate` - Recalculate run
- `POST /api/v1/payroll/runs/preview` - Preview run calculations
- `GET /api/v1/payroll/runs/:id/export?format=pdf|csv` - Export run

### Dashboard
- `GET /api/v1/payroll/stats` - Get dashboard statistics

## Data Models

See `frontend/src/app/lib/types/payroll.ts` for complete TypeScript definitions.

## Implementation Notes

- **No Mock Data**: All data comes from API calls
- **Type Safety**: Full TypeScript types for all entities
- **Responsive Design**: Mobile-friendly layouts
- **Accessibility**: Proper labels, ARIA attributes, keyboard navigation
- **Error Handling**: Comprehensive error states and user feedback
- **Loading States**: Skeleton loaders and spinners
- **Validation**: Client-side validation with clear error messages
- **Routing**: Next.js App Router file-based routing

## File Structure

```
frontend/src/app/(main)/payroll/
├── page.tsx                    # Dashboard
├── templates/
│   ├── page.tsx               # Template list
│   ├── new/
│   │   └── page.tsx           # Create template
│   ├── [id]/
│   │   └── page.tsx           # Template detail
│   └── [id]/
│       └── edit/
│           └── page.tsx       # Edit template
└── runs/
    ├── page.tsx               # Run list
    ├── new/
    │   └── page.tsx           # Create run
    ├── [id]/
    │   └── page.tsx           # Run detail
    └── [id]/
        └── edit/
            └── page.tsx       # Edit run

frontend/src/app/lib/
├── types/
│   └── payroll.ts            # TypeScript type definitions
└── api.ts                     # API client methods (payroll section)
```
