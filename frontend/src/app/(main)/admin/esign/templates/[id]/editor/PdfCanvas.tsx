"use client";

// PdfCanvas is always loaded via next/dynamic with { ssr: false }.
// IMPORTANT: react-pdf (pdfjs-dist) must NOT be imported at the module top-level
// because pdfjs calls Object.defineProperty on browser globals (window, globalThis)
// at module-init time. When webpack evaluates the chunk it crashes even in the
// browser before any component renders. We defer the entire react-pdf import
// into a useEffect so pdfjs only initialises after the component mounts.

import { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import {
  Type, PenTool, Calendar, Square, Stamp, FileSignature,
} from "lucide-react";

// CSS-only imports are processed by webpack at build time (no JS executes) — safe.
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// ─── Shared types ────────────────────────────────────────────────────────────

export interface OverlayField {
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

// ─── Constants ───────────────────────────────────────────────────────────────

const FIELD_TYPES = [
  { value: "text",        color: "#3b82f6", icon: Type },
  { value: "signature",   color: "#8b5cf6", icon: PenTool },
  { value: "initials",    color: "#ec4899", icon: FileSignature },
  { value: "date",        color: "#f59e0b", icon: Calendar },
  { value: "checkbox",    color: "#10b981", icon: Square },
  { value: "stamp",       color: "#ef4444", icon: Stamp },
  { value: "static_text", color: "#6b7280", icon: Type },
];

function getFieldColor(type: string) {
  return FIELD_TYPES.find((f) => f.value === type)?.color ?? "#3b82f6";
}

// ─── FieldOverlay (Rnd wrapper per field) ────────────────────────────────────

function FieldOverlay({
  field, selected, disabled, onSelect, onUpdate, onDelete,
}: {
  field: OverlayField;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<OverlayField>) => void;
  onDelete: () => void;
}) {
  const color = getFieldColor(field.type);
  const Icon = FIELD_TYPES.find((f) => f.value === field.type)?.icon ?? Type;

  return (
    <Rnd
      size={{ width: field.width, height: field.height }}
      position={{ x: field.x, y: field.y }}
      onDragStop={(_e, d) => { if (!disabled) onUpdate({ x: d.x, y: d.y }); }}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        if (!disabled)
          onUpdate({ width: ref.offsetWidth, height: ref.offsetHeight, x: pos.x, y: pos.y });
      }}
      disableDragging={disabled}
      enableResizing={!disabled}
      minWidth={24}
      minHeight={20}
      bounds="parent"
      style={{ zIndex: selected ? 30 : 20 }}
      onMouseDown={(e) => { (e as any).stopPropagation?.(); onSelect(); }}
    >
      <div
        className="relative w-full h-full rounded cursor-pointer select-none"
        style={{
          border: `2px ${selected ? "solid" : "dashed"} ${color}`,
          backgroundColor: color + "18",
          boxShadow: selected ? `0 0 0 3px ${color}44` : undefined,
        }}
      >
        <div
          className="absolute -top-5 left-0 flex items-center gap-1 text-[9px] text-white px-1.5 py-0.5 rounded-sm whitespace-nowrap z-10 leading-none"
          style={{ backgroundColor: color }}
        >
          <Icon className="h-2.5 w-2.5 inline" />
          {field.label || field.type}{field.required && " *"}
        </div>

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

// ─── PdfCanvas props ──────────────────────────────────────────────────────────

export interface PdfCanvasProps {
  pdfBlobUrl: string | null;
  scaledPageWidth: number;
  zoom: number;
  numPages: number;
  fields: OverlayField[];
  selectedFieldId: string | null;
  isPublished: boolean;
  pageContainerRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  onDocumentLoadSuccess: (data: { numPages: number }) => void;
  onPageLoadSuccess: (page: any, pageIndex: number) => void;
  onFieldSelect: (fieldId: string) => void;
  onFieldDeselect: () => void;
  onFieldUpdate: (fieldId: string, updates: Partial<OverlayField>) => void;
  onFieldDelete: (fieldId: string) => void;
}

// ─── PdfCanvas ────────────────────────────────────────────────────────────────

export default function PdfCanvas({
  pdfBlobUrl,
  scaledPageWidth,
  zoom,
  numPages,
  fields,
  selectedFieldId,
  isPublished,
  pageContainerRefs,
  onDocumentLoadSuccess,
  onPageLoadSuccess,
  onFieldSelect,
  onFieldDeselect,
  onFieldUpdate,
  onFieldDelete,
}: PdfCanvasProps) {
  // Lazy-load react-pdf inside useEffect so pdfjs never runs at module init time
  const [pdfLib, setPdfLib] = useState<{ Document: any; Page: any } | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);

  useEffect(() => {
    import("react-pdf")
      .then(({ Document, Page, pdfjs }) => {
        // Worker must be configured before any Document renders
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        setPdfLib({ Document, Page });
      })
      .catch((err) => {
        console.error("[PdfCanvas] Failed to load react-pdf:", err);
        setPdfLoadError("Failed to load PDF viewer library.");
      });
  }, []);

  // ── Loading / error states ──────────────────────────────────────────────────

  if (pdfLoadError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <p className="text-sm">{pdfLoadError}</p>
      </div>
    );
  }

  if (!pdfLib) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p className="text-sm">Initialising PDF viewer…</p>
      </div>
    );
  }

  if (!pdfBlobUrl) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-1">PDF not available</p>
          <p className="text-sm">The source PDF could not be loaded.</p>
        </div>
      </div>
    );
  }

  const { Document, Page } = pdfLib;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Document
      file={pdfBlobUrl}
      onLoadSuccess={onDocumentLoadSuccess}
      loading={
        <div className="text-center text-gray-500 py-12">Loading PDF…</div>
      }
      error={
        <div className="text-center text-red-500 py-12">Failed to load PDF.</div>
      }
      className="flex flex-col items-center gap-6"
    >
      {Array.from({ length: numPages }, (_, pageIndex) => (
        <div
          key={pageIndex}
          className="relative bg-white shadow-xl"
          style={{ width: scaledPageWidth }}
          ref={(el) => { pageContainerRefs.current[pageIndex] = el; }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute -top-6 left-0 text-[11px] text-gray-500 font-medium">
            Page {pageIndex + 1}
          </div>

          <Page
            pageNumber={pageIndex + 1}
            width={scaledPageWidth}
            onLoadSuccess={(page: any) => onPageLoadSuccess(page, pageIndex)}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />

          {/* Field overlays */}
          <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
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
                    onSelect={() => onFieldSelect(field.fieldId)}
                    onUpdate={(updates) => {
                      const base: Partial<OverlayField> = {};
                      if (updates.x !== undefined) base.x = updates.x / zoom;
                      if (updates.y !== undefined) base.y = updates.y / zoom;
                      if (updates.width !== undefined) base.width = updates.width / zoom;
                      if (updates.height !== undefined) base.height = updates.height / zoom;
                      onFieldUpdate(field.fieldId, base);
                    }}
                    onDelete={() => onFieldDelete(field.fieldId)}
                  />
                </div>
              ))}
          </div>

          {/* Deselect backdrop */}
          <div
            className="absolute inset-0"
            style={{ zIndex: 1, pointerEvents: "auto" }}
            onClick={onFieldDeselect}
          />
        </div>
      ))}
    </Document>
  );
}
