"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { TrendingUp, Users, DollarSign, AlertTriangle } from "lucide-react";

export default function WorkforcePlanning() {
  const scenarios = [
    { name: "Growth Scenario", headcount: 120, cost: "$14.4M", status: "Active", type: "growth" },
    { name: "Freeze Scenario", headcount: 100, cost: "$12.0M", status: "Draft", type: "freeze" },
    { name: "Restructure Scenario", headcount: 85, cost: "$10.2M", status: "Draft", type: "restructure" },
  ];

  const attritionRisk = [
    { employee: "James Wilson", risk: 0.85, tenure: "8 years", lastPromotion: "2 years ago", actions: ["Retention bonus", "Career discussion"] },
    { employee: "Sarah Johnson", risk: 0.72, tenure: "6 years", lastPromotion: "1 year ago", actions: ["Market comp adjustment"] },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workforce Planning</h2>
          <p className="text-gray-600 mt-1">Headcount scenarios and attrition analysis</p>
        </div>
        <Button>
          <TrendingUp className="h-4 w-4 mr-2" />
          Create Scenario
        </Button>
      </div>

      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="attrition">Attrition Prediction</TabsTrigger>
          <TabsTrigger value="budget">Budget Allocation</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Headcount Planning Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scenarios.map((scenario, idx) => (
                  <div
                    key={idx}
                    className={`p-6 border-2 rounded-lg ${
                      scenario.status === "Active" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{scenario.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {scenario.type === "growth"
                            ? "20% headcount increase over 12 months"
                            : scenario.type === "freeze"
                            ? "Maintain current headcount, backfill only"
                            : "15% reduction, optimize org structure"}
                        </p>
                      </div>
                      <Badge variant={scenario.status === "Active" ? "default" : "secondary"}>
                        {scenario.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-gray-600" />
                          <p className="text-sm text-gray-600">Target Headcount</p>
                        </div>
                        <p className="text-2xl font-bold">{scenario.headcount}</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-gray-600" />
                          <p className="text-sm text-gray-600">Annual Cost</p>
                        </div>
                        <p className="text-2xl font-bold">{scenario.cost}</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-gray-600" />
                          <p className="text-sm text-gray-600">Net Change</p>
                        </div>
                        <p className="text-2xl font-bold">
                          {scenario.headcount > 100 ? "+" : ""}
                          {scenario.headcount - 100}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button size="sm" variant={scenario.status === "Active" ? "outline" : "default"}>
                        {scenario.status === "Active" ? "View Details" : "Activate"}
                      </Button>
                      <Button size="sm" variant="outline">
                        Simulate Impact
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Constraint Solver Inputs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Annual Budget</p>
                  <p className="text-xl font-bold">$14.4M</p>
                  <p className="text-xs text-gray-500 mt-1">Approved by Finance</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Hiring Velocity</p>
                  <p className="text-xl font-bold">3-4 per month</p>
                  <p className="text-xs text-gray-500 mt-1">Based on recruiter capacity</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Attrition Forecast</p>
                  <p className="text-xl font-bold">12%</p>
                  <p className="text-xs text-gray-500 mt-1">Industry benchmark</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attrition" className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-orange-900">2 High-Risk Employees Identified</p>
              <p className="text-sm text-orange-700 mt-1">
                Immediate retention actions recommended
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attrition Risk Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attritionRisk.map((person, idx) => (
                  <div key={idx} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{person.employee}</h4>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span>Tenure: {person.tenure}</span>
                          <span>•</span>
                          <span>Last Promotion: {person.lastPromotion}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">Risk Score</p>
                        <p className="text-3xl font-bold text-red-600">{(person.risk * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Recommended Actions:</p>
                      <div className="flex gap-2">
                        {person.actions.map((action, i) => (
                          <Badge key={i} variant="outline">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button size="sm">Create Retention Plan</Button>
                      <Button size="sm" variant="outline">
                        Schedule Manager Task
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prediction Model Inputs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-600">Tenure</p>
                  <p className="font-medium mt-1">Years at company</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-600">Time Since Promotion</p>
                  <p className="font-medium mt-1">Career stagnation indicator</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-600">Performance Trend</p>
                  <p className="font-medium mt-1">Last 3 reviews</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-600">Engagement Score</p>
                  <p className="font-medium mt-1">Survey responses</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-600">Absence Frequency</p>
                  <p className="font-medium mt-1">Leave patterns</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-600">Market Comp Delta</p>
                  <p className="font-medium mt-1">vs industry benchmarks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Promotion Budget Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Engineering Department</span>
                    <span className="text-sm text-gray-600">Budget: $250,000</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Proposed Increases</span>
                      <span className="font-medium">$235,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "94%" }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>$15,000 remaining</span>
                      <span>94% allocated</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Finance Department</span>
                    <span className="text-sm text-gray-600">Budget: $120,000</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Proposed Increases</span>
                      <span className="font-medium">$105,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "87.5%" }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>$15,000 remaining</span>
                      <span>87.5% allocated</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  When budget exceeded: System ranks by performance and creates deferral list
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
