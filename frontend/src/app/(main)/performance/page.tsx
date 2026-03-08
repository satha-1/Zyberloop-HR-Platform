"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import {
  Plus, Target, Users, TrendingUp, AlertTriangle, CheckCircle2,
  RefreshCw, Eye, Send, ChevronDown, ChevronUp, Settings, BarChart3,
  Flag, Loader2, Info,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";

export const dynamic = "force-dynamic";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Cycle { _id: string; name: string; status: string; startDate: string; endDate: string; }
interface Goal {
  _id: string; title: string; description?: string; ownerType: string;
  weight: number; progress: number; status: string; isSuggested: boolean; suggestionStatus: string;
}
interface Appraisal {
  _id: string; status: string; managerScore: number; okrAchievementPct: number;
  peerFeedbackScore: number; finalRating: number; formulaVersionNumber: number;
  selfAssessmentText?: string; managerAssessmentText?: string;
  employeeId: { _id: string; firstName: string; lastName: string; jobTitle?: string; employeeCode?: string };
  managerId?: { firstName: string; lastName: string };
  approvals: Array<{ stepName: string; status: string; note?: string }>;
}
interface Assignment {
  _id: string; collectedResponsesCount: number; requiredResponsesCount: number;
  status: string; deadlineAt?: string;
  targetEmployeeId: { _id: string; firstName: string; lastName: string; employeeCode?: string };
}
interface BiasFlag {
  _id: string; type: string; subjectId: string; metricName: string;
  metricValue: number; threshold: number; comparisonBaseline: number;
  status: string; notes?: string; createdAt: string;
}
interface Formula { managerWeight: number; okrWeight: number; peerWeight: number; versionNumber: number; }
interface MeritBand { name: string; minRating: number; maxRating: number; minIncreasePct: number; maxIncreasePct: number; }
interface MeritMatrix { bands: MeritBand[]; approvalChain: string[]; }

// â”€â”€â”€ Status colour helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const goalStatusColor: Record<string, string> = {
  ON_TRACK: "bg-blue-100 text-blue-800",
  AHEAD: "bg-green-100 text-green-800",
  AT_RISK: "bg-orange-100 text-orange-800",
  OFF_TRACK: "bg-red-100 text-red-800",
};
const appraisalStatusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  SUBMITTED_BY_EMPLOYEE: "bg-blue-100 text-blue-800",
  SUBMITTED_BY_MANAGER: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CALIBRATED: "bg-teal-100 text-teal-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
};
const biasFlagColor: Record<string, string> = {
  OPEN: "bg-red-100 text-red-800",
  REVIEWED: "bg-yellow-100 text-yellow-800",
  DISMISSED: "bg-gray-100 text-gray-600",
  ACTIONED: "bg-green-100 text-green-800",
};

