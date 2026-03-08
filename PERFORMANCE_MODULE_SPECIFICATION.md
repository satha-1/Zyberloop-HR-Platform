# Performance Management Module - Specification

## Overview

The Performance Management Module is a comprehensive system for managing employee performance through structured cycles, goal setting (OKRs), appraisals, 360-degree feedback, and bias detection. It provides a complete workflow from cycle creation to performance evaluation, with automated rating calculations, merit matrix integration, and fairness monitoring.

### Key Entities

1. **Performance Cycle**: A time-bound period (e.g., Q1 2024, Annual 2024) during which performance is evaluated. Cycles have statuses: DRAFT, ACTIVE, CLOSED, ARCHIVED.
2. **Goal (OKR)**: Objectives and Key Results that employees or teams work towards. Goals can be individual or team-based, with progress tracking and status indicators.
3. **Rating Formula**: Configurable formula that calculates final performance ratings using weighted components (manager score, OKR achievement, peer feedback).
4. **Merit Matrix**: Defines salary increase bands based on performance ratings, with approval chain configuration.
5. **Appraisal**: Performance evaluation record for an employee in a cycle, containing manager scores, OKR achievement, peer feedback, and calculated final rating.
6. **360 Feedback Template**: Reusable questionnaire templates for 360-degree feedback with sections and questions (Likert scale or text).
7. **360 Assignment**: Assignment of a 360 feedback template to an employee, with multiple raters (manager, peers, direct reports).
8. **360 Response**: Individual feedback responses from raters, collected via token-based links.
9. **Bias Flag**: Automated detection of potential bias in performance ratings (manager outliers, group gaps, distribution anomalies).

## Module Structure

### 1. Dashboard (`/performance`)
- **Purpose**: Overview of performance management system status and quick actions
- **Features**:
  - Active cycle selector and status
  - Statistics cards: Active goals, appraisals in progress, 360 assignments, bias flags
  - Quick action buttons: Create cycle, Generate appraisals, Run bias detection
  - Cycle status summary (Draft, Active, Closed, Archived)
  - Empty state with CTAs when no cycles exist

### 2. Performance Cycles

#### 2.1 Cycle List (`/performance/cycles`)
- **Features**:
  - Table view with columns: Name, Start Date, End Date, Status, Created Date
  - Search by cycle name
  - Filter by status (Draft, Active, Closed, Archived)
  - Actions: View, Edit, Activate, Archive
  - Pagination support
  - Empty and error states

#### 2.2 Create Cycle (`/performance/cycles/new`)
- **Features**:
  - Form fields:
    - Name (required, unique)
    - Start Date (required)
    - End Date (required, must be after start date)
    - Status (default: DRAFT)
  - Validation:
    - Required fields validation
    - Date range validation
    - Unique name validation
  - Success redirect to cycle detail

#### 2.3 Edit Cycle (`/performance/cycles/:id/edit`)
- **Features**:
  - Same form as create, pre-filled with existing data
  - Update API call
  - Status change restrictions (cannot change status from CLOSED/ARCHIVED to ACTIVE)
  - Success redirect to cycle detail

#### 2.4 Cycle Detail (`/performance/cycles/:id`)
- **Features**:
  - Read-only view of cycle information
  - Tabs for: Goals, Appraisals, 360 Feedback, Bias Detection
  - Actions: Edit, Activate, Close, Archive
  - Statistics: Goal count, Appraisal count, Completion rate

### 3. Goals (OKRs)

#### 3.1 Goal List (`/performance/cycles/:cycleId/goals`)
- **Features**:
  - Table view with columns: Title, Owner (Employee/Team), Type, Weight, Progress, Status, Actions
  - Search by goal title or owner
  - Filter by:
    - Owner type (Individual, Team)
    - Status (On Track, Ahead, At Risk, Off Track)
    - Suggestion status (Pending, Accepted, Rejected)
  - Group by owner or parent goal
  - Actions: View, Edit, Update Progress, Delete, Accept/Reject Suggestion
  - Progress bars and status badges
  - Hierarchical view for cascaded goals

