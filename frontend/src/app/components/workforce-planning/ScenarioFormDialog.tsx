"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { WorkforcePlanningScenario, ScenarioStatus } from "../../lib/types/workforcePlanning";
import { Loader2 } from "lucide-react";

interface ScenarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario?: WorkforcePlanningScenario | null;
  onSuccess?: () => void;
}

export function ScenarioFormDialog({
  open,
  onOpenChange,
  scenario,
  onSuccess,
}: ScenarioFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "DRAFT" as ScenarioStatus,
    currentHeadcount: 0,
    targetHeadcount: 0,
    annualCost: 0,
    durationMonths: 12,
    notes: "",
    projectedAttritionPct: null as number | null,
    projectedHiringPerMonthMin: null as number | null,
    projectedHiringPerMonthMax: null as number | null,
  });

  useEffect(() => {
    if (open && scenario) {
      setFormData({
        name: scenario.name || "",
        description: scenario.description || "",
        status: scenario.status || "DRAFT",
        currentHeadcount: scenario.currentHeadcount || 0,
        targetHeadcount: scenario.targetHeadcount || 0,
        annualCost: scenario.annualCost || 0,
        durationMonths: scenario.durationMonths || 12,
        notes: scenario.notes || "",
        projectedAttritionPct: scenario.projectedAttritionPct ?? null,
        projectedHiringPerMonthMin: scenario.projectedHiringPerMonthMin ?? null,
        projectedHiringPerMonthMax: scenario.projectedHiringPerMonthMax ?? null,
      });
    } else if (open && !scenario) {
      setFormData({
        name: "",
        description: "",
        status: "DRAFT",
        currentHeadcount: 0,
        targetHeadcount: 0,
        annualCost: 0,
        durationMonths: 12,
        notes: "",
        projectedAttritionPct: null,
        projectedHiringPerMonthMin: null,
        projectedHiringPerMonthMax: null,
      });
    }
  }, [open, scenario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate hiring min <= max
      if (
        formData.projectedHiringPerMonthMin !== null &&
        formData.projectedHiringPerMonthMax !== null &&
        formData.projectedHiringPerMonthMin > formData.projectedHiringPerMonthMax
      ) {
        toast.error("Minimum hiring per month must be <= maximum");
        setLoading(false);
        return;
      }

      const payload: any = {
        ...formData,
        currentHeadcount: Number(formData.currentHeadcount),
        targetHeadcount: Number(formData.targetHeadcount),
        annualCost: Number(formData.annualCost),
        durationMonths: Number(formData.durationMonths),
      };

      // Only include optional fields if they have values
      if (formData.projectedAttritionPct !== null) {
        payload.projectedAttritionPct = Number(formData.projectedAttritionPct);
      }
      if (formData.projectedHiringPerMonthMin !== null) {
        payload.projectedHiringPerMonthMin = Number(formData.projectedHiringPerMonthMin);
      }
      if (formData.projectedHiringPerMonthMax !== null) {
        payload.projectedHiringPerMonthMax = Number(formData.projectedHiringPerMonthMax);
      }

      if (scenario) {
        await api.updateWorkforcePlanningScenario(scenario._id, payload);
        toast.success("Scenario updated successfully!");
      } else {
        await api.createWorkforcePlanningScenario(payload);
        toast.success("Scenario created successfully!");
      }

      onOpenChange(false);
      // Call onSuccess immediately - the parent will handle the refresh
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save scenario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{scenario ? "Edit Scenario" : "Create Scenario"}</DialogTitle>
          <DialogDescription>
            {scenario
              ? "Update the workforce planning scenario details"
              : "Create a new workforce planning scenario"}
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
                placeholder="e.g., Growth Scenario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ScenarioStatus })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED_FOR_APPROVAL">Submitted for Approval</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="FROZEN">Frozen</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the scenario"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentHeadcount">Current Headcount *</Label>
              <Input
                id="currentHeadcount"
                type="number"
                required
                min="0"
                value={formData.currentHeadcount}
                onChange={(e) =>
                  setFormData({ ...formData, currentHeadcount: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetHeadcount">Target Headcount *</Label>
              <Input
                id="targetHeadcount"
                type="number"
                required
                min="0"
                value={formData.targetHeadcount}
                onChange={(e) =>
                  setFormData({ ...formData, targetHeadcount: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMonths">Duration (Months) *</Label>
              <Input
                id="durationMonths"
                type="number"
                required
                min="1"
                value={formData.durationMonths}
                onChange={(e) =>
                  setFormData({ ...formData, durationMonths: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="annualCost">Annual Cost *</Label>
            <Input
              id="annualCost"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.annualCost}
              onChange={(e) =>
                setFormData({ ...formData, annualCost: Number(e.target.value) })
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectedAttritionPct">Projected Attrition (%)</Label>
              <Input
                id="projectedAttritionPct"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.projectedAttritionPct ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    projectedAttritionPct: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectedHiringPerMonthMin">Hiring Min/Month</Label>
              <Input
                id="projectedHiringPerMonthMin"
                type="number"
                min="0"
                value={formData.projectedHiringPerMonthMin ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    projectedHiringPerMonthMin: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectedHiringPerMonthMax">Hiring Max/Month</Label>
              <Input
                id="projectedHiringPerMonthMax"
                type="number"
                min="0"
                value={formData.projectedHiringPerMonthMax ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    projectedHiringPerMonthMax: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or comments"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {scenario ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
