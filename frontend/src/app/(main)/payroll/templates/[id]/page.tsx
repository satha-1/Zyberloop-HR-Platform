"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { api } from "../../../../lib/api";
import { PayrollTemplate } from "../../../../lib/types/payroll";
import { ArrowLeft, Pencil, Copy, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";

export default function PayrollTemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  const [template, setTemplate] = useState<PayrollTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const data = await api.getPayrollTemplateById(templateId);
      setTemplate(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load template");
      setTemplate(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deletePayrollTemplate(templateId);
      toast.success("Template deleted successfully");
      router.push("/payroll/templates");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template");
    }
  };

  const handleDuplicate = async () => {
    try {
      const newTemplate = await api.duplicatePayrollTemplate(templateId);
      toast.success("Template duplicated successfully");
      if (newTemplate?.id) {
        router.push(`/payroll/templates/${newTemplate.id}/edit`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate template");
    }
  };

  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency) {
      case "monthly":
        return "bg-blue-100 text-blue-800";
      case "biweekly":
        return "bg-green-100 text-green-800";
      case "weekly":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Not Found</h3>
            <p className="text-gray-600 mb-6">The template you're looking for doesn't exist.</p>
            <Link href="/payroll/templates">
              <Button>Back to Templates</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/payroll/templates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
            <p className="text-gray-600 mt-1">Template Details</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Link href={`/payroll/templates/${templateId}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Template
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Template Name</p>
              <p className="font-medium">{template.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pay Frequency</p>
              <Badge className={getFrequencyBadgeColor(template.payFrequency)}>
                {template.payFrequency}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Currency</p>
              <p className="font-medium">{template.currency}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant={template.isActive ? "default" : "outline"}>
                {template.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Effective From</p>
              <p className="font-medium">
                {new Date(template.effectiveFrom).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Effective To</p>
              <p className="font-medium">
                {template.effectiveTo
                  ? new Date(template.effectiveTo).toLocaleDateString()
                  : "No end date"}
              </p>
            </div>
          </div>
          {template.description && (
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-medium">{template.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay Items */}
      <Card>
        <CardHeader>
          <CardTitle>Default Pay Items ({template.defaultPayItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {template.defaultPayItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pay items configured</p>
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
                    <TableHead>Applies To</TableHead>
                    <TableHead>Taxable</TableHead>
                    <TableHead>Default</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {template.defaultPayItems.map((item, index) => (
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
                          ? `${template.currency} ${item.amount?.toFixed(2) || 0}`
                          : `${item.percentage || 0}%`}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{item.appliesTo.replace(/([A-Z])/g, " $1").trim()}</span>
                      </TableCell>
                      <TableCell>{item.isTaxable ? "Yes" : "No"}</TableCell>
                      <TableCell>{item.isDefault ? "Yes" : "No"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Country</p>
              <p className="font-medium">{template.taxConfig.country}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tax Year</p>
              <p className="font-medium">{template.taxConfig.taxYear}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Progressive Tax</p>
              <p className="font-medium">
                {template.taxConfig.hasProgressiveTax ? "Yes" : "No"}
              </p>
            </div>
          </div>
          {template.taxConfig.notes && (
            <div>
              <p className="text-sm text-gray-600">Notes</p>
              <p className="font-medium">{template.taxConfig.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Created At</p>
              <p className="font-medium">
                {new Date(template.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="font-medium">
                {new Date(template.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{template.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
