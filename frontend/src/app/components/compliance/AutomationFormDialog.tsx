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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { Loader2 } from "lucide-react";

interface ComplianceAutomationRule {
  _id: string;
  name: string;
  type: string;
  active: boolean;
  scheduleCron?: string | null;
}

interface AutomationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation?: ComplianceAutomationRule | null;
  onSuccess?: () => void;
}

export function AutomationFormDialog({
  open,
  onOpenChange,
  automation,
  onSuccess,
}: AutomationFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "EPF_ETF_AUTOFILING",
    active: false,
    scheduleCron: "",
  });

  useEffect(() => {
    if (open && automation) {
      setFormData({
        name: automation.name || "",
        type: automation.type || "EPF_ETF_AUTOFILING",
        active: automation.active || false,
        scheduleCron: automation.scheduleCron || "",
      });
    } else if (open && !automation) {
      setFormData({
        name: "",
        type: "EPF_ETF_AUTOFILING",
        active: false,
        scheduleCron: "",
      });
    }
  }, [open, automation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name) {
        toast.error("Please enter a name");
        setLoading(false);
        return;
      }

      const payload: any = {
        name: formData.name,
        type: formData.type,
        active: formData.active,
        scheduleCron: formData.scheduleCron || null,
      };

      if (automation) {
        await api.updateComplianceAutomation(automation._id, payload);
        toast.success("Automation rule updated successfully!");
      } else {
        await api.createComplianceAutomation(payload);
        toast.success("Automation rule created successfully!");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save automation rule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {automation ? "Edit Automation Rule" : "Create Automation Rule"}
          </DialogTitle>
          <DialogDescription>
            {automation
              ? "Update the automation rule details"
              : "Create a new automation rule"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Auto-File EPF/ETF Forms"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EPF_ETF_AUTOFILING">EPF/ETF Auto-Filing</SelectItem>
                  <SelectItem value="BANK_RECON">Bank Reconciliation</SelectItem>
                  <SelectItem value="HR_CHATBOT">HR Chatbot</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="active">Status</Label>
              <Select
                value={formData.active ? "true" : "false"}
                onValueChange={(value) =>
                  setFormData({ ...formData, active: value === "true" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduleCron">Schedule (Cron Expression)</Label>
            <Input
              id="scheduleCron"
              value={formData.scheduleCron}
              onChange={(e) => setFormData({ ...formData, scheduleCron: e.target.value })}
              placeholder="e.g., 0 0 1 * * (1st of every month)"
            />
            <p className="text-xs text-gray-500">
              Optional: Cron expression for scheduled runs
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {automation ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
