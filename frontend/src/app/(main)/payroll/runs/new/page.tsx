"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { api } from "../../../../lib/api";
import { ArrowLeft, Save, Loader2, Users, Calculator } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "../../../../components/ui/calendar";
import { CalendarIcon } from "lucide-react";

export default function CreatePayrollRunPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    templateId: "",
    runName: "",
    periodStart: "",
    periodEnd: "",
    paymentDate: "",
    notes: "",
    employeeIds: [] as string[],
  });

  useEffect(() => {
    loadTemplates();
    loadEmployees();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await api.getPayrollTemplates({ isActive: true });
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees({ status: "active" });
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load employees:", error);
    }
  };

  const handlePreview = async () => {
    if (!formData.templateId || !formData.periodStart || !formData.periodEnd) {
      toast.error("Please fill in template, period start, and period end");
      return;
    }

    try {
      setLoading(true);
      const preview = await api.previewPayrollRun({
        templateId: formData.templateId,
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        employeeIds: formData.employeeIds.length > 0 ? formData.employeeIds : undefined,
      });
      setPreviewData(preview);
      setStep(2);
      toast.success("Preview generated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate preview");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.runName || !formData.periodStart || !formData.periodEnd || !formData.paymentDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        runName: formData.runName,
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        paymentDate: formData.paymentDate,
        employeeLines: previewData?.employeeLines || [],
      };

      // Only include templateId if it's not empty
      if (formData.templateId && formData.templateId.trim() !== "") {
        payload.templateId = formData.templateId;
      }

      // Only include notes if it's not empty
      if (formData.notes && formData.notes.trim() !== "") {
        payload.notes = formData.notes;
      }

      const result = await api.createPayrollRun(payload) as any;
      toast.success("Payroll run created successfully");
      router.push(`/payroll/runs/${result.id || result._id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create payroll run");
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (employeeId: string) => {
    setFormData((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(employeeId)
        ? prev.employeeIds.filter((id) => id !== employeeId)
        : [...prev.employeeIds, employeeId],
    }));
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/payroll/runs">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Payroll Run</h2>
            <p className="text-gray-600 mt-1">Set up a new payroll run for a pay period</p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2 ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            1
          </div>
          <span className="font-medium">Basic Info</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200"></div>
        <div className={`flex items-center gap-2 ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            2
          </div>
          <span className="font-medium">Preview & Confirm</span>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
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
                  suppressHydrationWarning
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateId">Payroll Template</Label>
                <Select
                  value={formData.templateId || undefined}
                  onValueChange={(value) => setFormData({ ...formData, templateId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Period Start *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                <Label>Period End *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                <Label>Payment Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
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

            {/* Employee Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Select Employees (Optional)</Label>
                <span className="text-sm text-gray-500">
                  {formData.employeeIds.length} selected
                </span>
              </div>
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Department</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => {
                      const empId = employee.id || employee._id;
                      return (
                        <TableRow key={empId}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={formData.employeeIds.includes(empId)}
                              onChange={() => toggleEmployee(empId)}
                              suppressHydrationWarning
                            />
                          </TableCell>
                          <TableCell>
                            {employee.firstName} {employee.lastName}
                          </TableCell>
                          <TableCell>{employee.employeeCode}</TableCell>
                          <TableCell>{employee.departmentId?.name || "N/A"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Link href="/payroll/runs">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button onClick={handlePreview} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Preview...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Preview & Continue
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && previewData && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Confirm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold">{previewData.totals?.employeeCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Gross</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "LKR",
                    minimumFractionDigits: 0,
                  }).format(previewData.totals?.totalGross || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Net</p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "LKR",
                    minimumFractionDigits: 0,
                  }).format(previewData.totals?.totalNet || 0)}
                </p>
              </div>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Gross Pay</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.employeeLines?.map((line: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{line.employeeName}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "LKR",
                          minimumFractionDigits: 0,
                        }).format(line.baseSalary || 0)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "LKR",
                          minimumFractionDigits: 0,
                        }).format(line.grossPay || 0)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "LKR",
                          minimumFractionDigits: 0,
                        }).format(line.totalDeductions || 0)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "LKR",
                          minimumFractionDigits: 0,
                        }).format(line.netPay || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Payroll Run
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