function ratingBar(v: number) {
  const pct = (v / 5) * 100;
  const col = v >= 4.5 ? "bg-green-500" : v >= 3.5 ? "bg-blue-500" : "bg-orange-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${col}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold w-8 text-right">{v.toFixed(1)}</span>
    </div>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PerformanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "goals";

  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [biasFlags, setBiasFlags] = useState<BiasFlag[]>([]);
  const [biasSummary, setBiasSummary] = useState<any>(null);
  const [formula, setFormula] = useState<Formula | null>(null);
  const [meritMatrix, setMeritMatrix] = useState<MeritMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [employees, setEmployees] = useState<Array<{ _id: string; firstName: string; lastName: string }>>([]);

  // Modals
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showAppraisalModal, setShowAppraisalModal] = useState<Appraisal | null>(null);
  const [showBiasDetail, setShowBiasDetail] = useState<BiasFlag | null>(null);

  // Forms
  const [cycleForm, setCycleForm] = useState({ name: "", startDate: "", endDate: "" });
  const [goalForm, setGoalForm] = useState({ title: "", description: "", ownerType: "TEAM", ownerId: "", weight: 20, status: "ON_TRACK" });
  const [formulaForm, setFormulaForm] = useState({ managerWeight: 0.5, okrWeight: 0.3, peerWeight: 0.2 });
  const [appraisalEdit, setAppraisalEdit] = useState({ managerScore: 0, managerAssessmentText: "", okrAchievementPct: 0, peerFeedbackScore: 0 });

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "goals") params.delete("tab"); else params.set("tab", value);
    router.push(`/performance?${params.toString()}`, { scroll: false });
  };

  // Load cycles + employees on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cyclesData, empsData] = await Promise.allSettled([
          api.getPerformanceCycles(),
          api.getEmployees({ status: "active" }),
        ]);
        if (cyclesData.status === "fulfilled") {
          const data = cyclesData.value as Cycle[];
          setCycles(data || []);
          const active = (data || []).find((c: Cycle) => c.status === "ACTIVE") || data?.[0] || null;
          setActiveCycle(active);
        } else {
          toast.error("Failed to load cycles");
        }
        if (empsData.status === "fulfilled") {
          const empResult = empsData.value as any;
          const empList = Array.isArray(empResult) ? empResult : empResult?.employees || empResult?.data || [];
          setEmployees(empList);
        }
      } catch (e: any) {
        toast.error("Failed to load data: " + (e.message || "Unknown error"));
      } finally { setLoading(false); }
    })();
  }, []);

  // Load tab data when cycle or tab changes
  useEffect(() => {
    if (!activeCycle) return;
    (async () => {
      setTabLoading(true);
      try {
        if (activeTab === "goals") {
          const data = await api.getGoals(activeCycle._id) as Goal[];
          setGoals(data || []);
        } else if (activeTab === "appraisals") {
          const [apData, formulaData, matrixData] = await Promise.allSettled([
            api.getAppraisals(activeCycle._id),
            api.getRatingFormula(activeCycle._id),
            api.getMeritMatrix(activeCycle._id),
          ]);
          if (apData.status === "fulfilled") setAppraisals((apData.value as any) || []);
          if (formulaData.status === "fulfilled") setFormula((formulaData.value as any) || null);
          if (matrixData.status === "fulfilled") setMeritMatrix((matrixData.value as any) || null);
        } else if (activeTab === "360") {
          const data = await api.get360Assignments(activeCycle._id) as Assignment[];
          setAssignments(data || []);
        } else if (activeTab === "bias") {
          const [flagsData, summaryData] = await Promise.allSettled([
            api.getBiasFlags(activeCycle._id),
            api.getBiasSummary(activeCycle._id),
          ]);
          if (flagsData.status === "fulfilled") setBiasFlags((flagsData.value as any) || []);
          if (summaryData.status === "fulfilled") setBiasSummary((summaryData.value as any)?.summary || null);
        }
      } catch (e: any) {
        toast.error("Failed to load data: " + (e.message || "Unknown error"));
      } finally { setTabLoading(false); }
    })();
  }, [activeCycle, activeTab]);

  const handleCreateCycle = async () => {
    try {
      const c = await api.createPerformanceCycle(cycleForm) as Cycle;
      setCycles((prev) => [c, ...prev]);
      setActiveCycle(c);
      setShowCycleModal(false);
      setCycleForm({ name: "", startDate: "", endDate: "" });
      toast.success("Cycle created");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCreateGoal = async () => {
    if (!activeCycle) return;
    try {
      const payload: any = { ...goalForm };
      // ownerId is optional on the frontend – backend defaults to req.user.id when omitted
      if (!payload.ownerId) delete payload.ownerId;
      const g = await api.createGoal(activeCycle._id, payload) as Goal;
      setGoals((prev) => [...prev, g]);
      setShowGoalModal(false);
      setGoalForm({ title: "", description: "", ownerType: "TEAM", ownerId: "", weight: 20, status: "ON_TRACK" });
      toast.success("Goal created");
    } catch (e: any) { toast.error(e.message || "Failed to create goal"); }
  };

  const handleCascadeGoals = async () => {
    if (!activeCycle) return;
    try {
      const res: any = await api.cascadeGoals(activeCycle._id);
      toast.success(res.message || "Goals cascaded");
      const data = await api.getGoals(activeCycle._id) as Goal[];
      setGoals(data || []);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAcceptSuggestion = async (goalId: string) => {
    try {
      await api.acceptGoalSuggestion(goalId);
      setGoals((prev) => prev.map((g) => g._id === goalId ? { ...g, isSuggested: false, suggestionStatus: "ACCEPTED" } : g));
      toast.success("Suggestion accepted");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleRejectSuggestion = async (goalId: string) => {
    try {
      await api.rejectGoalSuggestion(goalId);
      setGoals((prev) => prev.filter((g) => g._id !== goalId));
      toast.success("Suggestion rejected");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleGenerateAppraisals = async () => {
    if (!activeCycle) return;
    try {
      const res: any = await api.generateAppraisals(activeCycle._id);
      toast.success(res.message || "Appraisals generated");
      const data = await api.getAppraisals(activeCycle._id) as Appraisal[];
      setAppraisals(data || []);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveFormula = async () => {
    if (!activeCycle) return;
    const total = formulaForm.managerWeight + formulaForm.okrWeight + formulaForm.peerWeight;
    if (Math.abs(total - 1) > 0.01) { toast.error("Weights must sum to 1.0"); return; }
    try {
      const f: any = await api.upsertRatingFormula(activeCycle._id, formulaForm);
      setFormula(f);
      setShowFormulaModal(false);
      toast.success("Formula saved (v" + f.versionNumber + ")");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveAppraisal = async () => {
    if (!showAppraisalModal) return;
    try {
      const updated: any = await api.updateAppraisal(showAppraisalModal._id, appraisalEdit);
      setAppraisals((prev) => prev.map((a) => a._id === updated._id ? updated : a));
      setShowAppraisalModal(null);
      toast.success("Appraisal saved â€” final rating: " + updated.finalRating?.toFixed(2));
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSync360 = async () => {
    if (!activeCycle) return;
    try {
      const res: any = await api.sync360ToAppraisals(activeCycle._id);
      toast.success(res.message || "Peer scores synced");
      const data = await api.getAppraisals(activeCycle._id) as Appraisal[];
      setAppraisals(data || []);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSendInvites = async (assignmentId: string) => {
    try {
      await api.send360Invites(assignmentId);
      toast.success("Invitations sent");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleRunBias = async () => {
    if (!activeCycle) return;
    try {
      const res: any = await api.runBiasDetection(activeCycle._id);
      toast.success(res.message || "Bias detection complete");
      const flags = await api.getBiasFlags(activeCycle._id) as BiasFlag[];
      setBiasFlags(flags || []);
      const summary: any = await api.getBiasSummary(activeCycle._id);
      setBiasSummary(summary?.summary || null);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleUpdateBiasFlag = async (id: string, status: string) => {
    try {
      const updated: any = await api.updateBiasFlag(id, { status });
      setBiasFlags((prev) => prev.map((f) => f._id === id ? { ...f, status: updated.status } : f));
      toast.success(`Flag marked ${status.toLowerCase()}`);
    } catch (e: any) { toast.error(e.message); }
  };

  // Derived
  const teamGoals = goals.filter((g) => g.ownerType === "TEAM" && !g.isSuggested);
  const individualGoals = goals.filter((g) => g.ownerType === "INDIVIDUAL" && !g.isSuggested);
  const suggestedGoals = goals.filter((g) => g.isSuggested && g.suggestionStatus === "PENDING");
  const totalTeamWeight = teamGoals.reduce((s, g) => s + g.weight, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading Performance Management...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Management</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Goals, appraisals, 360 feedback, and bias detection</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Cycle selector */}
          <Select
            value={activeCycle?._id || ""}
            onValueChange={(v) => { const c = cycles.find((x) => x._id === v); if (c) setActiveCycle(c); }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select cycle" />
            </SelectTrigger>
            <SelectContent>
              {cycles.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                  <span className={`ml-2 text-xs ${c.status === "ACTIVE" ? "text-green-600" : "text-gray-400"}`}>
                    ({c.status})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setShowCycleModal(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Cycle
          </Button>
        </div>
      </div>

      {/* Active cycle banner */}
      {activeCycle && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${activeCycle.status === "ACTIVE" ? "bg-green-500" : "bg-gray-400"}`} />
          <span className="font-medium text-blue-900">{activeCycle.name}</span>
          <span className="text-blue-600">
            {new Date(activeCycle.startDate).toLocaleDateString()} â€“ {new Date(activeCycle.endDate).toLocaleDateString()}
          </span>
          <Badge variant="outline" className={activeCycle.status === "ACTIVE" ? "border-green-500 text-green-700" : ""}>
            {activeCycle.status}
          </Badge>
        </div>
      )}

      {!activeCycle && (
        <div className="p-8 text-center text-gray-500 border-2 border-dashed rounded-xl">
          <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No performance cycles found</p>
          <p className="text-sm mt-1">Create a cycle to start managing performance</p>
          <Button className="mt-4" onClick={() => setShowCycleModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create First Cycle
          </Button>
        </div>
      )}

      {activeCycle && (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="goals">Goal Setting</TabsTrigger>
            <TabsTrigger value="appraisals">Appraisals</TabsTrigger>
            <TabsTrigger value="360">360 Feedback</TabsTrigger>
            <TabsTrigger value="bias">Bias Detection</TabsTrigger>
          </TabsList>

          {/* â•â•â• GOAL SETTING TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <TabsContent value="goals" className="space-y-4 mt-4">
            {tabLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
            ) : (
              <>
                {/* Cascading info card */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-blue-900">Goal Cascading</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Team goals automatically propagate to suggested individual goals. Employees can accept or reject.
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="border-blue-400 text-blue-700 hover:bg-blue-100 flex-shrink-0" onClick={handleCascadeGoals}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Cascade Goals
                    </Button>
                  </div>
                </div>

                {/* Pending suggestions */}
                {suggestedGoals.length > 0 && (
                  <Card className="border-amber-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-amber-800 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> {suggestedGoals.length} Suggested Goal{suggestedGoals.length > 1 ? "s" : ""} Pending Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {suggestedGoals.map((g) => (
                          <div key={g._id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div>
                              <p className="font-medium text-sm text-gray-900">{g.title}</p>
                              <p className="text-xs text-gray-500">Weight: {g.weight}%</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="text-green-700 border-green-400 hover:bg-green-50" onClick={() => handleAcceptSuggestion(g._id)}>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleRejectSuggestion(g._id)}>
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Team Goals */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Team Goals â€” {activeCycle.name}</CardTitle>
                      <Button size="sm" onClick={() => { setGoalForm((f) => ({ ...f, ownerType: "TEAM" })); setShowGoalModal(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Team Goal
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {teamGoals.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No team goals yet</p>
                    ) : (
                      <div className="space-y-5">
                        {teamGoals.map((g) => (
                          <div key={g._id} className="border-b pb-5 last:border-0 last:pb-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  <h4 className="font-semibold text-gray-900 truncate">{g.title}</h4>
                                </div>
                                {g.description && <p className="text-xs text-gray-500 mt-1 ml-6">{g.description}</p>}
                                <p className="text-xs text-gray-500 mt-1 ml-6">Weight: {g.weight}%</p>
                              </div>
                              <Badge className={`ml-2 flex-shrink-0 text-xs ${goalStatusColor[g.status] || "bg-gray-100 text-gray-700"}`}>
                                {g.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Progress</span><span className="font-medium">{g.progress}%</span>
                              </div>
                              <Progress value={g.progress} className="h-2" />
                            </div>
                          </div>
                        ))}
                        <div className="pt-3 border-t flex justify-between items-center">
                          <span className="font-semibold text-sm text-gray-700">Total Team Goal Weight</span>
                          <span className={`text-lg font-bold ${totalTeamWeight === 100 ? "text-green-600" : totalTeamWeight > 100 ? "text-red-600" : "text-orange-500"}`}>
                            {totalTeamWeight}%
                          </span>
                        </div>
                        {totalTeamWeight !== 100 && (
                          <p className="text-xs text-orange-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Goal weights must sum to 100% at save time
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Individual Goals */}
                {individualGoals.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Individual Goals</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => { setGoalForm((f) => ({ ...f, ownerType: "INDIVIDUAL" })); setShowGoalModal(true); }}>
                          <Plus className="h-4 w-4 mr-1" /> Add Individual Goal
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {individualGoals.map((g) => (
                          <div key={g._id} className="flex items-center gap-4 p-3 border rounded-lg">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm text-gray-900 truncate">{g.title}</p>
                                <Badge className={`text-xs flex-shrink-0 ${goalStatusColor[g.status] || "bg-gray-100"}`}>
                                  {g.status.replace("_", " ")}
                                </Badge>
                              </div>
                              <Progress value={g.progress} className="h-1.5" />
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold">{g.progress}%</p>
                              <p className="text-xs text-gray-400">{g.weight}% weight</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* â•â•â• APPRAISALS TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <TabsContent value="appraisals" className="space-y-4 mt-4">
            {tabLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
            ) : (
              <>
                {/* Actions bar */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-base font-semibold text-gray-800">Performance Appraisals â€” {activeCycle.name}</h2>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => {
                      if (formula) setFormulaForm({ managerWeight: formula.managerWeight, okrWeight: formula.okrWeight, peerWeight: formula.peerWeight });
                      setShowFormulaModal(true);
                    }}>
                      <Settings className="h-4 w-4 mr-1" /> View/Edit Rating Formula
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSync360}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Sync 360 Scores
                    </Button>
                    <Button size="sm" onClick={handleGenerateAppraisals}>
                      <Plus className="h-4 w-4 mr-1" /> Generate Appraisals
                    </Button>
                  </div>
                </div>

                {/* Formula summary */}
                {formula && (
                  <div className="p-3 bg-gray-50 border rounded-lg text-xs text-gray-600 font-mono">
                    final_rating = {formula.managerWeight}Ã—manager + {formula.okrWeight}Ã—(okr%/100Ã—5) + {formula.peerWeight}Ã—peer
                    <span className="ml-2 text-gray-400">(v{formula.versionNumber})</span>
                  </div>
                )}

                {/* Appraisal cards */}
                {appraisals.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium">No appraisals yet</p>
                    <p className="text-sm mt-1">Click "Generate Appraisals" to create appraisals for all active employees</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {appraisals.map((a) => (
                      <Card key={a._id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {a.employeeId?.firstName} {a.employeeId?.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {a.employeeId?.jobTitle || a.employeeId?.employeeCode || ""} Â· {activeCycle.name}
                              </p>
                            </div>
                            <Badge className={`text-xs ${appraisalStatusColor[a.status] || "bg-gray-100"}`}>
                              {a.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Manager Score</p>
                              {ratingBar(a.managerScore || 0)}
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">OKR Achievement</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-purple-400" style={{ width: `${a.okrAchievementPct || 0}%` }} />
                                </div>
                                <span className="text-sm font-semibold w-10 text-right">{a.okrAchievementPct || 0}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Peer Feedback</p>
                              {ratingBar(a.peerFeedbackScore || 0)}
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Final Rating</p>
                              <div className="flex items-center gap-2">
                                <div className={`text-2xl font-bold ${(a.finalRating || 0) >= 4.5 ? "text-green-600" : (a.finalRating || 0) >= 3.5 ? "text-blue-600" : "text-orange-500"}`}>
                                  {(a.finalRating || 0).toFixed(2)}
                                </div>
                                <span className="text-xs text-gray-400">/5.0</span>
                              </div>
                            </div>
                          </div>
                          {/* Approval chain */}
                          <div className="flex items-center gap-1 flex-wrap mt-2">
                            {a.approvals?.map((step, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${step.status === "APPROVED" ? "bg-green-100 text-green-700" : step.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                                  {step.stepName}
                                </span>
                                {i < a.approvals.length - 1 && <span className="text-gray-300 text-xs">â†’</span>}
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setAppraisalEdit({ managerScore: a.managerScore || 0, managerAssessmentText: a.managerAssessmentText || "", okrAchievementPct: a.okrAchievementPct || 0, peerFeedbackScore: a.peerFeedbackScore || 0 });
                              setShowAppraisalModal(a);
                            }}>
                              <Eye className="h-3.5 w-3.5 mr-1" /> Edit Scores
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Merit Matrix */}
                {meritMatrix && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Compensation Planning â€” Merit Matrix</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        {meritMatrix.bands.map((band, i) => {
                          const colors = ["bg-green-50 border-green-200 text-green-800", "bg-blue-50 border-blue-200 text-blue-800", "bg-orange-50 border-orange-200 text-orange-800"];
                          return (
                            <div key={i} className={`p-4 rounded-lg border ${colors[i] || colors[0]}`}>
                              <p className="text-sm font-semibold">{band.name}</p>
                              <p className="text-xs opacity-75 mt-0.5">{band.minRating}â€“{band.maxRating} rating</p>
                              <p className="text-base font-bold mt-1">{band.minIncreasePct}â€“{band.maxIncreasePct}% increase</p>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="font-medium">Approval chain:</span>
                        {meritMatrix.approvalChain.join(" â†’ ")}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* â•â•â• 360 FEEDBACK TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <TabsContent value="360" className="space-y-4 mt-4">
            {tabLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-base font-semibold text-gray-800">360 Feedback â€" {activeCycle.name}</h2>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push(`/performance/360/templates?cycleId=${activeCycle._id}`)}
                    >
                      <Settings className="h-4 w-4 mr-1" /> Manage Templates
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push(`/performance/360/assignments?cycleId=${activeCycle._id}`)}
                    >
                      <Users className="h-4 w-4 mr-1" /> Manage Assignments
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSync360}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Sync to Appraisals
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-blue-200 hover:border-blue-400 transition-colors cursor-pointer" onClick={() => router.push(`/performance/360/templates/new?cycleId=${activeCycle._id}`)}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Settings className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">Create Feedback Template</h3>
                          <p className="text-sm text-gray-600">
                            Build a custom 360-degree feedback questionnaire with sections and questions
                          </p>
                        </div>
                        <Plus className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 hover:border-green-400 transition-colors cursor-pointer" onClick={() => router.push(`/performance/360/assignments/generate?cycleId=${activeCycle._id}`)}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">Generate Assignments</h3>
                          <p className="text-sm text-gray-600">
                            Create feedback assignments for employees and configure raters
                          </p>
                        </div>
                        <Plus className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {assignments.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium">No 360 assignments yet</p>
                    <p className="text-sm mt-1 mb-4">Create a template and generate assignments to collect feedback</p>
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/performance/360/templates/new?cycleId=${activeCycle._id}`)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Create Template
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => router.push(`/performance/360/assignments/generate?cycleId=${activeCycle._id}`)}
                      >
                        <Users className="h-4 w-4 mr-1" /> Generate Assignments
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignments.map((a) => {
                      const pct = a.requiredResponsesCount > 0
                        ? Math.round((a.collectedResponsesCount / a.requiredResponsesCount) * 100)
                        : 0;
                      return (
                        <Card 
                          key={a._id} 
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(`/performance/360/assignments/${a._id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Users className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {a.targetEmployeeId?.firstName} {a.targetEmployeeId?.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {a.collectedResponsesCount} of {a.requiredResponsesCount} responses collected
                                    {a.deadlineAt && ` Â· Due ${new Date(a.deadlineAt).toLocaleDateString()}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="w-36">
                                  <Progress value={pct} className="h-2" />
                                </div>
                                <span className={`text-sm font-semibold w-10 text-right ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-blue-600" : "text-orange-500"}`}>
                                  {pct}%
                                </span>
                                <Badge className={`text-xs ${a.status === "COMPLETED" ? "bg-green-100 text-green-700" : a.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                                  {a.status.replace("_", " ")}
                                </Badge>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendInvites(a._id);
                                  }}
                                >
                                  <Send className="h-3.5 w-3.5 mr-1" /> Send Reminders
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/performance/360/assignments/${a._id}`);
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* â•â•â• BIAS DETECTION TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <TabsContent value="bias" className="space-y-4 mt-4">
            {tabLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-base font-semibold text-gray-800">Bias Detection â€” {activeCycle.name}</h2>
                  <Button size="sm" onClick={handleRunBias}>
                    <BarChart3 className="h-4 w-4 mr-1" /> Run Bias Detection
                  </Button>
                </div>

                {/* Summary cards */}
                {biasSummary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Total Flags", value: biasSummary.total, color: "text-gray-800" },
                      { label: "Open", value: biasSummary.open, color: "text-red-600" },
                      { label: "Reviewed", value: biasSummary.reviewed, color: "text-yellow-600" },
                      { label: "Actioned", value: biasSummary.actioned, color: "text-green-600" },
                    ].map((item) => (
                      <Card key={item.label}>
                        <CardContent className="p-4 text-center">
                          <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Flags list */}
                {biasFlags.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium">No bias flags</p>
                    <p className="text-sm mt-1">Run bias detection to analyse rating patterns</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {biasFlags.map((f) => (
                      <Card key={f._id} className={f.status === "OPEN" ? "border-red-200" : ""}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between flex-wrap gap-3">
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${f.status === "OPEN" ? "bg-red-100" : "bg-gray-100"}`}>
                                <Flag className={`h-4 w-4 ${f.status === "OPEN" ? "text-red-600" : "text-gray-500"}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-gray-900 text-sm">{f.type.replace(/_/g, " ")}</p>
                                  <Badge className={`text-xs ${biasFlagColor[f.status] || "bg-gray-100"}`}>{f.status}</Badge>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                  <span className="font-medium">{f.metricName}:</span> {f.metricValue.toFixed(2)} (org avg: {f.comparisonBaseline.toFixed(2)}, threshold: Â±{f.threshold})
                                </p>
                                {f.notes && <p className="text-xs text-gray-500 mt-1 italic">"{f.notes}"</p>}
                                <p className="text-xs text-gray-400 mt-1">{new Date(f.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            {f.status === "OPEN" && (
                              <div className="flex gap-2 flex-shrink-0">
                                <Button size="sm" variant="outline" onClick={() => handleUpdateBiasFlag(f._id, "REVIEWED")}>
                                  Mark Reviewed
                                </Button>
                                <Button size="sm" variant="outline" className="text-green-700 border-green-400" onClick={() => handleUpdateBiasFlag(f._id, "ACTIONED")}>
                                  Mark Actioned
                                </Button>
                                <Button size="sm" variant="ghost" className="text-gray-500" onClick={() => handleUpdateBiasFlag(f._id, "DISMISSED")}>
                                  Dismiss
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* â”€â”€ CREATE CYCLE MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog open={showCycleModal} onOpenChange={setShowCycleModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Performance Cycle</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Cycle Name (e.g. 2026 Q2)</Label>
              <Input value={cycleForm.name} onChange={(e) => setCycleForm((f) => ({ ...f, name: e.target.value }))} placeholder="2026 Q2" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label>
                <Input type="date" value={cycleForm.startDate} onChange={(e) => setCycleForm((f) => ({ ...f, startDate: e.target.value }))} className="mt-1" />
              </div>
              <div><Label>End Date</Label>
                <Input type="date" value={cycleForm.endDate} onChange={(e) => setCycleForm((f) => ({ ...f, endDate: e.target.value }))} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCycleModal(false)}>Cancel</Button>
            <Button onClick={handleCreateCycle} disabled={!cycleForm.name || !cycleForm.startDate || !cycleForm.endDate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* â”€â”€ CREATE GOAL MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog open={showGoalModal} onOpenChange={(o) => { setShowGoalModal(o); if (!o) setGoalForm({ title: "", description: "", ownerType: "TEAM", ownerId: "", weight: 20, status: "ON_TRACK" }); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Goal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input value={goalForm.title} onChange={(e) => setGoalForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Complete three courses in Q1" className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={goalForm.description} onChange={(e) => setGoalForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional — add more context" className="mt-1" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Owner Type</Label>
                <Select value={goalForm.ownerType} onValueChange={(v) => setGoalForm((f) => ({ ...f, ownerType: v, ownerId: "" }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEAM">Team</SelectItem>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Weight (%) <span className="text-red-500">*</span></Label>
                <Input type="number" min={1} max={100} value={goalForm.weight} onChange={(e) => setGoalForm((f) => ({ ...f, weight: Number(e.target.value) }))} className="mt-1" />
              </div>
            </div>

            {/* Employee picker — only for INDIVIDUAL goals */}
            {goalForm.ownerType === "INDIVIDUAL" && (
              <div>
                <Label>Assign to Employee <span className="text-gray-400 text-xs">(optional — defaults to you)</span></Label>
                <Select value={goalForm.ownerId} onValueChange={(v) => setGoalForm((f) => ({ ...f, ownerId: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select employee or leave blank for self" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Status</Label>
              <Select value={goalForm.status} onValueChange={(v) => setGoalForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["ON_TRACK", "AHEAD", "AT_RISK", "OFF_TRACK"].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Weight hint */}
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              All goals for the same owner must sum to exactly 100% to save the appraisal.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalModal(false)}>Cancel</Button>
            <Button onClick={handleCreateGoal} disabled={!goalForm.title || goalForm.weight <= 0}>
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* â”€â”€ RATING FORMULA MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog open={showFormulaModal} onOpenChange={setShowFormulaModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rating Formula Configuration</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Weights must sum to 1.0. Each increment creates a new auditable version.
            </p>
            <div className="p-3 bg-gray-50 rounded-lg font-mono text-xs text-gray-700">
              final = {formulaForm.managerWeight}Ã—manager + {formulaForm.okrWeight}Ã—(okr%Ã·100Ã—5) + {formulaForm.peerWeight}Ã—peer
            </div>
            <div className="space-y-3">
              {(["managerWeight", "okrWeight", "peerWeight"] as const).map((k) => (
                <div key={k} className="flex items-center gap-3">
                  <Label className="w-36 text-right capitalize flex-shrink-0">{k.replace("Weight", " Weight")}</Label>
                  <Input type="number" step="0.05" min={0} max={1} value={formulaForm[k]}
                    onChange={(e) => setFormulaForm((f) => ({ ...f, [k]: Number(e.target.value) }))} className="flex-1" />
                </div>
              ))}
            </div>
            <div className={`text-sm font-medium ${Math.abs(formulaForm.managerWeight + formulaForm.okrWeight + formulaForm.peerWeight - 1) < 0.01 ? "text-green-600" : "text-red-500"}`}>
              Total: {(formulaForm.managerWeight + formulaForm.okrWeight + formulaForm.peerWeight).toFixed(2)} (must = 1.0)
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormulaModal(false)}>Cancel</Button>
            <Button onClick={handleSaveFormula}>Save Formula</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* â”€â”€ EDIT APPRAISAL MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog open={!!showAppraisalModal} onOpenChange={(o) => !o && setShowAppraisalModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Edit Appraisal â€” {showAppraisalModal?.employeeId?.firstName} {showAppraisalModal?.employeeId?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Manager Score (0â€“5)</Label>
                <Input type="number" min={0} max={5} step={0.1} value={appraisalEdit.managerScore}
                  onChange={(e) => setAppraisalEdit((f) => ({ ...f, managerScore: Number(e.target.value) }))} className="mt-1" />
              </div>
              <div><Label>OKR Achievement (%)</Label>
                <Input type="number" min={0} max={100} value={appraisalEdit.okrAchievementPct}
                  onChange={(e) => setAppraisalEdit((f) => ({ ...f, okrAchievementPct: Number(e.target.value) }))} className="mt-1" />
              </div>
              <div><Label>Peer Feedback Score (0â€“5)</Label>
                <Input type="number" min={0} max={5} step={0.1} value={appraisalEdit.peerFeedbackScore}
                  onChange={(e) => setAppraisalEdit((f) => ({ ...f, peerFeedbackScore: Number(e.target.value) }))} className="mt-1" />
              </div>
              <div className="flex flex-col justify-end pb-1">
                <p className="text-xs text-gray-500">Computed Final Rating</p>
                <p className="text-lg font-bold text-blue-600">
                  {(0.5 * appraisalEdit.managerScore + 0.3 * (appraisalEdit.okrAchievementPct / 100 * 5) + 0.2 * appraisalEdit.peerFeedbackScore).toFixed(2)}/5.0
                </p>
              </div>
            </div>
            <div><Label>Manager Assessment</Label>
              <Textarea value={appraisalEdit.managerAssessmentText}
                onChange={(e) => setAppraisalEdit((f) => ({ ...f, managerAssessmentText: e.target.value }))}
                rows={3} className="mt-1" placeholder="Manager's assessment comments..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppraisalModal(null)}>Cancel</Button>
            <Button onClick={handleSaveAppraisal}>Save & Recalculate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PerformancePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <PerformanceContent />
    </Suspense>
  );
}
