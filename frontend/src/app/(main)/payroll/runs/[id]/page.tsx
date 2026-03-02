"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { api } from "../../../../lib/api";
import { ArrowLeft, Download, CheckCircle, AlertCircle, Edit, Lock, RefreshCw, Trash2, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../../components/ui/alert-dialog";

export default function PayrollRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [payrollRun, setPayrollRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [downloadingPayslip, setDownloadingPayslip] = useState<string | null>(null);
  const activeTab = searchParams.get("tab") || "employees";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "employees") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.push(`/payroll/runs/${id}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (id) {
      loadPayrollRun();
      loadEntries();
    }
  }, [id]);

  const loadPayrollRun = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPayrollRunById(id);
      setPayrollRun(data);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to load payroll run";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async () => {
    try {
      const data = await api.getPayrollEntries(id);
      setEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load entries:", error);
      setEntries([]);
    }
  };

  const handleRecalculate = async () => {
    try {
      await api.recalculatePayrollRun(id);
      toast.success("Payroll run recalculated successfully");
      loadPayrollRun();
      loadEntries();
    } catch (error: any) {
      toast.error(error.message || "Failed to recalculate payroll run");
    }
  };

  const handleLock = async () => {
    try {
      await api.lockPayrollRun(id);
      toast.success("Payroll run locked successfully");
      loadPayrollRun();
    } catch (error: any) {
      toast.error(error.message || "Failed to lock payroll run");
    }
  };

  const handleDelete = async () => {
    try {
      await api.deletePayrollRun(id);
      toast.success("Payroll run deleted successfully");
      router.push("/payroll/runs");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete payroll run");
    }
  };

  const handleExport = async (format: 'pdf' | 'csv' = 'pdf') => {
    try {
      await api.exportPayrollRun(id, format);
      toast.success(`Payroll run exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to export payroll run");
    }
  };

  const handleDownloadPayslip = async (employeeId: string, employeeName: string) => {
    try {
      setDownloadingPayslip(employeeId);
      await api.downloadEmployeePayslip(id, employeeId);
      toast.success(`Payslip downloaded for ${employeeName}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to download payslip");
    } finally {
      setDownloadingPayslip(null);
    }
  };

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

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={loadPayrollRun} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Link href="/payroll/runs">
                <Button variant="outline">Back to Payroll Runs</Button>
              </Link>
            </div>
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
            <Link href="/payroll/runs">
              <Button className="mt-4">Back to Payroll Runs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
      case "FINALIZED":
        return "bg-green-100 text-green-800";
      case "locked":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canEdit = payrollRun.status === "draft" || payrollRun.status === "in_progress";
  const isLocked = payrollRun.status === "locked" || payrollRun.status === "FINALIZED" || payrollRun.status === "completed";

  // Use employeeLines if available, otherwise use entries
  const employeePayroll = payrollRun.employeeLines?.length > 0
    ? payrollRun.employeeLines
    : entries.map((entry: any) => ({
        employeeId: entry.employeeId?._id || entry.employeeId,
        employeeName: entry.employeeId
          ? `${entry.employeeId.firstName || entry.employeeId.first_name || ""} ${entry.employeeId.lastName || entry.employeeId.last_name || ""}`
          : "Unknown",
        grossPay: entry.gross || 0,
        totalDeductions: (entry.statutoryDeductions?.epfEmployee || 0) + (entry.statutoryDeductions?.tax || 0) + (entry.otherDeductions || 0),
        netPay: entry.net || 0,
      }));

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <Link href="/payroll/runs">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            {payrollRun.runName || `Payroll Run - ${new Date(payrollRun.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
            {new Date(payrollRun.periodStart).toLocaleDateString()} -{" "}
            {new Date(payrollRun.periodEnd).toLocaleDateString()}
          </p>
        </div>
        <Badge className={getStatusColor(payrollRun.status)}>
          {payrollRun.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Employees</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{payrollRun.employeeCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Gross</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "LKR",
                minimumFractionDigits: 0,
              }).format(payrollRun.totalGross || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Deductions</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "LKR",
                minimumFractionDigits: 0,
              }).format(payrollRun.totalDeductions || (payrollRun.totalGross - payrollRun.totalNet) || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Net</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "LKR",
                minimumFractionDigits: 0,
              }).format(payrollRun.totalNet || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {canEdit && (
          <Link href={`/payroll/runs/${id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        )}
        {canEdit && (
          <Button variant="outline" onClick={handleRecalculate}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalculate
          </Button>
        )}
        {!isLocked && (
          <Button variant="outline" onClick={handleLock}>
            <Lock className="h-4 w-4 mr-2" />
            Lock Run
          </Button>
        )}
        <Button variant="outline" onClick={() => handleExport('pdf')}>
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
        <Button variant="outline" onClick={() => handleExport('csv')}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        {canEdit && (
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Payroll Run</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this payroll run? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Payroll Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead className="w-[80px]">Payslip</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeePayroll.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No employee data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      employeePayroll.map((item: any, index: number) => {
                        const employeeId = item.employeeId?._id || item.employeeId;
                        const isDownloading = downloadingPayslip === employeeId;
                        return (
                          <TableRow key={employeeId || index}>
                            <TableCell className="font-medium">{item.employeeName || "Unknown"}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "LKR",
                                minimumFractionDigits: 0,
                              }).format(item.baseSalary || 0)}
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "LKR",
                                minimumFractionDigits: 0,
                              }).format(item.grossPay || 0)}
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "LKR",
                                minimumFractionDigits: 0,
                              }).format(item.totalDeductions || 0)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "LKR",
                                minimumFractionDigits: 0,
                              }).format(item.netPay || 0)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPayslip(employeeId, item.employeeName || "Unknown")}
                                disabled={isDownloading || !employeeId}
                                className="h-8 w-8 p-0"
                                aria-label={`Download payslip for ${item.employeeName || "Unknown"}`}
                                title="Download payslip"
                              >
                                {isDownloading ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                ) : (
                                  <FileText className="h-4 w-4 text-gray-600 hover:text-blue-600" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Earnings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span>Total Gross</span>
                      <span>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "LKR",
                          minimumFractionDigits: 0,
                        }).format(payrollRun.totalGross || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Deductions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span>Total Deductions</span>
                      <span>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "LKR",
                          minimumFractionDigits: 0,
                        }).format(payrollRun.totalDeductions || (payrollRun.totalGross - payrollRun.totalNet) || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t-2">
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Net Payable</span>
                  <span className="font-bold text-blue-600">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "LKR",
                      minimumFractionDigits: 0,
                    }).format(payrollRun.totalNet || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
