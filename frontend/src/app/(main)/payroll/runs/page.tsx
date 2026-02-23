"use client";

import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { EnterpriseTable, TableLink } from "../../../components/ui/EnterpriseTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { api } from "../../../lib/api";
import { PayrollRun, PayrollRunStatus } from "../../../lib/types/payroll";
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
} from "../../../components/ui/alert-dialog";

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

      <EnterpriseTable
        title="Payroll Runs"
        subtitle="Manage and process payroll runs"
        itemCountLabel={loading ? "Loading..." : `${runs.length} run${runs.length !== 1 ? 's' : ''}`}
        headerActions={
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search runs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full text-sm"
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
        }
        columns={[
          {
            key: "runName",
            header: "Run Name",
            render: (run: PayrollRun) => (
              <TableLink href={`/payroll/runs/${run.id || (run as any)._id}`}>
                {run.runName}
              </TableLink>
            ),
          },
          {
            key: "templateName",
            header: "Template",
            render: (run: PayrollRun) => run.templateName || "N/A",
          },
          {
            key: "period",
            header: "Period",
            render: (run: PayrollRun) =>
              `${new Date(run.periodStart).toLocaleDateString()} - ${new Date(run.periodEnd).toLocaleDateString()}`,
          },
          {
            key: "paymentDate",
            header: "Payment Date",
            render: (run: PayrollRun) => new Date(run.paymentDate).toLocaleDateString(),
          },
          {
            key: "status",
            header: "Status",
            render: (run: PayrollRun) => (
              <Badge className={getStatusColor(run.status)}>
                {run.status.replace("_", " ")}
              </Badge>
            ),
          },
          {
            key: "employeeCount",
            header: "Employees",
            align: "right",
            render: (run: PayrollRun) => run.employeeCount || 0,
          },
          {
            key: "totalGross",
            header: "Total Gross",
            align: "right",
            render: (run: PayrollRun) => (
              <span className="font-medium">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "LKR",
                  minimumFractionDigits: 0,
                }).format(run.totalGross)}
              </span>
            ),
          },
          {
            key: "totalNet",
            header: "Total Net",
            align: "right",
            render: (run: PayrollRun) => (
              <span className="font-medium">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "LKR",
                  minimumFractionDigits: 0,
                }).format(run.totalNet)}
              </span>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            widthClassName: "w-32",
            render: (run: PayrollRun) => (
              <div className="flex items-center gap-2 justify-end">
                <Link href={`/payroll/runs/${run.id || (run as any)._id}`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                {canEdit(run.status) && (
                  <Link href={`/payroll/runs/${run.id || (run as any)._id}/edit`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {run.status !== "locked" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Lock"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLock(run.id || (run as any)._id);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Lock className="h-4 w-4" />
                  </Button>
                )}
                {canEdit(run.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRunToDelete(run.id || (run as any)._id);
                      setDeleteDialogOpen(true);
                    }}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={loading ? [] : runs}
        getRowKey={(run: PayrollRun) => run.id || (run as any)._id}
        emptyStateText={
          search || statusFilter !== "all" || templateFilter !== "all"
            ? "Try adjusting your filters"
            : "Get started by creating your first payroll run"
        }
        emptyStateIcon={<AlertCircle className="h-12 w-12 text-gray-400" />}
        onRowClick={(run: PayrollRun) => {
          window.location.href = `/payroll/runs/${run.id || (run as any)._id}`;
        }}
      />

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
