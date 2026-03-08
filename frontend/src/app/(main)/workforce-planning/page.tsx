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
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
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
  TrendingUp,
  Users,
  DollarSign,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  Archive,
  Loader2,
  AlertCircle,
  RotateCcw,
  Send,
  CheckCircle,
  XCircle,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import {
  WorkforcePlanningScenario,
  WorkforcePlanningInput,
  WorkforcePlanningSummary,
  ScenarioStatus,
} from "../../lib/types/workforcePlanning";
import { ScenarioFormDialog } from "../../components/workforce-planning/ScenarioFormDialog";
import { ScenarioImpactDialog } from "../../components/workforce-planning/ScenarioImpactDialog";
import { PlanningInputFormDialog } from "../../components/workforce-planning/PlanningInputFormDialog";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED_FOR_APPROVAL: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700",
  ACTIVE: "bg-purple-100 text-purple-700",
  REJECTED: "bg-red-100 text-red-700",
  FROZEN: "bg-gray-200 text-gray-800",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

const approvalStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

function WorkforcePlanningContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "scenarios";

  const [summary, setSummary] = useState<WorkforcePlanningSummary | null>(null);
  const [scenarios, setScenarios] = useState<WorkforcePlanningScenario[]>([]);
  const [planningInputs, setPlanningInputs] = useState<WorkforcePlanningInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [inputsLoading, setInputsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialog states
  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<WorkforcePlanningScenario | null>(null);
  const [impactDialogOpen, setImpactDialogOpen] = useState(false);
  const [selectedImpactScenarioId, setSelectedImpactScenarioId] = useState<string>("");
  const [inputDialogOpen, setInputDialogOpen] = useState(false);
  const [selectedInput, setSelectedInput] = useState<WorkforcePlanningInput | null>(null);
  
  // Approval workflow dialog states
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedSubmitScenarioId, setSelectedSubmitScenarioId] = useState<string>("");
  const [submitComment, setSubmitComment] = useState("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedApproveScenarioId, setSelectedApproveScenarioId] = useState<string>("");
  const [approveComments, setApproveComments] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRejectScenarioId, setSelectedRejectScenarioId] = useState<string>("");
  const [rejectComments, setRejectComments] = useState("");

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "scenarios") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.push(`/workforce-planning?${params.toString()}`, { scroll: false });
  };

  const loadSummary = async () => {
    try {
      // API client automatically extracts data from { success: true, data: {...} }
      const summaryData = await api.getWorkforcePlanningSummary() as WorkforcePlanningSummary;
      setSummary(summaryData);
    } catch (error: any) {
      console.error("Failed to load summary:", error);
    }
  };

  const loadScenarios = async () => {
    setScenariosLoading(true);
    try {
      // API client automatically extracts data from { success: true, data: [...] }
      const scenarios = await api.getWorkforcePlanningScenarios({
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }) as WorkforcePlanningScenario[];
      
      console.log("Loaded scenarios:", scenarios);
      
      if (Array.isArray(scenarios)) {
        setScenarios(scenarios);
      } else {
        console.warn("Unexpected response format, expected array:", scenarios);
        setScenarios([]);
      }
    } catch (error: any) {
      console.error("Failed to load scenarios:", error);
      toast.error(error.message || "Failed to load scenarios");
      setScenarios([]);
    } finally {
      setScenariosLoading(false);
    }
  };

  const loadPlanningInputs = async () => {
    setInputsLoading(true);
    try {
      // API client automatically extracts data from { success: true, data: [...] }
      const inputs = await api.getWorkforcePlanningInputs() as WorkforcePlanningInput[];
      setPlanningInputs(Array.isArray(inputs) ? inputs : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load planning inputs");
      setPlanningInputs([]);
    } finally {
      setInputsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadSummary(), loadScenarios(), loadPlanningInputs()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    loadScenarios();
  }, [searchQuery, statusFilter]);

  const handleCreateScenario = () => {
    setSelectedScenario(null);
    setScenarioDialogOpen(true);
  };

  const handleEditScenario = (scenario: WorkforcePlanningScenario) => {
    setSelectedScenario(scenario);
    setScenarioDialogOpen(true);
  };

  const handleDeleteScenario = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scenario?")) return;
    try {
      await api.deleteWorkforcePlanningScenario(id);
      toast.success("Scenario deleted successfully");
      loadScenarios();
      loadSummary();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete scenario");
    }
  };

  const handleActivateScenario = async (id: string) => {
    try {
      await api.activateWorkforcePlanningScenario(id);
      toast.success("Scenario activated successfully");
      loadScenarios();
      loadSummary();
    } catch (error: any) {
      toast.error(error.message || "Failed to activate scenario");
    }
  };

  const handleFreezeScenario = async (id: string) => {
    try {
      await api.freezeWorkforcePlanningScenario(id);
      toast.success("Scenario frozen successfully");
      loadScenarios();
      loadSummary();
    } catch (error: any) {
      toast.error(error.message || "Failed to freeze scenario");
    }
  };

  const handleArchiveScenario = async (id: string) => {
    try {
      await api.archiveWorkforcePlanningScenario(id);
      toast.success("Scenario archived successfully");
      loadScenarios();
      loadSummary();
    } catch (error: any) {
      toast.error(error.message || "Failed to archive scenario");
    }
  };

  const handleRestoreScenario = async (id: string) => {
    try {
      // Restore by changing status to DRAFT
      await api.updateWorkforcePlanningScenario(id, { status: "DRAFT" });
      toast.success("Scenario restored to Draft status");
      loadScenarios();
      loadSummary();
    } catch (error: any) {
      toast.error(error.message || "Failed to restore scenario");
    }
  };

  const handleChangeStatus = async (id: string, newStatus: ScenarioStatus) => {
    try {
      await api.updateWorkforcePlanningScenario(id, { status: newStatus });
      toast.success(`Scenario status changed to ${newStatus}`);
      loadScenarios();
      loadSummary();
    } catch (error: any) {
      toast.error(error.message || "Failed to change scenario status");
    }
  };

  const handleSubmitForApproval = async (id: string, comment?: string) => {
    try {
      await api.submitWorkforcePlanningScenario(id, comment);
      toast.success("Scenario submitted for approval");
      setSubmitDialogOpen(false);
      setSubmitComment("");
      loadScenarios();
      loadSummary();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit scenario for approval");
    }
  };

  const handleStartReview = async (id: string) => {
    try {
      await api.startReviewWorkforcePlanningScenario(id);
      toast.success("Review started");
      loadScenarios();
      loadSummary();
    } catch (error: any) {
      toast.error(error.message || "Failed to start review");
    }
  };

  const handleApprove = async (id: string, comments?: string) => {
    try {
      await api.approveWorkforcePlanningScenario(id, comments);
      toast.success("Scenario approved");
      setApproveDialogOpen(false);
      setApproveComments("");
      loadScenarios();
      loadSummary();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve scenario");
    }
  };

  const handleReject = async (id: string, comments: string) => {
    if (!comments || comments.trim() === "") {
      toast.error("Rejection comments are required");
      return;
    }
    try {
      await api.rejectWorkforcePlanningScenario(id, comments);
      toast.success("Scenario rejected");
      setRejectDialogOpen(false);
      setRejectComments("");
      loadScenarios();
      loadSummary();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject scenario");
    }
  };

  // Check user roles (simplified - in production, get from auth context)
  const getUserRoles = (): string[] => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.roles || [];
      }
    } catch (e) {
      console.error("Error getting user roles:", e);
    }
    return [];
  };

  const hasRole = (requiredRoles: string[]): boolean => {
    const userRoles = getUserRoles();
    return requiredRoles.some((role) => userRoles.includes(role));
  };

  const handleViewImpact = (scenarioId: string) => {
    setSelectedImpactScenarioId(scenarioId);
    setImpactDialogOpen(true);
  };

  const handleCreateInput = () => {
    setSelectedInput(null);
    setInputDialogOpen(true);
  };

  const handleEditInput = (input: WorkforcePlanningInput) => {
    setSelectedInput(input);
    setInputDialogOpen(true);
  };

  const handleDeleteInput = async (id: string) => {
    if (!confirm("Are you sure you want to delete this planning input?")) return;
    try {
      await api.deleteWorkforcePlanningInput(id);
      toast.success("Planning input deleted successfully");
      loadPlanningInputs();
      loadSummary();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete planning input");
    }
  };

  const handleActivateInput = async (id: string) => {
    try {
      await api.activateWorkforcePlanningInput(id);
      toast.success("Planning input activated successfully");
      loadPlanningInputs();
      loadSummary();
    } catch (error: any) {
      toast.error(error.message || "Failed to activate planning input");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  const activeInput = planningInputs.find((input) => input.isActive);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workforce Planning</h2>
          <p className="text-gray-600 mt-1">Headcount scenarios and planning inputs</p>
        </div>
        {activeTab === "scenarios" && (
          <Button onClick={handleCreateScenario}>
            <Plus className="h-4 w-4 mr-2" />
            Create Scenario
          </Button>
        )}
        {activeTab === "inputs" && (
          <Button onClick={handleCreateInput}>
            <Plus className="h-4 w-4 mr-2" />
            Create Planning Input
          </Button>
        )}
      </div>

      {/* Summary Section */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Total Scenarios</p>
              <p className="text-2xl font-bold">{summary.totalScenarios}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Active Scenarios</p>
              <p className="text-2xl font-bold">{summary.activeScenarioCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Active Scenario</p>
              <p className="text-lg font-semibold truncate">
                {summary.activeScenario?.name || "None"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Active Planning Input</p>
              <p className="text-lg font-semibold">
                {summary.activePlanningInput ? "Configured" : "Not Set"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="inputs">Planning Inputs</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search scenarios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
              suppressHydrationWarning
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="FROZEN">Frozen</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Scenarios List */}
          {scenariosLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : scenarios.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">No scenarios found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first scenario to get started"}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button onClick={handleCreateScenario} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Scenario
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {scenarios.map((scenario) => (
                <Card
                  key={scenario._id}
                  className={`${
                    scenario.status === "ACTIVE" ? "border-blue-500 bg-blue-50" : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-lg">{scenario.name}</h4>
                          <Badge className={statusColors[scenario.status] || statusColors.DRAFT}>
                            {scenario.status}
                          </Badge>
                        </div>
                        {scenario.description && (
                          <p className="text-sm text-gray-600">{scenario.description}</p>
                        )}
                        {/* Approval Timeline */}
                        {scenario.approval && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border text-xs">
                            {scenario.approval.submittedBy && (
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-gray-600">Submitted by:</span>
                                <span className="font-medium">
                                  {scenario.approval.submittedBy.name || scenario.approval.submittedBy.email}
                                </span>
                                {scenario.approval.submittedAt && (
                                  <span className="text-gray-500">
                                    on {new Date(scenario.approval.submittedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                            {scenario.approval.reviewerId && (
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-gray-600">Reviewed by:</span>
                                <span className="font-medium">
                                  {scenario.approval.reviewerId.name || scenario.approval.reviewerId.email}
                                </span>
                                {scenario.approval.reviewedAt && (
                                  <span className="text-gray-500">
                                    on {new Date(scenario.approval.reviewedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                            {scenario.approval.decision && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Decision:</span>
                                <Badge
                                  className={
                                    scenario.approval.decision === "APPROVED"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }
                                >
                                  {scenario.approval.decision}
                                </Badge>
                              </div>
                            )}
                            {scenario.approval.comments && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-gray-600 mb-1">Comments:</p>
                                <p className="text-gray-800">{scenario.approval.comments}</p>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Approval History */}
                        {scenario.approvalHistory && scenario.approvalHistory.length > 0 && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-lg border text-xs">
                            <p className="font-medium text-gray-700 mb-2">Approval History:</p>
                            <div className="space-y-1">
                              {scenario.approvalHistory.map((history, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-gray-600">
                                    {new Date(history.timestamp).toLocaleDateString()}:
                                  </span>
                                  <span className="font-medium">{history.action}</span>
                                  {history.userId && (
                                    <span className="text-gray-500">
                                      by {history.userId.name || history.userId.email}
                                    </span>
                                  )}
                                  {history.comment && (
                                    <span className="text-gray-600">- {history.comment}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="p-4 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-gray-600" />
                          <p className="text-sm text-gray-600">Target Headcount</p>
                        </div>
                        <p className="text-2xl font-bold">{formatNumber(scenario.targetHeadcount)}</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-gray-600" />
                          <p className="text-sm text-gray-600">Annual Cost</p>
                        </div>
                        <p className="text-2xl font-bold">{formatCurrency(scenario.annualCost)}</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-gray-600" />
                          <p className="text-sm text-gray-600">Net Change</p>
                        </div>
                        <p
                          className={`text-2xl font-bold ${
                            scenario.netChange >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {scenario.netChange >= 0 ? "+" : ""}
                          {formatNumber(scenario.netChange)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewImpact(scenario._id)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Simulate Impact
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditScenario(scenario)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      {/* Approval Workflow Buttons */}
                      {scenario.status === "DRAFT" && hasRole(["ADMIN", "HR_ADMIN", "HRBP"]) && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedSubmitScenarioId(scenario._id);
                            setSubmitDialogOpen(true);
                          }}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Submit for Approval
                        </Button>
                      )}
                      {scenario.status === "SUBMITTED_FOR_APPROVAL" && hasRole(["FINANCE", "HR_ADMIN"]) && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStartReview(scenario._id)}
                        >
                          <FileCheck className="h-3.5 w-3.5 mr-1" />
                          Start Review
                        </Button>
                      )}
                      {scenario.status === "UNDER_REVIEW" && hasRole(["FINANCE", "HR_ADMIN"]) && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedApproveScenarioId(scenario._id);
                              setApproveDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRejectScenarioId(scenario._id);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {scenario.status === "APPROVED" && hasRole(["ADMIN", "HR_ADMIN"]) && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleActivateScenario(scenario._id)}
                        >
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Activate
                        </Button>
                      )}
                      {scenario.status === "REJECTED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditScenario(scenario)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit Scenario
                        </Button>
                      )}
                      {scenario.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFreezeScenario(scenario._id)}
                        >
                          <Pause className="h-3.5 w-3.5 mr-1" />
                          Freeze
                        </Button>
                      )}
                      {scenario.status === "ARCHIVED" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleRestoreScenario(scenario._id)}
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            Restore to Draft
                          </Button>
                          <Select
                            value={scenario.status}
                            onValueChange={(value) => handleChangeStatus(scenario._id, value as ScenarioStatus)}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              <SelectValue placeholder="Change Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DRAFT">Draft</SelectItem>
                              <SelectItem value="SUBMITTED_FOR_APPROVAL">Submitted for Approval</SelectItem>
                              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                              <SelectItem value="APPROVED">Approved</SelectItem>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="REJECTED">Rejected</SelectItem>
                              <SelectItem value="FROZEN">Frozen</SelectItem>
                              <SelectItem value="ARCHIVED">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      )}
                      {scenario.status !== "ARCHIVED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleArchiveScenario(scenario._id)}
                        >
                          <Archive className="h-3.5 w-3.5 mr-1" />
                          Archive
                        </Button>
                      )}
                      {scenario.status !== "ACTIVE" && scenario.status !== "ARCHIVED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteScenario(scenario._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inputs" className="space-y-4">
          {inputsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Active Input Card */}
              {activeInput && (
                <Card className="border-green-500 bg-green-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Active Planning Input</CardTitle>
                      <Badge className="bg-green-600 text-white">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-white rounded-lg border">
                        <p className="text-sm text-gray-600 mb-2">Annual Budget</p>
                        <p className="text-xl font-bold">{formatCurrency(activeInput.annualBudget)}</p>
                        <Badge
                          className={`mt-2 ${approvalStatusColors[activeInput.financeApprovalStatus]}`}
                        >
                          {activeInput.financeApprovalStatus}
                        </Badge>
                      </div>
                      <div className="p-4 bg-white rounded-lg border">
                        <p className="text-sm text-gray-600 mb-2">Hiring Velocity</p>
                        <p className="text-xl font-bold">
                          {formatNumber(activeInput.hiringVelocityMinPerMonth)} -{" "}
                          {formatNumber(activeInput.hiringVelocityMaxPerMonth)} per month
                        </p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border">
                        <p className="text-sm text-gray-600 mb-2">Attrition Forecast</p>
                        <p className="text-xl font-bold">{activeInput.attritionForecastPct}%</p>
                      </div>
                    </div>
                    {activeInput.financeApprovalNote && (
                      <div className="mt-4 p-3 bg-white rounded border">
                        <p className="text-sm text-gray-600 mb-1">Finance Note:</p>
                        <p className="text-sm">{activeInput.financeApprovalNote}</p>
                      </div>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditInput(activeInput)}>
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Historical Inputs Table */}
              {planningInputs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {activeInput ? "Historical Planning Inputs" : "Planning Inputs"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Annual Budget</TableHead>
                          <TableHead>Finance Status</TableHead>
                          <TableHead>Hiring Velocity</TableHead>
                          <TableHead>Attrition %</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {planningInputs.map((input) => (
                          <TableRow key={input._id}>
                            <TableCell>{formatCurrency(input.annualBudget)}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  approvalStatusColors[input.financeApprovalStatus] ||
                                  approvalStatusColors.PENDING
                                }
                              >
                                {input.financeApprovalStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatNumber(input.hiringVelocityMinPerMonth)} -{" "}
                              {formatNumber(input.hiringVelocityMaxPerMonth)}/month
                            </TableCell>
                            <TableCell>{input.attritionForecastPct}%</TableCell>
                            <TableCell>
                              {input.isActive ? (
                                <Badge className="bg-green-600 text-white">Active</Badge>
                              ) : (
                                <Badge variant="outline">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {!input.isActive && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleActivateInput(input._id)}
                                  >
                                    <Play className="h-3.5 w-3.5 mr-1" />
                                    Activate
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditInput(input)}
                                >
                                  <Edit className="h-3.5 w-3.5 mr-1" />
                                  Edit
                                </Button>
                                {!input.isActive && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteInput(input._id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {planningInputs.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 font-medium">No planning inputs found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Create your first planning input to get started
                    </p>
                    <Button onClick={handleCreateInput} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Planning Input
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ScenarioFormDialog
        open={scenarioDialogOpen}
        onOpenChange={setScenarioDialogOpen}
        scenario={selectedScenario}
        onSuccess={async () => {
          await Promise.all([loadScenarios(), loadSummary()]);
        }}
      />

      <ScenarioImpactDialog
        open={impactDialogOpen}
        onOpenChange={setImpactDialogOpen}
        scenarioId={selectedImpactScenarioId}
      />

      <PlanningInputFormDialog
        open={inputDialogOpen}
        onOpenChange={setInputDialogOpen}
        input={selectedInput}
        onSuccess={() => {
          loadPlanningInputs();
          loadSummary();
        }}
      />

      {/* Submit for Approval Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Scenario for Approval</DialogTitle>
            <DialogDescription>
              Add an optional comment before submitting this scenario for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="submitComment">Comment (Optional)</Label>
              <Textarea
                id="submitComment"
                value={submitComment}
                onChange={(e) => setSubmitComment(e.target.value)}
                placeholder="Add any notes for reviewers..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleSubmitForApproval(selectedSubmitScenarioId, submitComment || undefined)}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Scenario</DialogTitle>
            <DialogDescription>
              Add optional comments before approving this scenario.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approveComments">Comments (Optional)</Label>
              <Textarea
                id="approveComments"
                value={approveComments}
                onChange={(e) => setApproveComments(e.target.value)}
                placeholder="Add approval comments..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() => handleApprove(selectedApproveScenarioId, approveComments || undefined)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Scenario</DialogTitle>
            <DialogDescription>
              Please provide comments explaining why this scenario is being rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectComments">Rejection Comments *</Label>
              <Textarea
                id="rejectComments"
                value={rejectComments}
                onChange={(e) => setRejectComments(e.target.value)}
                placeholder="Explain why this scenario is being rejected..."
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReject(selectedRejectScenarioId, rejectComments)}
                disabled={!rejectComments || rejectComments.trim() === ""}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WorkforcePlanning() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Workforce Planning</h2>
              <p className="text-gray-600 mt-1">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <WorkforcePlanningContent />
    </Suspense>
  );
}