#### 3.2 Create Goal (`/performance/cycles/:cycleId/goals/new`)
- **Features**:
  - Form fields:
    - Title (required)
    - Description (optional)
    - Owner Type (required: Individual or Team)
    - Owner (required: Employee or Team selection)
    - Weight (required, 0-100, must sum to 100 for owner)
    - Parent Goal (optional, for cascading)
    - Is Suggested (checkbox, for AI/manager suggestions)
  - Validation:
    - Required fields validation
    - Weight sum validation per owner
    - Parent goal validation (must be in same cycle)
  - Success redirect to goal list

#### 3.3 Edit Goal (`/performance/cycles/:cycleId/goals/:id/edit`)
- **Features**:
  - Same form as create, pre-filled with existing data
  - Update API call
  - Progress update section
  - Status update dropdown
  - Success redirect to goal detail

#### 3.4 Goal Detail (`/performance/cycles/:cycleId/goals/:id`)
- **Features**:
  - Read-only view of goal information
  - Progress history timeline
  - Child goals (if parent)
  - Suggestion status and actions
  - Actions: Edit, Update Progress, Delete, Accept/Reject Suggestion

#### 3.5 Update Goal Progress (`/performance/cycles/:cycleId/goals/:id/progress`)
- **Features**:
  - Progress percentage input (0-100)
  - Status update (On Track, Ahead, At Risk, Off Track)
  - Notes/comment field
  - Auto-calculation based on child goals (if parent)
  - Success notification

#### 3.6 Cascade Goals (`/performance/cycles/:cycleId/goals/cascade`)
- **Features**:
  - Select parent goal
  - Select target employees or teams
  - Auto-create child goals with same structure
  - Weight distribution options
  - Preview before creation
  - Batch creation with progress indicator

### 4. Rating Formula Configuration

#### 4.1 View/Edit Formula (`/performance/cycles/:cycleId/rating-formula`)
- **Features**:
  - Display current formula configuration
  - Form fields:
    - Manager Weight (required, 0-1, default: 0.5)
    - OKR Weight (required, 0-1, default: 0.3)
    - Peer Feedback Weight (required, 0-1, default: 0.2)
    - Scale (default: 5)
    - OKR Mapping:
      - Type (LINEAR)
      - Min Percentage (default: 0)
      - Max Percentage (default: 100)
    - Version Number (auto-incremented on save)
  - Validation:
    - Weights must sum to 1.0
    - Scale must be positive
    - OKR mapping range validation
  - Formula preview: `Final Rating = (Manager × W1) + (OKR × W2) + (Peer × W3)`
  - Version history display
  - Success notification

### 5. Merit Matrix

#### 5.1 View/Edit Merit Matrix (`/performance/cycles/:cycleId/merit-matrix`)
- **Features**:
  - Display current merit matrix configuration
  - Form fields:
    - Bands (array):
      - Name (required)
      - Min Rating (required, 0-5)
      - Max Rating (required, 0-5)
      - Min Increase % (required, >= 0)
      - Max Increase % (required, >= 0)
    - Approval Chain (array of role names)
  - Add/Remove band functionality
  - Validation:
    - Rating ranges must not overlap
    - Min rating <= Max rating
    - Min increase <= Max increase
    - Complete coverage of rating scale (0-5)
  - Visual band display
  - Success notification

### 6. Appraisals

#### 6.1 Appraisal List (`/performance/cycles/:cycleId/appraisals`)
- **Features**:
  - Table view with columns: Employee, Manager, Status, Manager Score, OKR %, Peer Score, Final Rating, Actions
  - Search by employee name or code
  - Filter by:
    - Status (Draft, In Progress, Submitted, Completed, Calibrated, Approved)
    - Manager
    - Rating range
  - Sort by final rating, employee name, status
  - Status badges with color coding
  - Actions: View, Edit, Submit (Manager/Employee), Approve
  - Export to CSV/PDF

