"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Welcome header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, Admin</h2>
        <p className="text-gray-600 mt-1">Here's what's happening in your organization today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.link}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                  <div
                    className={`mt-0.5 ${
                      activity.status === "success"
                        ? "text-green-600"
                        : activity.status === "warning"
                        ? "text-orange-600"
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
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentPayroll && (
                <Link href={`/payroll/${currentPayroll.id || currentPayroll._id}`}>
                  <div className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Review Payroll</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {currentPayroll.employee_count || 0} employees • ${((currentPayroll.total_net || 0) / 1000).toFixed(0)}k net
                        </p>
                      </div>
                      <Badge variant="secondary">Draft</Badge>
                    </div>
                  </div>
                </Link>
              )}

              <Link href="/leave">
                <div className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Approve Leave Requests</p>
                      <p className="text-xs text-gray-600 mt-1">{pendingLeaves} pending requests</p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </div>
              </Link>

              <Link href="/recruitment">
                <div className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Review Candidates</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {requisitions?.reduce((sum: number, r: any) => sum + (r.candidates || 0), 0) || 0} total candidates
                      </p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link
              href="/employees"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
            >
              <Users className="h-6 w-6 mx-auto text-gray-600" />
              <p className="text-sm font-medium text-gray-900 mt-2">Add Employee</p>
            </Link>
            <Link
              href="/payroll"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
            >
              <DollarSign className="h-6 w-6 mx-auto text-gray-600" />
              <p className="text-sm font-medium text-gray-900 mt-2">Process Payroll</p>
            </Link>
            <Link
              href="/recruitment"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
            >
              <Briefcase className="h-6 w-6 mx-auto text-gray-600" />
              <p className="text-sm font-medium text-gray-900 mt-2">Create Requisition</p>
            </Link>
            <Link
              href="/admin/logs"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
            >
              <TrendingUp className="h-6 w-6 mx-auto text-gray-600" />
              <p className="text-sm font-medium text-gray-900 mt-2">View Reports</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
