"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Badge } from "../../../../../components/ui/badge";
import { api } from "../../../../../lib/api";
import { toast } from "sonner";
import {
  ArrowLeft, Download, FileText, Clock, User, Mail,
  Eye, CheckCircle2, XCircle, Shield, Send,
} from "lucide-react";
import Link from "next/link";

export default function EnvelopeDetailPage() {
  const params = useParams();
  const [envelope, setEnvelope] = useState<any>(null);
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      Promise.all([
        api.getEnvelopeById(params.id as string),
        api.getEnvelopeAudit(params.id as string).catch(() => null),
      ])
        .then(([envData, auditData]) => {
          setEnvelope(envData);
          setAudit(auditData);
        })
        .catch((err: any) => toast.error(err.message))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const handleSend = async () => {
    try {
      await api.sendEsignEnvelope(params.id as string);
      toast.success("Document sent for signature!");
      const data = await api.getEnvelopeById(params.id as string);
      setEnvelope(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to send");
    }
  };

  const handleDownload = async () => {
    try {
      const result: any = await api.downloadSignedPdf(params.id as string);
      if (result.url) window.open(result.url, "_blank");
    } catch (error: any) {
      toast.error(error.message || "Download not available");
    }
  };

  const handleAuditDownload = () => {
    const url = audit?.auditPdfUrl || audit?.auditFileUrl;
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error("Audit file not available");
    }
  };

  const handleVoid = async () => {
    if (!confirm("Are you sure you want to void this document?")) return;
    try {
      await api.voidEnvelope(params.id as string);
      toast.success("Document voided");
      const data = await api.getEnvelopeById(params.id as string);
      setEnvelope(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to void");
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;
  if (!envelope) return <div className="p-6 text-center text-gray-500">Envelope not found</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-700";
      case "sent": return "bg-blue-100 text-blue-700";
      case "viewed": return "bg-amber-100 text-amber-700";
      case "in_progress": return "bg-orange-100 text-orange-700";
      case "finalised": return "bg-green-100 text-green-700";
      case "declined": return "bg-red-100 text-red-700";
      case "signed": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "created": return <FileText className="h-4 w-4 text-gray-400" />;
      case "sent": return <Send className="h-4 w-4 text-blue-500" />;
      case "opened": return <Eye className="h-4 w-4 text-amber-500" />;
      case "field_completed": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "signed": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "finalised": return <Shield className="h-4 w-4 text-green-700" />;
      case "voided": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/esign/documents">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{envelope.displayName}</h2>
          <p className="text-gray-600 mt-1">Created {new Date(envelope.createdAt).toLocaleString()}</p>
        </div>
        <Badge className={getStatusColor(envelope.status)}>{envelope.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: PDF Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {envelope.sourcePdfUrl ? (
                <iframe
                  src={envelope.sourcePdfUrl}
                  className="w-full h-[600px] border rounded"
                  title="Document Preview"
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded border">
                  <p className="text-gray-500">Preview not available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Details */}
        <div className="space-y-4">
          {/* Actions */}
          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {envelope.status === "draft" && (
                <Button className="w-full" onClick={handleSend}>
                  <Send className="h-4 w-4 mr-2" /> Send for Signature
                </Button>
              )}
              {envelope.status === "finalised" && (
                <>
                  <Button className="w-full" variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" /> Download Signed PDF
                  </Button>
                  <Button className="w-full" variant="outline" onClick={handleAuditDownload}>
                    <Shield className="h-4 w-4 mr-2" /> Download Audit Certificate
                  </Button>
                </>
              )}
              {!["finalised", "voided", "expired"].includes(envelope.status) && (
                <Button className="w-full text-red-500 border-red-200" variant="outline" onClick={handleVoid}>
                  <XCircle className="h-4 w-4 mr-2" /> Void Document
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader><CardTitle>Recipients</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {envelope.recipients?.map((r: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.email}</p>
                    {r.viewedAt && (
                      <p className="text-xs text-amber-600 mt-1">
                        Viewed {new Date(r.viewedAt).toLocaleString()}
                      </p>
                    )}
                    {r.signedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        Signed {new Date(r.signedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(r.status)}>{r.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {envelope.sentAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Sent</span>
                  <span>{new Date(envelope.sentAt).toLocaleString()}</span>
                </div>
              )}
              {envelope.finalisedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Finalised</span>
                  <span>{new Date(envelope.finalisedAt).toLocaleString()}</span>
                </div>
              )}
              {envelope.expiryAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Expires</span>
                  <span>{new Date(envelope.expiryAt).toLocaleDateString()}</span>
                </div>
              )}
              {envelope.signedPdfHashSha256 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">SHA-256</span>
                  <span className="text-xs font-mono truncate max-w-[180px]" title={envelope.signedPdfHashSha256}>
                    {envelope.signedPdfHashSha256.substring(0, 16)}...
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card>
            <CardHeader><CardTitle>Audit Trail</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(audit?.auditTrail || envelope.auditTrail)?.map((event: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5">{getEventIcon(event.eventType)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">
                        {event.eventType.replace("_", " ")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {event.actorEmail || event.actorUserId || "System"} ·{" "}
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                      {event.ip && (
                        <p className="text-xs text-gray-400">IP: {event.ip}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
