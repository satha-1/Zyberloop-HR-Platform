"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../../../components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../../../components/ui/dialog";
import { api } from "../../../../lib/api";
import { toast } from "sonner";
import {
  Plus, Upload, FileText, Eye, Edit, Copy, MoreHorizontal,
} from "lucide-react";
import { useEsignTemplates } from "../../../../lib/hooks";
import Link from "next/link";

export default function EsignTemplatesPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: templates = [], loading, refetch } = useEsignTemplates({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a PDF file");
      return;
    }
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", templateName);
      formData.append("description", templateDesc);
      await api.createEsignTemplate(formData);
      toast.success("Template created successfully");
      setUploadOpen(false);
      setTemplateName("");
      setTemplateDesc("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to create template");
    } finally {
      setUploading(false);
    }
  };

  const handleDuplicate = async (templateId: string) => {
    try {
      await api.duplicateEsignTemplate(templateId);
      toast.success("Template duplicated");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800";
      case "draft": return "bg-amber-100 text-amber-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PDF Templates</h2>
          <p className="text-gray-600 mt-1">
            Upload PDFs and create reusable templates with signature fields
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No templates yet</h3>
              <p className="text-gray-500 mb-4">Upload a PDF to create your first template</p>
              <Button onClick={() => setUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload PDF
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((tpl: any) => (
                    <TableRow key={tpl._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          {tpl.name}
                        </div>
                        {tpl.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{tpl.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(tpl.status)}>
                          {tpl.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tpl.createdAt ? new Date(tpl.createdAt).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/admin/esign/templates/${tpl._id}`}>
                            <Button variant="ghost" size="sm" title="View details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {(tpl.status === "draft" || tpl.latestVersionId) && (
                            <Link
                              href={`/admin/esign/templates/${tpl._id}/editor?version=${tpl.latestVersionId}`}
                            >
                              <Button variant="ghost" size="sm" title="Edit fields">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Duplicate"
                            onClick={() => handleDuplicate(tpl._id)}
                          >
                            <Copy className="h-4 w-4" />
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

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Template from PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template Name *</label>
              <Input
                placeholder="e.g. Employment Agreement"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                placeholder="Optional description"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PDF File *</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