#### 6.2 Generate Appraisals (`/performance/cycles/:cycleId/appraisals/generate`)
- **Features**:
  - Select employees (all active or specific selection)
  - Preview count
  - Auto-populate:
    - Manager from employee hierarchy
    - OKR achievement from goals
    - Peer feedback from 360 assignments (if available)
  - Generate button with confirmation
  - Progress indicator for batch creation
  - Success notification with count

#### 6.3 Appraisal Detail (`/performance/appraisals/:id`)
- **Features**:
  - Header: Employee name, Manager, Status, Cycle
  - Tabs:
    - **Overview**: Final rating, component scores, formula breakdown
    - **Self Assessment**: Employee's self-assessment text (if submitted)
    - **Manager Assessment**: Manager's assessment text
    - **Goals**: Linked goals with achievement percentages
    - **360 Feedback**: Aggregated peer feedback scores
    - **Approvals**: Approval chain status
  - Actions:
    - Edit (if status allows)
    - Submit by Employee
    - Submit by Manager
    - Approve (HR/Admin only)
  - Rating visualization (bars, charts)
  - Read-only mode for employees (their own appraisals)

#### 6.4 Edit Appraisal (`/performance/appraisals/:id/edit`)
- **Features**:
  - Form fields:
    - Manager Score (0-5, required)
    - Manager Assessment Text (optional, rich text)
    - OKR Achievement % (0-100, auto-calculated from goals, editable)
    - Peer Feedback Score (0-5, auto-calculated from 360, editable)
    - Self Assessment Text (employee-only, optional)
  - Auto-calculation of final rating using formula
  - Formula version display
  - Validation:
    - Score ranges
    - Required fields based on status
  - Save as draft or submit
  - Success redirect to appraisal detail

#### 6.5 Submit Appraisal
- **Features**:
  - **Employee Submit**: Submit self-assessment, lock employee fields
  - **Manager Submit**: Submit manager assessment and scores, lock manager fields
  - **Approve**: Final approval by HR/Admin, triggers merit matrix lookup
  - Status transitions with notifications
  - Confirmation dialogs

### 7. 360-Degree Feedback

#### 7.1 360 Templates

##### 7.1.1 Template List (`/performance/cycles/:cycleId/360/templates`)
- **Features**:
  - Table view with columns: Name, Reusable, Sections Count, Questions Count, Created Date
  - Filter by reusable status
  - Search by template name
  - Actions: View, Edit, Duplicate, Delete
  - Empty state with CTA

##### 7.1.2 Create Template (`/performance/cycles/:cycleId/360/templates/new`)
- **Features**:
  - Form fields:
    - Name (required)
    - Reusable (checkbox, default: false)
    - Sections (array):
      - Title (required)
      - Questions (array):
        - ID (auto-generated or manual)
        - Type (LIKERT or TEXT, required)
        - Prompt (required)
        - Required (checkbox)
        - Scale Min/Max (for LIKERT, default: 1-5)
    - Settings:
      - Anonymous (checkbox, default: true)
      - Min Responses to Show (default: 3)
  - Add/Remove sections and questions
  - Preview mode
  - Validation:
    - At least one section required
    - At least one question per section
    - Required fields validation
  - Success redirect to template list

##### 7.1.3 Edit Template (`/performance/cycles/:cycleId/360/templates/:id/edit`)
- **Features**:
  - Same form as create, pre-filled
  - Update API call
  - Success redirect to template detail

##### 7.1.4 Template Detail (`/performance/cycles/:cycleId/360/templates/:id`)
- **Features**:
  - Read-only view of template structure
  - Preview of form as raters will see it
  - Actions: Edit, Duplicate, Delete

#### 7.2 360 Assignments

