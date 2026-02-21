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

interface CreateRequisitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateRequisitionDialog({ open, onOpenChange, onSuccess }: CreateRequisitionDialogProps) {
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
  });

  useEffect(() => {
    if (open) {
      fetchDepartments();
    }
  }, [open]);

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
      };

      await api.createRequisition(requisitionData);
      
      toast.success("Requisition created successfully!");
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
      });
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create requisition");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Requisition</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new job requisition.
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
                <Label htmlFor="estimatedSalaryBandMin">Min Salary *</Label>
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
                <Label htmlFor="estimatedSalaryBandMax">Max Salary *</Label>
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
              {loading ? "Creating..." : "Create Requisition"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
