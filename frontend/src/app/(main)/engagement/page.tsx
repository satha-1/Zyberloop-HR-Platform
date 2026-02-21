"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import { MessageSquare, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

export default function Engagement() {
  const surveyResults = [
    { category: "Work-Life Balance", score: 78, trend: "up", change: 5 },
    { category: "Career Growth", score: 65, trend: "down", change: -3 },
    { category: "Management", score: 82, trend: "up", change: 8 },
    { category: "Compensation", score: 58, trend: "down", change: -7 },
    { category: "Culture", score: 85, trend: "up", change: 2 },
  ];

  const lowScoringGroups = [
    { group: "Engineering - Backend Team", score: 52, respondents: 12, actionPlan: "In Progress", sla: "5 days" },
    { group: "Marketing Department", score: 61, respondents: 8, actionPlan: "Pending", sla: "7 days" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Engagement & Surveys</h2>
          <p className="text-gray-600 mt-1">Pulse surveys and employee sentiment</p>
        </div>
        <Button>
          <MessageSquare className="h-4 w-4 mr-2" />
          Launch Survey
        </Button>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 mb-2">Overall Engagement Score</p>
              <p className="text-6xl font-bold">73</p>
              <p className="text-blue-100 mt-2">Based on 95% response rate</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-green-200">
                <TrendingUp className="h-5 w-5" />
                <span className="text-2xl font-semibold">+3</span>
              </div>
              <p className="text-blue-100 text-sm mt-1">vs last quarter</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Scores</CardTitle>
          <p className="text-sm text-gray-600">Rolling averages via exponential smoothing</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {surveyResults.map((result, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{result.category}</span>
                    <div className={`flex items-center gap-1 text-sm ${result.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                      {result.trend === "up" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>{Math.abs(result.change)}%</span>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{result.score}</span>
                </div>
                <Progress value={result.score} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Low Scoring Groups */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Groups Requiring Attention</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Score below 65 threshold</p>
            </div>
            <Badge variant="destructive">2 Groups</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lowScoringGroups.map((group, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">{group.group}</h4>
                      <div className="flex gap-3 mt-1 text-sm text-gray-600">
                        <span>{group.respondents} respondents</span>
                        <span>•</span>
                        <span>Score: {group.score}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={group.actionPlan === "In Progress" ? "default" : "secondary"}>
                    {group.actionPlan}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Action Plan SLA:</span> {group.sla} remaining
                  </p>
                  <Button size="sm" variant={group.actionPlan === "Pending" ? "default" : "outline"}>
                    {group.actionPlan === "Pending" ? "Create Action Plan" : "View Plan"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anonymity & Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Anonymity Enforced</p>
                <p className="text-sm text-blue-700 mt-1">
                  Minimum respondent threshold: <strong>K = 5</strong>
                </p>
                <p className="text-sm text-blue-700">
                  Groups with fewer than 5 responses are aggregated to protect anonymity
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Survey Frequency</p>
                <p className="font-semibold">Quarterly Pulse</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Response Rate Target</p>
                <p className="font-semibold">90%</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Smoothing Alpha (α)</p>
                <p className="font-semibold">0.3</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Action Plan SLA</p>
                <p className="font-semibold">14 days</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Comments (Anonymized) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback (Anonymized)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-700 italic">
                "Great work-life balance and supportive management. Career growth opportunities
                could be more clearly communicated."
              </p>
              <p className="text-xs text-gray-500 mt-2">Engineering • 2 days ago</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-700 italic">
                "Compensation needs to be more competitive with market rates. Otherwise, happy with
                the culture."
              </p>
              <p className="text-xs text-gray-500 mt-2">Product • 3 days ago</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-700 italic">
                "Love the collaborative environment. Would appreciate more learning and development
                opportunities."
              </p>
              <p className="text-xs text-gray-500 mt-2">Marketing • 5 days ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
