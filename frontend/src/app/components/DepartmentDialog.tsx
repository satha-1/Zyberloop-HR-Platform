"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useDepartments, useEmployees } from "../lib/hooks";

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: any;
  onSuccess?: () => void;
}

export function DepartmentDialog({
  open,
  onOpenChange,
  department,
  onSuccess,
}: DepartmentDialogProps) {
  const { data: departments = [] } = useDepartments();
  const { data: employees = [] } = useEmployees({ status: "active" });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    parentDepartmentId: "",
    headId: "",
  });

  useEffect(() => {
    if (open) {
      if (department) {
        setFormData({
          name: department.name || "",
          code: department.code || "",
          parentDepartmentId: department.parentDepartmentId?._id || department.parentDepartmentId || "",
          headId: department.headId?._id || department.headId || "",
        });
      } else {
        setFormData({
          name: "",
          code: "",
          parentDepartmentId: "",
          headId: "",
        });
      }
    }
  }, [open, department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.error("Name and code are required");
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        name: formData.name,
        code: formData.code.toUpperCase(),
      };

      if (formData.parentDepartmentId && formData.parentDepartmentId !== "none") {
        data.parentDepartmentId = formData.parentDepartmentId;
      }

      if (formData.headId && formData.headId !== "none") {
        data.headId = formData.headId;
      }

      if (department) {
        await api.updateDepartment(department._id || department.id, data);
        toast.success("Department updated successfully!");
      } else {
        await api.createDepartment(data);
        toast.success("Department created successfully!");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save department");
    } finally {
      setLoading(false);
    }
  };

  // Filter out current department from parent options
  const parentOptions = departments.filter(
    (dept: any) => !department || (dept._id || dept.id) !== (department._id || department.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{department ? "Edit Department" : "Create Department"}</DialogTitle>
          <DialogDescription>
            {department
              ? "Update department information"
              : "Add a new department to the organization"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Human Resources"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., HR"
                maxLength={10}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parentDepartmentId">Parent Department</Label>
              <Select
                value={formData.parentDepartmentId || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, parentDepartmentId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {parentOptions.map((dept: any) => {
                    const deptId = dept._id || dept.id;
                    if (!deptId) return null;
                    return (
                      <SelectItem key={String(deptId)} value={String(deptId)}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="headId">Department Head</Label>
              <Select
                value={formData.headId || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, headId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department head (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {employees.map((emp: any) => {
                    const empId = emp._id || emp.id;
                    if (!empId) return null;
                    return (
                      <SelectItem key={String(empId)} value={String(empId)}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
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
              {loading ? "Saving..." : department ? "Update Department" : "Create Department"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
