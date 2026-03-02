"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useDepartments, useEmployees } from "../lib/hooks";
import { useDebounce } from "../lib/hooks";

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
  const [generatingCode, setGeneratingCode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    parentDepartmentId: "",
    headId: "",
    location: "",
    costCenter: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    effectiveFrom: "",
    email: "",
    phoneExt: "",
  });

  // Debounce name for code generation
  const debouncedName = useDebounce(formData.name, 500);

  // Generate code when name changes (only for new departments)
  useEffect(() => {
    if (!department && debouncedName && debouncedName.trim().length > 0) {
      generateCode(debouncedName);
    }
  }, [debouncedName, department]);

  const generateCode = useCallback(async (name: string) => {
    if (!name || name.trim().length === 0) return;
    
    setGeneratingCode(true);
    try {
      const result = await api.generateDepartmentCode(name);
      if (result?.data?.code) {
        setFormData((prev) => ({ ...prev, code: result.data.code }));
      }
    } catch (error: any) {
      console.error("Failed to generate code:", error);
      // Don't show error toast - code generation is optional
    } finally {
      setGeneratingCode(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      if (department) {
        setFormData({
          name: department.name || "",
          code: department.code || "",
          description: department.description || "",
          parentDepartmentId: department.parentDepartmentId?._id || department.parentDepartmentId || "",
          headId: department.headId?._id || department.headId || "",
          location: department.location || "",
          costCenter: department.costCenter || "",
          status: department.status || "ACTIVE",
          effectiveFrom: department.effectiveFrom
            ? new Date(department.effectiveFrom).toISOString().split("T")[0]
            : "",
          email: department.email || "",
          phoneExt: department.phoneExt || "",
        });
      } else {
        setFormData({
          name: "",
          code: "",
          description: "",
          parentDepartmentId: "",
          headId: "",
          location: "",
          costCenter: "",
          status: "ACTIVE",
          effectiveFrom: "",
          email: "",
          phoneExt: "",
        });
      }
    }
  }, [open, department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Department name is required");
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        name: formData.name,
        description: formData.description || undefined,
        location: formData.location || undefined,
        costCenter: formData.costCenter || undefined,
        status: formData.status,
        email: formData.email || undefined,
        phoneExt: formData.phoneExt || undefined,
      };

      // Only include code if creating new department (it's auto-generated)
      if (!department && formData.code) {
        data.code = formData.code;
      }

      if (formData.parentDepartmentId && formData.parentDepartmentId !== "none") {
        data.parentDepartmentId = formData.parentDepartmentId;
      }

      if (formData.headId && formData.headId !== "none") {
        data.headId = formData.headId;
      }

      if (formData.effectiveFrom) {
        data.effectiveFrom = formData.effectiveFrom;
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{department ? "Edit Department" : "Create Department"}</DialogTitle>
          <DialogDescription>
            {department
              ? "Update department information"
              : "Add a new department to the organization"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Core Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Human Resources"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Department Code *</Label>
              <Input
                id="code"
                required
                readOnly
                value={formData.code}
                className="bg-gray-50 cursor-not-allowed"
                placeholder={generatingCode ? "Generating..." : "Will be generated automatically"}
              />
              {!department && (
                <p className="text-xs text-gray-500">
                  Code is auto-generated from department name
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the department's purpose and responsibilities..."
              rows={3}
            />
          </div>

          {/* Structural Fields */}
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

          {/* Additional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location / Site</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Head Office, Colombo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costCenter">Cost Center / GL Code</Label>
              <Input
                id="costCenter"
                value={formData.costCenter}
                onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                placeholder="e.g., CC-1001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Department Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g., hr@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneExt">Phone Extension</Label>
              <Input
                id="phoneExt"
                value={formData.phoneExt}
                onChange={(e) => setFormData({ ...formData, phoneExt: e.target.value })}
                placeholder="e.g., 1234"
              />
            </div>
          </div>

          {/* Status and Effective Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <div className="flex items-center gap-3">
                <Switch
                  id="status"
                  checked={formData.status === "ACTIVE"}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, status: checked ? "ACTIVE" : "INACTIVE" })
                  }
                />
                <Label htmlFor="status" className="cursor-pointer">
                  {formData.status === "ACTIVE" ? "Active" : "Inactive"}
                </Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">Effective From Date</Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || generatingCode}>
              {loading
                ? "Saving..."
                : department
                ? "Update Department"
                : "Create Department"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
