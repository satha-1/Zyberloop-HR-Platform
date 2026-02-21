"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { api } from "../lib/api";
import { toast } from "sonner";
import { TemplateEditor } from "./TemplateEditor/TemplateEditor";
import { parseHandlebarsToVisual } from "./TemplateEditor/utils/parser";

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: any;
  onSuccess?: () => void;
}

export function TemplateDialog({ open, onOpenChange, template, onSuccess }: TemplateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [useVisualEditor, setUseVisualEditor] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    docType: "",
    locale: "en",
    engine: "HANDLEBARS_HTML",
    description: "",
    content: "",
    tags: "",
  });

  useEffect(() => {
    if (open && template) {
      setFormData({
        name: template.name || "",
        docType: template.docType || template.type || "",
        locale: template.locale || "en",
        engine: template.engine || "HANDLEBARS_HTML",
        description: template.description || "",
        content: template.content || "",
        tags: (template.tags || []).join(", "),
      });
      setUseVisualEditor(false); // Reset to code view when editing existing template
    } else if (open && !template) {
      setFormData({
        name: "",
        docType: "",
        locale: "en",
        engine: "HANDLEBARS_HTML",
        description: "",
        content: "",
        tags: "",
      });
      setUseVisualEditor(false); // Reset to code view for new template
    }
  }, [open, template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      if (template) {
        await api.updateTemplate(template._id || template.id, dataToSubmit);
        toast.success("Template updated successfully!");
      } else {
        await api.createTemplate(dataToSubmit);
        toast.success("Template created successfully!");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  // If using visual editor and docType is set, show full-page editor
  if (useVisualEditor && formData.docType && open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
        <DialogContent className="max-w-full w-full h-full max-h-[100vh] p-0 m-0">
          <TemplateEditor
            template={template ? parseHandlebarsToVisual(template.content, formData.docType) : undefined}
            docType={formData.docType}
            locale={formData.locale}
            onSave={async (serialized) => {
              try {
                setLoading(true);
                const dataToSubmit = {
                  ...formData,
                  content: serialized.handlebars,
                  tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
                };

                if (template) {
                  await api.updateTemplate(template._id || template.id, dataToSubmit);
                  toast.success("Template updated successfully!");
                } else {
                  await api.createTemplate(dataToSubmit);
                  toast.success("Template created successfully!");
                }

                onOpenChange(false);
                onSuccess?.();
              } catch (error: any) {
                toast.error(error.message || "Failed to save template");
              } finally {
                setLoading(false);
              }
            }}
            onCancel={() => onOpenChange(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "Create Template"}</DialogTitle>
          <DialogDescription>
            {template ? "Update the template details" : "Create a new document template"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="docType">Document Type *</Label>
              <Select value={formData.docType} onValueChange={(value) => setFormData({ ...formData, docType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFFER_LETTER">Offer Letter</SelectItem>
                  <SelectItem value="APPOINTMENT_LETTER">Appointment Letter</SelectItem>
                  <SelectItem value="PAYSLIP">Payslip</SelectItem>
                  <SelectItem value="FINAL_SETTLEMENT">Final Settlement</SelectItem>
                  <SelectItem value="EXPERIENCE_CERT">Experience Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="locale">Locale *</Label>
              <Select value={formData.locale} onValueChange={(value) => setFormData({ ...formData, locale: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select locale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="si-LK">Sinhala</SelectItem>
                  <SelectItem value="ta-LK">Tamil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="engine">Template Engine *</Label>
              <Select value={formData.engine} onValueChange={(value) => setFormData({ ...formData, engine: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select engine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HANDLEBARS_HTML">Handlebars HTML</SelectItem>
                  <SelectItem value="LIQUID_HTML">Liquid HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="e.g., standard, offer, letter" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Template Content *</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={useVisualEditor ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (!formData.docType) {
                      toast.error("Please select document type first");
                      return;
                    }
                    setUseVisualEditor(true);
                  }}
                >
                  Visual Editor
                </Button>
                <Button
                  type="button"
                  variant={!useVisualEditor ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseVisualEditor(false)}
                >
                  Handlebars Code
                </Button>
              </div>
            </div>
            {useVisualEditor ? (
              <div className="border rounded-lg p-4 bg-gray-50 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Click "Visual Editor" button above to open the visual template editor
                </p>
                <p className="text-xs text-gray-500">
                  The visual editor provides a DocHub-like experience for creating templates
                </p>
              </div>
            ) : (
              <>
                <Textarea
                  id="content"
                  required={!useVisualEditor}
                  rows={15}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Use {{variable}} syntax for placeholders. Example: {{employee.fullName}}, {{employee.salary}}"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Available variables: employee.*, company.*, payroll.* (for payslips)
                </p>
              </>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : template ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
