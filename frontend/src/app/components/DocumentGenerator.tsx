"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { api } from "../lib/api";
import { toast } from "sonner";
import { FileText, Download, Eye, X } from "lucide-react";

interface DocumentGeneratorProps {
  employeeId: string;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const documentTypes = [
  { value: "OFFER_LETTER", label: "Offer Letter" },
  { value: "APPOINTMENT_LETTER", label: "Appointment Letter" },
  { value: "WARNING_LETTER", label: "Warning Letter" },
  { value: "TERMINATION_LETTER", label: "Termination Letter" },
  { value: "SALARY_INCREMENT_LETTER", label: "Salary Increment Letter" },
];

export function DocumentGenerator({
  employeeId,
  employeeName,
  open,
  onOpenChange,
  onSuccess,
}: DocumentGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [documentType, setDocumentType] = useState("");
  const [customData, setCustomData] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = async () => {
    if (!documentType) {
      toast.error("Please select a document type");
      return;
    }

    setPreviewLoading(true);
    try {
      const result = await api.previewDocument(employeeId, documentType, customData);
      setPreviewContent(result.data.content);
      setShowPreview(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to preview document");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!documentType) {
      toast.error("Please select a document type");
      return;
    }

    setLoading(true);
    try {
      const result = await api.generateDocument(employeeId, documentType, customData);
      toast.success("Document generated successfully!");
      
      if (result.downloadUrl) {
        // Open download link
        window.open(result.downloadUrl, "_blank");
      }
      
      onOpenChange(false);
      setDocumentType("");
      setCustomData({});
      setPreviewContent(null);
      setShowPreview(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate document");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFieldChange = (key: string, value: string) => {
    setCustomData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Document</DialogTitle>
          <DialogDescription>
            Generate a document for {employeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Document Type *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
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

          {documentType === "SALARY_INCREMENT_LETTER" && (
            <div className="space-y-2">
              <Label>New Salary</Label>
              <Input
                type="number"
                placeholder="Enter new salary"
                value={customData.newSalary || ""}
                onChange={(e) => handleCustomFieldChange("newSalary", e.target.value)}
              />
            </div>
          )}

          {documentType === "WARNING_LETTER" && (
            <div className="space-y-2">
              <Label>Warning Reason</Label>
              <Input
                placeholder="Enter warning reason"
                value={customData.reason || ""}
                onChange={(e) => handleCustomFieldChange("reason", e.target.value)}
              />
            </div>
          )}

          {documentType === "TERMINATION_LETTER" && (
            <div className="space-y-2">
              <Label>Termination Reason</Label>
              <Input
                placeholder="Enter termination reason"
                value={customData.reason || ""}
                onChange={(e) => handleCustomFieldChange("reason", e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setPreviewContent(null);
                setShowPreview(false);
              }}
              disabled={loading || previewLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={previewLoading || loading || !documentType}
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewLoading ? "Loading..." : "Preview"}
            </Button>
            <Button onClick={handleGenerate} disabled={loading || previewLoading || !documentType}>
              <Download className="h-4 w-4 mr-2" />
              {loading ? "Generating..." : "Generate & Download"}
            </Button>
          </div>
        </div>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
            </DialogHeader>
            {previewContent && (
              <div className="space-y-4">
                <div className="p-4 bg-white border rounded-lg">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {previewContent}
                  </pre>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                  >
                    Close
                  </Button>
                  <Button onClick={handleGenerate} disabled={loading}>
                    <Download className="h-4 w-4 mr-2" />
                    {loading ? "Generating..." : "Generate & Download"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