##### 7.2.1 Assignment List (`/performance/cycles/:cycleId/360/assignments`)
- **Features**:
  - Table view with columns: Employee, Template, Status, Responses (Collected/Required), Deadline, Actions
  - Filter by status (Not Started, Sent, In Progress, Completed, Locked)
  - Search by employee name
  - Actions: View, Edit, Send Invites, View Aggregate, Sync to Appraisals
  - Progress indicators
  - Status badges

##### 7.2.2 Generate Assignments (`/performance/cycles/:cycleId/360/assignments/generate`)
- **Features**:
  - Select template (required)
  - Select target employees (required)
  - Configure raters:
    - Manager (auto-selected, required)
    - Peers (select from employees, min count)
    - Direct Reports (auto-selected if available)
    - Self (optional)
  - Required responses count (default: min responses to show from template)
  - Deadline (optional)
  - Preview assignment count
  - Generate button with confirmation
  - Success notification

##### 7.2.3 Assignment Detail (`/performance/360/assignments/:id`)
- **Features**:
  - Header: Employee, Template, Status, Deadline
  - Rater list with status:
    - Name, Email, Role Type, Status (Sent, Opened, Submitted)
    - Resend invite option
  - Response count: Collected / Required
  - Actions:
    - Edit (add/remove raters)
    - Send Invites (email with token links)
    - View Aggregate (if min responses met)
    - Sync to Appraisals (update peer feedback score)
  - Response timeline

##### 7.2.4 Send 360 Invites (`/performance/360/assignments/:id/send`)
- **Features**:
  - Select raters to send invites to
  - Preview email content
  - Send button with confirmation
  - Progress indicator
  - Success notification with count
  - Email contains unique token link

#### 7.3 360 Response Form (Public Token-Based)

##### 7.3.1 Response Form (`/performance/360/respond/:token`)
- **Features**:
  - Public endpoint (no authentication required)
  - Token validation
  - Display template sections and questions
  - Form fields based on question type:
    - LIKERT: Radio buttons or slider (scale min-max)
    - TEXT: Textarea
  - Required field validation
  - Save draft functionality
  - Submit button
  - Success message with thank you
  - Auto-redirect after submission

##### 7.3.2 View Aggregate (`/performance/360/assignments/:id/aggregate`)
- **Features**:
  - Display aggregated results:
    - Average scores per question (for LIKERT)
    - Text responses (if not anonymous, or if anonymous with min responses)
  - Group by rater type (Manager, Peer, Direct Report)
  - Charts and visualizations
  - Export to PDF
  - Read-only view

### 8. Bias Detection

#### 8.1 Bias Summary (`/performance/cycles/:cycleId/bias/summary`)
- **Features**:
  - Overview dashboard:
    - Total flags count by type
    - Flags by status
    - Distribution charts
    - Manager outlier count
    - Group gap count
    - Distribution anomaly count
  - Quick actions: Run Detection, View All Flags

#### 8.2 Bias Flags List (`/performance/cycles/:cycleId/bias/flags`)
- **Features**:
  - Table view with columns: Type, Subject, Metric, Value, Threshold, Baseline, Status, Created Date, Actions
  - Filter by:
    - Type (Manager Outlier, Group Gap, Distribution Anomaly)
    - Status (Open, Reviewed, Dismissed, Actioned)
  - Search by subject (employee/manager name)
  - Status badges with color coding
  - Actions: View Detail, Update Status, Dismiss, Mark as Actioned
  - Export to CSV

#### 8.3 Run Bias Detection (`/performance/cycles/:cycleId/bias/run`)
- **Features**:
  - Confirmation dialog
  - Progress indicator
  - Detection algorithms:
    - **Manager Outlier**: Managers with significantly different average ratings
    - **Group Gap**: Rating differences between demographic groups
    - **Distribution Anomaly**: Unusual rating distributions (e.g., too many high ratings)
  - Results summary
  - Auto-create flags for detected issues
  - Success notification with flag count

