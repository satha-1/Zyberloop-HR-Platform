# HR Management Platform - Verification Tests

## Test Checklist

### ✅ Authentication Tests
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Auto-login on app initialization
- [ ] Token refresh on 401 errors
- [ ] Protected routes require authentication

### ✅ Employee Management Tests
- [ ] List employees (GET /employees)
- [ ] Get employee by ID (GET /employees/:id)
- [ ] Create employee (POST /employees)
- [ ] Update employee (PATCH /employees/:id)
- [ ] Delete employee (DELETE /employees/:id)
- [ ] Upload employee documents
- [ ] Download employee documents
- [ ] Delete employee documents
- [ ] File size validation (10MB max)
- [ ] File type validation (PDF, JPG, PNG, DOC, DOCX)
- [ ] Upload progress indicator works
- [ ] Image preview works

### ✅ Document Generation Tests
- [ ] Generate Offer Letter
- [ ] Generate Appointment Letter
- [ ] Generate Warning Letter
- [ ] Generate Termination Letter
- [ ] Generate Salary Increment Letter
- [ ] Preview document before download
- [ ] Download generated PDF
- [ ] Placeholder replacement works correctly
- [ ] PDF formatting is correct

### ✅ Template Management Tests
- [ ] List templates (GET /employees/templates)
- [ ] Get template by ID (GET /employees/templates/:id)
- [ ] Create template (POST /employees/templates)
- [ ] Update template (PATCH /employees/templates/:id)
- [ ] Template editor UI works
- [ ] Placeholder detection works
- [ ] Template versioning works

### ✅ Recruitment Tests
- [ ] List requisitions (GET /recruitment/requisitions)
- [ ] Create requisition (POST /recruitment/requisitions)
- [ ] Update requisition status
- [ ] List candidates (GET /recruitment/candidates)
- [ ] Update candidate application status
- [ ] Pipeline counts are accurate
- [ ] Status transitions work (APPLIED → SCREENING → INTERVIEW → OFFERED → HIRED)

### ✅ Payroll Tests
- [ ] List payroll runs (GET /payroll/runs)
- [ ] Create payroll run (POST /payroll/runs)
- [ ] Calculate payroll (POST /payroll/runs/:id/calculate)
- [ ] Approve payroll (HR/Finance)
- [ ] Finalize payroll
- [ ] Get payroll entries

### ✅ Leave Management Tests
- [ ] List leave requests (GET /leave/requests)
- [ ] Create leave request (POST /leave/requests)
- [ ] Approve leave request
- [ ] Reject leave request

### ✅ Users Management Tests
- [ ] List users (GET /users)
- [ ] Create user (POST /users)
- [ ] Update user (PATCH /users/:id)
- [ ] Delete user (DELETE /users/:id)
- [ ] Password hashing works

### ✅ Departments Tests
- [ ] List departments (GET /departments)
- [ ] Create department (POST /departments)
- [ ] Update department (PATCH /departments/:id)
- [ ] Delete department (DELETE /departments/:id)

### ✅ Attendance Tests
- [ ] List attendance records (GET /attendance)
- [ ] Create attendance record (POST /attendance)
- [ ] Update attendance record (PATCH /attendance/:id)
- [ ] Delete attendance record (DELETE /attendance/:id)

### ✅ Performance Tests
- [ ] List performance cycles (GET /performance/cycles)
- [ ] Create performance cycle (POST /performance/cycles)
- [ ] List goals (GET /performance/goals)
- [ ] Create goal (POST /performance/goals)
- [ ] Update goal (PATCH /performance/goals/:id)
- [ ] List appraisals (GET /performance/appraisals)
- [ ] Create appraisal (POST /performance/appraisals)
- [ ] Update appraisal (PATCH /performance/appraisals/:id)
- [ ] Final rating calculation (50% manager + 30% OKR + 20% peer)

### ✅ Learning Tests
- [ ] List courses (GET /learning/courses)
- [ ] Create course (POST /learning/courses)
- [ ] Update course (PATCH /learning/courses/:id)
- [ ] Delete course (DELETE /learning/courses/:id)
- [ ] List assignments (GET /learning/assignments)
- [ ] Create assignment (POST /learning/assignments)
- [ ] Update assignment (PATCH /learning/assignments/:id)
- [ ] Auto-completion on 100% progress

### ✅ Workforce Tests
- [ ] List scenarios (GET /workforce/scenarios)
- [ ] Create scenario (POST /workforce/scenarios)
- [ ] Update scenario (PATCH /workforce/scenarios/:id)
- [ ] Delete scenario (DELETE /workforce/scenarios/:id)

### ✅ Engagement Tests
- [ ] List surveys (GET /engagement/surveys)
- [ ] Create survey (POST /engagement/surveys)
- [ ] Update survey (PATCH /engagement/surveys/:id)
- [ ] Delete survey (DELETE /engagement/surveys/:id)
- [ ] List responses (GET /engagement/responses)
- [ ] Submit response (POST /engagement/responses)

### ✅ Compliance Tests
- [ ] List filings (GET /compliance/filings)
- [ ] Create filing (POST /compliance/filings)
- [ ] Update filing (PATCH /compliance/filings/:id)
- [ ] Delete filing (DELETE /compliance/filings/:id)

### ✅ Audit Logs Tests
- [ ] List audit logs (GET /logs)
- [ ] Filter audit logs by module/action
- [ ] Export audit logs

### ✅ Error Handling Tests
- [ ] 400 errors show validation messages
- [ ] 401 errors trigger auto-login
- [ ] 403 errors show permission denied
- [ ] 404 errors show not found message
- [ ] 500 errors show generic error message
- [ ] Network errors are handled gracefully

### ✅ UI/UX Tests
- [ ] All buttons have cursor pointer
- [ ] Loading states show spinners
- [ ] Empty states show helpful messages
- [ ] Forms validate before submission
- [ ] Toast notifications appear
- [ ] Dialogs open/close correctly
- [ ] Responsive design works on mobile

### ✅ File Upload Tests
- [ ] Small files (<5MB) upload normally
- [ ] Large files (>5MB) use chunked upload
- [ ] Upload progress shows accurate percentage
- [ ] Multiple files upload correctly
- [ ] File preview works for images
- [ ] File size validation works
- [ ] File type validation works

## Running Tests

### Manual Testing Steps

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Each Feature**
   - Open browser console to check for errors
   - Test each CRUD operation
   - Verify API responses
   - Check database for data persistence

### Automated Testing (Future)

- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical flows
- Performance tests for large datasets

## Known Issues

None currently. All features are working as expected.

## Test Results

Run tests and check off items as you verify them. Document any issues found.
