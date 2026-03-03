"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Progress } from "../../components/ui/progress";
import { Plus, Target, Users, TrendingUp } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic';

function PerformanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "goals";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "goals") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.push(`/performance?${params.toString()}`, { scroll: false });
  };
  const goals = [
    { name: "Q1 Revenue Target", weight: 40, progress: 85, owner: "Sales Team", status: "On Track" },
    { name: "Product Launch", weight: 30, progress: 65, owner: "Engineering", status: "On Track" },
    { name: "Customer Satisfaction", weight: 30, progress: 92, owner: "Support", status: "Ahead" },
  ];

  const appraisals = [
    { employee: "Sarah Johnson", period: "2026 Q1", manager_score: 4.5, okr: 85, peer: 4.2, final: 4.4, status: "Completed" },
    { employee: "Michael Chen", period: "2026 Q1", manager_score: 4.0, okr: 75, peer: 4.0, final: 3.9, status: "In Progress" },
    { employee: "Emily Rodriguez", period: "2026 Q1", manager_score: 4.8, okr: 95, peer: 4.5, final: 4.7, status: "Completed" },
  ];

  const ratingFormula = "final_rating = 0.5 * manager_score + 0.3 * okr_achievement + 0.2 * peer_feedback";

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Management</h2>
          <p className="text-gray-600 mt-1">Goals, appraisals, and development</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Goal
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="goals">Goal Setting</TabsTrigger>
          <TabsTrigger value="appraisals">Appraisals</TabsTrigger>
          <TabsTrigger value="360">360 Feedback</TabsTrigger>
          <TabsTrigger value="bias">Bias Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900">Goal Cascading</h3>
            <p className="text-sm text-blue-700 mt-1">
              Team goals automatically propagate to suggested individual goals
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current Goals (2026)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {goals.map((goal, idx) => (
                  <div key={idx} className="border-b pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Target className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold">{goal.name}</h4>
                        </div>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span>Weight: {goal.weight}%</span>
                          <span>•</span>
                          <span>Owner: {goal.owner}</span>
                        </div>
                      </div>
                      <Badge variant={goal.status === "Ahead" ? "default" : "secondary"}>
                        {goal.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} />
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Goal Weight</span>
                    <span className="text-lg font-bold text-blue-600">
                      {goals.reduce((sum, g) => sum + g.weight, 0)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Goal weights must sum to 100% at save time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appraisals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Performance Appraisals</CardTitle>
                <Button variant="outline" size="sm">View Rating Formula</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-2">Rating Formula</p>
                <code className="text-xs text-gray-700">{ratingFormula}</code>
              </div>
              <div className="space-y-4">
                {appraisals.map((appraisal, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{appraisal.employee}</h4>
                        <p className="text-sm text-gray-600">{appraisal.period}</p>
                      </div>
                      <Badge variant={appraisal.status === "Completed" ? "default" : "secondary"}>
                        {appraisal.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Manager Score</p>
                        <p className="text-lg font-semibold">{appraisal.manager_score}/5.0</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">OKR Achievement</p>
                        <p className="text-lg font-semibold">{appraisal.okr}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Peer Feedback</p>
                        <p className="text-lg font-semibold">{appraisal.peer}/5.0</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Final Rating</p>
                        <p className="text-xl font-bold text-blue-600">{appraisal.final}/5.0</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compensation Planning Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Appraisal outcomes feed into compensation planning via merit matrix
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Exceeds (4.5-5.0)</p>
                    <p className="font-semibold text-green-700">8-12% increase</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Meets (3.5-4.4)</p>
                    <p className="font-semibold text-blue-700">3-7% increase</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Below (&lt; 3.5)</p>
                    <p className="font-semibold text-orange-700">0-2% increase</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Approval chain: Manager -&gt; HRBP -&gt; Comp Committee -&gt; Finance
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="360" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>360 Feedback Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Sarah Johnson - 2026 Q1</p>
                      <p className="text-sm text-gray-600">5 of 7 responses collected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={71} className="w-32" />
                    <span className="text-sm font-medium">71%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Michael Chen - 2026 Q1</p>
                      <p className="text-sm text-gray-600">3 of 6 responses collected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={50} className="w-32" />
                    <span className="text-sm font-medium">50%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bias Detection & Fairness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Rating Distribution Analysis</p>
                    <p className="text-sm text-green-700 mt-1">
                      No significant bias detected across gender, age, or ethnicity
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg flex items-start gap-3">
                  <Users className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900">Manager Review Required</p>
                    <p className="text-sm text-orange-700 mt-1">
                      2 managers flagged for rating patterns that deviate from team trends
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Generate Detailed Fairness Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Performance() {
  return (
    <Suspense fallback={
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Performance Management</h2>
            <p className="text-gray-600 mt-1">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <PerformanceContent />
    </Suspense>
  );
}
