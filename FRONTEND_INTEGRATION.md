# Frontend Integration Guide

## Overview

The frontend has been partially updated to use real API calls. Here's what needs to be completed:

## Completed

✅ API client utilities (`frontend/src/app/lib/api.ts`)
✅ React hooks for data fetching (`frontend/src/app/lib/hooks.ts`)
✅ Dashboard page updated
✅ Employees page updated

## Remaining Work

### Pages to Update

1. **Employees Detail Page** (`frontend/src/app/(main)/employees/[id]/page.tsx`)
   - Replace `mockEmployees.find()` with `api.getEmployeeById()`

2. **Payroll Pages**
   - `frontend/src/app/(main)/payroll/page.tsx` - Use `usePayrollRuns()` hook
   - `frontend/src/app/(main)/payroll/[id]/page.tsx` - Use `api.getPayrollRunById()` and `api.getPayrollEntries()`

3. **Leave Page** (`frontend/src/app/(main)/leave/page.tsx`)
   - Replace `mockLeaveRequests` with `useLeaveRequests()` hook
   - Update approve/reject handlers to use `api.approveLeaveRequest()` / `api.rejectLeaveRequest()`

4. **Recruitment Page** (`frontend/src/app/(main)/recruitment/page.tsx`)
   - Replace `mockRequisitions` with `useRequisitions()` hook
   - Replace `mockCandidates` with `api.getCandidates()`

5. **Candidate Portal** (`frontend/src/app/portal/jobs/[requisitionId]/page.tsx`)
   - Use `api.getPublicRequisition()` instead of `mockRequisitions.find()`
   - Use `api.createCandidateApplication()` for form submission

6. **Admin Logs** (`frontend/src/app/(main)/admin/logs/page.tsx`)
   - Replace `mockAuditLogs` with `useLogs()` hook

7. **Other Pages** (Performance, Learning, Workforce, Engagement, Compliance)
   - These modules have stub backend endpoints
   - Create corresponding API methods in `api.ts`
   - Create hooks in `hooks.ts`
   - Update pages to use real data

## Environment Variable

Add to `.env.local` in the frontend root:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

## Authentication

The API client stores the JWT token in localStorage. You'll need to:

1. Create a login page that calls `api.login(email, password)`
2. Protect routes using the token
3. Handle token expiration and refresh

## Data Transformation

The backend returns data in a slightly different format than the mock data:
- `id` → `_id` (MongoDB ObjectId)
- `first_name` → `firstName` (camelCase)
- `employee_code` → `employeeCode`
- Department is populated as an object: `departmentId: { name, code }`

Update all pages to handle both formats or transform the data in the API client.

## Example: Updating a Page

```typescript
// Before (using mock data)
import { mockEmployees } from "../../data/mockData";
const employees = mockEmployees;

// After (using API)
import { useEmployees } from "../../lib/hooks";
const { data: employees, loading, error } = useEmployees();

// Handle loading and error states
if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
```

## Removing Mock Data

Once all pages are updated:
1. Delete `frontend/src/app/data/mockData.ts`
2. Remove all imports of `mockData`
3. Test all functionality

## Testing

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Login with seeded admin credentials
4. Test each module
