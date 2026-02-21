"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { usePayrollRuns } from "../../lib/hooks";
import { Plus, Download, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function Payroll() {
  const { data: payrollRuns = [], loading } = usePayrollRuns();
  const getStatusColor = (status: string) => {
    switch (status) {
      case "FINALIZED":
        return "bg-green-100 text-green-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "APPROVAL_PENDING":
        return "bg-orange-100 text-orange-800";
      case "PARTIAL_FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Management</h2>
          <p className="text-gray-600 mt-1">Process and manage payroll runs</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Payroll Run
          </Button>
        </div>
      </div>

      {/* Alert for draft payroll */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-blue-900">February 2026 Payroll in Progress</p>
          <p className="text-sm text-blue-700 mt-1">
            Review and approve the draft payroll run before finalizing.
          </p>
        </div>
        <Link href="/payroll/pr_001">
          <Button size="sm">Review</Button>
        </Link>
      </div>

      {/* Payroll Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Current Period</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">Feb 2026</p>
            <p className="text-xs text-gray-500 mt-1">1-28 February</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Employees</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">5</p>
            <p className="text-xs text-gray-500 mt-1">Active payroll</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Gross Amount</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">$455k</p>
            <p className="text-xs text-gray-500 mt-1">Before deductions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Net Amount</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">$364k</p>
            <p className="text-xs text-gray-500 mt-1">To be paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Gross Amount</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : payrollRuns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No payroll runs found
                    </TableCell>
                  </TableRow>
                ) : (
                  payrollRuns.map((run: any) => (
                    <TableRow key={run._id || run.id}>
                      <TableCell className="font-medium">
                        {new Date(run.periodStart || run.period_start).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{run.employee_count || run.employeeCount || 0}</TableCell>
                      <TableCell>${((run.total_gross || run.totalGross || 0) / 1000).toFixed(0)}k</TableCell>
                      <TableCell>${((run.total_net || run.totalNet || 0) / 1000).toFixed(0)}k</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(run.status)}>
                          {run.status?.replace(/_/g, " ") || run.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(run.createdAt || run.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Link href={`/payroll/${run._id || run.id}`}>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Statutory Filings (Sri Lanka)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">EPF Filing - February 2026</p>
                <p className="text-xs text-gray-600">Due: March 15, 2026</p>
              </div>
              <Badge variant="outline">Pending</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">ETF Filing - February 2026</p>
                <p className="text-xs text-gray-600">Due: March 15, 2026</p>
              </div>
              <Badge variant="outline">Pending</Badge>
            </div>
            <Button variant="outline" className="w-full">
              Generate Filing Reports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Generate Payslips
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Download Bank Transfer File
            </Button>
            <Button variant="outline" className="w-full justify-start">
              View Payroll Summary
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Export Error Report CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