#### 8.4 Bias Flag Detail (`/performance/bias/flags/:id`)
- **Features**:
  - Read-only view of flag information:
    - Type, Subject, Metric details
    - Value vs Threshold vs Baseline comparison
    - Context and explanation
  - Status update dropdown
  - Notes field
  - Actions: Update Status, Dismiss, Mark as Actioned
  - Related appraisals/employees links

### 9. Shared Components

- **Layout**: Uses existing MainLayout with sidebar navigation
- **UI Components**: Buttons, Inputs, Selects, Tables, Cards, Dialogs, Badges, Alerts, Progress Bars, Tabs
- **State Management**: React hooks (useState, useEffect, useCallback)
- **API Integration**: Centralized API client with error handling
- **Notifications**: Toast notifications for success/error states
- **Loading States**: Skeletons and spinners
- **Error States**: Retry buttons and error messages
- **Empty States**: CTAs and helpful messages
- **Charts**: Rating visualizations, progress bars, distribution charts

## API Endpoints

### Cycles
- `GET /api/v1/performance/cycles` - List cycles (with filters)
- `GET /api/v1/performance/cycles/:id` - Get cycle by ID
- `POST /api/v1/performance/cycles` - Create cycle (Admin/HR Admin/HRBP)
- `PATCH /api/v1/performance/cycles/:id` - Update cycle (Admin/HR Admin/HRBP)

### Goals
- `GET /api/v1/performance/cycles/:cycleId/goals` - List goals (with filters)
- `POST /api/v1/performance/cycles/:cycleId/goals` - Create goal
- `PATCH /api/v1/performance/goals/:id` - Update goal
- `DELETE /api/v1/performance/goals/:id` - Delete goal (Admin/HR Admin/HRBP/Manager)
- `POST /api/v1/performance/goals/:id/progress` - Update goal progress
- `POST /api/v1/performance/cycles/:cycleId/goals/cascade` - Cascade goals (Admin/HR Admin/HRBP/Manager)
- `POST /api/v1/performance/goals/:id/accept-suggestion` - Accept goal suggestion
- `POST /api/v1/performance/goals/:id/reject-suggestion` - Reject goal suggestion

### Rating Formula
- `GET /api/v1/performance/cycles/:cycleId/rating-formula` - Get rating formula
- `PUT /api/v1/performance/cycles/:cycleId/rating-formula` - Upsert rating formula (Admin/HR Admin)

### Merit Matrix
- `GET /api/v1/performance/cycles/:cycleId/merit-matrix` - Get merit matrix
- `PUT /api/v1/performance/cycles/:cycleId/merit-matrix` - Upsert merit matrix (Admin/HR Admin)

### Appraisals
- `GET /api/v1/performance/cycles/:cycleId/appraisals` - List appraisals (with filters, Admin/HR Admin/HRBP/Manager)
- `GET /api/v1/performance/appraisals/:id` - Get appraisal by ID
- `POST /api/v1/performance/cycles/:cycleId/appraisals/generate` - Generate appraisals (Admin/HR Admin/HRBP)
- `PATCH /api/v1/performance/appraisals/:id` - Update appraisal
- `POST /api/v1/performance/appraisals/:id/submit-manager` - Submit by manager (Admin/HR Admin/Manager)
- `POST /api/v1/performance/appraisals/:id/submit-employee` - Submit by employee
- `POST /api/v1/performance/appraisals/:id/approve` - Approve appraisal (Admin/HR Admin/HRBP)

### 360 Feedback Templates
- `GET /api/v1/performance/cycles/:cycleId/360/templates` - List templates
- `GET /api/v1/performance/360/templates/:id` - Get template by ID
- `POST /api/v1/performance/cycles/:cycleId/360/templates` - Create template (Admin/HR Admin/HRBP)
- `PATCH /api/v1/performance/360/templates/:id` - Update template (Admin/HR Admin/HRBP)

