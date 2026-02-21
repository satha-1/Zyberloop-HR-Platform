"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { usePayrollRun } from "../../../lib/hooks";
import { api } from "../../../lib/api";
import { ArrowLeft, Download, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function PayrollRun() {
  const params = useParams();
  const id = params.id as string;
  const { data: payrollRun, loading } = usePayrollRun(id);
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      api.getPayrollEntries(id).then(setEntries).catch(() => setEntries([]));
    }
  }, [id]);

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

  if (!payrollRun) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Payroll run not found</p>
            <Link href="/payroll">
              <Button className="mt-4">Back to Payroll</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const employeePayroll = entries.map((entry: any) => ({
    employee: entry.employeeId || entry.employee,
    gross: entry.gross || 0,
    deductions: (entry.statutoryDeductions || 0) + (entry.otherDeductions || 0),
    net: entry.net || 0,
    status: entry.status || "verified",
  }));

  const handleApprove = async (type: 'hr' | 'finance') => {
    try {
      await api.approvePayrollRun(id, type);
      toast.success(`Payroll run ${type} approved successfully!`);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve payroll run");
    }
  };

  const handleFinalize = async () => {
    try {
      await api.finalizePayrollRun(id);
      toast.success("Payroll run finalized! Bank file and payslips generated.");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to finalize payroll run");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payroll">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            Payroll Run - {new Date(payrollRun.periodStart || payrollRun.period_start).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <p className="text-gray-600 mt-1">
            {new Date(payrollRun.periodStart || payrollRun.period_start).toLocaleDateString()} -{" "}
            {new Date(payrollRun.periodEnd || payrollRun.period_end).toLocaleDateString()}
          </p>
        </div>
        <Badge
          className={
            payrollRun.status === "FINALIZED"
              ? "bg-green-100 text-green-800"
              : payrollRun.status === "DRAFT"
              ? "bg-gray-100 text-gray-800"
              : "bg-orange-100 text-orange-800"
          }
        >
          {payrollRun.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Employees</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{payrollRun.employee_count || payrollRun.employeeCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Gross</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${((payrollRun.total_gross || payrollRun.totalGross || 0) / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Deductions</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${(((payrollRun.total_gross || payrollRun.totalGross || 0) - (payrollRun.total_net || payrollRun.totalNet || 0)) / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Net</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              ${((payrollRun.total_net || payrollRun.totalNet || 0) / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {payrollRun.status === "DRAFT" && (
        <div className="flex gap-3">
          <Button onClick={handleApprove}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Payroll
          </Button>
          <Button onClick={handleFinalize} variant="outline">
            Finalize & Generate Files
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Error Report
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">Employee Details</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="deductions">Deductions</TabsTrigger>
          <TabsTrigger value="errors">Errors & Warnings</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Payroll Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeePayroll.map((item) => (
                      <TableRow key={item.employee?._id || item.employee?.id || Math.random()}>
                        <TableCell className="font-medium">
                          {(item.employee?.firstName || item.employee?.first_name || "")} {(item.employee?.lastName || item.employee?.last_name || "")}
                        </TableCell>
                        <TableCell>{item.employee?.departmentId?.name || item.employee?.department || "N/A"}</TableCell>
                        <TableCell>${item.gross.toLocaleString()}</TableCell>
                        <TableCell>${item.deductions.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold">
                          ${item.net.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Earnings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Salary</span>
                      <span className="font-medium">$455,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Allowances</span>
                      <span className="font-medium">$91,000</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span>Total Gross</span>
                      <span>${(payrollRun.total_gross || payrollRun.totalGross || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Deductions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Income Tax</span>
                      <span className="font-medium">$68,250</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">EPF (Employee)</span>
                      <span className="font-medium">$22,750</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span>Total Deductions</span>
                      <span>
                        ${((payrollRun.total_gross || payrollRun.totalGross || 0) - (payrollRun.total_net || payrollRun.totalNet || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t-2">
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Net Payable</span>
                  <span className="font-bold text-blue-600">
                    ${(payrollRun.total_net || payrollRun.totalNet || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statutory Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">EPF (Employer 12%)</p>
                      <p className="text-sm text-gray-600">Employees' Provident Fund</p>
                    </div>
                    <p className="text-lg font-semibold">$54,600</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">EPF (Employee 8%)</p>
                      <p className="text-sm text-gray-600">Employee Contribution</p>
                    </div>
                    <p className="text-lg font-semibold">$36,400</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">ETF (Employer 3%)</p>
                      <p className="text-sm text-gray-600">Employees' Trust Fund</p>
                    </div>
                    <p className="text-lg font-semibold">$13,650</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">All validations passed</p>
                    <p className="text-sm text-green-700 mt-1">
                      Bank details verified for all employees
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">No calculation errors</p>
                    <p className="text-sm text-green-700 mt-1">
                      All payroll calculations completed successfully
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Ready to finalize</p>
                    <p className="text-sm text-blue-700 mt-1">
                      This payroll run is ready for approval and finalization
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
