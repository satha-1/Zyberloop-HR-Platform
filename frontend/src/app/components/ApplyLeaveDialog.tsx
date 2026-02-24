"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { api } from "../lib/api";
import { toast } from "sonner";

interface ApplyLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ApplyLeaveDialog({
  open,
  onOpenChange,
  onSuccess,
}: ApplyLeaveDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    leaveTypeId: "",
    casualType: "PAID",
    startDate: "",
    endDate: "",
    days: "",
    reason: "",
  });

  // For testing purposes, hardcoding leave types. In a real app, you would fetch these from the API.
  const leaveTypes = [
    { _id: "65b8df...1", name: "Annual Leave", code: "ANNUAL" },
    { _id: "65b8df...2", name: "Sick Leave", code: "SICK" },
    { _id: "65b8df...3", name: "Casual Leave", code: "CASUAL" }, // Used to toggle casualType field
  ];

  // Helper to determine if selected leave type is CASUAL
  const selectedLeaveType = leaveTypes.find(
    (t) => t._id === formData.leaveTypeId,
  );
  const isCasualLeave =
    selectedLeaveType && selectedLeaveType.code === "CASUAL";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.employeeId ||
      !formData.leaveTypeId ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.days
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Build request body, including casualType only if needed
      const requestData = {
        ...formData,
        days: Number(formData.days),
        ...(isCasualLeave ? { casualType: formData.casualType } : {}),
      };

      await api.createLeaveRequest(requestData);
      toast.success("Leave request submitted successfully");
      onSuccess();
      onOpenChange(false);
      setFormData({
        employeeId: "",
        leaveTypeId: "",
        casualType: "PAID",
        startDate: "",
        endDate: "",
        days: "",
        reason: "",
      });
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit leave request",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input
              id="employeeId"
              name="employeeId"
              placeholder="Paste Employee ID here"
              value={formData.employeeId}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leaveTypeId">Leave Type</Label>
            <Select
              value={formData.leaveTypeId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, leaveTypeId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Leave Type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type._id} value={type._id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-red-500">
              * Note: For testing, We must replace the hardcoded IDs in
              ApplyLeaveDialog.tsx with real IDs from our database.
            </p>
          </div>

          {isCasualLeave && (
            <div className="space-y-2">
              <Label htmlFor="casualType">Casual Leave Type</Label>
              <Select
                value={formData.casualType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, casualType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">
                    Paid (Calculates Balance)
                  </SelectItem>
                  <SelectItem value="UNPAID_AUTHORIZED">
                    Unpaid (Authorized)
                  </SelectItem>
                  <SelectItem value="UNPAID_UNAUTHORIZED">
                    Unpaid (Unauthorized)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="days">Total Days</Label>
            <Input
              id="days"
              name="days"
              type="number"
              min="0.5"
              step="0.5"
              placeholder="e.g., 2"
              value={formData.days}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              name="reason"
              placeholder="Brief reason for leave"
              value={formData.reason}
              onChange={handleChange}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
