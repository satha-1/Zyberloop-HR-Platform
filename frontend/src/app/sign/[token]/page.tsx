"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "../../lib/api";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  CheckCircle2, PenTool, Calendar, Type, Square, Stamp,
  FileSignature, Download, Loader2, Shield, AlertTriangle, X,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ─── Minimal UI Components (no auth deps) ────────────────────────────────────

function Btn({
  children, className = "", variant = "default", disabled = false, ...props
}: any) {
  const base =
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2 gap-2";
  const variants: Record<string, string> = {
    default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
    ghost: "hover:bg-gray-100 text-gray-700",
    success: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button
      className={`${base} ${variants[variant] || variants.default} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface OverlayField {
  fieldId: string;
  type: string;
  pageIndex: number;
  x: number; // fraction 0-1 or pixel — see note below
  y: number;
  width: number;
  height: number;
  required: boolean;
  assignedRole: string;
  label: string;
  placeholder?: string;
  staticText?: string;
  fontSize?: number;
  fontColor?: string;
}

interface FieldValue {
  fieldId: string;
  value?: string;
  signatureImageBase64?: string;
}

// ─── Signature Pad Modal ─────────────────────────────────────────────────────

function SignaturePadModal({
  fieldLabel,
  isInitials,
  onSave,
  onClose,
}: {
  fieldLabel: string;
  isInitials: boolean;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typed, setTyped] = useState("");
  const [hasDrawn, setHasDrawn] = useState(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getPos(e, canvas);
    ctx.lineWidth = isInitials ? 1.5 : 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDraw = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const save = () => {
    if (mode === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      onSave(canvas.toDataURL("image/png"));
    } else {
      if (!typed.trim()) return;
      const tmp = document.createElement("canvas");
      tmp.width = isInitials ? 200 : 500;
      tmp.height = isInitials ? 80 : 100;
      const ctx = tmp.getContext("2d")!;
      ctx.clearRect(0, 0, tmp.width, tmp.height);
      ctx.font = `italic ${isInitials ? 36 : 46}px 'Georgia', serif`;
      ctx.fillStyle = "#1e3a5f";
      ctx.textBaseline = "middle";
      ctx.fillText(typed, 12, tmp.height / 2);
      onSave(tmp.toDataURL("image/png"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {isInitials ? "Add Your Initials" : "Add Your Signature"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Field: <span className="font-medium text-gray-700">{fieldLabel}</span>
        </p>

        {/* Mode toggle */}
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg">
          <button
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "draw"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setMode("draw")}
          >
            <PenTool className="h-3.5 w-3.5 inline mr-1" /> Draw
          </button>
          <button
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "type"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setMode("type")}
          >
            <Type className="h-3.5 w-3.5 inline mr-1" /> Type
          </button>
        </div>

        {mode === "draw" ? (
          <div>
            <canvas
              ref={canvasRef}
              width={460}
              height={isInitials ? 100 : 140}
              className="border-2 border-dashed border-blue-300 rounded-xl cursor-crosshair bg-blue-50/30 w-full touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">Draw your {isInitials ? "initials" : "signature"} above</p>
              <button
                onClick={clear}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div>
            <input
              type="text"
              placeholder={isInitials ? "e.g. JD" : "Type your full name"}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none text-2xl font-serif italic text-gray-800"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
            />
            {typed && (
              <div className="mt-3 p-4 bg-gray-50 rounded-xl text-center border">
                <p className="text-3xl font-serif italic text-gray-800">{typed}</p>
                <p className="text-[10px] text-gray-400 mt-1">Preview</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn
            onClick={save}
            disabled={mode === "draw" ? !hasDrawn : !typed.trim()}
          >
            Apply {isInitials ? "Initials" : "Signature"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Field Overlay Component ──────────────────────────────────────────────────

function SigningFieldOverlay({
  field,
  fieldValue,
  pageWidth,
  pageHeight,
  isMyField,
  onInteract,
}: {
  field: OverlayField;
  fieldValue?: FieldValue;
  pageWidth: number;
  pageHeight: number;
  isMyField: boolean;
  onInteract: (fieldId: string) => void;
}) {
  // Fields stored as fractions (0-1) — convert to pixels
  const isFractional = field.x <= 1 && field.y <= 1 && field.width <= 1 && field.height <= 1;
  const px = isFractional ? field.x * pageWidth : field.x;
  const py = isFractional ? field.y * pageHeight : field.y;
  const pw = isFractional ? field.width * pageWidth : field.width;
  const ph = isFractional ? field.height * pageHeight : field.height;

  const isFilled = !!fieldValue?.value || !!fieldValue?.signatureImageBase64;

  const getBorderColor = () => {
    if (!isMyField) return "#d1d5db";
    if (isFilled) return "#10b981";
    return "#3b82f6";
  };

  const getBgColor = () => {
    if (!isMyField) return "transparent";
    if (isFilled) return "#f0fdf4";
    return "#eff6ff";
  };

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        left: px,
        top: py,
        width: pw,
        height: ph,
        border: `2px ${isMyField ? "solid" : "dashed"} ${getBorderColor()}`,
        backgroundColor: getBgColor(),
        borderRadius: 4,
        cursor: isMyField ? "pointer" : "not-allowed",
        zIndex: 10,
        transition: "border-color 0.2s, background-color 0.2s",
        boxShadow: isMyField && !isFilled ? "0 0 0 2px rgba(59,130,246,0.2)" : undefined,
      }}
      onClick={() => isMyField && onInteract(field.fieldId)}
    >
      {/* Filled content */}
      {isFilled ? (
        field.type === "signature" || field.type === "initials" ? (
          <img
            src={fieldValue!.signatureImageBase64}
            alt="signature"
            className="w-full h-full object-contain p-0.5"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center px-1">
            <span className="text-xs text-gray-700 truncate">
              {fieldValue!.value}
            </span>
          </div>
        )
      ) : (
        // Empty field placeholder
        <div className="w-full h-full flex items-center justify-center gap-1">
          {isMyField ? (
            <>
              {field.type === "signature" && (
                <PenTool className="h-3.5 w-3.5 text-blue-400" />
              )}
              {field.type === "initials" && (
                <FileSignature className="h-3 w-3 text-blue-400" />
              )}
              {field.type === "date" && (
                <Calendar className="h-3 w-3 text-blue-400" />
              )}
              {field.type === "checkbox" && (
                <Square className="h-3.5 w-3.5 text-blue-400" />
              )}
              {field.type === "text" && (
                <Type className="h-3 w-3 text-blue-400" />
              )}
              {field.type === "stamp" && (
                <Stamp className="h-3.5 w-3.5 text-blue-400" />
              )}
              {!["signature", "initials", "date", "checkbox", "text", "stamp"].includes(field.type) && (
                <span className="text-[9px] text-blue-400 uppercase">{field.type}</span>
              )}
            </>
          ) : (
            <span className="text-[9px] text-gray-300 uppercase">{field.label}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Static text overlay ──────────────────────────────────────────────────────

function StaticTextOverlay({
  field,
  pageWidth,
  pageHeight,
}: {
  field: OverlayField;
  pageWidth: number;
  pageHeight: number;
}) {
  const isFractional = field.x <= 1 && field.y <= 1 && field.width <= 1 && field.height <= 1;
  const px = isFractional ? field.x * pageWidth : field.x;
  const py = isFractional ? field.y * pageHeight : field.y;
  const pw = isFractional ? field.width * pageWidth : field.width;
  const ph = isFractional ? field.height * pageHeight : field.height;
  return (
    <div
      className="absolute flex items-center overflow-hidden px-1"
      style={{
        left: px, top: py, width: pw, height: ph,
        fontSize: field.fontSize || 12,
        color: field.fontColor || "#111827",
        zIndex: 8,
        pointerEvents: "none",
      }}
    >
      <span className="truncate">{field.staticText || ""}</span>
    </div>
  );
}

// ─── Inline field form ───────────────────────────────────────────────────────

function InlineFieldForm({
  field,
  value,
  onChange,
  onSignatureClick,
}: {
  field: OverlayField;
  value?: FieldValue;
  onChange: (fieldId: string, val: string) => void;
  onSignatureClick: (fieldId: string) => void;
}) {
  const isFilled = !!value?.value || !!value?.signatureImageBase64;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-colors ${
        isFilled
          ? "border-green-200 bg-green-50/60"
          : "border-gray-200 bg-white hover:border-blue-200"
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isFilled ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <p className="text-sm font-medium text-gray-800">{field.label}</p>
          {field.required && (
            <span className="text-[10px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
              Required
            </span>
          )}
        </div>

        {field.type === "text" && (
          <input
            type="text"
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            value={value?.value || ""}
            onChange={(e) => onChange(field.fieldId, e.target.value)}
          />
        )}

        {field.type === "date" && (
          <input
            type="date"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            value={value?.value || ""}
            onChange={(e) => onChange(field.fieldId, e.target.value)}
          />
        )}

        {field.type === "checkbox" && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
              checked={value?.value === "true"}
              onChange={(e) => onChange(field.fieldId, e.target.checked.toString())}
            />
            <span className="text-sm text-gray-700">{field.placeholder || "I agree"}</span>
          </label>
        )}

        {(field.type === "signature" || field.type === "initials") && (
          <div>
            {value?.signatureImageBase64 ? (
              <div className="flex items-center gap-3">
                <img
                  src={value.signatureImageBase64}
                  alt="signature"
                  className="h-14 border rounded-lg bg-white p-1 shadow-sm"
                />
                <Btn
                  variant="outline"
                  className="text-xs py-1 px-3"
                  onClick={() => onSignatureClick(field.fieldId)}
                >
                  Change
                </Btn>
              </div>
            ) : (
              <Btn
                variant="outline"
                className="text-sm"
                onClick={() => onSignatureClick(field.fieldId)}
              >
                <PenTool className="h-4 w-4" />
                {field.type === "signature" ? "Add Signature" : "Add Initials"}
              </Btn>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Signing Page ───────────────────────────────────────────────────────

const PAGE_WIDTH = 794;

export default function SigningPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [fieldValues, setFieldValues] = useState<Map<string, FieldValue>>(new Map());
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [activeSignatureFieldId, setActiveSignatureFieldId] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageSizes, setPageSizes] = useState<Record<number, { width: number; height: number }>>({});
  const [zoom, setZoom] = useState(1);
  const activeField = session?.templateVersion?.overlayDefinition?.find(
    (f: any) => f.fieldId === activeSignatureFieldId
  );

  useEffect(() => {
    if (!token) return;
    api
      .getSigningSession(token)
      .then((data: any) => {
        setSession(data);
        api.markSigningViewed(token).catch(() => {});
        if (data.fieldValues) {
          const map = new Map<string, FieldValue>();
          data.fieldValues.forEach((fv: any) => {
            map.set(fv.fieldId, { fieldId: fv.fieldId, value: fv.value });
          });
          setFieldValues(map);
        }
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleFieldInteract = useCallback((fieldId: string) => {
    const field = session?.templateVersion?.overlayDefinition?.find(
      (f: any) => f.fieldId === fieldId
    );
    if (!field) return;

    if (field.type === "signature" || field.type === "initials") {
      setActiveSignatureFieldId(fieldId);
      setShowSignaturePad(true);
    } else if (field.type === "date") {
      const today = new Date().toISOString().split("T")[0];
      setFieldValue(fieldId, today);
    } else if (field.type === "checkbox") {
      const current = fieldValues.get(fieldId)?.value;
      setFieldValue(fieldId, current === "true" ? "false" : "true");
    }
    // text fields handled in the form panel
  }, [session, fieldValues]);

  const setFieldValue = (fieldId: string, value: string) => {
    const newMap = new Map(fieldValues);
    newMap.set(fieldId, { fieldId, value });
    setFieldValues(newMap);
    api.submitSigningField(token, { fieldId, value }).catch(() => {});
  };

  const saveSignature = (dataUrl: string) => {
    if (!activeSignatureFieldId) return;
    const newMap = new Map(fieldValues);
    newMap.set(activeSignatureFieldId, {
      fieldId: activeSignatureFieldId,
      signatureImageBase64: dataUrl,
    });
    setFieldValues(newMap);
    api.submitSigningField(token, {
      fieldId: activeSignatureFieldId,
      signatureImageBase64: dataUrl,
    }).catch(() => {});
    setShowSignaturePad(false);
    setActiveSignatureFieldId(null);
  };

  const handleComplete = async () => {
    if (!consent) return;
    try {
      setCompleting(true);
      const result: any = await api.completeSigning(token);
      setCompleted(true);
      setDownloadUrl(result.downloadUrl || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading document...</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md bg-white rounded-2xl p-8 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Document</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ── Completed ─────────────────────────────────────────────────────────────
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
        <div className="text-center max-w-md bg-white rounded-2xl p-10 shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Signing Complete!</h2>
          <p className="text-gray-500 mb-8">
            The document has been signed successfully. All parties will receive a copy via email.
          </p>
          {downloadUrl && (
            <Btn
              variant="success"
              className="mx-auto"
              onClick={() => window.open(downloadUrl!, "_blank")}
            >
              <Download className="h-4 w-4" />
              Download Signed Document
            </Btn>
          )}
          <p className="text-xs text-gray-300 mt-8">Secured by ZyberHR eSign</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const { envelope, templateVersion, sourcePdfUrl } = session;
  const allFields: OverlayField[] = templateVersion?.overlayDefinition || [];
  const myFields = allFields.filter(
    (f: OverlayField) => f.type !== "static_text" && f.assignedRole === "employee"
  );
  const requiredMyFields = myFields.filter((f: OverlayField) => f.required);
  const allRequiredFilled = requiredMyFields.every((f: OverlayField) => {
    const fv = fieldValues.get(f.fieldId);
    return fv && (fv.value || fv.signatureImageBase64);
  });
  const filledCount = myFields.filter((f: OverlayField) => {
    const fv = fieldValues.get(f.fieldId);
    return fv && (fv.value || fv.signatureImageBase64);
  }).length;

  const scaledWidth = Math.round(PAGE_WIDTH * zoom);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{envelope.displayName}</p>
              <p className="text-xs text-gray-400">Review and sign the document below</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                {filledCount}
              </div>
              <span className="text-gray-400">/</span>
              <span>{myFields.length}</span>
              <span className="text-gray-400 text-xs">fields</span>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-blue-500 transition-all duration-500"
            style={{ width: myFields.length > 0 ? `${(filledCount / myFields.length) * 100}%` : "0%" }}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* ── PDF Column ──────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Zoom controls */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600 font-medium">Document Preview</p>
            <div className="flex items-center gap-1 bg-white border rounded-lg px-2 py-1 shadow-sm">
              <button
                className="p-1 hover:bg-gray-100 rounded text-gray-600"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-gray-600 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                className="p-1 hover:bg-gray-100 rounded text-gray-600"
                onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          {sourcePdfUrl ? (
            <Document
              file={sourcePdfUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={
                <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                </div>
              }
              error={
                <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow text-red-500">
                  Failed to load PDF
                </div>
              }
              className="flex flex-col items-center gap-6"
            >
              {Array.from({ length: numPages }, (_, pageIndex) => {
                const ps = pageSizes[pageIndex];
                const pageH = ps
                  ? Math.round((ps.height / ps.width) * scaledWidth)
                  : Math.round(scaledWidth * (11 / 8.5));

                return (
                  <div
                    key={pageIndex}
                    className="relative bg-white shadow-xl rounded-sm overflow-hidden"
                    style={{ width: scaledWidth }}
                  >
                    {/* Page number badge */}
                    <div className="absolute top-2 right-2 z-20 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">
                      {pageIndex + 1} / {numPages}
                    </div>

                    <Page
                      pageNumber={pageIndex + 1}
                      width={scaledWidth}
                      onLoadSuccess={(page) => {
                        setPageSizes((prev) => ({
                          ...prev,
                          [pageIndex]: { width: page.width, height: page.height },
                        }));
                      }}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                    />

                    {/* Overlays */}
                    <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
                      {/* Static text fields */}
                      {allFields
                        .filter((f: OverlayField) => f.pageIndex === pageIndex && f.type === "static_text")
                        .map((field: OverlayField) => (
                          <div key={field.fieldId} style={{ pointerEvents: "none" }}>
                            <StaticTextOverlay
                              field={field}
                              pageWidth={scaledWidth}
                              pageHeight={pageH}
                            />
                          </div>
                        ))}

                      {/* Interactive fields */}
                      {allFields
                        .filter(
                          (f: OverlayField) =>
                            f.pageIndex === pageIndex && f.type !== "static_text"
                        )
                        .map((field: OverlayField) => {
                          const isMyField = field.assignedRole === "employee";
                          return (
                            <div key={field.fieldId} style={{ pointerEvents: "all" }}>
                              <SigningFieldOverlay
                                field={field}
                                fieldValue={fieldValues.get(field.fieldId)}
                                pageWidth={scaledWidth}
                                pageHeight={pageH}
                                isMyField={isMyField}
                                onInteract={handleFieldInteract}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </Document>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow text-gray-400">
              Document not available
            </div>
          )}
        </div>

        {/* ── Side Panel ──────────────────────────────────── */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {/* Fields to fill */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-sm text-gray-800">Fields to Complete</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {filledCount} of {myFields.length} filled
              </p>
            </div>
            <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
              {myFields.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No fields assigned to you.
                </p>
              ) : (
                myFields.map((field: OverlayField) => (
                  <InlineFieldForm
                    key={field.fieldId}
                    field={field}
                    value={fieldValues.get(field.fieldId)}
                    onChange={setFieldValue}
                    onSignatureClick={(id) => {
                      setActiveSignatureFieldId(id);
                      setShowSignaturePad(true);
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Consent + Submit */}
          <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                I consent to sign this document electronically. I understand this constitutes
                a legally binding signature under applicable e-signature laws.
              </span>
            </label>

            <Btn
              className="w-full"
              variant={allRequiredFilled && consent ? "success" : "default"}
              disabled={!consent || !allRequiredFilled || completing}
              onClick={handleComplete}
            >
              {completing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finalising...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  {allRequiredFilled ? "Complete Signing" : `${requiredMyFields.length - (requiredMyFields.filter(f => { const fv = fieldValues.get(f.fieldId); return fv && (fv.value || fv.signatureImageBase64); }).length)} fields remaining`}
                </>
              )}
            </Btn>

            {!allRequiredFilled && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                Complete all required fields before signing.
              </p>
            )}
          </div>

          {/* Document info */}
          <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Document Info
            </h4>
            <div className="space-y-1.5">
              {envelope.expiryAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Expires</span>
                  <span className="text-gray-700 font-medium">
                    {new Date(envelope.expiryAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Recipients</span>
                <span className="text-gray-700 font-medium">
                  {envelope.recipients?.length || 1}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Total fields</span>
                <span className="text-gray-700 font-medium">
                  {myFields.length}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-300 text-center px-4">
            This document is secured and encrypted by ZyberHR eSign. Do not share this link.
          </p>
        </div>
      </div>

      {/* ── Signature Pad Modal ──────────────────────────── */}
      {showSignaturePad && activeSignatureFieldId && (
        <SignaturePadModal
          fieldLabel={activeField?.label || "Signature"}
          isInitials={activeField?.type === "initials"}
          onSave={saveSignature}
          onClose={() => {
            setShowSignaturePad(false);
            setActiveSignatureFieldId(null);
          }}
        />
      )}
    </div>
  );
}
