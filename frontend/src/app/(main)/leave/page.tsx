"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useState, useMemo } from "react";
import {
  useLeaveRequests,
  useEmployees,
  useEmployeeProfileAbsence,
  useAttendanceRecords,
} from "../../lib/hooks";
import { api } from "../../lib/api";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ApplyLeaveDialog } from "../../components/ApplyLeaveDialog";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

// Force dynamic rendering to prevent static generation errors
export const dynamic = "force-dynamic";

function LeaveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "requests";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "requests") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.push(`/leave?${params.toString()}`, { scroll: false });
  };
  const { data: leaveRequests = [], loading, refetch } = useLeaveRequests();
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);

  // For testing purposes, fetch balances for a specific employee EMP-000051-80
  //Future update needed after role devided logged in user info should show
  const testEmployeeCode = "EMP-000051-80";
  const { data: employees = [] } = useEmployees({ search: testEmployeeCode });
  const testEmployee = employees.find(
    (e: any) => e.employeeCode === testEmployeeCode,
  );
  const { data: absenceProfile, loading: balancesLoading } =
    useEmployeeProfileAbsence(testEmployee?._id || "");

  const getBalanceConfig = (planName: string) => {
    const balance = absenceProfile?.balances?.find((b: any) =>
      b.plan.toLowerCase().includes(planName.toLowerCase()),
    );
    return {
      remaining: balance?.availableBalance || 0,
      total: balance?.accruedYTD || 0,
      percentage: balance?.accruedYTD
        ? (balance.availableBalance / balance.accruedYTD) * 100
        : 0,
    };
  };

  const annualBalance = getBalanceConfig("Annual");
  const sickBalance = getBalanceConfig("Sick");
  const casualBalance = getBalanceConfig("Casual");

  // Fetch attendance records for the current month for the test employee EMP-000051-80
  //Future update needed after role devided logged in user info should show
  const startOfMonth = useMemo(
    () =>
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0],
    [],
  );
  const endOfMonth = useMemo(
    () =>
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        .toISOString()
        .split("T")[0],
    [],
  );

  const { data: attendanceRecords = [], loading: attendanceLoading } =
    useAttendanceRecords({
      employeeId: testEmployee?._id,
      startDate: startOfMonth,
      endDate: endOfMonth,
    });

  const attendanceSummary = useMemo(() => {
    const summary = { PRESENT: 0, ABSENT: 0, LEAVE: 0, HOLIDAY: 0 };
    attendanceRecords.forEach((record: any) => {
      const status = record.status?.toUpperCase();
      if (status && summary[status as keyof typeof summary] !== undefined) {
        summary[status as keyof typeof summary]++;
      }
    });
    return summary;
  }, [attendanceRecords]);

  const currentMonthName = useMemo(
    () =>
      new Date().toLocaleString("default", { month: "long", year: "numeric" }),
    [],
  );

  const getStatusColor = (status: string) => {
    if (
      status === "approved" ||
      status === "APPROVED" ||
      status === "hr_approved"
    )
      return "bg-green-100 text-green-800";
    if (status === "rejected" || status === "REJECTED")
      return "bg-red-100 text-red-800";
    return "bg-orange-100 text-orange-800";
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Leave & Attendance
          </h2>
          <p className="text-gray-600 mt-1">
            Manage leave requests and attendance
          </p>
        </div>
        <Button onClick={() => setIsApplyDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Apply for Leave
        </Button>
      </div>

      <ApplyLeaveDialog
        open={isApplyDialogOpen}
        onOpenChange={setIsApplyDialogOpen}
        onSuccess={refetch}
      />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="balance">Leave Balances</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500"
                        >
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : leaveRequests.filter(
                        (r: any) =>
                          [
                            "pending",
                            "approved",
                            "hr_approved",
                            "manager_approved",
                            "APPROVED",
                            "PENDING",
                          ].includes(r.status) ||
                          [
                            "pending",
                            "approved",
                            "hr_approved",
                            "manager_approved",
                          ].includes(r.status?.toLowerCase()),
                      ).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500"
                        >
                          No leave history found
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaveRequests
                        .filter(
                          (r: any) =>
                            [
                              "pending",
                              "approved",
                              "hr_approved",
                              "manager_approved",
                              "APPROVED",
                              "PENDING",
                            ].includes(r.status) ||
                            [
                              "pending",
                              "approved",
                              "hr_approved",
                              "manager_approved",
                            ].includes(r.status?.toLowerCase()),
                        )
                        .map((request: any) => (
                          <TableRow key={request._id || request.id}>
                            <TableCell className="font-medium">
                              {request.employeeId?.firstName ||
                                request.employee_name ||
                                "N/A"}{" "}
                              {request.employeeId?.lastName || ""}
                            </TableCell>
                            <TableCell>
                              <div>
                                {request.leaveTypeId?.name ||
                                  request.leave_type ||
                                  "N/A"}
                                {request.casual_type &&
                                  request.casual_type !== "PAID" && (
                                    <span className="block text-xs text-muted-foreground mt-0.5">
                                      {request.casual_type.replace("_", " ")}
                                    </span>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(
                                request.startDate || request.start_date,
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(
                                request.endDate || request.end_date,
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{request.days || 0}</TableCell>
                            <TableCell>{request.balance || 0} days</TableCell>
                            <TableCell>
                              <Badge
                                className={getStatusColor(
                                  request.status?.toLowerCase() ||
                                    request.status,
                                )}
                              >
                                {request.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Annual Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-600">
                    {balancesLoading ? "..." : annualBalance.remaining}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">days remaining</p>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${annualBalance.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {annualBalance.remaining} of {annualBalance.total} days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sick Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-600">
                    {balancesLoading ? "..." : sickBalance.remaining}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">days remaining</p>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${sickBalance.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {sickBalance.remaining} of {sickBalance.total} days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Casual Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600">
                    {balancesLoading ? "..." : casualBalance.remaining}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">days remaining</p>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${casualBalance.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {casualBalance.remaining} of {casualBalance.total} days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Leave Accrual Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Accrual Formula</p>
                  <code className="text-xs text-gray-700">
                    current_balance = Σ accruals − Σ taken + carry_in − encashed
                  </code>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      Monthly Accrual (Casual)
                    </p>
                    <p className="text-lg font-semibold">0.5 days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Annual Entitlement</p>
                    <p className="text-lg font-semibold">14 days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Active Service Period
                    </p>
                    <p className="text-lg font-semibold">since July 2023</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Carry Forward Limit</p>
                    <p className="text-lg font-semibold">0 days</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary - {currentMonthName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-700">
                    {attendanceLoading ? "..." : attendanceSummary.PRESENT}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Present</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-700">
                    {attendanceLoading ? "..." : attendanceSummary.ABSENT}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Absent</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-3xl font-bold text-orange-700">
                    {attendanceLoading ? "..." : attendanceSummary.LEAVE}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">On Leave</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-700">
                    {attendanceLoading ? "..." : attendanceSummary.HOLIDAY}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Holidays</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Leave() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Leave & Attendance
              </h2>
              <p className="text-gray-600 mt-1">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <LeaveContent />
    </Suspense>
  );
}
