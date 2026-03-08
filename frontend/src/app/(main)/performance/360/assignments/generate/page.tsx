"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Checkbox } from "../../../../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import {
  ArrowLeft, Save, Loader2, Users,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../../lib/api";

export const dynamic = "force-dynamic";

function GenerateAssignmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cycleId = searchParams.get("cycleId");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    templateId: "",
    targetEmployeeIds: [] as string[],
    includeManager: true,
    includeSelf: true,
    includeDirectReports: false,
    requiredResponsesCount: 5,
    deadlineAt: "",
  });

  useEffect(() => {
    if (cycleId) {
      loadTemplates();
      loadEmployees();
    }
  }, [cycleId]);

  const loadTemplates = async () => {
    if (!cycleId) return;
    try {
      const data = await api.get360Templates(cycleId);
      setTemplates(data || []);
    } catch (e: any) {
      toast.error("Failed to load templates");
    }
  };

  const loadEmployees = async () => {
    try {
      const data: any = await api.getEmployees({ status: "active" });
      const empList = Array.isArray(data) ? data : data?.employees || data?.data || [];
      setEmployees(empList);
    } catch (e: any) {
      toast.error("Failed to load employees");
    }
  };

  const handleSave = async () => {
    if (!formData.templateId) {
      toast.error("Please select a template");
      return;
    }
    if (formData.targetEmployeeIds.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        templateId: formData.templateId,
        targetEmployeeIds: formData.targetEmployeeIds,
        ratersConfig: {
          includeManager: formData.includeManager,
          includeSelf: formData.includeSelf,
          includeDirectReports: formData.includeDirectReports,
        },
        requiredResponsesCount: formData.requiredResponsesCount,
      };
      if (formData.deadlineAt) {
        payload.deadlineAt = new Date(formData.deadlineAt).toISOString();
      }

      const res: any = await api.generate360Assignments(cycleId!, payload);
      toast.success(res.message || "Assignments generated");
      router.push(`/performance/360/assignments?cycleId=${cycleId}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate assignments");
    } finally {
      setSaving(false);
    }
  };

  if (!cycleId) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">Please select a performance cycle first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate 360 Assignments</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Create feedback assignments for employees</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Template *</Label>
            <Select
              value={formData.templateId}
              onValueChange={(v) => setFormData({ ...formData, templateId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t._id} value={t._id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Target Employees *</Label>
            <div className="border rounded-md p-3 max-h-64 overflow-y-auto">
              {employees.length === 0 ? (
                <p className="text-sm text-gray-500">Loading employees...</p>
              ) : (
                <div className="space-y-2">
                  {employees.map((emp) => (
                    <div key={emp._id} className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.targetEmployeeIds.includes(emp._id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              targetEmployeeIds: [...formData.targetEmployeeIds, emp._id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              targetEmployeeIds: formData.targetEmployeeIds.filter((id) => id !== emp._id),
                            });
                          }
                        }}
                      />
                      <Label className="cursor-pointer font-normal">
                        {emp.firstName} {emp.lastName}
                        {emp.employeeCode && <span className="text-gray-500 ml-2">({emp.employeeCode})</span>}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setFormData({
                  ...formData,
                  targetEmployeeIds: employees.map((e) => e._id),
                });
              }}
            >
              <Users className="h-4 w-4 mr-2" /> Select All
            </Button>
          </div>

          <div>
            <Label>Rater Configuration</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.includeManager}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, includeManager: checked === true })
                  }
                />
                <Label className="cursor-pointer">Include Manager (auto-selected)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.includeSelf}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, includeSelf: checked === true })
                  }
                />
                <Label className="cursor-pointer">Include Self-Assessment</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.includeDirectReports}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, includeDirectReports: checked === true })
                  }
                />
                <Label className="cursor-pointer">Include Direct Reports</Label>
              </div>
            </div>
          </div>

          <div>
            <Label>Required Responses Count</Label>
            <Input
              type="number"
              min="1"
              value={formData.requiredResponsesCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requiredResponsesCount: parseInt(e.target.value) || 5,
                })
              }
            />
          </div>

          <div>
            <Label>Deadline (Optional)</Label>
            <Input
              type="datetime-local"
              value={formData.deadlineAt}
              onChange={(e) => setFormData({ ...formData, deadlineAt: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Generate Assignments
        </Button>
      </div>
    </div>
  );
}

export default function GenerateAssignmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 bg-gray-200 animate-pulse rounded" />
            <div>
              <div className="h-7 w-64 bg-gray-200 animate-pulse rounded mb-2" />
              <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      }
    >
      <GenerateAssignmentsContent />
    </Suspense>
  );
}
