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
import { WorkforcePlanningInput, FinanceApprovalStatus } from "../../lib/types/workforcePlanning";
import { Loader2 } from "lucide-react";

interface PlanningInputFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  input?: WorkforcePlanningInput | null;
  onSuccess?: () => void;
}

export function PlanningInputFormDialog({
  open,
  onOpenChange,
  input,
  onSuccess,
}: PlanningInputFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    annualBudget: 0,
    financeApprovalStatus: "PENDING" as FinanceApprovalStatus,
    financeApprovalNote: "",
    hiringVelocityMinPerMonth: 0,
    hiringVelocityMaxPerMonth: 0,
    attritionForecastPct: 0,
    effectiveFrom: "",
    isActive: false,
  });

  useEffect(() => {
    if (open && input) {
      setFormData({
        annualBudget: input.annualBudget || 0,
        financeApprovalStatus: input.financeApprovalStatus || "PENDING",
        financeApprovalNote: input.financeApprovalNote || "",
        hiringVelocityMinPerMonth: input.hiringVelocityMinPerMonth || 0,
        hiringVelocityMaxPerMonth: input.hiringVelocityMaxPerMonth || 0,
        attritionForecastPct: input.attritionForecastPct || 0,
        effectiveFrom: input.effectiveFrom
          ? new Date(input.effectiveFrom).toISOString().split("T")[0]
          : "",
        isActive: input.isActive || false,
      });
    } else if (open && !input) {
      setFormData({
        annualBudget: 0,
        financeApprovalStatus: "PENDING",
        financeApprovalNote: "",
        hiringVelocityMinPerMonth: 0,
        hiringVelocityMaxPerMonth: 0,
        attritionForecastPct: 0,
        effectiveFrom: "",
        isActive: false,
      });
    }
  }, [open, input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate min <= max
      if (formData.hiringVelocityMinPerMonth > formData.hiringVelocityMaxPerMonth) {
        toast.error("Minimum hiring velocity must be <= maximum");
        setLoading(false);
        return;
      }

      const payload: any = {
        annualBudget: Number(formData.annualBudget),
        financeApprovalStatus: formData.financeApprovalStatus,
        financeApprovalNote: formData.financeApprovalNote,
        hiringVelocityMinPerMonth: Number(formData.hiringVelocityMinPerMonth),
        hiringVelocityMaxPerMonth: Number(formData.hiringVelocityMaxPerMonth),
        attritionForecastPct: Number(formData.attritionForecastPct),
        isActive: formData.isActive,
      };

      if (formData.effectiveFrom) {
        payload.effectiveFrom = new Date(formData.effectiveFrom).toISOString();
      } else {
        payload.effectiveFrom = null;
      }

      if (input) {
        await api.updateWorkforcePlanningInput(input._id, payload);
        toast.success("Planning input updated successfully!");
      } else {
        await api.createWorkforcePlanningInput(payload);
        toast.success("Planning input created successfully!");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save planning input");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{input ? "Edit Planning Input" : "Create Planning Input"}</DialogTitle>
          <DialogDescription>
            {input
              ? "Update the workforce planning input configuration"
              : "Create a new workforce planning input configuration"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="annualBudget">Annual Budget *</Label>
            <Input
              id="annualBudget"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.annualBudget}
              onChange={(e) =>
                setFormData({ ...formData, annualBudget: Number(e.target.value) })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="financeApprovalStatus">Finance Approval Status *</Label>
              <Select
                value={formData.financeApprovalStatus}
                onValueChange={(value) =>
                  setFormData({ ...formData, financeApprovalStatus: value as FinanceApprovalStatus })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">Effective From</Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="financeApprovalNote">Finance Approval Note</Label>
            <Textarea
              id="financeApprovalNote"
              value={formData.financeApprovalNote}
              onChange={(e) => setFormData({ ...formData, financeApprovalNote: e.target.value })}
              placeholder="Notes from finance team"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hiringVelocityMinPerMonth">Hiring Velocity Min/Month *</Label>
              <Input
                id="hiringVelocityMinPerMonth"
                type="number"
                required
                min="0"
                value={formData.hiringVelocityMinPerMonth}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hiringVelocityMinPerMonth: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hiringVelocityMaxPerMonth">Hiring Velocity Max/Month *</Label>
              <Input
                id="hiringVelocityMaxPerMonth"
                type="number"
                required
                min="0"
                value={formData.hiringVelocityMaxPerMonth}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hiringVelocityMaxPerMonth: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attritionForecastPct">Attrition Forecast (%) *</Label>
            <Input
              id="attritionForecastPct"
              type="number"
              required
              min="0"
              max="100"
              step="0.1"
              value={formData.attritionForecastPct}
              onChange={(e) =>
                setFormData({ ...formData, attritionForecastPct: Number(e.target.value) })
              }
            />
          </div>

          {input && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Set as active planning input
              </Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {input ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
