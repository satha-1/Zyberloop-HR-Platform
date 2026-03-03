"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useEmployees, useDepartments } from "../lib/hooks";

interface JobAdvancementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: any;
  onSuccess?: () => void;
}

const ACTION_TYPES = [
  { value: "PROMOTION", label: "Promotion" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "SALARY_REVISION", label: "Salary Revision" },
  { value: "MANAGER_CHANGE", label: "Manager Change" },
  { value: "EMPLOYMENT_TYPE_CHANGE", label: "Employment Type Change" },
  { value: "GRADE_CHANGE", label: "Grade Change" },
  { value: "OTHER", label: "Other" },
] as const;

const EMPLOYMENT_TYPES = [
  { value: "permanent", label: "Permanent" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
  { value: "casual", label: "Casual" },
] as const;

export function JobAdvancementDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: JobAdvancementDialogProps) {
  const { data: departmentsData = [] } = useDepartments();
  const { data: managersData = [] } = useEmployees({ status: "active" });
  const [loading, setLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const [formData, setFormData] = useState({
    actionType: "PROMOTION" as const,
    effectiveFrom: new Date().toISOString().split("T")[0],
    departmentId: "",
    managerId: "",
    jobTitle: "",
    employmentType: "permanent" as const,
    workLocation: "",
    grade: "",
    notes: "",
  });

  useEffect(() => {
    if (open && employee) {
      // Fetch current job record to prefill
      fetchCurrentRecord();
    }
  }, [open, employee]);

  const fetchCurrentRecord = async () => {
    if (!employee?._id && !employee?.id) return;
    try {
      const result: any = await api.getCurrentJobRecord(employee._id || employee.id);
      const data = result?.data || result;
      
      if (data) {
        setCurrentRecord(data);
        // Prefill form with current values
        setFormData({
          actionType: "PROMOTION",
          effectiveFrom: new Date().toISOString().split("T")[0],
          departmentId: data.departmentId?._id || data.departmentId || employee.departmentId?._id || employee.departmentId || "",
          managerId: data.managerId?._id || data.managerId || employee.managerId?._id || employee.managerId || "",
          jobTitle: data.jobTitle || employee.jobTitle || "",
          employmentType: (data.employmentType || employee.employmentType || "permanent") as any,
          workLocation: data.workLocation || employee.workLocation || "",
          grade: data.grade || employee.grade || "",
          notes: "",
        });
      } else {
        // Fallback to employee data
        setFormData({
          actionType: "PROMOTION",
          effectiveFrom: new Date().toISOString().split("T")[0],
          departmentId: employee.departmentId?._id || employee.departmentId || "",
          managerId: employee.managerId?._id || employee.managerId || "",
          jobTitle: employee.jobTitle || "",
          employmentType: (employee.employmentType || "permanent") as any,
          workLocation: employee.workLocation || "",
          grade: employee.grade || "",
          notes: "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch current job record:", error);
      // Fallback to employee data
      setFormData({
        actionType: "PROMOTION",
        effectiveFrom: new Date().toISOString().split("T")[0],
        departmentId: employee.departmentId?._id || employee.departmentId || "",
        managerId: employee.managerId?._id || employee.managerId || "",
        jobTitle: employee.jobTitle || "",
        employmentType: (employee.employmentType || "permanent") as any,
        workLocation: employee.workLocation || "",
        grade: employee.grade || "",
        notes: "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee?._id && !employee?.id) return;

    setLoading(true);

    try {
      const payload: any = {
        actionType: formData.actionType,
        effectiveFrom: formData.effectiveFrom,
      };

      // Only include fields that are being changed (non-empty)
      if (formData.departmentId) payload.departmentId = formData.departmentId;
      if (formData.managerId) payload.managerId = formData.managerId;
      if (formData.jobTitle) payload.jobTitle = formData.jobTitle;
      if (formData.employmentType) payload.employmentType = formData.employmentType;
      if (formData.workLocation) payload.workLocation = formData.workLocation;
      if (formData.grade) payload.grade = formData.grade;
      if (formData.notes) payload.notes = formData.notes;

      await api.createJobAdvancement(employee._id || employee.id, payload);
      toast.success("Job advancement created successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create job advancement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Job Advancement</DialogTitle>
          <DialogDescription>
            Record a job change for {employee?.firstName} {employee?.lastName} ({employee?.employeeCode})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actionType">Action Type *</Label>
              <Select
                value={formData.actionType}
                onValueChange={(value: any) => setFormData({ ...formData, actionType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">Effective From *</Label>
              <Input
                id="effectiveFrom"
                type="date"
                required
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department</Label>
              <Select
                value={formData.departmentId || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, departmentId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No change</SelectItem>
                  {departmentsData.map((dept: any) => (
                    <SelectItem key={dept._id || dept.id} value={dept._id || dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="managerId">Manager</Label>
              <Select
                value={formData.managerId || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, managerId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No change</SelectItem>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select
                value={formData.employmentType}
                onValueChange={(value: any) => setFormData({ ...formData, employmentType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workLocation">Work Location</Label>
              <Input
                id="workLocation"
                value={formData.workLocation}
                onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                placeholder="e.g., Head Office - Colombo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                placeholder="e.g., G5, Band 3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes about this job change (e.g., 'Annual increment', 'Transfer to Kandy branch')"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Job Advancement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
