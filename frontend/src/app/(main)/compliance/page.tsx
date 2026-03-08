"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Shield,
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  Plus,
  Search,
  Upload,
  Calendar,
  FileCheck,
  Loader2,
  X,
  Edit,
  Trash2,
  Eye,
  Clock,
  Bot,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { FilingFormDialog } from "../../components/compliance/FilingFormDialog";
import { PermitFormDialog } from "../../components/compliance/PermitFormDialog";
import { AuditFormDialog } from "../../components/compliance/AuditFormDialog";
import { AutomationFormDialog } from "../../components/compliance/AutomationFormDialog";

export const dynamic = "force-dynamic";

// Types (simplified - in production, create a types file)
interface ComplianceFiling {
  _id: string;
  filingTypeId: any;
  periodId: any;
  statutoryDueDate: string;
  internalDueDate?: string | null;
  amount: number;
  status: "DRAFT" | "PENDING" | "FILED" | "OVERDUE";
  filedAt?: string | null;
  paymentReference?: string | null;
  reportAssets: any[];
  receiptAssets: any[];
  notes?: string | null;
}

interface CompliancePermit {
  _id: string;
  employeeId: any;
  permitType: string;
  country: string;
  identifier?: string | null;
  expiresAt: string;
  status: "ACTIVE" | "RENEWAL_IN_PROGRESS" | "EXPIRED" | "CANCELLED";
  ownerUserId?: any;
  documentAssets: any[];
  notes?: string | null;
}

interface ComplianceAuditReport {
  _id: string;
  title: string;
  category: "STATUTORY" | "INTERNAL" | "GDPR" | "OTHER";
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  completedAt?: string | null;
  evidenceAssets: any[];
}

interface ComplianceAlert {
  _id: string;
  type: "VISA_EXPIRY" | "FILING_DUE" | "FILING_OVERDUE" | "MISSING_RECEIPT";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  entityType: "FILING" | "PERMIT" | "AUDIT";
  entityId: string;
  dueAt?: string | null;
  resolved: boolean;
}

interface ComplianceAutomationRule {
  _id: string;
  name: string;
  type: string;
  active: boolean;
  scheduleCron?: string | null;
  lastRunAt?: string | null;
  lastRunStatus?: "SUCCESS" | "FAILED" | "SKIPPED" | null;
  lastRunLog?: string | null;
}

interface DashboardData {
  criticalAlerts: ComplianceAlert[];
  upcomingFilings: ComplianceFiling[];
  expiringPermits: CompliancePermit[];
  metrics: {
    totalFilingsLast12Months: number;
    onTimeRatePct: number;
    receiptsStoredLast12Months: number;
  };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING: "bg-orange-100 text-orange-700",
  FILED: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  RENEWAL_IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  EXPIRED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-700",
  PLANNED: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
};

const severityColors: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-blue-100 text-blue-700",
};

function ComplianceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "dashboard";

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [filings, setFilings] = useState<ComplianceFiling[]>([]);
  const [permits, setPermits] = useState<CompliancePermit[]>([]);
  const [audits, setAudits] = useState<ComplianceAuditReport[]>([]);
  const [automations, setAutomations] = useState<ComplianceAutomationRule[]>([]);
  const [filingTypes, setFilingTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialog states
  const [filingDialogOpen, setFilingDialogOpen] = useState(false);
  const [selectedFiling, setSelectedFiling] = useState<ComplianceFiling | null>(null);
  const [permitDialogOpen, setPermitDialogOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<CompliancePermit | null>(null);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<ComplianceAuditReport | null>(null);
  const [receiptUploadOpen, setReceiptUploadOpen] = useState(false);
  const [receiptFilingId, setReceiptFilingId] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [automationDialogOpen, setAutomationDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<ComplianceAutomationRule | null>(null);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "dashboard") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.push(`/compliance?${params.toString()}`);
  };

  useEffect(() => {
    loadDashboard();
    loadFilingTypes();
  }, []);

  useEffect(() => {
    if (activeTab === "filings") {
      loadFilings();
    } else if (activeTab === "permits") {
      loadPermits();
    } else if (activeTab === "audits") {
      loadAudits();
    } else if (activeTab === "automation") {
      loadAutomations();
    }
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      const response = await api.getComplianceDashboard() as DashboardData;
      if (response && typeof response === 'object') {
        setDashboard({
          criticalAlerts: response.criticalAlerts || [],
          upcomingFilings: response.upcomingFilings || [],
          expiringPermits: response.expiringPermits || [],
          metrics: response.metrics || {
            totalFilingsLast12Months: 0,
            onTimeRatePct: 0,
            receiptsStoredLast12Months: 0,
          },
        });
      } else {
        setDashboard({
          criticalAlerts: [],
          upcomingFilings: [],
          expiringPermits: [],
          metrics: {
            totalFilingsLast12Months: 0,
            onTimeRatePct: 0,
            receiptsStoredLast12Months: 0,
          },
        });
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load dashboard");
      setDashboard({
        criticalAlerts: [],
        upcomingFilings: [],
        expiringPermits: [],
        metrics: {
          totalFilingsLast12Months: 0,
          onTimeRatePct: 0,
          receiptsStoredLast12Months: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFilingTypes = async () => {
    try {
      const response = await api.getComplianceFilingTypes() as any[];
      setFilingTypes(response || []);
    } catch (e: any) {
      console.error("Failed to load filing types:", e);
      setFilingTypes([]);
    }
  };

  const loadFilings = async () => {
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchQuery) params.q = searchQuery;
      const response = await api.getComplianceFilings(params) as ComplianceFiling[];
      setFilings(response || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load filings");
      setFilings([]);
    }
  };

  const loadPermits = async () => {
    try {
      const params: any = {};
      if (searchQuery) params.q = searchQuery;
      const response = await api.getCompliancePermits(params) as CompliancePermit[];
      setPermits(response || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load permits");
      setPermits([]);
    }
  };

  const loadAudits = async () => {
    try {
      const response = await api.getComplianceAudits() as ComplianceAuditReport[];
      setAudits(response || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load audits");
      setAudits([]);
    }
  };

  const loadAutomations = async () => {
    try {
      const response = await api.getComplianceAutomations() as ComplianceAutomationRule[];
      setAutomations(response || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load automations");
      setAutomations([]);
    }
  };

  const handleGenerateReport = async () => {
    try {
      await api.generateComplianceReport();
      toast.success("Compliance report generated");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate report");
    }
  };

  const handleGenerateFilingReport = async (filingId: string) => {
    try {
      await api.generateComplianceFilingReport(filingId);
      toast.success("Report generated");
      loadFilings();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate report");
    }
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !receiptFilingId) {
      toast.error("Please select a file");
      return;
    }
    try {
      await api.uploadComplianceFilingReceipt(receiptFilingId, receiptFile);
      toast.success("Receipt uploaded");
      setReceiptUploadOpen(false);
      setReceiptFile(null);
      setReceiptFilingId("");
      loadFilings();
      loadDashboard();
    } catch (e: any) {
      toast.error(e.message || "Failed to upload receipt");
    }
  };

  const handleMarkFiled = async (filingId: string) => {
    try {
      await api.markComplianceFilingFiled(filingId);
      toast.success("Filing marked as filed");
      loadFilings();
      loadDashboard();
    } catch (e: any) {
      toast.error(e.message || "Failed to mark filing as filed");
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await api.resolveComplianceAlert(alertId);
      toast.success("Alert resolved");
      loadDashboard();
    } catch (e: any) {
      toast.error(e.message || "Failed to resolve alert");
    }
  };

  const handleToggleAutomation = async (id: string) => {
    try {
      await api.toggleComplianceAutomation(id);
      toast.success("Automation toggled");
      loadAutomations();
    } catch (e: any) {
      toast.error(e.message || "Failed to toggle automation");
    }
  };

  const getDaysUntilExpiry = (expiresAt: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiresAt);
    expiry.setHours(0, 0, 0, 0);
    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Compliance & Administration</h2>
          <p className="text-gray-600 mt-1">Statutory filings and compliance tracking</p>
        </div>
        <Button onClick={handleGenerateReport}>
          <Shield className="h-4 w-4 mr-2" />
          Generate Compliance Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="filings">Statutory Filings</TabsTrigger>
          <TabsTrigger value="permits">Work Visa & Permits</TabsTrigger>
          <TabsTrigger value="audits">Audit Reports</TabsTrigger>
          <TabsTrigger value="automation">Automation & RPA</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* Critical Alerts */}
          {dashboard?.criticalAlerts && dashboard.criticalAlerts.length > 0 && (
      <div className="space-y-3">
              {dashboard.criticalAlerts.map((alert) => (
                <div
                  key={alert._id}
                  className={`border rounded-lg p-4 flex items-start gap-3 ${
                    alert.severity === "CRITICAL"
                      ? "bg-red-50 border-red-200"
                      : "bg-orange-50 border-orange-200"
                  }`}
                >
                  <AlertCircle
                    className={`h-5 w-5 mt-0.5 ${
                      alert.severity === "CRITICAL" ? "text-red-600" : "text-orange-600"
                    }`}
                  />
          <div className="flex-1">
                    <p className={`font-medium ${
                      alert.severity === "CRITICAL" ? "text-red-900" : "text-orange-900"
                    }`}>
                      {alert.severity}: {alert.message}
            </p>
          </div>
                  <Button
                    size="sm"
                    variant={alert.severity === "CRITICAL" ? "destructive" : "outline"}
                    onClick={() => handleResolveAlert(alert._id)}
                  >
                    Resolve
          </Button>
        </div>
              ))}
          </div>
          )}

          {/* Upcoming Filings */}
          {dashboard?.upcomingFilings && dashboard.upcomingFilings.length > 0 && (
      <Card>
        <CardHeader>
                <CardTitle>Upcoming Filings</CardTitle>
        </CardHeader>
        <CardContent>
                <div className="space-y-3">
                  {dashboard.upcomingFilings.map((filing) => {
                    const filingType = filing.filingTypeId;
                    const period = filing.periodId;
                    const daysUntilDue = Math.ceil(
                      (new Date(filing.statutoryDueDate).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div
                        key={filing._id}
                        className="p-4 border rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">
                            {filingType?.name || "Unknown"} - {period?.label || "Unknown Period"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Due: {new Date(filing.statutoryDueDate).toLocaleDateString()} ({daysUntilDue} days)
                          </p>
                        </div>
                        <Badge className={statusColors[filing.status] || "bg-gray-100 text-gray-700"}>
                        {filing.status}
                      </Badge>
                      </div>
                    );
                  })}
          </div>
        </CardContent>
      </Card>
          )}

          {/* Expiring Permits */}
          {dashboard?.expiringPermits && dashboard.expiringPermits.length > 0 && (
      <Card>
        <CardHeader>
                <CardTitle>Expiring Permits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
                  {dashboard.expiringPermits.map((permit) => {
                    const employee = permit.employeeId;
                    const daysLeft = getDaysUntilExpiry(permit.expiresAt);
                    const isCritical = daysLeft <= 14;
                    return (
                      <div
                        key={permit._id}
                className={`p-4 rounded-lg border-2 ${
                          isCritical
                    ? "border-red-500 bg-red-50"
                    : "border-orange-500 bg-orange-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                            <h4 className="font-semibold">{employee?.name || "Unknown Employee"}</h4>
                    <div className="flex gap-3 mt-1 text-sm text-gray-600">
                              <span>{permit.permitType}</span>
                      <span>•</span>
                              <span>Expires: {new Date(permit.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                            <p className={`text-2xl font-bold ${isCritical ? "text-red-700" : "text-orange-700"}`}>
                              {daysLeft}
                    </p>
                    <p className="text-sm text-gray-600">days left</p>
                  </div>
                </div>
              </div>
                    );
                  })}
          </div>
        </CardContent>
      </Card>
          )}

          {/* Metrics */}
          {dashboard?.metrics && (
      <Card>
        <CardHeader>
          <CardTitle>Immutable Filing Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Blockchain-Ready Verification</p>
                <p className="text-sm text-blue-700 mt-1">
                  All statutory filings and acknowledgment receipts maintained in immutable storage
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <p className="text-sm text-gray-600">Total Filings</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {dashboard.metrics.totalFilingsLast12Months}
                      </p>
                <p className="text-xs text-gray-500 mt-1">Last 12 months</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-sm text-gray-600">On-Time Rate</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        {dashboard.metrics.onTimeRatePct.toFixed(1)}%
                      </p>
                <p className="text-xs text-gray-500 mt-1">Perfect compliance</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-sm text-gray-600">Receipts Stored</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {dashboard.metrics.receiptsStoredLast12Months}
                      </p>
                <p className="text-xs text-gray-500 mt-1">Immutable copies</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
          )}
        </TabsContent>

        <TabsContent value="filings" className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search filings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                suppressHydrationWarning
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" suppressHydrationWarning>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FILED">Filed</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadFilings}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button onClick={() => {
              setSelectedFiling(null);
              setFilingDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Filing
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Statutory Filings (Sri Lanka)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Filed Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!filings || filings.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No filings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filings.map((filing) => {
                        const filingType = filing.filingTypeId;
                        const period = filing.periodId;
                        return (
                          <TableRow key={filing._id}>
                            <TableCell className="font-medium">
                              {period?.label || "Unknown"}
                            </TableCell>
                            <TableCell>{filingType?.name || "Unknown"}</TableCell>
                            <TableCell>
                              {new Date(filing.statutoryDueDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {filingType?.currency || "LKR"} {filing.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[filing.status] || "bg-gray-100 text-gray-700"}>
                                {filing.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {filing.filedAt
                                ? new Date(filing.filedAt).toLocaleDateString()
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {filing.status !== "FILED" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleGenerateFilingReport(filing._id)}
                                    >
                                      Generate Report
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setReceiptFilingId(filing._id);
                                        setReceiptUploadOpen(true);
                                      }}
                                    >
                                      <Upload className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkFiled(filing._id)}
                                    >
                                      Mark Filed
                                    </Button>
                                  </>
                                )}
                                {filing.receiptAssets && filing.receiptAssets.length > 0 && (
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                                {filing.status !== "FILED" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedFiling(filing);
                                      setFilingDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
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

        <TabsContent value="permits" className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search permits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                suppressHydrationWarning
              />
            </div>
            <Button onClick={loadPermits}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button onClick={() => {
              setSelectedPermit(null);
              setPermitDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Permit
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Work Visa & Permits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(!permits || permits.length === 0) ? (
                  <p className="text-center py-8 text-gray-500">No permits found</p>
                ) : (
                  permits.map((permit) => {
                    const employee = permit.employeeId;
                    const daysLeft = getDaysUntilExpiry(permit.expiresAt);
                    const isCritical = daysLeft <= 14;
                    const isHigh = daysLeft <= 30 && daysLeft > 14;
                    return (
                      <div
                        key={permit._id}
                        className={`p-4 rounded-lg border-2 ${
                          isCritical
                            ? "border-red-500 bg-red-50"
                            : isHigh
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{employee?.name || "Unknown Employee"}</h4>
                            <div className="flex gap-3 mt-1 text-sm text-gray-600">
                              <span>{permit.permitType}</span>
                              <span>•</span>
                              <span>Expires: {new Date(permit.expiresAt).toLocaleDateString()}</span>
                              {permit.identifier && (
                                <>
                                  <span>•</span>
                                  <span>ID: {permit.identifier}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-2xl font-bold ${
                                isCritical ? "text-red-700" : isHigh ? "text-orange-700" : "text-gray-700"
                              }`}
                            >
                              {daysLeft}
                            </p>
                            <p className="text-sm text-gray-600">days left</p>
                            <Badge className={`mt-2 ${statusColors[permit.status] || "bg-gray-100 text-gray-700"}`}>
                              {permit.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                setSelectedPermit(permit);
                                setPermitDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Button onClick={() => {
              setSelectedAudit(null);
              setAuditDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Audit Report
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Audit-Ready Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(!audits || audits.length === 0) ? (
                  <p className="text-center py-8 text-gray-500">No audit reports found</p>
                ) : (
                  audits.map((audit) => (
                    <div key={audit._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">{audit.title}</p>
                          <div className="flex gap-3 mt-1 text-sm text-gray-600">
                            <span>{audit.category}</span>
                            <span>•</span>
                            <span>
                              {audit.completedAt
                                ? new Date(audit.completedAt).toLocaleDateString()
                                : "Not completed"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[audit.status] || "bg-gray-100 text-gray-700"}>
                          {audit.status}
                        </Badge>
                        {audit.evidenceAssets && audit.evidenceAssets.length > 0 && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAudit(audit);
                            setAuditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Button onClick={() => {
            setSelectedAutomation(null);
            setAutomationDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Automation Rule
          </Button>
      <Card>
        <CardHeader>
          <CardTitle>Automation & RPA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
                {(!automations || automations.length === 0) ? (
                  <p className="text-center py-8 text-gray-500">No automation rules found</p>
                ) : (
                  automations.map((automation) => (
                    <div key={automation._id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Bot className="h-5 w-5 text-gray-600" />
                          <p className="font-medium">{automation.name}</p>
                        </div>
                <p className="text-sm text-gray-600 mt-1">
                          Type: {automation.type} • Last run:{" "}
                          {automation.lastRunAt
                            ? new Date(automation.lastRunAt).toLocaleString()
                            : "Never"}
                        </p>
                        {automation.lastRunStatus && (
                          <p className="text-xs text-gray-500 mt-1">
                            Status: {automation.lastRunStatus}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={automation.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {automation.active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAutomation(automation);
                            setAutomationDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAutomation(automation._id)}
                        >
                          {automation.active ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </Button>
              </div>
            </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receipt Upload Dialog */}
      <Dialog open={receiptUploadOpen} onOpenChange={setReceiptUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Receipt</DialogTitle>
            <DialogDescription>Upload acknowledgment receipt for this filing</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>File</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                suppressHydrationWarning
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReceiptUploadOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUploadReceipt}>Upload</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filing Form Dialog */}
      <FilingFormDialog
        open={filingDialogOpen}
        onOpenChange={setFilingDialogOpen}
        filing={selectedFiling}
        onSuccess={async () => {
          await loadFilings();
          await loadDashboard();
        }}
      />

      {/* Permit Form Dialog */}
      <PermitFormDialog
        open={permitDialogOpen}
        onOpenChange={setPermitDialogOpen}
        permit={selectedPermit}
        onSuccess={async () => {
          await loadPermits();
          await loadDashboard();
        }}
      />

      {/* Audit Form Dialog */}
      <AuditFormDialog
        open={auditDialogOpen}
        onOpenChange={setAuditDialogOpen}
        audit={selectedAudit}
        onSuccess={async () => {
          await loadAudits();
        }}
      />

      {/* Automation Form Dialog */}
      <AutomationFormDialog
        open={automationDialogOpen}
        onOpenChange={setAutomationDialogOpen}
        automation={selectedAutomation}
        onSuccess={async () => {
          await loadAutomations();
        }}
      />
    </div>
  );
}

export default function Compliance() {
  return (
    <Suspense fallback={
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <ComplianceContent />
    </Suspense>
  );
}
