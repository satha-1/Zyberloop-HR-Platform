"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { useEmployee } from "../../../lib/hooks";
import { DocumentGenerator } from "../../../components/DocumentGenerator";
import { ArrowLeft, Mail, Phone, Calendar, DollarSign, User, Briefcase } from "lucide-react";

export default function EmployeeProfile() {
  const params = useParams();
  const id = params.id as string;
  const { data: employee, loading } = useEmployee(id);
  const [documentGeneratorOpen, setDocumentGeneratorOpen] = useState(false);

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
      <div className="p-6">
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
    { name: "Transport Allowance", amount: 500, frequency: "Monthly" },
  ];

  const performanceGoals = [
    { name: "Deliver Q1 Project Milestones", weight: 40, progress: 75, status: "On Track" },
    { name: "Improve Team Collaboration", weight: 30, progress: 90, status: "Ahead" },
    { name: "Complete Technical Training", weight: 30, progress: 60, status: "On Track" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Employee Profile</h2>
        </div>
        <Button variant="outline">Edit</Button>
        <Button onClick={() => setDocumentGeneratorOpen(true)}>Generate Documents</Button>
      </div>

      {/* Employee Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {firstName[0] || ""}
                {lastName[0] || ""}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {firstName} {lastName}
                  </h3>
                  <p className="text-gray-600 mt-1">{grade}</p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Employee Code</p>
                  <p className="font-medium">{employee.employee_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hire Date</p>
                  <p className="font-medium">
                    {new Date(employee.hire_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Manager</p>
                  <p className="font-medium">{employee.manager}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Grade</p>
                  <p className="font-medium">{employee.grade}</p>
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
                <Button variant="outline" className="w-full mt-4">
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
                    <p className="text-lg font-semibold">${comp.amount.toLocaleString()}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-4 border-t-2">
                  <p className="text-lg font-bold">Total Monthly</p>
                  <p className="text-xl font-bold text-blue-600">
                    $
                    {compensationComponents
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
              <CardTitle>Current Goals (2026)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {performanceGoals.map((goal, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{goal.name}</p>
                        <p className="text-sm text-gray-500">Weight: {goal.weight}%</p>
                      </div>
                      <Badge
                        variant={goal.status === "Ahead" ? "default" : "secondary"}
                      >
                        {goal.status}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          goal.progress >= 80 ? "bg-green-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{goal.progress}% Complete</p>
                  </div>
                ))}
              </div>
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
        <DocumentGenerator
          employeeId={id}
          employeeName={`${firstName} ${lastName}`}
          open={documentGeneratorOpen}
          onOpenChange={setDocumentGeneratorOpen}
        />
      )}
    </div>
  );
}
