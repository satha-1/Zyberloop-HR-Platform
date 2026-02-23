# Leave & Attendance Backend Implementation Summary

## Create Leave Request (`POST /api/v1/leaves`, `backend/src/modules/leave/leave.controller.ts`)

### Logic in Simple

Before allowing an employee to save a leave request to the database, the system must act as a calculator to figure out if they actually have the days available to take. It looks at when they were hired, calculates how many leaves they've earned so far, subtracts any leaves they've already used, and checks if their current request fits within their remaining balance. Additionally, the system ensures they aren't trying to apply for leave during critical company blackout dates (like the last 3 days of the month).

### What we added to it

We modified the `createLeaveRequest` function to include:

1. **Accrual Engine Calculation:** Added logic to fetch the employee's `hireDate` and multiply their `monthsWorked` by their specific `leaveType.accrualRule.perMonth` to get total earned leaves.
2. **Usage Aggregation:** Added a MongoDB aggregate query (`LeaveRequest.aggregate`) to dynamically sum all previously `HR_APPROVED` leave days for the employee.
3. **Current Balance Validation:** Calculated the real-time balance (`totalAccrued - takenAccrued`) and implemented an HTTP 400 error throw if the requested days exceed this balance.
4. **Default Approver Chain:** We now explicitly inject the required workflow (`MANAGER -> HR_ADMIN`) into the payload (`req.body.approverChain`) before saving to the database so that rule-based approvals can work later.
