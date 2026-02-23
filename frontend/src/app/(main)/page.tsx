"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { MetricCard } from "../components/ui/MetricCard";
import { PageCard } from "../components/ui/PageCard";
import { Users, Briefcase, DollarSign, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "../components/ui/badge";
import Link from "next/link";
import { useEmployees } from "../lib/hooks";
import { usePayrollRuns } from "../lib/hooks";
import { useLeaveRequests } from "../lib/hooks";
import { useRequisitions } from "../lib/hooks";

export default function Dashboard() {
  const { data: employees, loading: employeesLoading } = useEmployees({ status: "active" });
  const { data: payrollRuns, loading: payrollLoading } = usePayrollRuns();
  const { data: leaveRequests, loading: leaveLoading } = useLeaveRequests({ status: "pending" });
  const { data: requisitions, loading: requisitionsLoading } = useRequisitions({ status: "open" });

  const activeEmployees = employees?.length || 0;
  const pendingLeaves = leaveRequests?.length || 0;
  const openRequisitions = requisitions?.length || 0;
  const currentPayroll = payrollRuns?.find((p: any) => p.status === "DRAFT");

  const stats = [
    {
      title: "Active Employees",
      value: activeEmployees,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/employees",
    },
    {
      title: "Open Requisitions",
      value: openRequisitions,
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/recruitment",
    },
    {
      title: "Pending Leaves",
      value: pendingLeaves,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      link: "/leave",
    },
    {
      title: "Current Payroll",
      value: currentPayroll ? `$${(currentPayroll.total_net / 1000).toFixed(0)}k` : "N/A",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/payroll",
    },
  ];

  const recentActivity = [
    { action: "Payroll run created", module: "Payroll", time: "2 hours ago", status: "info" },
    { action: "Leave request approved", module: "Leave", time: "4 hours ago", status: "success" },
    { action: "New candidate applied", module: "Recruitment", time: "1 day ago", status: "info" },
    { action: "Performance review due", module: "Performance", time: "2 days ago", status: "warning" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Welcome back, Admin</h1>
        <p className="text-sm text-gray-600 mt-1.5">Here's what's happening in your organization today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.link} className="block">
            <MetricCard
              title={stat.title}
              value={stat.value}
              icon={<stat.icon className={`h-5 w-5 ${stat.color}`} />}
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <PageCard
          title="Recent Activity"
          description="Latest system activities and updates"
        >
          <div className="space-y-4">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div
                  className={`mt-0.5 flex-shrink-0 ${
                    activity.status === "success"
                      ? "text-emerald-600"
                      : activity.status === "warning"
                      ? "text-amber-600"
                      : "text-blue-600"
                  }`}
                >
                  {activity.status === "warning" ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <TrendingUp className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.module} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </PageCard>

        {/* Pending Actions */}
        <PageCard
          title="Pending Actions"
          description="Items requiring your attention"
        >
          <div className="space-y-3">
            {currentPayroll && (
              <Link href={`/payroll/${currentPayroll.id || currentPayroll._id}`}>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Review Payroll</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {currentPayroll.employee_count || 0} employees • ${((currentPayroll.total_net || 0) / 1000).toFixed(0)}k net
                      </p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">Draft</Badge>
                  </div>
                </div>
              </Link>
            )}

            <Link href="/leave">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Approve Leave Requests</p>
                    <p className="text-xs text-gray-600 mt-1">{pendingLeaves} pending requests</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                </div>
              </div>
            </Link>

            <Link href="/recruitment">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Review Candidates</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {requisitions?.reduce((sum: number, r: any) => sum + (r.candidates || 0), 0) || 0} total candidates
                    </p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
                </div>
              </div>
            </Link>
          </div>
        </PageCard>
      </div>

      {/* Quick Actions */}
      <PageCard
        title="Quick Actions"
        description="Common tasks and shortcuts"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/employees"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-center"
          >
            <Users className="h-6 w-6 mx-auto text-gray-600" />
            <p className="text-sm font-medium text-gray-900 mt-2">Add Employee</p>
          </Link>
          <Link
            href="/payroll"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-center"
          >
            <DollarSign className="h-6 w-6 mx-auto text-gray-600" />
            <p className="text-sm font-medium text-gray-900 mt-2">Process Payroll</p>
          </Link>
          <Link
            href="/recruitment"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-center"
          >
            <Briefcase className="h-6 w-6 mx-auto text-gray-600" />
            <p className="text-sm font-medium text-gray-900 mt-2">Create Requisition</p>
          </Link>
          <Link
            href="/admin/logs"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-center"
          >
            <TrendingUp className="h-6 w-6 mx-auto text-gray-600" />
            <p className="text-sm font-medium text-gray-900 mt-2">View Reports</p>
          </Link>
        </div>
      </PageCard>
    </div>
  );
}
