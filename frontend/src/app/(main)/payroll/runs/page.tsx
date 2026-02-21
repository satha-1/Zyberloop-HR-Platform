"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Input } from "../../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { api } from "../../../../lib/api";
import { PayrollRun, PayrollRunStatus } from "../../../../lib/types/payroll";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Filter,
  RefreshCw,
  AlertCircle,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";

export default function PayrollRunsPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [runToDelete, setRunToDelete] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    loadRuns();
  }, [search, statusFilter, templateFilter]);

  const loadTemplates = async () => {
    try {
      const data = await api.getPayrollTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const loadRuns = async () => {
    try {
      setRefreshing(true);
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      if (templateFilter !== "all") params.templateId = templateFilter;

      const data = await api.getPayrollRuns(params);
      setRuns(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load payroll runs");
      setRuns([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deletePayrollRun(id);
      toast.success("Payroll run deleted successfully");
      loadRuns();
      setDeleteDialogOpen(false);
      setRunToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete payroll run");
    }
  };

  const handleLock = async (id: string) => {
    try {
      await api.lockPayrollRun(id);
      toast.success("Payroll run locked successfully");
      loadRuns();
    } catch (error: any) {
      toast.error(error.message || "Failed to lock payroll run");
    }
  };

  const getStatusColor = (status: PayrollRunStatus) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "locked":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canEdit = (status: PayrollRunStatus) => {
    return status === "draft" || status === "in_progress";
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Runs</h2>
          <p className="text-gray-600 mt-1">Manage and process payroll runs</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadRuns} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/payroll/runs/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Payroll Run
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search runs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run Name</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Total Gross</TableHead>
                  <TableHead>Total Net</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : runs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Payroll Runs Found
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {search || statusFilter !== "all" || templateFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Get started by creating your first payroll run"}
                      </p>
                      {(!search && statusFilter === "all" && templateFilter === "all") && (
                        <Link href="/payroll/runs/new">
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Payroll Run
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium">{run.runName}</TableCell>
                      <TableCell>{run.templateName || "N/A"}</TableCell>
                      <TableCell>
                        {new Date(run.periodStart).toLocaleDateString()} -{" "}
                        {new Date(run.periodEnd).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{new Date(run.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(run.status)}>
                          {run.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{run.employeeCount}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "LKR",
                          minimumFractionDigits: 0,
                        }).format(run.totalGross)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "LKR",
                          minimumFractionDigits: 0,
                        }).format(run.totalNet)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/payroll/runs/${run.id || run._id}`}>
                            <Button variant="ghost" size="sm" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {canEdit(run.status) && (
                            <Link href={`/payroll/runs/${run.id || run._id}/edit`}>
                              <Button variant="ghost" size="sm" title="Edit">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {run.status !== "locked" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Lock"
                              onClick={() => handleLock(run.id || run._id)}
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                          )}
                          {canEdit(run.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete"
                              onClick={() => {
                                setRunToDelete(run.id || run._id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payroll Run</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payroll run? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRunToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => runToDelete && handleDelete(runToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
