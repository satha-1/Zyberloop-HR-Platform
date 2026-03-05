"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "../../lib/api";
import {
  CheckCircle2, PenTool, Calendar, Type, Square, Stamp,
  FileSignature, ChevronRight, Download, Loader2, Shield,
  AlertTriangle,
} from "lucide-react";

// Minimal inline components (signing page should not depend on auth)
function Button({ children, className = "", variant = "default", disabled = false, ...props }: any) {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2";
  const variants: Record<string, string> = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-50",
    ghost: "hover:bg-gray-100",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button className={`${base} ${variants[variant] || variants.default} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

function Badge({ children, className = "" }: any) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}

interface FieldValue {
  fieldId: string;
  value?: string;
  signatureImageBase64?: string;
}

export default function SigningPage() {
  const params = useParams();
  const token = params.token as string;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [fieldValues, setFieldValues] = useState<Map<string, FieldValue>>(new Map());
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [activeSignatureFieldId, setActiveSignatureFieldId] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedSignature, setTypedSignature] = useState("");
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");

  // Load signing session
  useEffect(() => {
    if (!token) return;

    api.getSigningSession(token)
      .then((data: any) => {
        setSession(data);
        // Mark as viewed
        api.markSigningViewed(token).catch(() => {});

        // Initialize field values from any previously submitted values
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

  // Signature pad drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignaturePad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    if (!activeSignatureFieldId) return;

    let imageBase64: string;

    if (signatureMode === "draw") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      imageBase64 = canvas.toDataURL("image/png");
    } else {
      // Generate typed signature as image
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = 400;
      tmpCanvas.height = 100;
      const ctx = tmpCanvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "transparent";
      ctx.fillRect(0, 0, 400, 100);
      ctx.font = "italic 36px 'Georgia', serif";
      ctx.fillStyle = "#1a1a1a";
      ctx.fillText(typedSignature, 20, 60);
      imageBase64 = tmpCanvas.toDataURL("image/png");
    }

    const newMap = new Map(fieldValues);
    newMap.set(activeSignatureFieldId, {
      fieldId: activeSignatureFieldId,
      signatureImageBase64: imageBase64,
    });
    setFieldValues(newMap);

    // Submit to server
    api.submitSigningField(token, {
      fieldId: activeSignatureFieldId,
      signatureImageBase64: imageBase64,
    }).catch(() => {});

    setShowSignaturePad(false);
    setActiveSignatureFieldId(null);
    setTypedSignature("");
  };

  const setFieldValue = (fieldId: string, value: string) => {
    const newMap = new Map(fieldValues);
    newMap.set(fieldId, { fieldId, value });
    setFieldValues(newMap);

    // Submit to server
    api.submitSigningField(token, { fieldId, value }).catch(() => {});
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Document</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Completed state
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Signing Complete!</h2>
          <p className="text-gray-600 mb-6">
            The document has been signed and finalised successfully.
          </p>
          {downloadUrl && (
            <Button onClick={() => window.open(downloadUrl!, "_blank")}>
              <Download className="h-4 w-4 mr-2" /> Download Signed Document
            </Button>
          )}
          <p className="text-xs text-gray-400 mt-6">Powered by ZyberHR</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const { envelope, templateVersion, sourcePdfUrl } = session;
  const fillableFields = templateVersion.overlayDefinition.filter(
    (f: any) => f.type !== "static_text" && f.assignedRole === "employee"
  );
  const requiredFields = fillableFields.filter((f: any) => f.required);
  const allRequiredFilled = requiredFields.every((f: any) => {
    const fv = fieldValues.get(f.fieldId);
    return fv && (fv.value || fv.signatureImageBase64);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-900">{envelope.displayName}</h1>
            <p className="text-xs text-gray-500">Please review and sign this document</p>
          </div>
          <Badge className="bg-blue-100 text-blue-700">
            {fieldValues.size} / {fillableFields.length} fields
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main: PDF + Fields */}
        <div className="lg:col-span-3">
          {/* PDF Viewer */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
            {sourcePdfUrl ? (
              <iframe
                src={sourcePdfUrl}
                className="w-full h-[600px]"
                title="Document"
              />
            ) : (
              <div className="h-[400px] flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">Document preview not available</p>
              </div>
            )}
          </div>

          {/* Field Forms */}
          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Fill Required Fields</h2>

            {fillableFields.map((field: any, idx: number) => {
              const fv = fieldValues.get(field.fieldId);
              const isFilled = fv && (fv.value || fv.signatureImageBase64);

              return (
                <div
                  key={field.fieldId}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    isFilled ? "border-green-200 bg-green-50/50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isFilled ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs text-gray-400">
                        {idx + 1}
                      </span>
                    )}
                    <span className="font-medium text-sm">{field.label}</span>
                    {field.required && <span className="text-red-500 text-xs">Required</span>}
                  </div>

                  {/* Text field */}
                  {field.type === "text" && (
                    <input
                      type="text"
                      placeholder={field.placeholder || "Enter text..."}
                      className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={fv?.value || ""}
                      onChange={(e) => setFieldValue(field.fieldId, e.target.value)}
                    />
                  )}

                  {/* Date field */}
                  {field.type === "date" && (
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={fv?.value || ""}
                      onChange={(e) => setFieldValue(field.fieldId, e.target.value)}
                    />
                  )}

                  {/* Checkbox */}
                  {field.type === "checkbox" && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={fv?.value === "true"}
                        onChange={(e) => setFieldValue(field.fieldId, e.target.checked.toString())}
                      />
                      <span className="text-sm text-gray-600">{field.placeholder || "I agree"}</span>
                    </label>
                  )}

                  {/* Signature / Initials */}
                  {(field.type === "signature" || field.type === "initials") && (
                    <div>
                      {fv?.signatureImageBase64 ? (
                        <div className="flex items-center gap-4">
                          <img
                            src={fv.signatureImageBase64}
                            alt="Signature"
                            className="h-16 border rounded bg-white p-1"
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              setActiveSignatureFieldId(field.fieldId);
                              setShowSignaturePad(true);
                            }}
                          >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setActiveSignatureFieldId(field.fieldId);
                            setShowSignaturePad(true);
                          }}
                        >
                          <PenTool className="h-4 w-4 mr-2" />
                          {field.type === "signature" ? "Add Signature" : "Add Initials"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Progress */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-medium text-sm text-gray-700 mb-3">Signing Progress</h3>
            <div className="space-y-2">
              {fillableFields.map((f: any) => {
                const fv = fieldValues.get(f.fieldId);
                const filled = fv && (fv.value || fv.signatureImageBase64);
                return (
                  <div key={f.fieldId} className="flex items-center gap-2 text-xs">
                    {filled ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0" />
                    )}
                    <span className={filled ? "text-green-700" : "text-gray-500"}>
                      {f.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Consent + Submit */}
          <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded mt-0.5"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span className="text-xs text-gray-600">
                I consent to sign this document electronically. I understand this constitutes a
                legally binding signature.
              </span>
            </label>

            <Button
              className="w-full"
              disabled={!consent || !allRequiredFilled || completing}
              onClick={handleComplete}
            >
              {completing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Finalising...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" /> Complete Signing
                </>
              )}
            </Button>

            {!allRequiredFilled && (
              <p className="text-xs text-amber-600">
                Please complete all required fields before signing.
              </p>
            )}
          </div>

          {/* Expiry */}
          {envelope.expiryAt && (
            <div className="text-xs text-gray-400 text-center">
              Expires {new Date(envelope.expiryAt).toLocaleDateString()}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">Powered by ZyberHR</p>
        </div>
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">
              {activeSignatureFieldId && fillableFields.find((f: any) => f.fieldId === activeSignatureFieldId)?.type === "initials"
                ? "Add Your Initials"
                : "Add Your Signature"}
            </h3>

            {/* Mode toggle */}
            <div className="flex gap-2">
              <Button
                variant={signatureMode === "draw" ? "default" : "outline"}
                onClick={() => setSignatureMode("draw")}
              >
                <PenTool className="h-4 w-4 mr-1" /> Draw
              </Button>
              <Button
                variant={signatureMode === "type" ? "default" : "outline"}
                onClick={() => setSignatureMode("type")}
              >
                <Type className="h-4 w-4 mr-1" /> Type
              </Button>
            </div>

            {signatureMode === "draw" ? (
              <div>
                <canvas
                  ref={canvasRef}
                  width={440}
                  height={150}
                  className="border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair bg-white w-full"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <Button variant="ghost" className="mt-2 text-xs" onClick={clearSignaturePad}>
                  Clear
                </Button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="Type your name"
                  className="w-full px-4 py-3 border rounded-lg text-2xl font-serif italic focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  autoFocus
                />
                {typedSignature && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-3xl font-serif italic text-gray-800">{typedSignature}</p>
                    <p className="text-xs text-gray-400 mt-1">Preview</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowSignaturePad(false)}>Cancel</Button>
              <Button onClick={saveSignature}>
                Apply {activeSignatureFieldId && fillableFields.find((f: any) => f.fieldId === activeSignatureFieldId)?.type === "initials" ? "Initials" : "Signature"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
