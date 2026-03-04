"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import { useLeaveRequests } from "../../../lib/hooks";
import { api } from "../../../lib/api";
import {
  CheckCircle,
  XCircle,
  Clock,
  History as HistoryIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useState, Suspense } from "react";

// Force dynamic rendering to prevent static generation errors
export const dynamic = "force-dynamic";

function ApproveLeaveContent() {
  const { data: leaveRequests = [], loading, refetch } = useLeaveRequests();
  const [activeTab, setActiveTab] = useState("pending");

  const pendingRequests = leaveRequests.filter(
    (r: any) => r.status?.toLowerCase() === "pending" || r.status === "PENDING",
  );

  const historyRequests = leaveRequests.filter(
    (r: any) => r.status?.toLowerCase() !== "pending" && r.status !== "PENDING",
  );

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
    const s = status?.toLowerCase();
    if (s === "approved" || s === "hr_approved" || s === "manager_approved")
      return "bg-green-100 text-green-800";
    if (s === "rejected") return "bg-red-100 text-red-800";
    return "bg-orange-100 text-orange-800";
  };

  const RequestTable = ({
    requests,
    showActions = false,
  }: {
    requests: any[];
    showActions?: boolean;
  }) => (
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
            {showActions && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={showActions ? 8 : 7}
                className="text-center py-8 text-gray-500"
              >
                Loading...
              </TableCell>
            </TableRow>
          ) : requests.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showActions ? 8 : 7}
                className="text-center py-8 text-gray-500"
              >
                No requests found
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request: any) => (
              <TableRow key={request._id || request.id}>
                <TableCell className="font-medium">
                  {request.employeeId?.firstName ||
                    request.employee_name ||
                    "N/A"}{" "}
                  {request.employeeId?.lastName || ""}
                </TableCell>
                <TableCell>
                  <div>
                    {request.leaveTypeId?.name || request.leave_type || "N/A"}
                    {request.casual_type && request.casual_type !== "PAID" && (
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
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleApprove(request._id || request.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleReject(request._id || request.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Approvals</h2>
          <p className="text-gray-600 mt-1">
            Review and manage employee leave requests
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Requests
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4" />
            Approval History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestTable requests={pendingRequests} showActions={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Approval & Rejection History</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestTable requests={historyRequests} showActions={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ApproveLeave() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Leave Approvals
              </h2>
              <p className="text-gray-600 mt-1">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ApproveLeaveContent />
    </Suspense>
  );
}
