"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
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
  Square, Stamp, FileSignature, Trash2, GripVertical, ZoomIn, ZoomOut,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Rnd } from "react-rnd";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ─── Types ──────────────────────────────────────────────────────────────────

interface OverlayField {
  fieldId: string;
  type: string;
  pageIndex: number;
  x: number;        // pixels from left of page
  y: number;        // pixels from top of page
  width: number;    // pixels
  height: number;   // pixels
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

// ─── Constants ──────────────────────────────────────────────────────────────

const PAGE_WIDTH = 794; // px — A4-ish reference width

const FIELD_TYPES = [
  { value: "text", label: "Text Field", icon: Type, color: "#3b82f6" },
  { value: "signature", label: "Signature", icon: PenTool, color: "#8b5cf6" },
  { value: "initials", label: "Initials", icon: FileSignature, color: "#ec4899" },
  { value: "date", label: "Date", icon: Calendar, color: "#f59e0b" },
  { value: "checkbox", label: "Checkbox", icon: Square, color: "#10b981" },
  { value: "stamp", label: "Seal/Stamp", icon: Stamp, color: "#ef4444" },
  { value: "static_text", label: "Static Text", icon: Type, color: "#6b7280" },
];

const DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  text: { w: 200, h: 32 },
  signature: { w: 180, h: 60 },
  initials: { w: 80, h: 40 },
  date: { w: 140, h: 32 },
  checkbox: { w: 24, h: 24 },
  stamp: { w: 120, h: 60 },
  static_text: { w: 200, h: 32 },
};

const RECIPIENT_ROLES = [
  { value: "employee", label: "Employee" },
  { value: "hr", label: "HR Staff" },
  { value: "hr_admin", label: "HR Admin" },
  { value: "manager", label: "Manager" },
  { value: "witness", label: "Witness" },
];

function generateId() {
  return "field_" + Math.random().toString(36).substring(2, 10);
}

function getFieldColor(type: string) {
  return FIELD_TYPES.find((f) => f.value === type)?.color || "#3b82f6";
}

// ─── Draggable Sidebar Item ──────────────────────────────────────────────────

function SidebarFieldItem({
  ft, disabled, onAdd,
}: {
  ft: (typeof FIELD_TYPES)[0];
  disabled: boolean;
  onAdd: () => void;
}) {
  return (
    <button
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm hover:bg-white hover:shadow-sm transition-all disabled:opacity-40 group"
      onClick={onAdd}
      disabled={disabled}
      title={`Add ${ft.label}`}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: ft.color + "22", color: ft.color }}
      >
        <ft.icon className="h-4 w-4" />
      </div>
      <div>
        <div className="font-medium text-gray-800 text-xs">{ft.label}</div>
      </div>
    </button>
  );
}

// ─── Field Overlay on PDF ───────────────────────────────────────────────────

function FieldOverlay({
  field,
  selected,
  disabled,
  onSelect,
  onUpdate,
  onDelete,
}: {
  field: OverlayField;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<OverlayField>) => void;
  onDelete: () => void;
}) {
  const color = getFieldColor(field.type);
  const Icon = FIELD_TYPES.find((f) => f.value === field.type)?.icon || Type;

  return (
    <Rnd
      size={{ width: field.width, height: field.height }}
      position={{ x: field.x, y: field.y }}
      onDragStop={(_e, d) => {
        if (!disabled) onUpdate({ x: d.x, y: d.y });
      }}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        if (!disabled)
          onUpdate({
            width: ref.offsetWidth,
            height: ref.offsetHeight,
            x: pos.x,
            y: pos.y,
          });
      }}
      disableDragging={disabled}
      enableResizing={!disabled}
      minWidth={24}
      minHeight={20}
      bounds="parent"
      style={{ zIndex: selected ? 30 : 20 }}
      onMouseDown={(e) => {
        (e as any).stopPropagation?.();
        onSelect();
      }}
    >
      <div
        className="relative w-full h-full rounded cursor-pointer select-none"
        style={{
          border: `2px ${selected ? "solid" : "dashed"} ${color}`,
          backgroundColor: color + "18",
          boxShadow: selected ? `0 0 0 3px ${color}44` : undefined,
        }}
      >
        {/* Label tag */}
        <div
          className="absolute -top-5 left-0 flex items-center gap-1 text-[9px] text-white px-1.5 py-0.5 rounded-sm whitespace-nowrap z-10 leading-none"
          style={{ backgroundColor: color }}
        >
          <Icon className="h-2.5 w-2.5 inline" />
          {field.label || field.type}
          {field.required && " *"}
        </div>

        {/* Field content preview */}
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          {field.type === "signature" && (
            <div className="flex flex-col items-center gap-0.5">
              <PenTool className="h-4 w-4" style={{ color }} />
              <span className="text-[9px]" style={{ color }}>Sign here</span>
            </div>
          )}
          {field.type === "initials" && (
            <div className="flex flex-col items-center gap-0.5">
              <FileSignature className="h-3 w-3" style={{ color }} />
              <span className="text-[9px]" style={{ color }}>Initials</span>
            </div>
          )}
          {field.type === "stamp" && (
            <div className="flex flex-col items-center gap-0.5">
              <Stamp className="h-4 w-4" style={{ color }} />
              <span className="text-[9px]" style={{ color }}>Seal</span>
            </div>
          )}
          {field.type === "date" && (
            <span className="text-[10px] font-medium" style={{ color }}>
              {field.placeholder || "MM/DD/YYYY"}
            </span>
          )}
          {field.type === "checkbox" && (
            <div className="w-4 h-4 border-2 rounded-sm flex items-center justify-center" style={{ borderColor: color }}>
              <span className="text-[10px]" style={{ color }}>✓</span>
            </div>
          )}
          {field.type === "text" && (
            <span className="text-[10px] px-1 text-gray-500 truncate">
              {field.placeholder || field.label}
            </span>
          )}
          {field.type === "static_text" && (
            <span className="text-[10px] px-1 text-gray-700 truncate font-medium">
              {field.staticText || "Static text"}
            </span>
          )}
        </div>

        {/* Delete button (only when selected and not disabled) */}
        {selected && !disabled && (
          <button
            className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] hover:bg-red-600 shadow-sm z-20"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete field"
          >
            ✕
          </button>
        )}
      </div>
    </Rnd>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TemplateEditorPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-gray-500">Loading editor...</div>}>
      <TemplateEditorInner />
    </Suspense>
  );
}

