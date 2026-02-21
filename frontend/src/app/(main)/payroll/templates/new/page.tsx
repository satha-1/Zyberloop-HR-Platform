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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../../components/ui/dialog";
import { api } from "../../../../lib/api";
import {
  PayrollTemplate,
  PayItem,
  CreatePayrollTemplatePayload,
  PayFrequency,
  PayItemType,
  CalculationType,
  AppliesTo,
} from "../../../../lib/types/payroll";
import { ArrowLeft, Plus, Trash2, Save, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CreatePayrollTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [payItemDialogOpen, setPayItemDialogOpen] = useState(false);
  const [editingPayItemIndex, setEditingPayItemIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreatePayrollTemplatePayload>({
    name: "",
    description: "",
    payFrequency: "monthly",
    currency: "LKR",
    isActive: true,
    effectiveFrom: new Date().toISOString().split("T")[0],
    effectiveTo: undefined,
    defaultPayItems: [],
    taxConfig: {
      country: "Sri Lanka",
      taxYear: new Date().getFullYear(),
      hasProgressiveTax: true,
      notes: "",
    },
  });

  const [payItemForm, setPayItemForm] = useState<Omit<PayItem, "id">>({
    code: "",
    label: "",
    type: "earning",
    calculationType: "flat",
    amount: null,
    percentage: null,
    appliesTo: "basicSalary",
    isTaxable: true,
    isDefault: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error("Template name is required");
      return;
    }
    if (!formData.effectiveFrom) {
      toast.error("Effective from date is required");
      return;
    }

    // Validate pay items
    for (const item of formData.defaultPayItems) {
      if (item.calculationType === "flat" && (item.amount === null || item.amount === undefined)) {
        toast.error(`Pay item "${item.label}" requires an amount for flat calculation`);
        return;
      }
      if (item.calculationType === "percentage" && (item.percentage === null || item.percentage === undefined)) {
        toast.error(`Pay item "${item.label}" requires a percentage for percentage calculation`);
        return;
      }
    }

    setLoading(true);
    try {
      await api.createPayrollTemplate(formData);
      toast.success("Payroll template created successfully");
      router.push("/payroll/templates");
    } catch (error: any) {
      toast.error(error.message || "Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayItem = () => {
    setPayItemForm({
      code: "",
      label: "",
      type: "earning",
      calculationType: "flat",
      amount: null,
      percentage: null,
      appliesTo: "basicSalary",
      isTaxable: true,
      isDefault: true,
    });
    setEditingPayItemIndex(null);
    setPayItemDialogOpen(true);
  };

  const handleEditPayItem = (index: number) => {
    setPayItemForm(formData.defaultPayItems[index]);
    setEditingPayItemIndex(index);
    setPayItemDialogOpen(true);
  };

  const handleSavePayItem = () => {
    if (!payItemForm.code.trim() || !payItemForm.label.trim()) {
      toast.error("Code and label are required");
      return;
    }

    if (payItemForm.calculationType === "flat" && payItemForm.amount === null) {
      toast.error("Amount is required for flat calculation");
      return;
    }

    if (payItemForm.calculationType === "percentage" && payItemForm.percentage === null) {
      toast.error("Percentage is required for percentage calculation");
      return;
    }

    const newPayItem: Omit<PayItem, "id"> = {
      ...payItemForm,
      amount: payItemForm.calculationType === "flat" ? payItemForm.amount : null,
      percentage: payItemForm.calculationType === "percentage" ? payItemForm.percentage : null,
    };

    if (editingPayItemIndex !== null) {
      const updated = [...formData.defaultPayItems];
      updated[editingPayItemIndex] = newPayItem;
      setFormData({ ...formData, defaultPayItems: updated });
    } else {
      setFormData({
        ...formData,
        defaultPayItems: [...formData.defaultPayItems, newPayItem],
      });
    }

    setPayItemDialogOpen(false);
    setEditingPayItemIndex(null);
  };

  const handleDeletePayItem = (index: number) => {
    const updated = formData.defaultPayItems.filter((_, i) => i !== index);
    setFormData({ ...formData, defaultPayItems: updated });
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center gap-4">
        <Link href="/payroll/templates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Payroll Template</h2>
          <p className="text-gray-600 mt-1">Define how payroll is calculated</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Template Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Monthly Payroll - Sri Lanka"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Template description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">
                  Currency <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  required
                  placeholder="LKR"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payFrequency">
                  Pay Frequency <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.payFrequency}
                  onValueChange={(value: PayFrequency) =>
                    setFormData({ ...formData, payFrequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effectiveFrom">
                  Effective From <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  value={formData.effectiveFrom}
                  onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveTo">Effective To (Optional)</Label>
                <Input
                  id="effectiveTo"
                  type="date"
                  value={formData.effectiveTo || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      effectiveTo: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Template is active
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Default Pay Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Default Pay Items</CardTitle>
              <Button type="button" onClick={handleAddPayItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Pay Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.defaultPayItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No pay items added yet.</p>
                <Button
                  type="button"
                  onClick={handleAddPayItem}
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Pay Item
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Calculation</TableHead>
                      <TableHead>Amount/Percentage</TableHead>
                      <TableHead>Taxable</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.defaultPayItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.code}</TableCell>
                        <TableCell>{item.label}</TableCell>
                        <TableCell>
                          <span className="capitalize">{item.type}</span>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{item.calculationType}</span>
                        </TableCell>
                        <TableCell>
                          {item.calculationType === "flat"
                            ? `${formData.currency} ${item.amount?.toFixed(2) || 0}`
                            : `${item.percentage || 0}%`}
                        </TableCell>
                        <TableCell>{item.isTaxable ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPayItem(index)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePayItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.taxConfig.country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxConfig: { ...formData.taxConfig, country: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxYear">Tax Year</Label>
                <Input
                  id="taxYear"
                  type="number"
                  value={formData.taxConfig.taxYear}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxConfig: {
                        ...formData.taxConfig,
                        taxYear: parseInt(e.target.value) || new Date().getFullYear(),
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasProgressiveTax"
                checked={formData.taxConfig.hasProgressiveTax}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    taxConfig: { ...formData.taxConfig, hasProgressiveTax: e.target.checked },
                  })
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="hasProgressiveTax" className="cursor-pointer">
                Has progressive tax brackets
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxNotes">Notes</Label>
              <Textarea
                id="taxNotes"
                value={formData.taxConfig.notes || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    taxConfig: { ...formData.taxConfig, notes: e.target.value },
                  })
                }
                placeholder="Tax configuration notes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/payroll/templates">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Create Template"}
          </Button>
        </div>
      </form>

      {/* Pay Item Dialog */}
      <Dialog open={payItemDialogOpen} onOpenChange={setPayItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPayItemIndex !== null ? "Edit Pay Item" : "Add Pay Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payItemCode">
                  Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="payItemCode"
                  value={payItemForm.code}
                  onChange={(e) => setPayItemForm({ ...payItemForm, code: e.target.value })}
                  required
                  placeholder="e.g., BASIC_SALARY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payItemLabel">
                  Label <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="payItemLabel"
                  value={payItemForm.label}
                  onChange={(e) => setPayItemForm({ ...payItemForm, label: e.target.value })}
                  required
                  placeholder="e.g., Basic Salary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payItemType">
                  Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={payItemForm.type}
                  onValueChange={(value: PayItemType) =>
                    setPayItemForm({ ...payItemForm, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earning">Earning</SelectItem>
                    <SelectItem value="deduction">Deduction</SelectItem>
                    <SelectItem value="benefit">Benefit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payItemCalculationType">
                  Calculation Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={payItemForm.calculationType}
                  onValueChange={(value: CalculationType) => {
                    setPayItemForm({
                      ...payItemForm,
                      calculationType: value,
                      amount: value === "flat" ? payItemForm.amount : null,
                      percentage: value === "percentage" ? payItemForm.percentage : null,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {payItemForm.calculationType === "flat" ? (
              <div className="space-y-2">
                <Label htmlFor="payItemAmount">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="payItemAmount"
                  type="number"
                  step="0.01"
                  value={payItemForm.amount || ""}
                  onChange={(e) =>
                    setPayItemForm({
                      ...payItemForm,
                      amount: parseFloat(e.target.value) || null,
                    })
                  }
                  required
                  placeholder="0.00"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="payItemPercentage">
                  Percentage <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="payItemPercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={payItemForm.percentage || ""}
                  onChange={(e) =>
                    setPayItemForm({
                      ...payItemForm,
                      percentage: parseFloat(e.target.value) || null,
                    })
                  }
                  required
                  placeholder="0.00"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="payItemAppliesTo">Applies To</Label>
              <Select
                value={payItemForm.appliesTo}
                onValueChange={(value: AppliesTo) =>
                  setPayItemForm({ ...payItemForm, appliesTo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basicSalary">Basic Salary</SelectItem>
                  <SelectItem value="gross">Gross Pay</SelectItem>
                  <SelectItem value="net">Net Pay</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="payItemIsTaxable"
                  checked={payItemForm.isTaxable}
                  onChange={(e) =>
                    setPayItemForm({ ...payItemForm, isTaxable: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="payItemIsTaxable" className="cursor-pointer">
                  Is taxable
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="payItemIsDefault"
                  checked={payItemForm.isDefault}
                  onChange={(e) =>
                    setPayItemForm({ ...payItemForm, isDefault: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="payItemIsDefault" className="cursor-pointer">
                  Include by default in payroll runs
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPayItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSavePayItem}>
              {editingPayItemIndex !== null ? "Update" : "Add"} Pay Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
