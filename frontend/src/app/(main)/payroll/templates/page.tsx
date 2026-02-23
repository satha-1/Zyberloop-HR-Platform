"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { api } from "../../../lib/api";
import { PayrollTemplate } from "../../../lib/types/payroll";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Filter,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
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
} from "../../../components/ui/alert-dialog";

export default function PayrollTemplatesPage() {
  const [templates, setTemplates] = useState<PayrollTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const loadTemplates = async () => {
    try {
      setRefreshing(true);
      const params: any = {};
      if (search) params.search = search;
      if (frequencyFilter !== "all") params.payFrequency = frequencyFilter;
      if (activeFilter !== "all") params.isActive = activeFilter === "active";

      const data = await api.getPayrollTemplates(params);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load payroll templates");
      setTemplates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [search, frequencyFilter, activeFilter]);

  const handleDelete = async (id: string) => {
    try {
      await api.deletePayrollTemplate(id);
      toast.success("Template deleted successfully");
      loadTemplates();
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const newTemplate = await api.duplicatePayrollTemplate(id) as any;
      toast.success("Template duplicated successfully");
      loadTemplates();
      // Optionally navigate to edit the new template
      if (newTemplate?.id) {
        window.location.href = `/payroll/templates/${newTemplate.id}/edit`;
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

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Templates</h2>
          <p className="text-gray-600 mt-1">Manage payroll calculation templates</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadTemplates} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/payroll/templates/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frequencies</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="biweekly">Biweekly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Pay Frequency</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Effective From</TableHead>
                  <TableHead>Effective To</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Templates Found
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {search || frequencyFilter !== "all" || activeFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Get started by creating your first payroll template"}
                      </p>
                      {(!search && frequencyFilter === "all" && activeFilter === "all") && (
                        <Link href="/payroll/templates/new">
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Template
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge className={getFrequencyBadgeColor(template.payFrequency)}>
                          {template.payFrequency}
                        </Badge>
                      </TableCell>
                      <TableCell>{template.currency}</TableCell>
                      <TableCell>
                        <Badge
                          variant={template.isActive ? "default" : "outline"}
                          className={template.isActive ? "bg-green-100 text-green-800" : ""}
                        >
                          {template.isActive ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(template.effectiveFrom).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {template.effectiveTo
                          ? new Date(template.effectiveTo).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/payroll/templates/${template.id}`}>
                            <Button variant="ghost" size="sm" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/payroll/templates/${template.id}/edit`}>
                            <Button variant="ghost" size="sm" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Duplicate"
                            onClick={() => handleDuplicate(template.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            onClick={() => {
                              setTemplateToDelete(template.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => templateToDelete && handleDelete(templateToDelete)}
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
