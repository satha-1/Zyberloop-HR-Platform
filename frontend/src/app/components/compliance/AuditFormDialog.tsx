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

interface ComplianceAuditReport {
  _id: string;
  title: string;
  category: "STATUTORY" | "INTERNAL" | "GDPR" | "OTHER";
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  completedAt?: string | null;
}

interface AuditFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audit?: ComplianceAuditReport | null;
  onSuccess?: () => void;
}

export function AuditFormDialog({
  open,
  onOpenChange,
  audit,
  onSuccess,
}: AuditFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "STATUTORY" as "STATUTORY" | "INTERNAL" | "GDPR" | "OTHER",
    status: "PLANNED" as "PLANNED" | "IN_PROGRESS" | "COMPLETED",
    completedAt: "",
  });

  useEffect(() => {
    if (open && audit) {
      setFormData({
        title: audit.title || "",
        category: audit.category || "STATUTORY",
        status: audit.status || "PLANNED",
        completedAt: audit.completedAt ? audit.completedAt.split("T")[0] : "",
      });
    } else if (open && !audit) {
      setFormData({
        title: "",
        category: "STATUTORY",
        status: "PLANNED",
        completedAt: "",
      });
    }
  }, [open, audit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.title) {
        toast.error("Please enter a title");
        setLoading(false);
        return;
      }

      const payload: any = {
        title: formData.title,
        category: formData.category,
        status: formData.status,
        completedAt: formData.completedAt ? new Date(formData.completedAt).toISOString() : null,
      };

      if (audit) {
        await api.updateComplianceAudit(audit._id, payload);
        toast.success("Audit report updated successfully!");
      } else {
        await api.createComplianceAudit(payload);
        toast.success("Audit report created successfully!");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save audit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{audit ? "Edit Audit Report" : "Create Audit Report"}</DialogTitle>
          <DialogDescription>
            {audit
              ? "Update the audit report details"
              : "Create a new audit report"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., EPF Compliance Audit 2025"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as any })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STATUTORY">Statutory</SelectItem>
                  <SelectItem value="INTERNAL">Internal</SelectItem>
                  <SelectItem value="GDPR">GDPR</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as any })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.status === "COMPLETED" && (
            <div className="space-y-2">
              <Label htmlFor="completedAt">Completed Date</Label>
              <Input
                id="completedAt"
                type="date"
                value={formData.completedAt}
                onChange={(e) => setFormData({ ...formData, completedAt: e.target.value })}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {audit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