### 360 Assignments
- `GET /api/v1/performance/cycles/:cycleId/360/assignments` - List assignments
- `GET /api/v1/performance/360/assignments/:id` - Get assignment by ID
- `POST /api/v1/performance/cycles/:cycleId/360/assignments/generate` - Generate assignments (Admin/HR Admin/HRBP)
- `PATCH /api/v1/performance/360/assignments/:id` - Update assignment (Admin/HR Admin/HRBP/Manager)
- `POST /api/v1/performance/360/assignments/:id/send` - Send invites (Admin/HR Admin/HRBP)
- `GET /api/v1/performance/360/assignments/:id/aggregate` - Get aggregate results
- `POST /api/v1/performance/cycles/:cycleId/360/sync-to-appraisals` - Sync 360 to appraisals (Admin/HR Admin/HRBP)

### 360 Responses (Public)
- `GET /api/v1/performance/360/respond/:token` - Get response form by token (public, no auth)
- `POST /api/v1/performance/360/respond/:token/opened` - Mark form as opened (public)
- `POST /api/v1/performance/360/respond/:token/submit` - Submit response (public)

### Bias Detection
- `GET /api/v1/performance/cycles/:cycleId/bias/summary` - Get bias summary (Admin/HR Admin/HRBP)
- `GET /api/v1/performance/cycles/:cycleId/bias/flags` - List bias flags (Admin/HR Admin/HRBP)
- `POST /api/v1/performance/cycles/:cycleId/bias/run` - Run bias detection (Admin/HR Admin/HRBP)
- `PATCH /api/v1/performance/bias/flags/:id` - Update bias flag status (Admin/HR Admin/HRBP)

## Data Models

See `backend/src/modules/performance/performance.model.ts` for complete TypeScript/Mongoose definitions.

### Key Type Definitions

- **CycleStatus**: `'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'`
- **GoalOwnerType**: `'TEAM' | 'INDIVIDUAL'`
- **GoalStatus**: `'ON_TRACK' | 'AHEAD' | 'AT_RISK' | 'OFF_TRACK'`
- **SuggestionStatus**: `'PENDING' | 'ACCEPTED' | 'REJECTED'`
- **AppraisalStatus**: `'DRAFT' | 'IN_PROGRESS' | 'SUBMITTED_BY_EMPLOYEE' | 'SUBMITTED_BY_MANAGER' | 'COMPLETED' | 'CALIBRATED' | 'APPROVED'`
- **ApprovalStatus**: `'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED'`
- **FeedbackAssignmentStatus**: `'NOT_STARTED' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED'`
- **FeedbackRaterStatus**: `'SENT' | 'OPENED' | 'SUBMITTED'`
- **FeedbackResponseStatus**: `'DRAFT' | 'SUBMITTED'`
- **BiasFlagType**: `'MANAGER_OUTLIER' | 'GROUP_GAP' | 'DISTRIBUTION_ANOMALY'`
- **BiasFlagStatus**: `'OPEN' | 'REVIEWED' | 'DISMISSED' | 'ACTIONED'`

## Business Rules

### Rating Formula Calculation
- Final Rating = (Manager Score × Manager Weight) + (OKR Score × OKR Weight) + (Peer Feedback Score × Peer Weight)
- OKR Score is calculated from OKR Achievement % using linear mapping
- Weights must sum to 1.0
- All scores normalized to 0-5 scale

### Goal Weight Validation
- Sum of weights for all goals owned by the same entity (employee/team) must equal 100
- Parent goal weight should equal sum of child goal weights

### Appraisal Workflow
1. **DRAFT**: Initial creation, editable by manager
2. **IN_PROGRESS**: Employee or manager has started filling
3. **SUBMITTED_BY_EMPLOYEE**: Employee submitted self-assessment
4. **SUBMITTED_BY_MANAGER**: Manager submitted assessment and scores
5. **COMPLETED**: Both submissions received, final rating calculated
6. **CALIBRATED**: HR has reviewed and calibrated ratings
7. **APPROVED**: Final approval, can trigger merit matrix lookup

