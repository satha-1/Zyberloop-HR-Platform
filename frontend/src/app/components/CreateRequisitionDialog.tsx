"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { api } from "../lib/api";
import { toast } from "sonner";
import { X } from "lucide-react";

interface CreateRequisitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  requisition?: any; // For editing
}

export function CreateRequisitionDialog({ open, onOpenChange, onSuccess, requisition }: CreateRequisitionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    departmentId: "",
    location: "",
    type: "full_time",
    justification: "",
    budgetCode: "",
    estimatedSalaryBandMin: "",
    estimatedSalaryBandMax: "",
    aboutTheRole: "",
    keyResponsibilities: [""],
    requirements: [""],
  });

  useEffect(() => {
    if (open) {
      fetchDepartments();
      if (requisition) {
        // Populate form for editing
        setFormData({
          title: requisition.title || "",
          departmentId: requisition.departmentId?._id || requisition.departmentId || "",
          location: requisition.location || "",
          type: requisition.type || "full_time",
          justification: requisition.justification || "",
          budgetCode: requisition.budgetCode || "",
          estimatedSalaryBandMin: requisition.estimatedSalaryBand?.min?.toString() || "",
          estimatedSalaryBandMax: requisition.estimatedSalaryBand?.max?.toString() || "",
          aboutTheRole: requisition.aboutTheRole || "",
          keyResponsibilities: requisition.keyResponsibilities?.length > 0 
            ? requisition.keyResponsibilities 
            : [""],
          requirements: requisition.requirements?.length > 0 
            ? requisition.requirements 
            : [""],
        });
      } else {
        // Reset form for new requisition
        setFormData({
          title: "",
          departmentId: "",
          location: "",
          type: "full_time",
          justification: "",
          budgetCode: "",
          estimatedSalaryBandMin: "",
          estimatedSalaryBandMax: "",
          aboutTheRole: "",
          keyResponsibilities: [""],
          requirements: [""],
        });
      }
    }
  }, [open, requisition]);

  const fetchDepartments = async () => {
    try {
      const depts = await api.getDepartments();
      setDepartments(depts || []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      toast.error("Failed to load departments");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const requisitionData = {
        title: formData.title,
        departmentId: formData.departmentId,
        location: formData.location,
        type: formData.type,
        justification: formData.justification,
        budgetCode: formData.budgetCode || undefined,
        estimatedSalaryBand: {
          min: parseFloat(formData.estimatedSalaryBandMin) || 0,
          max: parseFloat(formData.estimatedSalaryBandMax) || 0,
        },
        aboutTheRole: formData.aboutTheRole || undefined,
        keyResponsibilities: formData.keyResponsibilities.filter(r => r.trim() !== ""),
        requirements: formData.requirements.filter(r => r.trim() !== ""),
      };

      if (requisition) {
        await api.updateRequisition(requisition._id || requisition.id, requisitionData);
        toast.success("Requisition updated successfully!");
      } else {
        await api.createRequisition(requisitionData);
        toast.success("Requisition created successfully!");
      }
      
      onOpenChange(false);
      setFormData({
        title: "",
        departmentId: "",
        location: "",
        type: "full_time",
        justification: "",
        budgetCode: "",
        estimatedSalaryBandMin: "",
        estimatedSalaryBandMax: "",
        aboutTheRole: "",
        keyResponsibilities: [""],
        requirements: [""],
      });
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${requisition ? 'update' : 'create'} requisition`);
    } finally {
      setLoading(false);
    }
  };

  const addResponsibility = () => {
    setFormData({
      ...formData,
      keyResponsibilities: [...formData.keyResponsibilities, ""],
    });
  };

  const removeResponsibility = (index: number) => {
    setFormData({
      ...formData,
      keyResponsibilities: formData.keyResponsibilities.filter((_, i) => i !== index),
    });
  };

  const updateResponsibility = (index: number, value: string) => {
    const updated = [...formData.keyResponsibilities];
    updated[index] = value;
    setFormData({
      ...formData,
      keyResponsibilities: updated,
    });
  };

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [...formData.requirements, ""],
    });
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index),
    });
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...formData.requirements];
    updated[index] = value;
    setFormData({
      ...formData,
      requirements: updated,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{requisition ? "Edit Requisition" : "Create New Requisition"}</DialogTitle>
          <DialogDescription>
            {requisition ? "Update the requisition details." : "Fill in the details to create a new job requisition."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department *</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept._id || dept.id} value={dept._id || dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Colombo, Sri Lanka"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Employment Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification">Justification *</Label>
              <Textarea
                id="justification"
                required
                value={formData.justification}
                onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                placeholder="Explain why this position is needed..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetCode">Budget Code</Label>
                <Input
                  id="budgetCode"
                  value={formData.budgetCode}
                  onChange={(e) => setFormData({ ...formData, budgetCode: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedSalaryBandMin">Min Salary (LKR) *</Label>
                <Input
                  id="estimatedSalaryBandMin"
                  type="number"
                  required
                  min="0"
                  value={formData.estimatedSalaryBandMin}
                  onChange={(e) => setFormData({ ...formData, estimatedSalaryBandMin: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedSalaryBandMax">Max Salary (LKR) *</Label>
                <Input
                  id="estimatedSalaryBandMax"
                  type="number"
                  required
                  min="0"
                  value={formData.estimatedSalaryBandMax}
                  onChange={(e) => setFormData({ ...formData, estimatedSalaryBandMax: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aboutTheRole">About the Role</Label>
              <Textarea
                id="aboutTheRole"
                value={formData.aboutTheRole}
                onChange={(e) => setFormData({ ...formData, aboutTheRole: e.target.value })}
                placeholder="Describe the role and what makes it exciting..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Key Responsibilities</Label>
              {formData.keyResponsibilities.map((resp, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={resp}
                    onChange={(e) => updateResponsibility(index, e.target.value)}
                    placeholder={`Responsibility ${index + 1}`}
                  />
                  {formData.keyResponsibilities.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeResponsibility(index)}
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addResponsibility}
              >
                + Add Responsibility
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Requirements</Label>
              {formData.requirements.map((req, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={req}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    placeholder={`Requirement ${index + 1}`}
                  />
                  {formData.requirements.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRequirement(index)}
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRequirement}
              >
                + Add Requirement
              </Button>
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
              {loading ? (requisition ? "Updating..." : "Creating...") : (requisition ? "Update Requisition" : "Create Requisition")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
