"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useEmployees } from "../lib/hooks";

interface AssignManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: any;
  onSuccess?: () => void;
}

export function AssignManagerDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: AssignManagerDialogProps) {
  const { data: managersData = [] } = useEmployees({ status: "active" });
  const [loading, setLoading] = useState(false);
  const [managerId, setManagerId] = useState("none");

  useEffect(() => {
    if (open && employee) {
      setManagerId(employee.managerId?._id || employee.managerId || "none");
    }
  }, [open, employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.updateEmployee(employee._id || employee.id, {
        managerId: managerId === "none" ? null : managerId,
      });
      toast.success("Manager assigned successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign manager");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Manager</DialogTitle>
          <DialogDescription>
            Assign a manager for {employee?.firstName} {employee?.lastName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="managerId">Manager</Label>
            <Select value={managerId} onValueChange={setManagerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {managersData
                  .filter((mgr: any) => (mgr._id || mgr.id) !== (employee?._id || employee?.id))
                  .map((mgr: any) => (
                    <SelectItem key={mgr._id || mgr.id} value={mgr._id || mgr.id}>
                      {mgr.firstName} {mgr.lastName} ({mgr.employeeCode})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Assigning..." : "Assign Manager"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