function TemplateEditorInner() {
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
  const [numPages, setNumPages] = useState<number>(0);
  const [zoom, setZoom] = useState(1);
  const [pageSizes, setPageSizes] = useState<Array<{ width: number; height: number }>>([]);

  const pageContainerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (templateId && versionId) {
      api
        .getEsignTemplateVersion(templateId, versionId)
        .then((data: any) => {
          setVersion(data);
          // Convert stored fractional coords to pixels if they look fractional
          const loaded = (data.overlayDefinition || []).map((f: any) => {
            // If stored as fraction (0-1 range), convert to pixels based on PAGE_WIDTH
            if (f.x <= 1 && f.y <= 1 && f.width <= 1 && f.height <= 1) {
              const ph = PAGE_WIDTH * (11 / 8.5); // A4 height estimate
              return {
                ...f,
                x: Math.round(f.x * PAGE_WIDTH),
                y: Math.round(f.y * ph),
                width: Math.round(f.width * PAGE_WIDTH),
                height: Math.round(f.height * ph),
              };
            }
            return f;
          });
          setFields(loaded);
        })
        .catch((err: any) => toast.error(err.message))
        .finally(() => setLoading(false));
    }
  }, [templateId, versionId]);

  const selectedField = fields.find((f) => f.fieldId === selectedFieldId) ?? null;

  const addField = useCallback(
    (type: string, pageIndex = 0) => {
      const size = DEFAULT_SIZES[type] || { w: 160, h: 36 };
      const newField: OverlayField = {
        fieldId: generateId(),
        type,
        pageIndex,
        x: 60,
        y: 60,
        width: size.w,
        height: size.h,
        required: type !== "static_text" && type !== "checkbox",
        assignedRole: type === "stamp" ? "hr_admin" : "employee",
        label: `${FIELD_TYPES.find((f) => f.value === type)?.label ?? type} ${fields.length + 1}`,
        placeholder: "",
        staticText: type === "static_text" ? "Enter text here" : undefined,
        fontSize: 12,
        useCompanySeal: type === "stamp",
      };
      setFields((prev) => [...prev, newField]);
      setSelectedFieldId(newField.fieldId);
    },
    [fields.length]
  );

  const updateField = useCallback((fieldId: string, updates: Partial<OverlayField>) => {
    setFields((prev) =>
      prev.map((f) => (f.fieldId === fieldId ? { ...f, ...updates } : f))
    );
  }, []);

  const removeField = useCallback((fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.fieldId !== fieldId));
    setSelectedFieldId((cur) => (cur === fieldId ? null : cur));
  }, []);

  const serializeFields = () => {
    // Persist in fractional coords relative to PAGE_WIDTH (for rendering independence)
    return fields.map((f) => {
      const pageH = pageSizes[f.pageIndex]?.height
        ? (pageSizes[f.pageIndex].height / pageSizes[f.pageIndex].width) * PAGE_WIDTH
        : PAGE_WIDTH * (11 / 8.5);
      return {
        ...f,
        x: f.x / PAGE_WIDTH,
        y: f.y / pageH,
        width: f.width / PAGE_WIDTH,
        height: f.height / pageH,
      };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateEsignTemplateVersion(templateId, versionId, {
        overlayDefinition: serializeFields(),
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
        overlayDefinition: serializeFields(),
      });
      await api.publishEsignTemplateVersion(templateId, versionId);
      toast.success("Template published!");
      router.push(`/admin/esign/templates/${templateId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to publish");
    }
  };

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    pageContainerRefs.current = new Array(numPages).fill(null);
  };

  const handlePageLoadSuccess = (page: any, pageIndex: number) => {
    setPageSizes((prev) => {
      const next = [...prev];
      next[pageIndex] = { width: page.width, height: page.height };
      return next;
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading editor...
      </div>
    );
  }

  if (!version) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Template version not found
      </div>
    );
  }

  const isPublished = version.status === "published";
  const scaledPageWidth = Math.round(PAGE_WIDTH * zoom);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white shadow-sm z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/admin/esign/templates/${templateId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="font-semibold text-gray-800">Template Editor</span>
          <Badge
            className={
              isPublished
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }
          >
            {version.status}
          </Badge>
          <span className="text-xs text-gray-500">
            v{version.versionNumber} · {fields.length} fields
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 border rounded-lg px-2 py-1 bg-gray-50">
            <button
              className="p-1 hover:bg-gray-200 rounded"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            >
              <ZoomOut className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-xs font-medium text-gray-600 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              className="p-1 hover:bg-gray-200 rounded"
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            >
              <ZoomIn className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {!isPublished && (
            <>
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Saving..." : "Save Draft"}
              </Button>
              <Button size="sm" onClick={handlePublish} disabled={saving}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Save & Publish
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── Left Toolbox ──────────────────────────────────── */}
        <div className="w-52 border-r bg-gray-50 overflow-y-auto flex-shrink-0">
          <div className="p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
              Add Field
            </p>
            <div className="space-y-0.5">
              {FIELD_TYPES.map((ft) => (
                <SidebarFieldItem
                  key={ft.value}
                  ft={ft}
                  disabled={isPublished}
                  onAdd={() => addField(ft.value, 0)}
                />
              ))}
            </div>
          </div>

          {/* Field list at bottom */}
          {fields.length > 0 && (
            <div className="border-t p-3 mt-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-1">
                <Layers className="h-3 w-3" /> Fields ({fields.length})
              </p>
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {fields.map((f) => {
                  const color = getFieldColor(f.type);
                  const FtIcon = FIELD_TYPES.find((ft) => ft.value === f.type)?.icon || Type;
                  return (
                    <button
                      key={f.fieldId}
                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-left text-xs ${
                        f.fieldId === selectedFieldId
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                      onClick={() => setSelectedFieldId(f.fieldId)}
                    >
                      <FtIcon className="h-3 w-3 flex-shrink-0" style={{ color }} />
                      <span className="truncate flex-1">{f.label}</span>
                      <span className="text-gray-400 flex-shrink-0">p{f.pageIndex + 1}</span>
                      {f.required && <span className="text-red-400">*</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Center: PDF Canvas ─────────────────────────────── */}
        <div
          className="flex-1 overflow-auto bg-gray-300 p-6"
          onClick={() => setSelectedFieldId(null)}
        >
          {version.sourcePdfUrl ? (
            <Document
              file={version.sourcePdfUrl}
              onLoadSuccess={handleDocumentLoadSuccess}
              loading={
                <div className="text-center text-gray-500 py-12">
                  Loading PDF...
                </div>
              }
              error={
                <div className="text-center text-red-500 py-12">
                  Failed to load PDF.
                </div>
              }
              className="flex flex-col items-center gap-6"
            >
              {Array.from({ length: numPages }, (_, pageIndex) => (
                <div
                  key={pageIndex}
                  className="relative bg-white shadow-xl"
                  style={{ width: scaledPageWidth }}
                  ref={(el) => {
                    pageContainerRefs.current[pageIndex] = el;
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Page label */}
                  <div className="absolute -top-6 left-0 text-[11px] text-gray-500 font-medium">
                    Page {pageIndex + 1}
                  </div>

                  {/* PDF page */}
                  <Page
                    pageNumber={pageIndex + 1}
                    width={scaledPageWidth}
                    onLoadSuccess={(page) => handlePageLoadSuccess(page, pageIndex)}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />

                  {/* Field overlays for this page */}
                  <div
                    className="absolute inset-0"
                    style={{ pointerEvents: "none" }}
                  >
                    {fields
                      .filter((f) => f.pageIndex === pageIndex)
                      .map((field) => (
                        <div key={field.fieldId} style={{ pointerEvents: "all" }}>
                          <FieldOverlay
                            field={{
                              ...field,
                              x: field.x * zoom,
                              y: field.y * zoom,
                              width: field.width * zoom,
                              height: field.height * zoom,
                            }}
                            selected={field.fieldId === selectedFieldId}
                            disabled={isPublished}
                            onSelect={() => setSelectedFieldId(field.fieldId)}
                            onUpdate={(updates) => {
                              // Convert zoomed coords back to base coords
                              const baseUpdates: Partial<OverlayField> = {};
                              if (updates.x !== undefined) baseUpdates.x = updates.x / zoom;
                              if (updates.y !== undefined) baseUpdates.y = updates.y / zoom;
                              if (updates.width !== undefined) baseUpdates.width = updates.width / zoom;
                              if (updates.height !== undefined) baseUpdates.height = updates.height / zoom;
                              updateField(field.fieldId, baseUpdates);
                            }}
                            onDelete={() => removeField(field.fieldId)}
                          />
                        </div>
                      ))}
                  </div>

                  {/* Drop zone for adding fields — click shows Add button on hover */}
                  {!isPublished && (
                    <div
                      className="absolute inset-0 flex flex-col items-end justify-end p-3 gap-1 pointer-events-none"
                      style={{ zIndex: 5 }}
                    />
                  )}
                </div>
              ))}
            </Document>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium mb-1">PDF not available</p>
                <p className="text-sm">The source PDF could not be loaded.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Properties Panel ─────────────────────────── */}
        <div className="w-72 border-l bg-white overflow-y-auto flex-shrink-0">
          {selectedField ? (
            <div className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-800">Field Properties</h3>
                <button
                  className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700"
                  onClick={() => removeField(selectedField.fieldId)}
                  disabled={isPublished}
                  title="Delete field"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
                <Input
                  value={selectedField.label}
                  onChange={(e) => updateField(selectedField.fieldId, { label: e.target.value })}
                  disabled={isPublished}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Field Type</label>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 border text-sm"
                  style={{ color: getFieldColor(selectedField.type) }}
                >
                  {(() => {
                    const ft = FIELD_TYPES.find((f) => f.value === selectedField.type);
                    return ft ? <ft.icon className="h-4 w-4" /> : null;
                  })()}
                  {FIELD_TYPES.find((f) => f.value === selectedField.type)?.label ?? selectedField.type}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Page</label>
                <Select
                  value={selectedField.pageIndex.toString()}
                  onValueChange={(v) =>
                    updateField(selectedField.fieldId, { pageIndex: parseInt(v) })
                  }
                  disabled={isPublished || numPages <= 1}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: numPages }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        Page {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Assigned To</label>
                <Select
                  value={selectedField.assignedRole}
                  onValueChange={(v) => updateField(selectedField.fieldId, { assignedRole: v })}
                  disabled={isPublished}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECIPIENT_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-1">
                <label className="text-xs font-medium text-gray-500">Required</label>
                <Switch
                  checked={selectedField.required}
                  onCheckedChange={(v) =>
                    updateField(selectedField.fieldId, { required: v })
                  }
                  disabled={isPublished}
                />
              </div>

              {selectedField.type === "text" && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Placeholder</label>
                  <Input
                    value={selectedField.placeholder || ""}
                    onChange={(e) =>
                      updateField(selectedField.fieldId, { placeholder: e.target.value })
                    }
                    disabled={isPublished}
                  />
                </div>
              )}

              {selectedField.type === "static_text" && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Static Text Content</label>
                  <Input
                    value={selectedField.staticText || ""}
                    onChange={(e) =>
                      updateField(selectedField.fieldId, { staticText: e.target.value })
                    }
                    disabled={isPublished}
                  />
                </div>
              )}

              {["text", "date", "static_text"].includes(selectedField.type) && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Font Size</label>
                  <Input
                    type="number"
                    min={6}
                    max={72}
                    value={selectedField.fontSize || 12}
                    onChange={(e) =>
                      updateField(selectedField.fieldId, {
                        fontSize: parseInt(e.target.value) || 12,
                      })
                    }
                    disabled={isPublished}
                  />
                </div>
              )}

              {/* Position / Size readout */}
              <div className="border-t pt-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Position (px)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["x", "y", "width", "height"] as const).map((prop) => (
                    <div key={prop}>
                      <label className="block text-[10px] text-gray-400 mb-0.5 capitalize">
                        {prop}
                      </label>
                      <Input
                        type="number"
                        value={Math.round(selectedField[prop] as number)}
                        onChange={(e) =>
                          updateField(selectedField.fieldId, {
                            [prop]: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={isPublished}
                        className="text-xs h-7"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400 mt-8">
              <GripVertical className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No field selected</p>
              <p className="text-xs mt-1">
                Click a field on the PDF to edit its properties, or add a new field from the left panel.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
