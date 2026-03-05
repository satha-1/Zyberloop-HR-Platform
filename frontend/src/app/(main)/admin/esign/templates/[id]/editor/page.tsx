"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card";
import { Button } from "../../../../../../components/ui/button";
import { Input } from "../../../../../../components/ui/input";
import { Badge } from "../../../../../../components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../../../../components/ui/select";
import { Switch } from "../../../../../../components/ui/switch";
import { api } from "../../../../../../lib/api";
import { toast } from "sonner";
import {
  ArrowLeft, Save, CheckCircle, Type, PenTool, Calendar,
  Square, Stamp, FileSignature, Trash2, Plus, GripVertical,
} from "lucide-react";
import Link from "next/link";

interface OverlayField {
  fieldId: string;
  type: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  assignedRole: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  staticText?: string;
  fontSize?: number;
  fontColor?: string;
  useCompanySeal?: boolean;
}

const FIELD_TYPES = [
  { value: "text", label: "Text Field", icon: Type, desc: "Employee fills text" },
  { value: "signature", label: "Signature", icon: PenTool, desc: "Signature placeholder" },
  { value: "initials", label: "Initials", icon: FileSignature, desc: "Initials placeholder" },
  { value: "date", label: "Date", icon: Calendar, desc: "Date field" },
  { value: "checkbox", label: "Checkbox", icon: Square, desc: "Checkbox field" },
  { value: "stamp", label: "Seal/Stamp", icon: Stamp, desc: "Company seal" },
  { value: "static_text", label: "Static Text", icon: Type, desc: "Fixed text by HR" },
];

function generateId() {
  return "field_" + Math.random().toString(36).substring(2, 10);
}

export default function TemplateEditorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading editor...</div>}>
      <TemplateEditorPageInner />
    </Suspense>
  );
}

function TemplateEditorPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = params.id as string;
  const versionId = searchParams.get("version") || "";

  const [version, setVersion] = useState<any>(null);
  const [fields, setFields] = useState<OverlayField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (templateId && versionId) {
      api.getEsignTemplateVersion(templateId, versionId)
        .then((data: any) => {
          setVersion(data);
          setFields(data.overlayDefinition || []);
        })
        .catch((err: any) => toast.error(err.message))
        .finally(() => setLoading(false));
    }
  }, [templateId, versionId]);

  const selectedField = fields.find((f) => f.fieldId === selectedFieldId) || null;

  const addField = (type: string) => {
    const newField: OverlayField = {
      fieldId: generateId(),
      type,
      pageIndex: currentPage,
      x: 0.1,
      y: 0.1,
      width: type === "checkbox" ? 0.03 : type === "signature" || type === "stamp" ? 0.2 : 0.3,
      height: type === "checkbox" ? 0.03 : type === "signature" || type === "stamp" ? 0.08 : 0.04,
      required: type !== "static_text" && type !== "checkbox",
      assignedRole: type === "stamp" ? "hr_admin" : "employee",
      label: `${type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")} ${fields.length + 1}`,
      placeholder: "",
      staticText: type === "static_text" ? "Enter text here" : undefined,
      fontSize: 12,
      useCompanySeal: type === "stamp",
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.fieldId);
  };

  const updateField = (fieldId: string, updates: Partial<OverlayField>) => {
    setFields(fields.map((f) => (f.fieldId === fieldId ? { ...f, ...updates } : f)));
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter((f) => f.fieldId !== fieldId));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateEsignTemplateVersion(templateId, versionId, {
        overlayDefinition: fields,
      });
      toast.success("Template saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      await api.updateEsignTemplateVersion(templateId, versionId, {
        overlayDefinition: fields,
      });
      await api.publishEsignTemplateVersion(templateId, versionId);
      toast.success("Template published!");
      router.push(`/admin/esign/templates/${templateId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to publish");
    }
  };

  // Mouse handling for field positioning on the PDF canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Deselect when clicking canvas background
    if ((e.target as HTMLElement).dataset.canvas === "true") {
      setSelectedFieldId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading editor...</div>;
  }

  if (!version) {
    return <div className="p-6 text-center text-gray-500">Template version not found</div>;
  }

  const isPublished = version.status === "published";
  const pageCount = version.pageCount || 1;

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white z-10">
        <div className="flex items-center gap-3">
          <Link href={`/admin/esign/templates/${templateId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="font-semibold">Template Editor</span>
          <Badge className={isPublished ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
            {version.status}
          </Badge>
          <span className="text-sm text-gray-500">v{version.versionNumber} · {fields.length} fields</span>
        </div>
        <div className="flex items-center gap-2">
          {!isPublished && (
            <>
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save"}
              </Button>
              <Button size="sm" onClick={handlePublish}>
                <CheckCircle className="h-4 w-4 mr-1" /> Save & Publish
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbox */}
        <div className="w-56 border-r bg-gray-50 overflow-y-auto p-3 space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Add Field</h3>
          {FIELD_TYPES.map((ft) => (
            <button
              key={ft.value}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors disabled:opacity-40"
              onClick={() => addField(ft.value)}
              disabled={isPublished}
            >
              <ft.icon className="h-4 w-4 flex-shrink-0" />
              <div>
                <div className="font-medium">{ft.label}</div>
                <div className="text-xs text-gray-400">{ft.desc}</div>
              </div>
            </button>
          ))}

          {/* Page selector */}
          {pageCount > 1 && (
            <div className="pt-4 border-t">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Page</h3>
              <Select value={currentPage.toString()} onValueChange={(v) => setCurrentPage(parseInt(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: pageCount }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      Page {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Center: PDF + Overlay */}
        <div className="flex-1 overflow-auto bg-gray-200 p-6">
          <div
            className="relative mx-auto bg-white shadow-lg"
            style={{
              width: 612, // Standard letter width in points
              minHeight: 792,
              aspectRatio: "8.5 / 11",
            }}
            data-canvas="true"
            onClick={handleCanvasClick}
          >
            {/* PDF Background */}
            {version.sourcePdfUrl && (
              <iframe
                src={`${version.sourcePdfUrl}#page=${currentPage + 1}`}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ border: "none" }}
                title="PDF Background"
              />
            )}

            {/* Field overlays for current page */}
            {fields
              .filter((f) => f.pageIndex === currentPage)
              .map((field) => {
                const isSelected = field.fieldId === selectedFieldId;
                return (
                  <div
                    key={field.fieldId}
                    className={`absolute cursor-pointer border-2 rounded transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-100/40 ring-2 ring-blue-300"
                        : "border-dashed border-blue-300 bg-blue-50/30 hover:border-blue-400"
                    }`}
                    style={{
                      left: `${field.x * 100}%`,
                      top: `${field.y * 100}%`,
                      width: `${field.width * 100}%`,
                      height: `${field.height * 100}%`,
                      minWidth: 24,
                      minHeight: 20,
                      zIndex: isSelected ? 20 : 10,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFieldId(field.fieldId);
                    }}
                  >
                    <div className="absolute -top-5 left-0 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                      {field.label || field.type}
                      {field.required && " *"}
                    </div>
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-blue-600 font-medium">
                      {field.type === "signature" && <PenTool className="h-3 w-3" />}
                      {field.type === "initials" && <FileSignature className="h-3 w-3" />}
                      {field.type === "stamp" && <Stamp className="h-3 w-3" />}
                      {field.type === "date" && <Calendar className="h-3 w-3" />}
                      {field.type === "checkbox" && <Square className="h-3 w-3" />}
                      {field.type === "text" && <span className="truncate px-1">{field.placeholder || "Text"}</span>}
                      {field.type === "static_text" && (
                        <span className="truncate px-1 text-gray-700">{field.staticText}</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right: Properties Panel */}
        <div className="w-72 border-l bg-white overflow-y-auto">
          {selectedField ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Field Properties</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => removeField(selectedField.fieldId)}
                  disabled={isPublished}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                <Input
                  value={selectedField.label}
                  onChange={(e) => updateField(selectedField.fieldId, { label: e.target.value })}
                  disabled={isPublished}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <Input value={selectedField.type.replace("_", " ")} disabled className="bg-gray-50" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">X (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={selectedField.x}
                    onChange={(e) => updateField(selectedField.fieldId, { x: parseFloat(e.target.value) || 0 })}
                    disabled={isPublished}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Y (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={selectedField.y}
                    onChange={(e) => updateField(selectedField.fieldId, { y: parseFloat(e.target.value) || 0 })}
                    disabled={isPublished}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Width (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.02"
                    max="1"
                    value={selectedField.width}
                    onChange={(e) => updateField(selectedField.fieldId, { width: parseFloat(e.target.value) || 0.1 })}
                    disabled={isPublished}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Height (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.02"
                    max="1"
                    value={selectedField.height}
                    onChange={(e) => updateField(selectedField.fieldId, { height: parseFloat(e.target.value) || 0.04 })}
                    disabled={isPublished}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Page</label>
                <Select
                  value={selectedField.pageIndex.toString()}
                  onValueChange={(v) => updateField(selectedField.fieldId, { pageIndex: parseInt(v) })}
                  disabled={isPublished}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: pageCount }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>Page {i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Assigned Role</label>
                <Select
                  value={selectedField.assignedRole}
                  onValueChange={(v) => updateField(selectedField.fieldId, { assignedRole: v })}
                  disabled={isPublished}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="hr">HR Staff</SelectItem>
                    <SelectItem value="hr_admin">HR Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600">Required</label>
                <Switch
                  checked={selectedField.required}
                  onCheckedChange={(v) => updateField(selectedField.fieldId, { required: v })}
                  disabled={isPublished}
                />
              </div>

              {selectedField.type === "text" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder</label>
                  <Input
                    value={selectedField.placeholder || ""}
                    onChange={(e) => updateField(selectedField.fieldId, { placeholder: e.target.value })}
                    disabled={isPublished}
                  />
                </div>
              )}

              {selectedField.type === "static_text" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Static Text</label>
                  <Input
                    value={selectedField.staticText || ""}
                    onChange={(e) => updateField(selectedField.fieldId, { staticText: e.target.value })}
                    disabled={isPublished}
                  />
                </div>
              )}

              {(selectedField.type === "text" || selectedField.type === "date" || selectedField.type === "static_text") && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                  <Input
                    type="number"
                    min="6"
                    max="72"
                    value={selectedField.fontSize || 12}
                    onChange={(e) => updateField(selectedField.fieldId, { fontSize: parseInt(e.target.value) || 12 })}
                    disabled={isPublished}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400">
              <GripVertical className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Select a field to edit its properties</p>
              <p className="text-xs mt-1">or add a new field from the toolbox</p>
            </div>
          )}

          {/* Field list */}
          <div className="border-t p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              All Fields ({fields.length})
            </h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {fields.map((f) => (
                <button
                  key={f.fieldId}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs text-left ${
                    f.fieldId === selectedFieldId ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setSelectedFieldId(f.fieldId);
                    setCurrentPage(f.pageIndex);
                  }}
                >
                  <span className="truncate">
                    {f.label} <span className="text-gray-400">(p{f.pageIndex + 1})</span>
                  </span>
                  {f.required && <span className="text-red-400 ml-1">*</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
