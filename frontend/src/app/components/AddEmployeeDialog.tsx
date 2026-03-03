"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { api } from "../lib/api";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddEmployeeDialog({ open, onOpenChange, onSuccess }: AddEmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [generatingNumber, setGeneratingNumber] = useState(false);
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    employeeNumber: "",
    employeeCode: "",
    initials: "",
    fullName: "",
    preferredName: "",
    email: "",
    phone: "",
    dob: "",
    currentAddress: "",
    permanentAddress: "",
    departmentId: "",
    managerId: "",
    jobTitle: "",
    employmentType: "permanent",
    workLocation: "",
    hireDate: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    emergencyContactEmail: "",
  });

  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchManagers();
      generateEmployeeCode();
    }
  }, [open]);

  const fetchDepartments = async () => {
    try {
      const depts = await api.getDepartments() as any;
      setDepartments(Array.isArray(depts) ? depts : []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  };

  const fetchManagers = async () => {
    try {
      const emps = await api.getEmployees({ status: "active" }) as any;
      setManagers(Array.isArray(emps) ? emps : []);
    } catch (error) {
      console.error("Failed to fetch managers:", error);
    }
  };

  const generateEmployeeCode = async () => {
    setGeneratingCode(true);
    try {
      const result: any = await api.generateEmployeeCode();
      if (result?.code) {
        setFormData((prev) => ({ ...prev, employeeCode: result.code }));
      }
    } catch (error) {
      console.error("Failed to generate employee code", error);
      toast.error("Failed to generate employee code");
    } finally {
      setGeneratingCode(false);
    }
  };

  const generateEmployeeNumber = async (departmentId: string) => {
    if (!departmentId) {
      setFormData((prev) => ({ ...prev, employeeNumber: "" }));
      return;
    }
    
    setGeneratingNumber(true);
    try {
      const result: any = await api.generateEmployeeNumber(departmentId);
      if (result?.empNo) {
        setFormData((prev) => ({ ...prev, employeeNumber: result.empNo }));
      }
    } catch (error) {
      console.error("Failed to generate employee number", error);
      toast.error("Failed to generate employee number");
    } finally {
      setGeneratingNumber(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        permanentAddress: sameAsCurrentAddress ? formData.currentAddress : formData.permanentAddress,
      };

      await api.createEmployee(payload);

      toast.success("Employee created successfully!");
      onOpenChange(false);
      setFormData({
        employeeNumber: "",
        employeeCode: "",
        initials: "",
        fullName: "",
        preferredName: "",
        email: "",
        phone: "",
        dob: "",
        currentAddress: "",
        permanentAddress: "",
        departmentId: "",
        managerId: "",
        jobTitle: "",
        employmentType: "permanent",
        workLocation: "",
        hireDate: "",
        emergencyContactName: "",
        emergencyContactRelationship: "",
        emergencyContactPhone: "",
        emergencyContactEmail: "",
      });
      setSameAsCurrentAddress(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Create core employee details now. Add salary, bank details, and documents later from employee profile.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Identification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="employeeNumber">Employee Number *</Label>
                  {formData.departmentId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => generateEmployeeNumber(formData.departmentId)}
                      disabled={generatingNumber || loading || !formData.departmentId}
                      className="h-7 px-2"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${generatingNumber ? "animate-spin" : ""}`} />
                    </Button>
                  )}
                </div>
                <Input
                  id="employeeNumber"
                  required
                  readOnly
                  value={formData.employeeNumber}
                  className="bg-gray-50"
                  placeholder={formData.departmentId ? "Auto-generated (select department first)" : "Select department to generate"}
                  disabled={!formData.departmentId}
                />
                <p className="text-xs text-gray-500">
                  Auto-generated based on department (9 digits: DDDSSSRRR)
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="employeeCode">Employee Code *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateEmployeeCode}
                    disabled={generatingCode || loading}
                    className="h-7 px-2"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${generatingCode ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <Input
                  id="employeeCode"
                  required
                  readOnly
                  value={formData.employeeCode}
                  className="bg-gray-50"
                  placeholder="Auto-generated"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal / Basic Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initials">Initials</Label>
                <Input
                  id="initials"
                  value={formData.initials}
                  onChange={(e) => setFormData({ ...formData, initials: e.target.value })}
                  placeholder="e.g., S.K."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredName">Preferred Name</Label>
                <Input
                  id="preferredName"
                  value={formData.preferredName}
                  onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Primary Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Employment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department *</Label>
                <Select
                  value={formData.departmentId || undefined}
                  onValueChange={(value) => {
                    setFormData({ ...formData, departmentId: value });
                    generateEmployeeNumber(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => {
                      const deptId = dept._id || dept.id;
                      if (!deptId) return null;
                      return (
                        <SelectItem key={String(deptId)} value={String(deptId)}>
                          {dept.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerId">Manager / Supervisor</Label>
                <Select
                  value={formData.managerId || undefined}
                  onValueChange={(value) => setFormData({ ...formData, managerId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {managers.map((mgr) => {
                      const mgrId = mgr._id || mgr.id;
                      if (!mgrId) return null;
                      return (
                        <SelectItem key={String(mgrId)} value={String(mgrId)}>
                          {mgr.firstName} {mgr.lastName} ({mgr.employeeCode})
                        </SelectItem>
                      );
                    })}
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
                  placeholder="e.g., HR Executive"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  required
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => setFormData({ ...formData, employmentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workLocation">Work Location / Site</Label>
                <Input
                  id="workLocation"
                  value={formData.workLocation}
                  onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                  placeholder="e.g., Head Office - Colombo"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address Details</h3>
            <div className="space-y-2">
              <Label htmlFor="currentAddress">Current Address *</Label>
              <Textarea
                id="currentAddress"
                required
                value={formData.currentAddress}
                onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="sameAsCurrentAddress"
                type="checkbox"
                checked={sameAsCurrentAddress}
                onChange={(e) => setSameAsCurrentAddress(e.target.checked)}
              />
              <Label htmlFor="sameAsCurrentAddress">Permanent address same as current</Label>
            </div>
            {!sameAsCurrentAddress && (
              <div className="space-y-2">
                <Label htmlFor="permanentAddress">Permanent Address</Label>
                <Textarea
                  id="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Emergency Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                <Input
                  id="emergencyContactRelationship"
                  value={formData.emergencyContactRelationship}
                  onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactEmail">Email</Label>
                <Input
                  id="emergencyContactEmail"
                  type="email"
                  value={formData.emergencyContactEmail}
                  onChange={(e) => setFormData({ ...formData, emergencyContactEmail: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-blue-50 p-3 text-sm text-blue-800">
            Salary details, bank details, and documents can be added separately after employee creation.
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
            <Button type="submit" disabled={loading || generatingCode}>
              {loading ? "Creating..." : "Create Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}