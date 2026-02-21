"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { api } from "../../lib/api";
import { Plus, FileText, TrendingUp, Users, DollarSign, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface PayrollStats {
  activeEmployees: number;
  templateCount: number;
  runsByStatus: {
    draft: number;
    in_progress: number;
    completed: number;
    locked: number;
  };
  latestPeriod?: {
    periodStart: string;
    periodEnd: string;
    totalGross: number;
    totalNet: number;
  };
}

export default function PayrollDashboard() {
  const [stats, setStats] = useState<PayrollStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      setRefreshing(true);
      const data = await api.getPayrollStats();
      setStats(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load payroll statistics");
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalRuns = stats
    ? stats.runsByStatus.draft +
      stats.runsByStatus.in_progress +
      stats.runsByStatus.completed +
      stats.runsByStatus.locked
    : 0;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Management</h2>
          <p className="text-gray-600 mt-1">Overview and quick actions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadStats} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/payroll/templates/new">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </Link>
          <Link href="/payroll/runs/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Start Payroll Run
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Employees</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats?.activeEmployees ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">In payroll system</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payroll Templates</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats?.templateCount ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Available templates</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Runs</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{totalRuns}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Latest Period Net</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats?.latestPeriod
                    ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "LKR",
                        minimumFractionDigits: 0,
                      }).format(stats.latestPeriod.totalNet)
                    : "N/A"}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last completed run</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Run Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payroll Run Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium">Draft</span>
                </div>
                <Badge variant="outline">{stats?.runsByStatus.draft ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm font-medium">In Progress</span>
                </div>
                <Badge variant="outline">{stats?.runsByStatus.in_progress ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <Badge variant="outline">{stats?.runsByStatus.completed ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-sm font-medium">Locked</span>
                </div>
                <Badge variant="outline">{stats?.runsByStatus.locked ?? 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/payroll/templates" className="block">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Manage Templates
              </Button>
            </Link>
            <Link href="/payroll/runs" className="block">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                View All Runs
              </Button>
            </Link>
            <Link href="/payroll/templates/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create New Template
              </Button>
            </Link>
            <Link href="/payroll/runs/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Start New Payroll Run
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Latest Period Info */}
      {stats?.latestPeriod && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Payroll Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">
                  Period:{" "}
                  {new Date(stats.latestPeriod.periodStart).toLocaleDateString()} -{" "}
                  {new Date(stats.latestPeriod.periodEnd).toLocaleDateString()}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Gross:{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "LKR",
                    minimumFractionDigits: 0,
                  }).format(stats.latestPeriod.totalGross)}{" "}
                  | Net:{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "LKR",
                    minimumFractionDigits: 0,
                  }).format(stats.latestPeriod.totalNet)}
                </p>
              </div>
              <Link href="/payroll/runs">
                <Button size="sm">View Details</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!stats && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Payroll Data Available
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by creating a payroll template and running your first payroll.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/payroll/templates/new">
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </Link>
              <Link href="/payroll/runs/new">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Start Payroll Run
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
