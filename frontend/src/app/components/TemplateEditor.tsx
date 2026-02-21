"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { api } from "../lib/api";
import { toast } from "sonner";
import { FileText, Save, X } from "lucide-react";
import { Badge } from "./ui/badge";

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId?: string;
  onSuccess?: () => void;
}

const documentTypes = [
  { value: "OFFER_LETTER", label: "Offer Letter" },
  { value: "APPOINTMENT_LETTER", label: "Appointment Letter" },
  { value: "WARNING_LETTER", label: "Warning Letter" },
  { value: "TERMINATION_LETTER", label: "Termination Letter" },
  { value: "SALARY_INCREMENT_LETTER", label: "Salary Increment Letter" },
];

export function TemplateEditor({
  open,
  onOpenChange,
  templateId,
  onSuccess,
}: TemplateEditorProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    content: "",
    placeholders: [] as string[],
  });

  useEffect(() => {
    if (open && templateId) {
      loadTemplate();
    } else if (open && !templateId) {
      // Reset form for new template
      setFormData({
        name: "",
        type: "",
        content: "",
        placeholders: [],
      });
    }
  }, [open, templateId]);

  const loadTemplate = async () => {
    if (!templateId) return;
    try {
      const result = await api.getTemplateById(templateId);
      setFormData({
        name: result.data.name,
        type: result.data.type,
        content: result.data.content,
        placeholders: result.data.placeholders || [],
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to load template");
    }
  };

  const extractPlaceholders = (content: string): string[] => {
    const matches = content.match(/{{(\w+)}}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];
  };

  const handleContentChange = (content: string) => {
    setFormData({
      ...formData,
      content,
      placeholders: extractPlaceholders(content),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      if (templateId) {
        await api.updateTemplate(templateId, {
          name: formData.name,
          content: formData.content,
        });
        toast.success("Template updated successfully!");
      } else {
        await api.createTemplate({
          name: formData.name,
          type: formData.type,
          content: formData.content,
          placeholders: formData.placeholders,
        });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {templateId ? "Edit Template" : "Create New Template"}
          </DialogTitle>
          <DialogDescription>
            {templateId
              ? "Edit the document template content and placeholders"
              : "Create a new document template with placeholders"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard Offer Letter"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Document Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                disabled={!!templateId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Template Content *</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter template content. Use {{placeholderName}} for dynamic values."
              rows={15}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-500">
              Use double curly braces for placeholders, e.g., {"{{employeeName}}"}, {"{{salary}}"}
            </p>
          </div>

          {formData.placeholders.length > 0 && (
            <div className="space-y-2">
              <Label>Detected Placeholders</Label>
              <div className="flex flex-wrap gap-2">
                {formData.placeholders.map((placeholder) => (
                  <Badge key={placeholder} variant="secondary">
                    {"{{" + placeholder + "}}"}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : templateId ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
