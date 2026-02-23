"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Textarea } from "../../../../../components/ui/textarea";
import { api } from "../../../../../lib/api";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "../../../../../components/ui/calendar";
import { CalendarIcon } from "lucide-react";

export default function EditPayrollRunPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [payrollRun, setPayrollRun] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadPayrollRun();
    }
  }, [id]);

  const loadPayrollRun = async () => {
    try {
      setLoading(true);
      const data = await api.getPayrollRunById(id) as any;
      setPayrollRun(data);
      // Pre-fill form
      if (data) {
        setFormData({
          runName: data.runName || "",
          notes: data.notes || "",
          periodStart: data.periodStart ? new Date(data.periodStart).toISOString().split("T")[0] : "",
          periodEnd: data.periodEnd ? new Date(data.periodEnd).toISOString().split("T")[0] : "",
          paymentDate: data.paymentDate ? new Date(data.paymentDate).toISOString().split("T")[0] : "",
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load payroll run");
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    runName: "",
    notes: "",
    periodStart: "",
    periodEnd: "",
    paymentDate: "",
  });

  const handleSubmit = async () => {
    if (!formData.runName) {
      toast.error("Run name is required");
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        runName: formData.runName,
        notes: formData.notes || undefined,
      };

      // Only update dates if not locked
      if (payrollRun?.status !== "locked" && payrollRun?.status !== "FINALIZED" && payrollRun?.status !== "completed") {
        if (formData.periodStart) payload.periodStart = formData.periodStart;
        if (formData.periodEnd) payload.periodEnd = formData.periodEnd;
        if (formData.paymentDate) payload.paymentDate = formData.paymentDate;
      }

      await api.updatePayrollRun(id, payload);
      toast.success("Payroll run updated successfully");
      router.push(`/payroll/runs/${id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update payroll run");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !payrollRun) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payrollRun) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Payroll run not found</p>
            <Link href="/payroll/runs">
              <Button className="mt-4">Back to Payroll Runs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLocked = payrollRun.status === "locked" || payrollRun.status === "FINALIZED" || payrollRun.status === "completed";

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/payroll/runs/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Payroll Run</h2>
            <p className="text-gray-600 mt-1">Update payroll run details</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Run Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="runName">Run Name *</Label>
              <Input
                id="runName"
                value={formData.runName}
                onChange={(e) => setFormData({ ...formData, runName: e.target.value })}
                placeholder="e.g., March 2025 Payroll"
              />
            </div>

            <div className="space-y-2">
              <Label>Period Start {isLocked && "(Locked)"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={isLocked}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.periodStart ? format(new Date(formData.periodStart), "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.periodStart ? new Date(formData.periodStart) : undefined}
                    onSelect={(date) =>
                      setFormData({ ...formData, periodStart: date?.toISOString().split("T")[0] || "" })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Period End {isLocked && "(Locked)"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={isLocked}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.periodEnd ? format(new Date(formData.periodEnd), "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.periodEnd ? new Date(formData.periodEnd) : undefined}
                    onSelect={(date) =>
                      setFormData({ ...formData, periodEnd: date?.toISOString().split("T")[0] || "" })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Payment Date {isLocked && "(Locked)"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={isLocked}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.paymentDate ? format(new Date(formData.paymentDate), "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.paymentDate ? new Date(formData.paymentDate) : undefined}
                    onSelect={(date) =>
                      setFormData({ ...formData, paymentDate: date?.toISOString().split("T")[0] || "" })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes about this payroll run"
              rows={3}
            />
          </div>

          {isLocked && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                This payroll run is locked and cannot be modified. Period and payment dates cannot be changed.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Link href={`/payroll/runs/${id}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