### 360 Feedback Rules
- Minimum responses required before showing aggregate (configurable, default: 3)
- Anonymous mode: Individual responses not shown, only aggregate
- Token-based access: Each rater gets unique token link
- Deadline enforcement: Responses locked after deadline

### Bias Detection Thresholds
- **Manager Outlier**: Manager's average rating differs by >2 standard deviations from organization average
- **Group Gap**: Rating difference between groups >0.5 points
- **Distribution Anomaly**: >80% of ratings in top 2 bands (e.g., 4.0-5.0)

## Implementation Notes

- **No Mock Data**: All data comes from API calls
- **Type Safety**: Full TypeScript types for all entities
- **Responsive Design**: Mobile-friendly layouts
- **Accessibility**: Proper labels, ARIA attributes, keyboard navigation
- **Error Handling**: Comprehensive error states and user feedback
- **Loading States**: Skeleton loaders and spinners
- **Validation**: Client-side validation with clear error messages
- **Routing**: Next.js App Router file-based routing
- **Role-Based Access**: Different views and actions based on user role
- **Real-Time Updates**: Polling or WebSocket for status changes (optional enhancement)
- **Email Integration**: Send 360 invites via email service
- **Token Security**: Secure token generation and validation for 360 responses

## File Structure

```
frontend/src/app/(main)/performance/
├── page.tsx                    # Dashboard with tabs
├── cycles/
│   ├── page.tsx                # Cycle list
│   ├── new/
│   │   └── page.tsx            # Create cycle
│   └── [id]/
│       ├── page.tsx            # Cycle detail
│       └── edit/
│           └── page.tsx        # Edit cycle
├── goals/
│   ├── page.tsx                # Goal list (with cycle context)
│   ├── new/
│   │   └── page.tsx            # Create goal
│   └── [id]/
│       ├── page.tsx            # Goal detail
│       └── edit/
│           └── page.tsx        # Edit goal
├── appraisals/
│   ├── page.tsx                # Appraisal list
│   ├── [id]/
│   │   ├── page.tsx            # Appraisal detail
│   │   └── edit/
│   │       └── page.tsx        # Edit appraisal
│   └── generate/
│       └── page.tsx            # Generate appraisals
├── 360/
│   ├── templates/
│   │   ├── page.tsx            # Template list
│   │   ├── new/
│   │   │   └── page.tsx        # Create template
│   │   └── [id]/
│   │       ├── page.tsx        # Template detail
│   │       └── edit/
│   │           └── page.tsx   # Edit template
│   ├── assignments/
│   │   ├── page.tsx            # Assignment list
│   │   ├── [id]/
│   │   │   └── page.tsx        # Assignment detail
│   │   └── generate/
│   │       └── page.tsx        # Generate assignments
│   └── respond/
│       └── [token]/
│           └── page.tsx        # Public response form
├── bias/
│   ├── page.tsx                # Bias summary
│   ├── flags/
│   │   ├── page.tsx            # Flag list
│   │   └── [id]/
│   │       └── page.tsx        # Flag detail
│   └── run/
│       └── page.tsx            # Run detection
├── rating-formula/
│   └── page.tsx                # Rating formula config
└── merit-matrix/
    └── page.tsx                # Merit matrix config

frontend/src/app/lib/
├── types/
│   └── performance.ts          # TypeScript type definitions
└── api.ts                      # API client methods (performance section)
```

## Future Enhancements

1. **AI-Powered Goal Suggestions**: ML-based goal recommendations
2. **Continuous Feedback**: Real-time feedback outside of cycles
3. **Calibration Sessions**: Manager calibration tools and meetings
4. **Performance Analytics**: Advanced dashboards and insights
5. **Integration with Learning Module**: Link performance goals to learning paths
6. **Mobile App**: Native mobile app for goal tracking and 360 responses
7. **Notifications**: Email and in-app notifications for deadlines and status changes
8. **Export/Reporting**: Comprehensive performance reports and analytics exports
