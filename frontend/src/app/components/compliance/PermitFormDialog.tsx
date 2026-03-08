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

interface CompliancePermit {
  _id: string;
  employeeId: any;
  permitType: string;
  country: string;
  identifier?: string | null;
  expiresAt: string;
  status: string;
  ownerUserId?: any;
  notes?: string | null;
}

interface PermitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permit?: CompliancePermit | null;
  onSuccess?: () => void;
}

export function PermitFormDialog({
  open,
  onOpenChange,
  permit,
  onSuccess,
}: PermitFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    employeeId: "",
    permitType: "",
    country: "LK",
    identifier: "",
    expiresAt: "",
    status: "ACTIVE",
    ownerUserId: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      loadEmployees();
      if (permit) {
        const employee = permit.employeeId;
        setFormData({
          employeeId: employee?._id || employee || "",
          permitType: permit.permitType || "",
          country: permit.country || "LK",
          identifier: permit.identifier || "",
          expiresAt: permit.expiresAt ? permit.expiresAt.split("T")[0] : "",
          status: permit.status || "ACTIVE",
          ownerUserId: permit.ownerUserId?._id || permit.ownerUserId || "",
          notes: permit.notes || "",
        });
      } else {
        setFormData({
          employeeId: "",
          permitType: "",
          country: "LK",
          identifier: "",
          expiresAt: "",
          status: "ACTIVE",
          ownerUserId: "",
          notes: "",
        });
      }
    }
  }, [open, permit]);

  const loadEmployees = async () => {
    try {
      const response = await api.getEmployees({ status: "active" }) as any[];
      setEmployees(response || []);
    } catch (e: any) {
      console.error("Failed to load employees:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.employeeId) {
        toast.error("Please select an employee");
        setLoading(false);
        return;
      }
      if (!formData.permitType) {
        toast.error("Please enter permit type");
        setLoading(false);
        return;
      }
      if (!formData.expiresAt) {
        toast.error("Please select expiry date");
        setLoading(false);
        return;
      }

      const payload: any = {
        employeeId: formData.employeeId,
        permitType: formData.permitType,
        country: formData.country,
        identifier: formData.identifier || null,
        expiresAt: formData.expiresAt,
        status: formData.status,
        ownerUserId: formData.ownerUserId || null,
        notes: formData.notes || null,
      };

      if (permit) {
        await api.updateCompliancePermit(permit._id, payload);
        toast.success("Permit updated successfully!");
      } else {
        await api.createCompliancePermit(payload);
        toast.success("Permit created successfully!");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save permit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{permit ? "Edit Permit" : "Create Permit"}</DialogTitle>
          <DialogDescription>
            {permit
              ? "Update the work permit/visa details"
              : "Create a new work permit/visa record"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee *</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => {
                    const empId = emp._id || emp.id;
                    if (!empId) return null;
                    return (
                      <SelectItem key={String(empId)} value={String(empId)}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.employeeId})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="permitType">Permit Type *</Label>
              <Input
                id="permitType"
                required
                value={formData.permitType}
                onChange={(e) => setFormData({ ...formData, permitType: e.target.value })}
                placeholder="e.g., Work Permit, Residence Visa, H1-B"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                placeholder="e.g., LK, US"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="identifier">Permit/Visa Number</Label>
              <Input
                id="identifier"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiry Date *</Label>
              <Input
                id="expiresAt"
                type="date"
                required
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="RENEWAL_IN_PROGRESS">Renewal In Progress</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
              {permit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
