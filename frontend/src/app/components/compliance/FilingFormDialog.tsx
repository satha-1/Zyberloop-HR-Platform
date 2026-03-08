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
import { Loader2 } from "lucide-react";

interface ComplianceFiling {
  _id: string;
  filingTypeId: any;
  periodId: any;
  amount: number;
  notes?: string | null;
  status?: string;
}

interface FilingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filing?: ComplianceFiling | null;
  onSuccess?: () => void;
}

export function FilingFormDialog({
  open,
  onOpenChange,
  filing,
  onSuccess,
}: FilingFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [filingTypes, setFilingTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    filingTypeId: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    amount: 0,
    notes: "",
  });

  useEffect(() => {
    if (open) {
      loadFilingTypes();
      if (filing) {
        const period = filing.periodId;
        setFormData({
          filingTypeId: filing.filingTypeId?._id || filing.filingTypeId || "",
          year: period?.year || new Date().getFullYear(),
          month: period?.month || new Date().getMonth() + 1,
          amount: filing.amount || 0,
          notes: filing.notes || "",
        });
      } else {
        setFormData({
          filingTypeId: "",
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          amount: 0,
          notes: "",
        });
      }
    }
  }, [open, filing]);

  const loadFilingTypes = async () => {
    try {
      const response = await api.getComplianceFilingTypes() as any[];
      setFilingTypes(response || []);
    } catch (e: any) {
      console.error("Failed to load filing types:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.filingTypeId) {
        toast.error("Please select a filing type");
        setLoading(false);
        return;
      }

      // Ensure period exists
      const periodResponse = await api.ensureCompliancePeriod({
        year: formData.year,
        month: formData.month,
      }) as any;
      const periodId = periodResponse._id || periodResponse.id;

      const payload: any = {
        filingTypeId: formData.filingTypeId,
        periodId: periodId,
        amount: Number(formData.amount),
        notes: formData.notes || null,
      };

      if (filing) {
        await api.updateComplianceFiling(filing._id, payload);
        toast.success("Filing updated successfully!");
      } else {
        await api.createComplianceFiling(payload);
        toast.success("Filing created successfully!");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save filing");
    } finally {
      setLoading(false);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{filing ? "Edit Filing" : "Create Filing"}</DialogTitle>
          <DialogDescription>
            {filing
              ? "Update the compliance filing details"
              : "Create a new compliance filing"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filingTypeId">Filing Type *</Label>
              <Select
                value={formData.filingTypeId}
                onValueChange={(value) => setFormData({ ...formData, filingTypeId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select filing type" />
                </SelectTrigger>
                <SelectContent>
                  {filingTypes.map((type) => (
                    <SelectItem key={type._id || type.id} value={String(type._id || type.id)}>
                      {type.name} ({type.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                required
                min="2000"
                max="2100"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month *</Label>
              <Select
                value={String(formData.month)}
                onValueChange={(value) => setFormData({ ...formData, month: Number(value) })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index + 1} value={String(index + 1)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                placeholder="0.00"
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
              {filing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
