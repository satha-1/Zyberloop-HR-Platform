"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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
import type { PdfCanvasProps, OverlayField as PdfOverlayField } from "./PdfCanvas";

// ── Dynamically import PdfCanvas with SSR disabled ──────────────────────────
// pdfjs-dist calls Object.defineProperty on browser globals → crashes on server
const PdfCanvas = dynamic<PdfCanvasProps>(() => import("./PdfCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 text-gray-500 py-12">
      Loading PDF viewer...
    </div>
  ),
});

// ─── Types ──────────────────────────────────────────────────────────────────

// Re-export the type from PdfCanvas so both files stay in sync
type OverlayField = PdfOverlayField;

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
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
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
        .then(async (data: any) => {
          setVersion(data);
          // Convert stored fractional coords to pixels if they look fractional
          const loaded = (data.overlayDefinition || []).map((f: any) => {
            if (f.x <= 1 && f.y <= 1 && f.width <= 1 && f.height <= 1) {
              const ph = PAGE_WIDTH * (11 / 8.5);
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

          // Fetch PDF as a local blob URL to avoid S3 CORS issues
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";
            const url = `${apiBase}/esign/templates/${templateId}/versions/${versionId}/pdf`;
            const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
            const response = await fetch(url, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!response.ok) throw new Error("Failed to fetch PDF for preview");
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            setPdfBlobUrl(blobUrl);
          } catch (e: any) {
            toast.error("Could not load PDF preview: " + (e.message || "unknown error"));
          }
        })
        .catch((err: any) => toast.error(err.message))
        .finally(() => setLoading(false));
    }
  }, [templateId, versionId]);

  // Revoke blob URL on unmount to free memory
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

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
          <PdfCanvas
            pdfBlobUrl={pdfBlobUrl}
            scaledPageWidth={scaledPageWidth}
            zoom={zoom}
            numPages={numPages}
            fields={fields}
            selectedFieldId={selectedFieldId}
            isPublished={isPublished}
            pageContainerRefs={pageContainerRefs}
            onDocumentLoadSuccess={handleDocumentLoadSuccess}
            onPageLoadSuccess={handlePageLoadSuccess}
            onFieldSelect={(id) => setSelectedFieldId(id)}
            onFieldDeselect={() => setSelectedFieldId(null)}
            onFieldUpdate={updateField}
            onFieldDelete={removeField}
          />
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
