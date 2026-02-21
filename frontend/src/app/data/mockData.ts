// Mock data for the NG-IHRP prototype

export interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  grade: string;
  manager: string;
  hire_date: string;
  status: "active" | "inactive" | "on_leave";
  salary: number;
}

export interface PayrollRun {
  id: string;
  period_start: string;
  period_end: string;
  status: "DRAFT" | "APPROVAL_PENDING" | "APPROVED" | "FINALIZED" | "PARTIAL_FAILED";
  total_gross: number;
  total_net: number;
  employee_count: number;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_name: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: "pending" | "approved" | "rejected";
  balance: number;
}

export interface Requisition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: "full_time" | "contract" | "intern";
  status: "open" | "closed" | "on_hold";
  candidates: number;
  posted_date: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  requisition_id: string;
  status: string;
  skill_match: number;
  experience_match: number;
  applied_date: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor_name: string;
  actor_roles: string[];
  action: string;
  module: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
}

export const mockEmployees: Employee[] = [
  {
    id: "emp_001",
    employee_code: "EMP001",
    first_name: "Sarah",
    last_name: "Johnson",
    email: "sarah.johnson@company.com",
    phone: "+1-555-0101",
    department: "Engineering",
    grade: "Senior Engineer",
    manager: "John Smith",
    hire_date: "2020-03-15",
    status: "active",
    salary: 95000,
  },
  {
    id: "emp_002",
    employee_code: "EMP002",
    first_name: "Michael",
    last_name: "Chen",
    email: "michael.chen@company.com",
    phone: "+1-555-0102",
    department: "Finance",
    grade: "Finance Manager",
    manager: "Lisa Wong",
    hire_date: "2019-07-22",
    status: "active",
    salary: 85000,
  },
  {
    id: "emp_003",
    employee_code: "EMP003",
    first_name: "Emily",
    last_name: "Rodriguez",
    email: "emily.rodriguez@company.com",
    phone: "+1-555-0103",
    department: "HR",
    grade: "HR Business Partner",
    manager: "David Lee",
    hire_date: "2021-01-10",
    status: "active",
    salary: 75000,
  },
  {
    id: "emp_004",
    employee_code: "EMP004",
    first_name: "James",
    last_name: "Wilson",
    email: "james.wilson@company.com",
    phone: "+1-555-0104",
    department: "Engineering",
    grade: "Staff Engineer",
    manager: "John Smith",
    hire_date: "2018-05-20",
    status: "active",
    salary: 120000,
  },
  {
    id: "emp_005",
    employee_code: "EMP005",
    first_name: "Priya",
    last_name: "Patel",
    email: "priya.patel@company.com",
    phone: "+1-555-0105",
    department: "Marketing",
    grade: "Marketing Lead",
    manager: "Amanda Brown",
    hire_date: "2020-09-01",
    status: "on_leave",
    salary: 80000,
  },
];

export const mockPayrollRuns: PayrollRun[] = [
  {
    id: "pr_001",
    period_start: "2026-02-01",
    period_end: "2026-02-28",
    status: "DRAFT",
    total_gross: 455000,
    total_net: 364000,
    employee_count: 5,
    created_at: "2026-02-20",
  },
  {
    id: "pr_002",
    period_start: "2026-01-01",
    period_end: "2026-01-31",
    status: "FINALIZED",
    total_gross: 455000,
    total_net: 364000,
    employee_count: 5,
    created_at: "2026-01-28",
  },
  {
    id: "pr_003",
    period_start: "2025-12-01",
    period_end: "2025-12-31",
    status: "FINALIZED",
    total_gross: 455000,
    total_net: 364000,
    employee_count: 5,
    created_at: "2025-12-27",
  },
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "lv_001",
    employee_name: "Sarah Johnson",
    employee_id: "emp_001",
    leave_type: "Annual Leave",
    start_date: "2026-03-10",
    end_date: "2026-03-14",
    days: 5,
    status: "pending",
    balance: 15,
  },
  {
    id: "lv_002",
    employee_name: "Michael Chen",
    employee_id: "emp_002",
    leave_type: "Sick Leave",
    start_date: "2026-02-25",
    end_date: "2026-02-26",
    days: 2,
    status: "approved",
    balance: 8,
  },
  {
    id: "lv_003",
    employee_name: "Priya Patel",
    employee_id: "emp_005",
    leave_type: "Maternity Leave",
    start_date: "2026-02-01",
    end_date: "2026-04-30",
    days: 90,
    status: "approved",
    balance: 90,
  },
];

