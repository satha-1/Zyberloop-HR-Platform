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
import { useState } from "react";
import { useLeaveRequests } from "../../lib/hooks";
import { api } from "../../lib/api";
import { Plus, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ApplyLeaveDialog } from "../../components/ApplyLeaveDialog";

export default function Leave() {
  const { data: leaveRequests = [], loading, refetch } = useLeaveRequests();
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);

  const handleApprove = async (id: string) => {
    try {
      await api.approveLeaveRequest(id);
      toast.success("Leave request approved");
      refetch();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to approve leave request",
      );
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectLeaveRequest(id);
      toast.error("Leave request rejected");
      refetch();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to reject leave request",
      );
    }
  };

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

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="balance">Leave Balances</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-gray-500"
                        >
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : leaveRequests.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-gray-500"
                        >
                          No leave requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaveRequests.map((request: any) => (
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
                                request.status?.toLowerCase() || request.status,
                              )}
                            >
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(request.status?.toLowerCase() === "pending" ||
                              request.status === "PENDING") && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleApprove(request._id || request.id)
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleReject(request._id || request.id)
                                  }
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            )}
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
                  <p className="text-4xl font-bold text-blue-600">0</p>
                  <p className="text-sm text-gray-600 mt-2">days remaining</p>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: "0%" }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">0 of 0 days</p>
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
                  <p className="text-4xl font-bold text-green-600">0</p>
                  <p className="text-sm text-gray-600 mt-2">days remaining</p>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: "0%" }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">0 of 0 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Personal Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600">0</p>
                  <p className="text-sm text-gray-600 mt-2">days remaining</p>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: "0%" }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">0 of 0 days</p>
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
                    <p className="text-sm text-gray-600">Monthly Accrual</p>
                    <p className="text-lg font-semibold">0 days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Annual Entitlement</p>
                    <p className="text-lg font-semibold">0 days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Carry Forward</p>
                    <p className="text-lg font-semibold">0 days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Encashment Eligible</p>
                    <p className="text-lg font-semibold">N/A</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary - February 2026</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-700">0</p>
                  <p className="text-sm text-gray-600 mt-1">Present</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-700">0</p>
                  <p className="text-sm text-gray-600 mt-1">Absent</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-3xl font-bold text-orange-700">0</p>
                  <p className="text-sm text-gray-600 mt-1">On Leave</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-700">0</p>
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
