"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { EmployeeAvatar } from "../../../components/ui/EmployeeAvatar";
import { useEmployee, useEmployees, usePerformanceGoals, usePerformanceCycles } from "../../../lib/hooks";
import { DocumentGenerator } from "../../../components/DocumentGenerator";
import { EditEmployeeDialog } from "../../../components/EditEmployeeDialog";
import { LeaveHistoryDialog } from "../../../components/LeaveHistoryDialog";
import { AssignManagerDialog } from "../../../components/AssignManagerDialog";
import { ArrowLeft, Mail, Phone, Calendar, DollarSign, User, Briefcase, Edit, UserPlus } from "lucide-react";

export default function EmployeeProfile() {
  const params = useParams();
  const id = params.id as string;
  const { data: employee, loading, refetch } = useEmployee(id);
  const { data: performanceCycles = [] } = usePerformanceCycles();
  const activeCycle = performanceCycles.find((cycle: any) => cycle.status === 'ACTIVE');
  const { data: performanceGoals = [], loading: goalsLoading } = usePerformanceGoals(id, activeCycle?._id);
  const [documentGeneratorOpen, setDocumentGeneratorOpen] = useState(false);
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [leaveHistoryOpen, setLeaveHistoryOpen] = useState(false);
  const [assignManagerOpen, setAssignManagerOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Employee not found</p>
            <Link href="/employees">
              <Button className="mt-4">Back to Employees</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const firstName = employee.firstName || employee.first_name || "";
  const lastName = employee.lastName || employee.last_name || "";
  const email = employee.email || "";
  const phone = employee.phone || "";
  const grade = employee.grade || "";
  const department = employee.departmentId?.name || employee.department || "N/A";
  const status = employee.status || "active";
  const salary = employee.salary || employee.currentSalary || 0;

  const compensationComponents = [
    { name: "Base Salary", amount: salary, frequency: "Monthly" },
    { name: "Housing Allowance", amount: salary * 0.2, frequency: "Monthly" },
    { name: "Transport Allowance", amount: 5000, frequency: "Monthly" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <Link href="/employees">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Employee Profile</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setEditEmployeeOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setAssignManagerOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Manager
          </Button>
          <Button onClick={() => setDocumentGeneratorOpen(true)} size="sm" className="w-full sm:w-auto">Generate Documents</Button>
        </div>
      </div>

      {/* Employee Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="relative">
              <EmployeeAvatar
                profilePicture={employee.profilePicture}
                firstName={firstName}
                lastName={lastName}
                size="lg"
                className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-gray-200"
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 border-2 border-white shadow-sm"
                onClick={() => setEditEmployeeOpen(true)}
                title="Edit profile picture"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {firstName} {lastName}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">{grade}</p>
                </div>
                <Badge
                  className={
                    status === "active" || status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }
                >
                  {status.replace("_", " ")}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm font-medium text-gray-900">{department}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Employee Code</p>
                  <p className="font-medium">{employee.employeeCode || employee.employee_code || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hire Date</p>
                  <p className="font-medium">
                    {employee.hireDate || employee.hire_date 
                      ? new Date(employee.hireDate || employee.hire_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Manager</p>
                  <p className="font-medium">
                    {employee.managerId 
                      ? `${employee.managerId.firstName || ''} ${employee.managerId.lastName || ''}`.trim() || "N/A"
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Grade</p>
                  <p className="font-medium">{grade || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leave Balance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Annual Leave</span>
                  <span className="font-medium">15 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sick Leave</span>
                  <span className="font-medium">8 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Personal Leave</span>
                  <span className="font-medium">3 days</span>
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={() => setLeaveHistoryOpen(true)}>
                  View Leave History
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compensation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compensation Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {compensationComponents.map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{comp.name}</p>
                      <p className="text-sm text-gray-500">{comp.frequency}</p>
                    </div>
                    <p className="text-lg font-semibold">LKR {comp.amount.toLocaleString()}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-4 border-t-2">
                  <p className="text-lg font-bold">Total Monthly</p>
                  <p className="text-xl font-bold text-blue-600">
                    LKR {compensationComponents
                      .reduce((sum, comp) => sum + comp.amount, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeCycle ? `Current Goals - ${activeCycle.name}` : "Performance Goals"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {goalsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading goals...</div>
              ) : performanceGoals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {activeCycle ? "No goals assigned for this cycle" : "No active performance cycle"}
                </div>
              ) : (
                <div className="space-y-6">
                  {performanceGoals.map((goal: any) => (
                    <div key={goal._id || goal.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{goal.description || goal.name}</p>
                          <p className="text-sm text-gray-500">Weight: {goal.weight || 0}%</p>
                        </div>
                        <Badge
                          variant={
                            goal.status === "COMPLETED" || (goal.progress || 0) >= 100
                              ? "default"
                              : goal.status === "OVERDUE"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {goal.status === "COMPLETED"
                            ? "Completed"
                            : goal.status === "IN_PROGRESS"
                            ? "In Progress"
                            : goal.status === "OVERDUE"
                            ? "Overdue"
                            : "Not Started"}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (goal.progress || 0) >= 80 ? "bg-green-500" : (goal.progress || 0) >= 50 ? "bg-blue-500" : "bg-yellow-500"
                          }`}
                          style={{ width: `${goal.progress || 0}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{goal.progress || 0}% Complete</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Employment Contract
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Latest Payslip
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Performance Reviews
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {employee && (
        <>
          <EditEmployeeDialog
            open={editEmployeeOpen}
            onOpenChange={setEditEmployeeOpen}
            employee={employee}
            onSuccess={() => {
              refetch();
              setEditEmployeeOpen(false);
            }}
          />
          <LeaveHistoryDialog
            open={leaveHistoryOpen}
            onOpenChange={setLeaveHistoryOpen}
            employeeId={id}
            employeeName={`${firstName} ${lastName}`}
          />
          <AssignManagerDialog
            open={assignManagerOpen}
            onOpenChange={setAssignManagerOpen}
            employee={employee}
            onSuccess={() => {
              refetch();
              setAssignManagerOpen(false);
            }}
          />
          <DocumentGenerator
            employeeId={id}
            employeeName={`${firstName} ${lastName}`}
            open={documentGeneratorOpen}
            onOpenChange={setDocumentGeneratorOpen}
          />
        </>
      )}
    </div>
  );
}