export const mockRequisitions: Requisition[] = [
  {
    id: "req_001",
    title: "Senior Software Engineer",
    department: "Engineering",
    location: "San Francisco, CA",
    type: "full_time",
    status: "open",
    candidates: 12,
    posted_date: "2026-02-01",
  },
  {
    id: "req_002",
    title: "Product Manager",
    department: "Product",
    location: "Remote",
    type: "full_time",
    status: "open",
    candidates: 8,
    posted_date: "2026-02-10",
  },
  {
    id: "req_003",
    title: "Marketing Intern",
    department: "Marketing",
    location: "New York, NY",
    type: "intern",
    status: "open",
    candidates: 25,
    posted_date: "2026-01-15",
  },
];

export const mockCandidates: Candidate[] = [
  {
    id: "cand_001",
    name: "Alex Thompson",
    email: "alex.thompson@email.com",
    phone: "+1-555-0201",
    requisition_id: "req_001",
    status: "Interview Scheduled",
    skill_match: 85,
    experience_match: 90,
    applied_date: "2026-02-05",
  },
  {
    id: "cand_002",
    name: "Jessica Lee",
    email: "jessica.lee@email.com",
    phone: "+1-555-0202",
    requisition_id: "req_001",
    status: "Screening",
    skill_match: 75,
    experience_match: 80,
    applied_date: "2026-02-08",
  },
  {
    id: "cand_003",
    name: "Robert Martinez",
    email: "robert.martinez@email.com",
    phone: "+1-555-0203",
    requisition_id: "req_002",
    status: "Offer Extended",
    skill_match: 95,
    experience_match: 88,
    applied_date: "2026-02-12",
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: "log_001",
    timestamp: "2026-02-21T10:30:45Z",
    actor_name: "Admin User",
    actor_roles: ["Admin", "System Admin"],
    action: "UPDATE",
    module: "Payroll",
    resource_type: "payroll_run",
    resource_id: "pr_001",
    ip_address: "192.168.1.100",
  },
  {
    id: "log_002",
    timestamp: "2026-02-21T09:15:22Z",
    actor_name: "Emily Rodriguez",
    actor_roles: ["HRBP"],
    action: "CREATE",
    module: "Employees",
    resource_type: "employee",
    resource_id: "emp_006",
    ip_address: "192.168.1.105",
  },
  {
    id: "log_003",
    timestamp: "2026-02-21T08:45:10Z",
    actor_name: "Michael Chen",
    actor_roles: ["Finance", "Payroll Officer"],
    action: "APPROVE",
    module: "Leave",
    resource_type: "leave_request",
    resource_id: "lv_002",
    ip_address: "192.168.1.102",
  },
  {
    id: "log_004",
    timestamp: "2026-02-20T16:20:33Z",
    actor_name: "Admin User",
    actor_roles: ["Admin"],
    action: "EXPORT",
    module: "Admin",
    resource_type: "audit_logs",
    resource_id: "export_001",
    ip_address: "192.168.1.100",
  },
  {
    id: "log_005",
    timestamp: "2026-02-20T14:55:18Z",
    actor_name: "Sarah Johnson",
    actor_roles: ["Manager"],
    action: "UPDATE",
    module: "Performance",
    resource_type: "appraisal",
    resource_id: "apr_001",
    ip_address: "192.168.1.101",
  },
];
