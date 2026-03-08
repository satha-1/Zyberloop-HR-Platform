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
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import {
  WorkforcePlanningScenario,
  WorkforcePlanningInput,
  WorkforcePlanningSummary,
} from "../../lib/types/workforcePlanning";
import { ScenarioFormDialog } from "../../components/workforce-planning/ScenarioFormDialog";
import { ScenarioImpactDialog } from "../../components/workforce-planning/ScenarioImpactDialog";
import { PlanningInputFormDialog } from "../../components/workforce-planning/PlanningInputFormDialog";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  FROZEN: "bg-orange-100 text-orange-700",
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
      const response = await api.getWorkforcePlanningSummary() as { success: boolean; data: WorkforcePlanningSummary };
      setSummary(response.data);
    } catch (error: any) {
      console.error("Failed to load summary:", error);
    }
  };

  const loadScenarios = async () => {
    setScenariosLoading(true);
    try {
      const response = await api.getWorkforcePlanningScenarios({
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }) as { success: boolean; data: WorkforcePlanningScenario[] };
      setScenarios(response.data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load scenarios");
    } finally {
      setScenariosLoading(false);
    }
  };

  const loadPlanningInputs = async () => {
    setInputsLoading(true);
    try {
      const response = await api.getWorkforcePlanningInputs() as { success: boolean; data: WorkforcePlanningInput[] };
      setPlanningInputs(response.data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load planning inputs");
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
                      {scenario.status === "DRAFT" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleActivateScenario(scenario._id)}
                        >
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Activate
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
                      {scenario.status !== "ACTIVE" && (
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
        onSuccess={() => {
          loadScenarios();
          loadSummary();
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
