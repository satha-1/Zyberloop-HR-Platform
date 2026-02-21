"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { api } from "../lib/api";
import { Calendar, X } from "lucide-react";

interface LeaveHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
}

export function LeaveHistoryDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
}: LeaveHistoryDialogProps) {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && employeeId) {
      fetchLeaveHistory();
    }
  }, [open, employeeId]);

  const fetchLeaveHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getLeaveRequests({ employeeId });
      setLeaveRequests(data || []);
    } catch (error) {
      console.error("Error fetching leave history:", error);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
      case "HR_APPROVED":
      case "MANAGER_APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Leave History - {employeeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No leave requests found
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((request: any) => (
                    <TableRow key={request.id || request._id}>
                      <TableCell>{request.leave_type || request.leaveTypeId?.name || "N/A"}</TableCell>
                      <TableCell>
                        {request.start_date
                          ? new Date(request.start_date).toLocaleDateString()
                          : request.startDate
                          ? new Date(request.startDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {request.end_date
                          ? new Date(request.end_date).toLocaleDateString()
                          : request.endDate
                          ? new Date(request.endDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>{request.days || 0}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status?.replace("_", " ") || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request.reason || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
